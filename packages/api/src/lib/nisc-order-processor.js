/**
 * Nisc order processor: runs in the QStash worker to process a single NiscOrder.
 * For each item: no integration → create NiscClientSubscription;
 * Plesk (web_hosting, email_hosting) → ensure integration + provision;
 * OpenProvider (domain_registration) → ensure integration, verify email, register domain;
 * OpenProvider (domain_transfer) → ensure integration, verify email, transfer domain (auth code in item.metadata);
 * Hivelocity (dedicated_server_hosting, vps_hosting, vds_hosting) → Deployment API, create subscription with device refs.
 */
import { and, eq, lt, or, sql } from "@npanel/db";
import { randomUUID } from "node:crypto";
import { db } from "@npanel/db";
import { niscOrder, niscOrderItem } from "@npanel/db/schema/nisc-orders";
import { domainTransferRequest } from "@npanel/db/schema/domain-transfer-requests";
import { niscClientSubscription } from "@npanel/db/schema/products";
import { team } from "@npanel/db/schema/teams";
import { niscLog } from "./nisc-order-logger";
import { provisionInitialUsageCreditsForSubscription } from "./subscription-usage-provisioning";
import { isZeepoAiAgentProduct, provisionZeepoAgentOrderItem, } from "./zeepo-agent-order-provisioning";
import { isZeepoAiProduct, provisionZeepoAiOrderItem, } from "./zeepo-ai-order-provisioning";
import { isKenicDomain } from "./epp/kenic-tlds";
import { agreedPriceIncVatFromOrderLine } from "./convert-price";
import { ensureKenicIntegration, registerKenicDomain, setKenicTransferLock, } from "./kenic-nisc";
import { OpenProviderApiError } from "./openprovider-client";
import { resolveDomainBillingCycle, resolveDomainRegistrationPeriodYears, resolveDomainTransferSubscriptionStartDate, resolveSubscriptionPeriodDates, } from "./nisc-subscription-dates";
import { processHivelocityOrderItem } from "./hivelocity-nisc-processor";
import { HIVELOCITY_SERVICE_TYPES } from "../routers/nisc-service-orders-schemas";
/** Build a serializable error-details object for provisioningErrorDetails (exact provider response for debugging). */
function buildProvisioningErrorDetails(err) {
    if (err instanceof OpenProviderApiError) {
        return {
            provider: "openprovider",
            code: err.code,
            description: err.description,
            rawResponse: err.rawResponse,
        };
    }
    if (err instanceof Error) {
        return {
            provider: "unknown",
            message: err.message,
            name: err.name,
        };
    }
    return { provider: "unknown", raw: String(err) };
}
/** Service types that require external provisioning (Plesk or domain provider). All other service types are treated as DB-only: create NiscClientSubscription and optionally provision NiscClientSubscriptionUsage from plan. */
const PLESK_SERVICE_TYPES = [
    "web_hosting",
    "email_hosting",
    "wordpress_hosting",
    "website_hosting",
];
const OPENPROVIDER_SERVICE_TYPES = ["domain_registration", "domain_transfer"];
/** Product serviceType "domains" is treated as domain_registration. */
function resolveServiceType(serviceType) {
    if (serviceType === "domains")
        return "domain_registration";
    return serviceType;
}
/** Resolve provisioning branch from product type plus checkout hints (description / auth code). */
function resolveItemServiceType(rawServiceType, item) {
    const base = resolveServiceType(rawServiceType);
    if (base !== "domain_registration")
        return base;
    const meta = item.metadata;
    if (item.description === "transfer" || meta?.transferAuthCode?.trim()) {
        return "domain_transfer";
    }
    return base;
}
/** Resolve domain provider from TLD: KENIC for .ke/.co.ke etc., OpenProvider for the rest. */
function getDomainProvider(domain) {
    if (!domain || typeof domain !== "string" || !domain.trim())
        return "openprovider";
    return isKenicDomain(domain) ? "kenic" : "openprovider";
}
/** Stale PROCESSING claims older than this may be reclaimed by another worker. */
const STALE_PROCESSING_MS = 15 * 60 * 1000;
export async function processNiscOrder(niscOrderId) {
    const order = await db.query.niscOrder.findFirst({
        where: eq(niscOrder.id, niscOrderId),
        with: {
            orderItems: {
                with: {
                    product: true,
                    productPlan: true,
                    domainSubscription: true,
                },
            },
            user: true,
            team: true,
        },
    });
    if (!order) {
        await niscLog("processor_order_not_found", { niscOrderId });
        return { ok: false, status: "FAILED", failureReason: "Order not found" };
    }
    await niscLog("processor_start", {
        niscOrderId,
        orderNumber: order.orderNumber,
        itemCount: order.orderItems.length,
        itemIds: order.orderItems.map((i) => i.id),
    });
    const now = new Date();
    const staleBefore = new Date(now.getTime() - STALE_PROCESSING_MS);
    // Atomic claim: PENDING → PROCESSING, or reclaim stale PROCESSING (crash recovery).
    const claimed = await db
        .update(niscOrder)
        .set({ status: "PROCESSING", processedAt: now, updatedAt: now })
        .where(and(eq(niscOrder.id, niscOrderId), or(eq(niscOrder.status, "PENDING"), and(eq(niscOrder.status, "PROCESSING"), lt(niscOrder.processedAt, staleBefore)))))
        .returning({ id: niscOrder.id, status: niscOrder.status });
    if (!claimed[0]) {
        const [current] = await db
            .select({ status: niscOrder.status, failureReason: niscOrder.failureReason })
            .from(niscOrder)
            .where(eq(niscOrder.id, niscOrderId))
            .limit(1);
        await niscLog("processor_order_claim_skipped", {
            niscOrderId,
            status: current?.status ?? null,
        });
        if (current?.status === "FAILED") {
            return {
                ok: false,
                status: "FAILED",
                failureReason: current.failureReason ?? "Order already failed",
            };
        }
        if (current?.status === "PARTIAL") {
            return {
                ok: true,
                status: "PARTIAL",
                failureReason: current.failureReason ?? undefined,
            };
        }
        if (current?.status === "PROCESSING") {
            // Fresh claim held by another worker  do not pretend COMPLETED (avoids early emails).
            return {
                ok: true,
                status: "PROCESSING",
                failureReason: "Order is already being processed",
            };
        }
        if (current?.status === "COMPLETED") {
            return { ok: true, status: "COMPLETED" };
        }
        return {
            ok: false,
            status: "FAILED",
            failureReason: `Order is not claimable (status: ${current?.status ?? "unknown"})`,
        };
    }
    await niscLog("processor_order_status_updated", { niscOrderId, status: "PROCESSING" });
    let hasFailure = false;
    let hasSuccess = false;
    let hasPendingVerification = false;
    const failureReasons = [];
    for (const item of order.orderItems) {
        const rawServiceType = item.product.serviceType;
        const serviceType = resolveItemServiceType(rawServiceType, item);
        if (rawServiceType !== serviceType) {
            await niscLog("processor_service_type_resolved", {
                niscOrderId,
                orderItemId: item.id,
                productName: item.product.name,
                rawServiceType,
                resolvedServiceType: serviceType,
            });
        }
        if (item.status === "PROVISIONED") {
            await niscLog("processor_item_skip_already_provisioned", {
                niscOrderId,
                orderItemId: item.id,
                productName: item.product.name,
            });
            hasSuccess = true;
            continue;
        }
        // Already linked to a subscription (e.g. crash after provision, before status write).
        if (item.niscClientSubscriptionId) {
            // PENDING + linked = awaiting provider verification (e.g. domain transfer); do not force PROVISIONED.
            if (item.status === "PENDING") {
                await niscLog("processor_item_skip_pending_verification", {
                    niscOrderId,
                    orderItemId: item.id,
                    subscriptionId: item.niscClientSubscriptionId,
                });
                hasPendingVerification = true;
                continue;
            }
            await db
                .update(niscOrderItem)
                .set({ status: "PROVISIONED", provisioningError: null, updatedAt: now })
                .where(eq(niscOrderItem.id, item.id));
            await niscLog("processor_item_skip_already_linked", {
                niscOrderId,
                orderItemId: item.id,
                subscriptionId: item.niscClientSubscriptionId,
            });
            hasSuccess = true;
            continue;
        }
        // Heartbeat so stale-claim reclaim does not steal a long multi-item run.
        const heartbeat = new Date();
        await db
            .update(niscOrder)
            .set({ processedAt: heartbeat, updatedAt: heartbeat })
            .where(eq(niscOrder.id, niscOrderId));
        await db
            .update(niscOrderItem)
            .set({ status: "PROCESSING", updatedAt: now })
            .where(eq(niscOrderItem.id, item.id));
        await niscLog("processor_item_start", {
            niscOrderId,
            orderItemId: item.id,
            productName: item.product.name,
            serviceType,
            primaryDomain: item.primaryDomain ?? null,
        });
        try {
            if (PLESK_SERVICE_TYPES.includes(serviceType)) {
                await niscLog("processor_item_branch", {
                    niscOrderId,
                    orderItemId: item.id,
                    branch: "plesk",
                    serviceType,
                });
                const result = await processPleskOrderItem(order, item);
                if (result.ok) {
                    await niscLog("processor_api_raw_response", {
                        niscOrderId,
                        orderItemId: item.id,
                        provider: "plesk",
                        call: "provisionToPlesk",
                        rawResponse: result.rawResponse,
                    });
                    await db
                        .update(niscOrderItem)
                        .set({
                        status: "PROVISIONED",
                        niscClientSubscriptionId: result.subscriptionId,
                        updatedAt: now,
                    })
                        .where(eq(niscOrderItem.id, item.id));
                    await niscLog("processor_item_success", {
                        niscOrderId,
                        orderItemId: item.id,
                        branch: "plesk",
                        subscriptionId: result.subscriptionId,
                    });
                    hasSuccess = true;
                }
                else {
                    const pleskErrorDetails = {
                        provider: "plesk",
                        message: result.error,
                        ...(result.errorDetails && { rawResponse: result.errorDetails }),
                    };
                    await niscLog("processor_api_raw_response", {
                        niscOrderId,
                        orderItemId: item.id,
                        provider: "plesk",
                        call: "provisionToPlesk",
                        rawResponse: pleskErrorDetails,
                    });
                    await db
                        .update(niscOrderItem)
                        .set({
                        status: "FAILED",
                        provisioningError: result.error,
                        provisioningErrorDetails: pleskErrorDetails,
                        updatedAt: now,
                    })
                        .where(eq(niscOrderItem.id, item.id));
                    await niscLog("processor_item_failed", {
                        niscOrderId,
                        orderItemId: item.id,
                        branch: "plesk",
                        error: result.error,
                        errorDetails: pleskErrorDetails,
                        rawResponse: result.errorDetails,
                    });
                    hasFailure = true;
                    failureReasons.push(`Item ${item.product.name}: ${result.error}`);
                }
                continue;
            }
            if (HIVELOCITY_SERVICE_TYPES.includes(serviceType)) {
                await niscLog("processor_item_branch", {
                    niscOrderId,
                    orderItemId: item.id,
                    branch: "hivelocity",
                    serviceType,
                });
                const result = await processHivelocityOrderItem(order, item);
                const operation = item.metadata?.operation;
                const hivelocityCall = operation === "vps_upgrade"
                    ? "PUT /vps/{deviceId} (VPS upgrade)"
                    : operation === "vps_reload"
                        ? "POST /device/{deviceId}/reload (VPS OS reload)"
                        : operation === "vps_reactivate"
                            ? "POST /device/{deviceId}/power boot + subscription ACTIVE"
                            : "POST /deploy/ (Deployment API)";
                if (result.ok) {
                    await niscLog("processor_api_raw_response", {
                        niscOrderId,
                        orderItemId: item.id,
                        provider: "hivelocity",
                        call: hivelocityCall,
                        rawResponse: result.rawResponse,
                    });
                    await db
                        .update(niscOrderItem)
                        .set({
                        status: "PROVISIONED",
                        niscClientSubscriptionId: result.subscriptionId,
                        updatedAt: now,
                    })
                        .where(eq(niscOrderItem.id, item.id));
                    await niscLog("processor_item_success", {
                        niscOrderId,
                        orderItemId: item.id,
                        branch: "hivelocity",
                        subscriptionId: result.subscriptionId,
                    });
                    hasSuccess = true;
                }
                else {
                    const errDetails = result.errorDetails ?? {
                        provider: "hivelocity",
                        message: result.error,
                    };
                    await niscLog("processor_api_raw_response", {
                        niscOrderId,
                        orderItemId: item.id,
                        provider: "hivelocity",
                        call: hivelocityCall,
                        rawResponse: errDetails,
                    });
                    await db
                        .update(niscOrderItem)
                        .set({
                        status: "FAILED",
                        provisioningError: result.error,
                        provisioningErrorDetails: errDetails,
                        updatedAt: now,
                    })
                        .where(eq(niscOrderItem.id, item.id));
                    await niscLog("processor_item_failed", {
                        niscOrderId,
                        orderItemId: item.id,
                        branch: "hivelocity",
                        error: result.error,
                        errorDetails: errDetails,
                    });
                    hasFailure = true;
                    failureReasons.push(`Item ${item.product.name}: ${result.error}`);
                }
                continue;
            }
            if (OPENPROVIDER_SERVICE_TYPES.includes(serviceType)) {
                const primaryDomain = item.primaryDomain?.trim() ?? null;
                const domainProvider = getDomainProvider(primaryDomain);
                await niscLog("processor_domain_provider_resolved", {
                    niscOrderId,
                    orderItemId: item.id,
                    primaryDomain,
                    domainProvider,
                    serviceType,
                    reason: domainProvider === "kenic"
                        ? "TLD is .ke/.co.ke or other KENIC TLD"
                        : "TLD is not KENIC; using OpenProvider",
                });
                await niscLog("processor_item_branch", {
                    niscOrderId,
                    orderItemId: item.id,
                    branch: domainProvider === "kenic"
                        ? serviceType === "domain_transfer"
                            ? "kenic_transfer"
                            : "kenic_registration"
                        : serviceType === "domain_transfer"
                            ? "openprovider_transfer"
                            : "openprovider_registration",
                    serviceType,
                    domainProvider,
                });
                const transferMeta = serviceType === "domain_transfer" ? item.metadata : null;
                const domainTransferRequestId = transferMeta?.domainTransferRequestId?.trim();
                if (domainTransferRequestId) {
                    await db
                        .update(domainTransferRequest)
                        .set({
                        status: "SUBMITTED_TO_PROVIDER",
                        submittedToProviderAt: now,
                        providerResponse: { niscOrderId, orderItemId: item.id },
                        updatedAt: now,
                    })
                        .where(eq(domainTransferRequest.id, domainTransferRequestId));
                }
                const result = domainProvider === "kenic"
                    ? serviceType === "domain_transfer"
                        ? await processKenicTransferOrderItem(order, item)
                        : await processKenicOrderItem(order, item)
                    : serviceType === "domain_transfer"
                        ? await processOpenProviderTransferOrderItem(order, item)
                        : await processOpenProviderOrderItem(order, item);
                const branchName = domainProvider === "kenic"
                    ? serviceType === "domain_transfer"
                        ? "kenic_transfer"
                        : "kenic_registration"
                    : serviceType === "domain_transfer"
                        ? "openprovider_transfer"
                        : "openprovider_registration";
                if (result.ok) {
                    if (branchName === "kenic_transfer" || branchName === "openprovider_transfer") {
                        const rawResponse = "rawResponse" in result ? result.rawResponse : undefined;
                        if (rawResponse !== undefined) {
                            await niscLog("processor_api_raw_response", {
                                niscOrderId,
                                orderItemId: item.id,
                                provider: branchName === "kenic_transfer" ? "kenic" : "openprovider",
                                call: branchName === "kenic_transfer" ? "executeKenicTransferRequest" : "transferDomain",
                                rawResponse,
                            });
                        }
                    }
                    const warnings = "warnings" in result && Array.isArray(result.warnings)
                        ? result.warnings.filter(Boolean)
                        : [];
                    await db
                        .update(niscOrderItem)
                        .set({
                        status: result.status,
                        niscClientSubscriptionId: result.subscriptionId ?? undefined,
                        provisioningError: result.pendingVerification
                            ? "Pending email verification"
                            : warnings.length
                                ? warnings.join("; ")
                                : undefined,
                        updatedAt: now,
                    })
                        .where(eq(niscOrderItem.id, item.id));
                    const isPendingVerification = Boolean(result.pendingVerification) || result.status === "PENDING";
                    if (domainTransferRequestId) {
                        await db
                            .update(domainTransferRequest)
                            .set({
                            status: isPendingVerification ? "SUBMITTED_TO_PROVIDER" : "COMPLETED",
                            providerResponse: {
                                subscriptionId: result.subscriptionId ?? null,
                                status: result.status,
                                pendingVerification: result.pendingVerification ?? false,
                                warnings: warnings.length ? warnings : undefined,
                            },
                            updatedAt: now,
                        })
                            .where(eq(domainTransferRequest.id, domainTransferRequestId));
                    }
                    await niscLog("processor_item_success", {
                        niscOrderId,
                        orderItemId: item.id,
                        branch: branchName,
                        subscriptionId: result.subscriptionId ?? null,
                        status: result.status,
                        pendingVerification: result.pendingVerification ?? false,
                        warnings: warnings.length ? warnings : undefined,
                    });
                    if (isPendingVerification) {
                        hasPendingVerification = true;
                    }
                    else {
                        hasSuccess = true;
                    }
                    // Transfer-lock warnings stay on item.provisioningError for visibility but are not failures.
                }
                else {
                    const errDetails = "errorDetails" in result ? result.errorDetails : undefined;
                    if (branchName === "kenic_transfer" || branchName === "openprovider_transfer") {
                        const rawResponse = errDetails && typeof errDetails === "object" && "rawResponse" in errDetails
                            ? errDetails.rawResponse
                            : errDetails;
                        await niscLog("processor_api_raw_response", {
                            niscOrderId,
                            orderItemId: item.id,
                            provider: branchName === "kenic_transfer" ? "kenic" : "openprovider",
                            call: branchName === "kenic_transfer" ? "executeKenicTransferRequest" : "transferDomain",
                            rawResponse: rawResponse ?? errDetails,
                        });
                    }
                    const updateData = {
                        status: "FAILED",
                        provisioningError: result.error,
                        updatedAt: now,
                    };
                    if (errDetails != null) {
                        updateData.provisioningErrorDetails = errDetails;
                    }
                    await db
                        .update(niscOrderItem)
                        .set(updateData)
                        .where(eq(niscOrderItem.id, item.id));
                    if (domainTransferRequestId) {
                        await db
                            .update(domainTransferRequest)
                            .set({
                            status: "FAILED",
                            providerResponse: {
                                error: result.error,
                                errorDetails: errDetails ?? undefined,
                            },
                            updatedAt: now,
                        })
                            .where(eq(domainTransferRequest.id, domainTransferRequestId));
                    }
                    await niscLog("processor_item_failed", {
                        niscOrderId,
                        orderItemId: item.id,
                        branch: branchName,
                        error: result.error,
                        errorDetails: errDetails ?? undefined,
                        rawResponse: errDetails && typeof errDetails === "object" && "rawResponse" in errDetails
                            ? errDetails.rawResponse
                            : errDetails,
                    });
                    hasFailure = true;
                    failureReasons.push(`Item ${item.product.name}: ${result.error}`);
                }
                continue;
            }
            // Default: DB-only (no external provider). Create subscription and provision usage from plan when configured.
            // Covers all service types not requiring Plesk or domain provider, e.g. ai_image_generator, background_remover, creatives, consulting, custom, etc.
            const isZeepoAgentItem = isZeepoAiAgentProduct(item.productId);
            const isZeepoAiItem = isZeepoAiProduct(item.productId);
            const isZeepoItem = isZeepoAgentItem || isZeepoAiItem;
            await niscLog("processor_item_branch", {
                niscOrderId,
                orderItemId: item.id,
                branch: isZeepoAiItem
                    ? "zeepo_ai"
                    : isZeepoAgentItem
                        ? "zeepo_ai_agent"
                        : "no_integration",
                serviceType,
                ...(isZeepoItem ? { teamId: order.teamId ?? null } : {}),
            });
            let sub;
            if (isZeepoAiItem) {
                const zeepoResult = await provisionZeepoAiOrderItem({
                    userId: order.userId,
                    teamId: order.teamId,
                    createdBy: order.createdBy,
                    orderId: order.id,
                    currency: order.currency,
                }, {
                    productId: item.productId,
                    productPlanId: item.productPlanId,
                    billingCycle: item.billingCycle,
                    itemPrice: item.itemPrice,
                    itemSubtotal: item.itemSubtotal,
                    description: item.description,
                    metadata: item.metadata,
                    product: { name: item.product.name },
                    productPlan: item.productPlan
                        ? {
                            name: item.productPlan.name,
                            pricingModel: item.productPlan.pricingModel,
                            price: item.productPlan.price,
                            cost: item.productPlan.cost,
                            metadata: item.productPlan.metadata,
                        }
                        : null,
                });
                sub = { id: zeepoResult.subscriptionId };
            }
            else if (isZeepoAgentItem) {
                const zeepoResult = await provisionZeepoAgentOrderItem({
                    userId: order.userId,
                    teamId: order.teamId,
                    createdBy: order.createdBy,
                    orderId: order.id,
                    currency: order.currency,
                }, {
                    productId: item.productId,
                    productPlanId: item.productPlanId,
                    billingCycle: item.billingCycle,
                    itemPrice: item.itemPrice,
                    itemSubtotal: item.itemSubtotal,
                    description: item.description,
                    metadata: item.metadata,
                    product: { name: item.product.name },
                    productPlan: item.productPlan
                        ? {
                            name: item.productPlan.name,
                            pricingModel: item.productPlan.pricingModel,
                            price: item.productPlan.price,
                            cost: item.productPlan.cost,
                            metadata: item.productPlan.metadata,
                        }
                        : null,
                });
                sub = { id: zeepoResult.subscriptionId };
            }
            else {
                sub = await createSubscriptionForOrderItem(order, item);
            }
            await db
                .update(niscOrderItem)
                .set({
                status: "PROVISIONED",
                niscClientSubscriptionId: sub.id,
                updatedAt: now,
            })
                .where(eq(niscOrderItem.id, item.id));
            await niscLog("processor_item_success", {
                niscOrderId,
                orderItemId: item.id,
                branch: isZeepoAiItem
                    ? "zeepo_ai"
                    : isZeepoAgentItem
                        ? "zeepo_ai_agent"
                        : "no_integration",
                subscriptionId: sub.id,
            });
            hasSuccess = true;
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            const errorDetails = buildProvisioningErrorDetails(err);
            const rawResponse = errorDetails && "rawResponse" in errorDetails ? errorDetails.rawResponse : errorDetails;
            await niscLog("processor_item_exception", {
                niscOrderId,
                orderItemId: item.id,
                productName: item.product.name,
                serviceType,
                error: message,
                stack: err instanceof Error ? err.stack : undefined,
                errorDetails,
                rawResponse,
            });
            await db
                .update(niscOrderItem)
                .set({
                status: "FAILED",
                provisioningError: message,
                provisioningErrorDetails: buildProvisioningErrorDetails(err),
                updatedAt: now,
            })
                .where(eq(niscOrderItem.id, item.id));
            if (serviceType === "domain_transfer") {
                const transferMeta = item.metadata;
                const domainTransferRequestId = transferMeta?.domainTransferRequestId?.trim();
                if (domainTransferRequestId) {
                    await db
                        .update(domainTransferRequest)
                        .set({
                        status: "FAILED",
                        providerResponse: { error: message, errorDetails },
                        updatedAt: now,
                    })
                        .where(eq(domainTransferRequest.id, domainTransferRequestId));
                }
            }
            hasFailure = true;
            failureReasons.push(`Item ${item.product.name}: ${message}`);
        }
    }
    const failureReason = failureReasons.length > 0 ? failureReasons.join("; ") : null;
    let orderStatus;
    // Pending verification is not terminal failure  keep PARTIAL so reclaim/retry can finish later.
    if (hasFailure && !hasSuccess && !hasPendingVerification) {
        orderStatus = "FAILED";
    }
    else if (hasFailure || hasPendingVerification) {
        orderStatus = "PARTIAL";
    }
    else {
        orderStatus = "COMPLETED";
    }
    await niscLog("processor_complete", {
        niscOrderId,
        orderStatus,
        hasFailure,
        hasSuccess,
        hasPendingVerification,
        failureReason: failureReason ?? null,
        failureReasons,
    });
    await db
        .update(niscOrder)
        .set({
        status: orderStatus,
        failureReason,
        completedAt: now,
        updatedAt: now,
    })
        .where(eq(niscOrder.id, niscOrderId));
    if (orderStatus === "FAILED") {
        return { ok: false, status: "FAILED", failureReason: failureReason ?? "" };
    }
    return {
        ok: true,
        status: orderStatus,
        failureReason: failureReason ?? undefined,
    };
}
async function createSubscriptionForOrderItem(order, item) {
    const plan = item.productPlan;
    const name = plan ? `${item.product.name} - ${plan.name}` : item.product.name;
    const pricingModel = plan?.pricingModel ?? "FIXED";
    const now = new Date();
    const periodDates = resolveSubscriptionPeriodDates(now, item.billingCycle);
    // Idempotent: reuse subscription already created for this order item (crash recovery).
    const existingForItem = await db.query.niscClientSubscription.findFirst({
        where: and(eq(niscClientSubscription.niscOrderId, order.id), sql `${niscClientSubscription.metadata}->>'niscOrderItemId' = ${item.id}`),
        columns: { id: true },
    });
    if (existingForItem) {
        return existingForItem;
    }
    const subId = randomUUID();
    const inserted = await db
        .insert(niscClientSubscription)
        .values({
        id: subId,
        name,
        description: item.description ?? null,
        userId: order.userId,
        teamId: order.teamId,
        productId: item.productId,
        productPlanId: item.productPlanId,
        orderId: null,
        niscOrderId: order.id,
        subscribedBy: order.createdBy,
        status: "ACTIVE",
        subscriptionDate: now,
        billingCycle: item.billingCycle ?? null,
        pricingModel,
        agreedPrice: agreedPriceIncVatFromOrderLine(item),
        agreedCurrency: order.currency,
        agreedCost: plan?.cost ?? null,
        agreedCostCurrency: "KES",
        providerCost: plan?.cost ?? null,
        providerCostCurrency: "KES",
        agreedCommissionRate: null,
        agreedCommissionBase: null,
        expiryDate: periodDates.expiryDate,
        nextRenewalDate: periodDates.nextRenewalDate,
        metadata: { niscOrderItemId: item.id },
    })
        .returning();
    const sub = inserted[0];
    if (!sub) {
        throw new Error("Failed to create Nisc subscription");
    }
    if (order.createdBy) {
        await provisionInitialUsageCreditsForSubscription({
            subscriptionId: sub.id,
            productId: item.productId,
            productPlanId: item.productPlanId,
            performedByUserId: order.createdBy,
        });
    }
    return sub;
}
async function processPleskOrderItem(order, item) {
    if (!item.productPlanId || !item.productPlan) {
        return { ok: false, error: "Hosting item requires a product plan." };
    }
    const domainName = item.primaryDomain ||
        item.domainSubscription?.primaryDomain ||
        item.domainSubscription?.name ||
        null;
    if (!domainName) {
        return { ok: false, error: "Domain is required for hosting. Enter a domain name for Plesk." };
    }
    // Crash/retry: reuse subscription already created for this order item.
    const existingForItem = await db.query.niscClientSubscription.findFirst({
        where: and(eq(niscClientSubscription.niscOrderId, order.id), sql `${niscClientSubscription.metadata}->>'niscOrderItemId' = ${item.id}`),
        columns: { id: true },
    });
    if (existingForItem) {
        return {
            ok: true,
            subscriptionId: existingForItem.id,
            rawResponse: { skipped: true, reason: "subscription_already_exists_for_order_item" },
        };
    }
    const meta = item.metadata;
    const provisionUserIdFromMeta = meta?.provisionUserId?.trim() || null;
    const teamOwnerId = provisionUserIdFromMeta
        ? provisionUserIdFromMeta
        : order.teamId
            ? (await db
                .select({ createdById: team.createdById })
                .from(team)
                .where(eq(team.id, order.teamId))
                .limit(1))[0]?.createdById
            : order.userId;
    if (!teamOwnerId || !order.createdBy) {
        return { ok: false, error: "Order must have a team or user and createdBy for Plesk provisioning." };
    }
    const planId = item.productPlan.pleskServicePlanId;
    if (!planId) {
        return { ok: false, error: "Product plan has no Plesk service plan configured." };
    }
    try {
        const { ensurePleskIntegration, provisionToPlesk } = await import("@npanel/api/lib/plesk-integration");
        const pleskOwnerId = await ensurePleskIntegration(teamOwnerId, order.createdBy);
        let result;
        try {
            result = await provisionToPlesk({
                domainName,
                pleskOwnerId,
                pleskServicePlanId: planId,
                ipAddress: item.productPlan.pleskIpAddress ?? undefined,
            });
        }
        catch (provisionErr) {
            const provisionMessage = provisionErr instanceof Error ? provisionErr.message : String(provisionErr);
            const looksLikeDuplicate = /already exists|duplicate|object already exists|exists already/i.test(provisionMessage);
            if (looksLikeDuplicate) {
                const existingSub = await db.query.niscClientSubscription.findFirst({
                    where: and(eq(niscClientSubscription.primaryDomain, domainName), eq(niscClientSubscription.productId, item.productId), order.teamId
                        ? eq(niscClientSubscription.teamId, order.teamId)
                        : sql `${niscClientSubscription.teamId} is null`, eq(niscClientSubscription.niscOrderId, order.id)),
                    columns: { id: true },
                });
                if (existingSub) {
                    return {
                        ok: true,
                        subscriptionId: existingSub.id,
                        rawResponse: {
                            skipped: true,
                            reason: "plesk_domain_already_exists_reused_subscription",
                            message: provisionMessage,
                        },
                    };
                }
            }
            throw provisionErr;
        }
        const name = `${item.product.name} - ${item.productPlan.name}`;
        const subId = randomUUID();
        const subscriptionDate = new Date();
        const periodDates = resolveSubscriptionPeriodDates(subscriptionDate, item.billingCycle);
        const inserted = await db
            .insert(niscClientSubscription)
            .values({
            id: subId,
            name,
            userId: order.userId,
            teamId: order.teamId,
            productId: item.productId,
            productPlanId: item.productPlanId,
            orderId: null,
            niscOrderId: order.id,
            subscribedBy: order.createdBy,
            status: "ACTIVE",
            subscriptionDate,
            billingCycle: item.billingCycle ?? null,
            pricingModel: item.productPlan.pricingModel,
            agreedPrice: agreedPriceIncVatFromOrderLine(item),
            agreedCurrency: order.currency,
            agreedCost: item.productPlan.cost ?? null,
            agreedCostCurrency: "KES",
            primaryDomain: domainName,
            pleskFilterId: result.pleskServiceId,
            pleskOwnerId,
            pleskFtpLogin: result.pleskFtpLogin,
            pleskFtpPassword: result.pleskFtpPassword,
            hostingType: item.productPlan.hostingType ?? null,
            agreedCommissionRate: null,
            agreedCommissionBase: null,
            expiryDate: periodDates.expiryDate,
            nextRenewalDate: periodDates.nextRenewalDate,
            metadata: { niscOrderItemId: item.id },
        })
            .returning();
        const sub = inserted[0];
        if (!sub) {
            throw new Error("Failed to create Nisc subscription");
        }
        if (order.createdBy) {
            await provisionInitialUsageCreditsForSubscription({
                subscriptionId: sub.id,
                productId: item.productId,
                productPlanId: item.productPlanId,
                performedByUserId: order.createdBy,
            });
        }
        return {
            ok: true,
            subscriptionId: sub.id,
            rawResponse: result.pleskResponseData,
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
            ok: false,
            error: message,
            errorDetails: buildProvisioningErrorDetails(err),
        };
    }
}
function billingCycleToYears(billingCycle, metadata) {
    return resolveDomainRegistrationPeriodYears(billingCycle, metadata);
}
async function resolveOwnerId(order, item) {
    const metadata = item.metadata;
    if (metadata?.useRegistrantInfo === "myself") {
        return order.createdBy;
    }
    const provisionUserId = metadata?.provisionUserId?.trim();
    if (provisionUserId) {
        return provisionUserId;
    }
    /** Agency billed-for user when registrant is the customer (not the agency agent). */
    if (metadata?.useRegistrantInfo === "customer" && order.userId) {
        return order.userId;
    }
    if (order.teamId) {
        const teamRow = await db
            .select({ createdById: team.createdById })
            .from(team)
            .where(eq(team.id, order.teamId))
            .limit(1);
        return teamRow[0]?.createdById ?? order.userId;
    }
    return order.userId;
}
/** KENIC TLD (.ke, .co.ke, etc.): registration via Nisc using EPP (contacts + domain create). */
async function processKenicOrderItem(order, item) {
    const domain = item.primaryDomain?.trim();
    if (!domain) {
        return { ok: false, error: "Primary domain is required for KENIC domain registration." };
    }
    const ownerId = await resolveOwnerId(order, item);
    if (!ownerId || !order.createdBy) {
        return {
            ok: false,
            error: "Order must have a team or user and createdBy for KENIC domain registration.",
        };
    }
    try {
        const metadata = item.metadata;
        void niscLog("processor_item_metadata", {
            niscOrderId: order.id,
            orderItemId: item.id,
            metadata,
        });
        const { contactId } = await ensureKenicIntegration(ownerId, order.createdBy, {
            logContext: { niscOrderId: order.id, orderItemId: item.id },
            manualDetails: metadata?.manualRegistrantDetails,
        });
        const period = billingCycleToYears(item.billingCycle, item.metadata);
        let nameServers = metadata?.nameServers;
        if (!nameServers || nameServers.length === 0) {
            try {
                const { resolveNameserversForDomain } = await import("./tld-resolution");
                nameServers = await resolveNameserversForDomain(domain);
            }
            catch (err) {
                return { ok: false, error: err instanceof Error ? err.message : "Failed to resolve nameservers for domain" };
            }
        }
        void niscLog("ensure_kenic_integration_success", {
            contactId: contactId,
            niscOrderId: order.id,
            orderItemId: item.id,
        });
        const regResult = await registerKenicDomain({
            domainName: domain,
            registrantContactId: contactId,
            period,
            orderId: order.id,
            orderItemId: item.id,
            nameServers,
        });
        const warnings = [];
        try {
            await setKenicTransferLock(domain, true);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error("[KENIC] Failed to enable transfer lock after registration:", err);
            warnings.push(`Domain provisioned but transfer lock could not be enabled (${msg})  enable lock manually.`);
        }
        const subId = randomUUID();
        const subscriptionDate = new Date();
        const billingCycle = resolveDomainBillingCycle(item.billingCycle);
        const registryExpiry = regResult.exDate ? new Date(regResult.exDate) : null;
        const periodDates = resolveSubscriptionPeriodDates(subscriptionDate, billingCycle, {
            expiryOverride: registryExpiry && !Number.isNaN(registryExpiry.getTime()) ? registryExpiry : null,
        });
        const inserted = await db
            .insert(niscClientSubscription)
            .values({
            id: subId,
            name: domain,
            description: item.description ?? null,
            userId: order.userId,
            teamId: order.teamId,
            productId: item.productId,
            productPlanId: item.productPlanId ?? null,
            orderId: null,
            niscOrderId: order.id,
            subscribedBy: order.createdBy,
            status: "ACTIVE",
            subscriptionDate,
            billingCycle: billingCycle,
            pricingModel: "FIXED",
            agreedPrice: agreedPriceIncVatFromOrderLine(item),
            agreedCurrency: order.currency,
            agreedCost: item.productPlan?.cost ?? null,
            agreedCostCurrency: "KES",
            primaryDomain: domain,
            openProviderId: null,
            domainAuthCode: regResult.authInfo,
            expiryDate: periodDates.expiryDate,
            nextRenewalDate: periodDates.nextRenewalDate,
            agreedCommissionRate: null,
            agreedCommissionBase: null,
            metadata: warnings.length ? { transferLockWarning: warnings[0] } : null,
        })
            .returning();
        const sub = inserted[0];
        if (!sub) {
            throw new Error("Failed to create Nisc subscription");
        }
        if (order.createdBy) {
            await provisionInitialUsageCreditsForSubscription({
                subscriptionId: sub.id,
                productId: item.productId,
                productPlanId: item.productPlanId ?? null,
                performedByUserId: order.createdBy,
            });
        }
        return {
            ok: true,
            subscriptionId: sub.id,
            status: "PROVISIONED",
            ...(warnings.length ? { warnings } : {}),
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const errorDetails = buildProvisioningErrorDetails(err);
        return {
            ok: false,
            error: message,
            errorDetails,
        };
    }
}
/** KENIC TLD: transfer via EPP, then create NiscClientSubscription (same as registration for tracking). */
async function processKenicTransferOrderItem(order, item) {
    const domain = item.primaryDomain?.trim();
    if (!domain) {
        return { ok: false, error: "Primary domain is required for KENIC domain transfer." };
    }
    const meta = item.metadata;
    const authCode = meta?.transferAuthCode?.trim();
    if (!authCode) {
        return { ok: false, error: "Transfer auth code is required. Provide it in the order item metadata (transferAuthCode)." };
    }
    const ownerId = await resolveOwnerId(order, item);
    if (!ownerId || !order.createdBy) {
        return {
            ok: false,
            error: "Order must have a team or user and createdBy for KENIC domain transfer.",
        };
    }
    try {
        const metadata = item.metadata;
        let nameServers = metadata?.nameServers;
        if (!nameServers || nameServers.length === 0) {
            try {
                const { resolveNameserversForDomain } = await import("./tld-resolution");
                nameServers = await resolveNameserversForDomain(domain);
            }
            catch (err) {
                return { ok: false, error: err instanceof Error ? err.message : "Failed to resolve nameservers for domain" };
            }
        }
        const { executeKenicTransferRequest } = await import("./kenic-transfer-request");
        const transferPeriod = resolveDomainRegistrationPeriodYears(item.billingCycle, item.metadata);
        const transferResult = await executeKenicTransferRequest({
            name: domain,
            authCode,
            period: transferPeriod,
            nameServers,
        });
        // CoCCA never returns plaintext auth codes later. Set a fresh outbound code when
        // we already sponsor the domain (non-pending). Pending transfers get no stored code yet.
        let outboundAuthCode = null;
        if (!transferResult.pending) {
            try {
                const { setKenicDomainAuthCode } = await import("./kenic-nisc");
                outboundAuthCode = await setKenicDomainAuthCode(domain);
            }
            catch (err) {
                console.error("[KENIC] Failed to set outbound auth code after transfer:", err);
            }
        }
        const warnings = [];
        if (!transferResult.pending) {
            try {
                await setKenicTransferLock(domain, true);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                console.error("[KENIC] Failed to enable transfer lock after transfer:", err);
                warnings.push(`Domain transferred but transfer lock could not be enabled (${msg})  enable lock manually.`);
            }
        }
        const subscriptionDate = await resolveDomainTransferSubscriptionStartDate({
            domainTransferRequestId: metadata?.domainTransferRequestId,
            orderCreatedAt: order.createdAt,
        });
        const billingCycle = resolveDomainBillingCycle(item.billingCycle);
        const registryExpiry = transferResult.exDate ? new Date(transferResult.exDate) : null;
        const periodDates = resolveSubscriptionPeriodDates(subscriptionDate, billingCycle, {
            expiryOverride: registryExpiry && !Number.isNaN(registryExpiry.getTime()) ? registryExpiry : null,
        });
        const subId = randomUUID();
        const inserted = await db
            .insert(niscClientSubscription)
            .values({
            id: subId,
            name: domain,
            description: item.description === "transfer" ? "domain-transfer" : (item.description ?? "domain-transfer"),
            userId: order.userId,
            teamId: order.teamId,
            productId: item.productId,
            productPlanId: item.productPlanId ?? null,
            orderId: null,
            niscOrderId: order.id,
            subscribedBy: order.createdBy,
            status: "ACTIVE",
            subscriptionDate,
            billingCycle: billingCycle,
            nextRenewalDate: periodDates.nextRenewalDate,
            pricingModel: "FIXED",
            agreedPrice: agreedPriceIncVatFromOrderLine(item),
            agreedCurrency: order.currency,
            agreedCost: item.productPlan?.cost ?? null,
            agreedCostCurrency: "KES",
            primaryDomain: domain,
            openProviderId: null,
            domainAuthCode: outboundAuthCode,
            expiryDate: periodDates.expiryDate,
            agreedCommissionRate: null,
            agreedCommissionBase: null,
            metadata: warnings.length ? { transferLockWarning: warnings[0] } : null,
        })
            .returning();
        const sub = inserted[0];
        if (!sub) {
            throw new Error("Failed to create Nisc subscription");
        }
        if (order.createdBy) {
            await provisionInitialUsageCreditsForSubscription({
                subscriptionId: sub.id,
                productId: item.productId,
                productPlanId: item.productPlanId ?? null,
                performedByUserId: order.createdBy,
            });
        }
        return {
            ok: true,
            subscriptionId: sub.id,
            status: transferResult.pending ? "PENDING" : "PROVISIONED",
            pendingVerification: transferResult.pending,
            rawResponse: transferResult.raw,
            ...(warnings.length ? { warnings } : {}),
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const errorDetails = buildProvisioningErrorDetails(err);
        return {
            ok: false,
            error: message,
            errorDetails,
        };
    }
}
async function processOpenProviderTransferOrderItem(order, item) {
    const domainName = item.primaryDomain;
    if (!domainName) {
        return { ok: false, error: "Primary domain is required for domain transfer." };
    }
    const meta = item.metadata;
    const authCode = meta?.transferAuthCode?.trim();
    if (!authCode) {
        return { ok: false, error: "Transfer auth code is required. Provide it in the order item metadata (transferAuthCode)." };
    }
    const ownerId = await resolveOwnerId(order, item);
    if (!ownerId || !order.createdBy) {
        return { ok: false, error: "Order must have a team or user and createdBy for domain transfer." };
    }
    try {
        const metadata = item.metadata;
        let nameServers = metadata?.nameServers;
        if (!nameServers || nameServers.length === 0) {
            try {
                const { resolveNameserversForDomain } = await import("./tld-resolution");
                nameServers = await resolveNameserversForDomain(domainName);
            }
            catch (err) {
                return { ok: false, error: err instanceof Error ? err.message : "Failed to resolve nameservers for domain" };
            }
        }
        const openProvider = await import("@npanel/api/lib/openprovider-nisc");
        const result = await openProvider.ensureOpenProviderAndTransferDomain({
            ownerId,
            createdBy: order.createdBy,
            domainName,
            authCode,
            orderId: order.id,
            orderItemId: item.id,
            productId: item.productId,
            productPlanId: item.productPlanId ?? undefined,
            description: item.description ?? undefined,
            userId: order.userId,
            teamId: order.teamId,
            billingCycle: resolveDomainBillingCycle(item.billingCycle),
            itemPrice: item.itemSubtotal || item.itemPrice,
            currency: order.currency,
            nameServers,
            period: resolveDomainRegistrationPeriodYears(item.billingCycle, item.metadata),
            metadata: item.metadata,
            manualDetails: metadata?.manualRegistrantDetails,
            domainTransferRequestId: metadata?.domainTransferRequestId,
            orderCreatedAt: order.createdAt,
        });
        return {
            ok: true,
            subscriptionId: result.subscriptionId,
            status: result.pendingVerification ? "PENDING" : "PROVISIONED",
            pendingVerification: result.pendingVerification,
            rawResponse: result.rawResponse,
            ...(result.warnings?.length ? { warnings: result.warnings } : {}),
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
            ok: false,
            error: message,
            errorDetails: buildProvisioningErrorDetails(err),
        };
    }
}
async function processOpenProviderOrderItem(order, item) {
    const domainName = item.primaryDomain;
    if (!domainName) {
        return { ok: false, error: "Primary domain is required for domain registration." };
    }
    const ownerId = await resolveOwnerId(order, item);
    if (!ownerId || !order.createdBy) {
        return { ok: false, error: "Order must have a team or user and createdBy for domain registration." };
    }
    try {
        const metadata = item.metadata;
        let nameServers = metadata?.nameServers;
        if (!nameServers || nameServers.length === 0) {
            try {
                const { resolveNameserversForDomain } = await import("./tld-resolution");
                nameServers = await resolveNameserversForDomain(domainName);
            }
            catch (err) {
                return { ok: false, error: err instanceof Error ? err.message : "Failed to resolve nameservers for domain" };
            }
        }
        const openProvider = await import("@npanel/api/lib/openprovider-nisc");
        const result = await openProvider.ensureOpenProviderAndRegisterDomain({
            ownerId,
            createdBy: order.createdBy,
            domainName,
            orderId: order.id,
            orderItemId: item.id,
            productId: item.productId,
            productPlanId: item.productPlanId ?? undefined,
            description: item.description ?? undefined,
            userId: order.userId,
            teamId: order.teamId,
            billingCycle: resolveDomainBillingCycle(item.billingCycle),
            itemPrice: item.itemSubtotal || item.itemPrice,
            currency: order.currency,
            nameServers,
            period: resolveDomainRegistrationPeriodYears(item.billingCycle, item.metadata),
            metadata: item.metadata,
            manualDetails: metadata?.manualRegistrantDetails,
        });
        if (result.subscriptionId) {
            return {
                ok: true,
                subscriptionId: result.subscriptionId,
                status: result.pendingVerification ? "PENDING" : "PROVISIONED",
                pendingVerification: result.pendingVerification,
                ...(result.warnings?.length ? { warnings: result.warnings } : {}),
            };
        }
        return {
            ok: true,
            status: result.pendingVerification ? "PENDING" : "PROVISIONED",
            pendingVerification: result.pendingVerification,
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
            ok: false,
            error: message,
            errorDetails: buildProvisioningErrorDetails(err),
        };
    }
}
