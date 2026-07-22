/**
 * Nisc order processor: runs in the QStash worker to process a single NiscOrder.
 * For each item: no integration → create NiscClientSubscription;
 * Plesk (web_hosting, email_hosting) → ensure integration + provision;
 * OpenProvider (domain_registration) → ensure integration, verify email, register domain;
 * OpenProvider (domain_transfer) → ensure integration, verify email, transfer domain (auth code in item.metadata);
 * Hivelocity (dedicated_server_hosting, vps_hosting, vds_hosting) → Deployment API, create subscription with device refs.
 */
import { eq } from "@npanel/db";
import { randomUUID } from "node:crypto";

import { db } from "@npanel/db";
import { niscOrder, niscOrderItem } from "@npanel/db/schema/nisc-orders";
import { domainTransferRequest } from "@npanel/db/schema/domain-transfer-requests";
import { niscClientSubscription } from "@npanel/db/schema/products";
import { team } from "@npanel/db/schema/teams";
import { niscLog } from "./nisc-order-logger";
import { provisionInitialUsageCreditsForSubscription } from "./subscription-usage-provisioning";
import {
	isZeepoAiAgentProduct,
	provisionZeepoAgentOrderItem,
} from "./zeepo-agent-order-provisioning";
import { isKenicDomain } from "./epp/kenic-tlds";
import { ensureKenicIntegration, registerKenicDomain } from "./kenic-nisc";
import { OpenProviderApiError } from "./openprovider-client";
import {
	computeSubscriptionExpiryFromBillingCycle,
	resolveDomainTransferSubscriptionStartDate,
	resolveSubscriptionPeriodDates,
} from "./nisc-subscription-dates";
import { processHivelocityOrderItem } from "./hivelocity-nisc-processor";
import { HIVELOCITY_SERVICE_TYPES } from "../routers/nisc-service-orders-schemas";

/** Build a serializable error-details object for provisioningErrorDetails (exact provider response for debugging). */
function buildProvisioningErrorDetails(err: unknown): Record<string, unknown> {
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
const PLESK_SERVICE_TYPES = ["web_hosting", "email_hosting"];
const OPENPROVIDER_SERVICE_TYPES = ["domain_registration", "domain_transfer"];

/** Product serviceType "domains" is treated as domain_registration. */
function resolveServiceType(serviceType: string): string {
	if (serviceType === "domains") return "domain_registration";
	return serviceType;
}

/** Resolve provisioning branch from product type plus checkout hints (description / auth code). */
function resolveItemServiceType(
	rawServiceType: string,
	item: { description: string | null; metadata: unknown },
): string {
	const base = resolveServiceType(rawServiceType);
	if (base !== "domain_registration") return base;
	const meta = item.metadata as { transferAuthCode?: string } | null;
	if (item.description === "transfer" || meta?.transferAuthCode?.trim()) {
		return "domain_transfer";
	}
	return base;
}

/** Resolve domain provider from TLD: KENIC for .ke/.co.ke etc., OpenProvider for the rest. */
function getDomainProvider(domain: string | null): "kenic" | "openprovider" {
	if (!domain || typeof domain !== "string" || !domain.trim()) return "openprovider";
	return isKenicDomain(domain) ? "kenic" : "openprovider";
}

export type ProcessNiscOrderResult =
	| { ok: true; status: "COMPLETED" | "PARTIAL"; failureReason?: string }
	| { ok: false; status: "FAILED"; failureReason: string };

export async function processNiscOrder(niscOrderId: string): Promise<ProcessNiscOrderResult> {
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
	await db
		.update(niscOrder)
		.set({ status: "PROCESSING", processedAt: now, updatedAt: now })
		.where(eq(niscOrder.id, niscOrderId));
	await niscLog("processor_order_status_updated", { niscOrderId, status: "PROCESSING" });

	let hasFailure = false;
	let hasSuccess = false;
	const failureReasons: string[] = [];

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
				} else {
					const pleskErrorDetails = {
						provider: "plesk" as const,
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

			if (HIVELOCITY_SERVICE_TYPES.includes(serviceType as (typeof HIVELOCITY_SERVICE_TYPES)[number])) {
				await niscLog("processor_item_branch", {
					niscOrderId,
					orderItemId: item.id,
					branch: "hivelocity",
					serviceType,
				});
				const result = await processHivelocityOrderItem(order, item);
				const operation = (item.metadata as { operation?: string } | null)?.operation;
				const hivelocityCall =
					operation === "vps_upgrade"
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
				} else {
					const errDetails = result.errorDetails ?? {
						provider: "hivelocity" as const,
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
					reason:
						domainProvider === "kenic"
							? "TLD is .ke/.co.ke or other KENIC TLD"
							: "TLD is not KENIC; using OpenProvider",
				});
				await niscLog("processor_item_branch", {
					niscOrderId,
					orderItemId: item.id,
					branch:
						domainProvider === "kenic"
							? serviceType === "domain_transfer"
								? "kenic_transfer"
								: "kenic_registration"
							: serviceType === "domain_transfer"
								? "openprovider_transfer"
								: "openprovider_registration",
					serviceType,
					domainProvider,
				});

				const transferMeta = serviceType === "domain_transfer" ? (item.metadata as DomainTransferItemMetadata) : null;
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

				const result =
					domainProvider === "kenic"
						? serviceType === "domain_transfer"
							? await processKenicTransferOrderItem(order, item)
							: await processKenicOrderItem(order, item)
						: serviceType === "domain_transfer"
							? await processOpenProviderTransferOrderItem(order, item)
							: await processOpenProviderOrderItem(order, item);
				const branchName =
					domainProvider === "kenic"
						? serviceType === "domain_transfer"
							? "kenic_transfer"
							: "kenic_registration"
						: serviceType === "domain_transfer"
							? "openprovider_transfer"
							: "openprovider_registration";
				if (result.ok) {
					if (branchName === "kenic_transfer" || branchName === "openprovider_transfer") {
						const rawResponse =
							"rawResponse" in result ? (result as { rawResponse?: unknown }).rawResponse : undefined;
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
					await db
						.update(niscOrderItem)
						.set({
							status: result.status,
							niscClientSubscriptionId: result.subscriptionId ?? undefined,
							provisioningError: result.pendingVerification ? "Pending email verification" : undefined,
							updatedAt: now,
						})
						.where(eq(niscOrderItem.id, item.id));
					if (domainTransferRequestId) {
						await db
							.update(domainTransferRequest)
							.set({
								status: "COMPLETED",
								providerResponse: {
									subscriptionId: result.subscriptionId ?? null,
									status: result.status,
									pendingVerification: result.pendingVerification ?? false,
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
					});
					hasSuccess = true;
				} else {
					const errDetails = "errorDetails" in result ? result.errorDetails : undefined;
					if (branchName === "kenic_transfer" || branchName === "openprovider_transfer") {
						const rawResponse =
							errDetails && typeof errDetails === "object" && "rawResponse" in errDetails
								? (errDetails as { rawResponse?: unknown }).rawResponse
								: errDetails;
						await niscLog("processor_api_raw_response", {
							niscOrderId,
							orderItemId: item.id,
							provider: branchName === "kenic_transfer" ? "kenic" : "openprovider",
							call: branchName === "kenic_transfer" ? "executeKenicTransferRequest" : "transferDomain",
							rawResponse: rawResponse ?? errDetails,
						});
					}
					const updateData: Partial<typeof niscOrderItem.$inferInsert> = {
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
						rawResponse:
							errDetails && typeof errDetails === "object" && "rawResponse" in errDetails
								? (errDetails as { rawResponse?: unknown }).rawResponse
								: errDetails,
					});
					hasFailure = true;
					failureReasons.push(`Item ${item.product.name}: ${result.error}`);
				}
				continue;
			}

			// Default: DB-only (no external provider). Create subscription and provision usage from plan when configured.
			// Covers all service types not requiring Plesk or domain provider, e.g. ai_image_generator, background_remover, creatives, consulting, custom, etc.
			const isZeepoItem = isZeepoAiAgentProduct(item.productId);
			await niscLog("processor_item_branch", {
				niscOrderId,
				orderItemId: item.id,
				branch: isZeepoItem ? "zeepo_ai_agent" : "no_integration",
				serviceType,
				...(isZeepoItem ? { teamId: order.teamId ?? null } : {}),
			});
			let sub: { id: string };
			if (isZeepoItem) {
				const zeepoResult = await provisionZeepoAgentOrderItem(
					{
						userId: order.userId,
						teamId: order.teamId,
						createdBy: order.createdBy,
						orderId: order.id,
						currency: order.currency,
					},
					{
						productId: item.productId,
						productPlanId: item.productPlanId,
						billingCycle: item.billingCycle,
						itemPrice: item.itemPrice,
						description: item.description,
						metadata: item.metadata as Record<string, unknown> | null,
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
					},
				);
				sub = { id: zeepoResult.subscriptionId };
			} else {
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
				branch: isZeepoItem ? "zeepo_ai_agent" : "no_integration",
				subscriptionId: sub.id,
			});
			hasSuccess = true;
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			const errorDetails = buildProvisioningErrorDetails(err);
			const rawResponse =
				errorDetails && "rawResponse" in errorDetails ? errorDetails.rawResponse : errorDetails;
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
				const transferMeta = item.metadata as DomainTransferItemMetadata;
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
	let orderStatus: "COMPLETED" | "FAILED" | "PARTIAL";
	if (hasFailure && !hasSuccess) {
		orderStatus = "FAILED";
	} else if (hasFailure && hasSuccess) {
		orderStatus = "PARTIAL";
	} else {
		orderStatus = "COMPLETED";
	}

	await niscLog("processor_complete", {
		niscOrderId,
		orderStatus,
		hasFailure,
		hasSuccess,
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
		return { ok: false as const, status: "FAILED" as const, failureReason: failureReason ?? "" };
	}
	return {
		ok: true as const,
		status: orderStatus,
		failureReason: failureReason ?? undefined,
	};
}

async function createSubscriptionForOrderItem(
	order: {
		userId: string | null;
		teamId: string | null;
		createdBy: string | null;
		id: string;
		currency: string;
	},
	item: {
		id: string;
		productId: string;
		productPlanId: string | null;
		billingCycle: string | null;
		itemPrice: string;
		itemSubtotal: string;
		description: string | null;
		product: { name: string };
		productPlan: {
			name: string;
			pricingModel: string;
			price: string | null;
			cost: string | null;
			hostingType: string | null;
		} | null;
	},
) {
	const plan = item.productPlan;
	const name = plan ? `${item.product.name} - ${plan.name}` : item.product.name;
	const pricingModel = (plan?.pricingModel as "FIXED" | "COMMISSION") ?? "FIXED";
	const now = new Date();
	const periodDates = resolveSubscriptionPeriodDates(now, item.billingCycle);
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
			billingCycle: (item.billingCycle as any) ?? null,
			pricingModel,
			agreedPrice: item.itemPrice,
			agreedCurrency: order.currency,
			agreedCost: plan?.cost ?? null,
			agreedCostCurrency: "KES",
			providerCost: plan?.cost ?? null,
			providerCostCurrency: "KES",
			agreedCommissionRate: null as any,
			agreedCommissionBase: null,
			expiryDate: periodDates.expiryDate,
			nextRenewalDate: periodDates.nextRenewalDate,
			metadata: null,
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

async function processPleskOrderItem(
	order: { teamId: string | null; userId: string | null; createdBy: string | null; id: string; currency: string },
	item: {
		id: string;
		productId: string;
		productPlanId: string | null;
		billingCycle: string | null;
		itemPrice: string;
		itemSubtotal: string;
		primaryDomain: string | null;
		domainSubscriptionId: string | null;
		product: { name: string };
		productPlan: {
			name: string;
			pricingModel: string;
			price: string | null;
			cost: string | null;
			pleskServicePlanId: string | null;
			pleskIpAddress: string | null;
			hostingType: string | null;
		} | null;
		domainSubscription: { name: string | null; primaryDomain: string | null } | null;
	},
): Promise<
	| { ok: true; subscriptionId: string; rawResponse: unknown }
	| { ok: false; error: string; errorDetails?: Record<string, unknown> }
> {
	if (!item.productPlanId || !item.productPlan) {
		return { ok: false, error: "Hosting item requires a product plan." };
	}
	const domainName =
		item.primaryDomain ||
		item.domainSubscription?.primaryDomain ||
		item.domainSubscription?.name ||
		null;
	if (!domainName) {
		return { ok: false, error: "Domain is required for hosting. Select a domain subscription." };
	}

	const meta = item.metadata as { provisionUserId?: string } | null;
	const provisionUserIdFromMeta = meta?.provisionUserId?.trim() || null;
	const teamOwnerId = provisionUserIdFromMeta
		? provisionUserIdFromMeta
		: order.teamId
			? (
					await db
						.select({ createdById: team.createdById })
						.from(team)
						.where(eq(team.id, order.teamId))
						.limit(1)
				)[0]?.createdById
			: order.userId;
	if (!teamOwnerId || !order.createdBy) {
		return { ok: false, error: "Order must have a team or user and createdBy for Plesk provisioning." };
	}

	const planId = item.productPlan.pleskServicePlanId;
	if (!planId) {
		return { ok: false, error: "Product plan has no Plesk service plan configured." };
	}

	try {
		const { ensurePleskIntegration, provisionToPlesk } = await import(
			"@npanel/api/lib/plesk-integration"
		);
		const pleskOwnerId = await ensurePleskIntegration(teamOwnerId, order.createdBy);
		const result = await provisionToPlesk({
			domainName,
			pleskOwnerId,
			pleskServicePlanId: planId,
			ipAddress: item.productPlan.pleskIpAddress ?? undefined,
		});

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
				billingCycle: item.billingCycle as any ?? null,
				pricingModel: item.productPlan.pricingModel as any,
				agreedPrice: item.itemPrice,
				agreedCurrency: order.currency,
				agreedCost: item.productPlan.cost ?? null,
				agreedCostCurrency: "KES",
				primaryDomain: domainName,
				pleskFilterId: result.pleskServiceId,
				pleskOwnerId,
				pleskFtpLogin: result.pleskFtpLogin,
				pleskFtpPassword: result.pleskFtpPassword,
				hostingType: item.productPlan.hostingType as any ?? null,
				agreedCommissionRate: null as any,
				agreedCommissionBase: null,
				expiryDate: periodDates.expiryDate,
				nextRenewalDate: periodDates.nextRenewalDate,
				metadata: null,
			})
			.returning();
		const sub = inserted[0];
		if (!sub) {
			throw new Error("Failed to create Nisc subscription");
		}

		if (order.createdBy) {
			await provisionInitialUsageCreditsForSubscription({
				subscriptionId: sub!.id,
				productId: item.productId,
				productPlanId: item.productPlanId,
				performedByUserId: order.createdBy,
			});
		}

		return {
			ok: true,
			subscriptionId: sub!.id,
			rawResponse: result.pleskResponseData,
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			ok: false as const,
			error: message,
			errorDetails: buildProvisioningErrorDetails(err),
		};
	}
}

/** Metadata stored on NiscOrderItem for domain_transfer (auth code, optional nameservers, link to DomainTransferRequest). */
type DomainTransferItemMetadata = {
	transferAuthCode?: string;
	nameServers?: Array<{ name: string; ip?: string }>;
	domainTransferRequestId?: string;
} | null;

type DomainOrderItem = {
	id: string;
	productId: string;
	productPlanId: string | null;
	billingCycle: string | null;
	itemPrice: string;
	itemSubtotal: string;
	primaryDomain: string | null;
	description: string | null;
	metadata: unknown;
	product: { name: string };
	productPlan: { name: string; pricingModel: string; price: string | null; cost: string | null } | null;
};

type DomainOrder = {
	teamId: string | null;
	userId: string | null;
	createdBy: string | null;
	id: string;
	currency: string;
	createdAt: Date;
};

function billingCycleToYears(billingCycle: string | null): number {
	if (!billingCycle) return 1;
	const cycle = billingCycle.trim().toUpperCase();
	if (cycle === "BIENNIALLY") return 2;
	if (cycle === "TRIENNIALLY") return 3;
	if (cycle === "QUADRENNIALLY") return 4;
	if (cycle === "YEARLY") return 1;
	return 1;
}

async function resolveOwnerId(order: DomainOrder, item: DomainOrderItem): Promise<string | null> {
	const metadata = item.metadata as {
		useRegistrantInfo?: string;
		provisionUserId?: string;
	} | null;
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
async function processKenicOrderItem(
	order: DomainOrder,
	item: DomainOrderItem,
): Promise<
	| { ok: true; subscriptionId: string; status: "PROVISIONED"; pendingVerification?: boolean }
	| { ok: false; error: string; errorDetails?: Record<string, unknown> }
> {
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
		const metadata = item.metadata as {
			nameServers?: Array<{ name: string; ip?: string }>;
			manualRegistrantDetails?: any;
		} | null;
		void niscLog("processor_item_metadata", {
			niscOrderId: order.id,
			orderItemId: item.id,
			metadata,
		});

		const { contactId } = await ensureKenicIntegration(ownerId, order.createdBy, {
			logContext: { niscOrderId: order.id, orderItemId: item.id },
			manualDetails: metadata?.manualRegistrantDetails,
		});
		const period = billingCycleToYears(item.billingCycle);
		let nameServers = metadata?.nameServers;

		if (!nameServers || nameServers.length === 0) {
			try {
				const { resolveNameserversForDomain } = await import("./tld-resolution");
				nameServers = await resolveNameserversForDomain(domain);
			} catch (err) {
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
		const subId = randomUUID();
		const subscriptionDate = new Date();
		const registryExpiry = regResult.exDate ? new Date(regResult.exDate) : null;
		const periodDates = resolveSubscriptionPeriodDates(subscriptionDate, item.billingCycle, {
			expiryOverride: registryExpiry,
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
				billingCycle: (item.billingCycle as "YEARLY" | "BIENNIALLY" | null) ?? null,
				pricingModel: "FIXED",
				agreedPrice: item.itemPrice,
				agreedCurrency: order.currency,
				agreedCost: item.productPlan?.cost ?? null,
				agreedCostCurrency: "KES",
				primaryDomain: domain,
				openProviderId: null,
				domainAuthCode: regResult.authInfo,
				expiryDate: periodDates.expiryDate,
				nextRenewalDate: periodDates.nextRenewalDate,
				agreedCommissionRate: null as any,
				agreedCommissionBase: null,
				metadata: null,
			})
			.returning();
		const sub = inserted[0];
		if (!sub) {
			throw new Error("Failed to create Nisc subscription");
		}

		if (order.createdBy) {
			await provisionInitialUsageCreditsForSubscription({
				subscriptionId: sub!.id,
				productId: item.productId,
				productPlanId: item.productPlanId ?? null,
				performedByUserId: order.createdBy,
			});
		}

		return {
			ok: true,
			subscriptionId: sub!.id,
			status: "PROVISIONED",
		};
	} catch (err) {
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
async function processKenicTransferOrderItem(
	order: DomainOrder,
	item: DomainOrderItem,
): Promise<
	| { ok: true; subscriptionId: string; status: "PROVISIONED" | "PENDING"; pendingVerification?: boolean; rawResponse?: unknown }
	| { ok: false; error: string; errorDetails?: Record<string, unknown> }
> {
	const domain = item.primaryDomain?.trim();
	if (!domain) {
		return { ok: false, error: "Primary domain is required for KENIC domain transfer." };
	}
	const meta = item.metadata as DomainTransferItemMetadata;
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
		const metadata = item.metadata as DomainTransferItemMetadata & { manualRegistrantDetails?: any };
		let nameServers = metadata?.nameServers;

		if (!nameServers || nameServers.length === 0) {
			try {
				const { resolveNameserversForDomain } = await import("./tld-resolution");
				nameServers = await resolveNameserversForDomain(domain);
			} catch (err) {
				return { ok: false, error: err instanceof Error ? err.message : "Failed to resolve nameservers for domain" };
			}
		}

		const { executeKenicTransferRequest } = await import("./kenic-transfer-request");
		const transferResult = await executeKenicTransferRequest({
			name: domain,
			authCode,
			period: 1,
			nameServers,
		});

		// CoCCA never returns plaintext auth codes later. Set a fresh outbound code when
		// we already sponsor the domain (non-pending). Pending transfers get no stored code yet.
		let outboundAuthCode: string | null = null;
		if (!transferResult.pending) {
			try {
				const { setKenicDomainAuthCode } = await import("./kenic-nisc");
				outboundAuthCode = await setKenicDomainAuthCode(domain);
			} catch (err) {
				console.error("[KENIC] Failed to set outbound auth code after transfer:", err);
			}
		}

		const subscriptionDate = await resolveDomainTransferSubscriptionStartDate({
			domainTransferRequestId: metadata?.domainTransferRequestId,
			orderCreatedAt: order.createdAt,
		});
		const expiryDate = computeSubscriptionExpiryFromBillingCycle(
			subscriptionDate,
			item.billingCycle,
		);
		const subId = randomUUID();
		const inserted = await db
			.insert(niscClientSubscription)
			.values({
				id: subId,
				name: domain,
				description:
					item.description === "transfer" ? "domain-transfer" : (item.description ?? "domain-transfer"),
				userId: order.userId,
				teamId: order.teamId,
				productId: item.productId,
				productPlanId: item.productPlanId ?? null,
				orderId: null,
				niscOrderId: order.id,
				subscribedBy: order.createdBy,
				status: "ACTIVE",
				subscriptionDate,
				billingCycle: (item.billingCycle as "YEARLY" | "BIENNIALLY" | null) ?? null,
				nextRenewalDate: expiryDate,
				pricingModel: "FIXED",
				agreedPrice: item.itemPrice,
				agreedCurrency: order.currency,
				agreedCost: item.productPlan?.cost ?? null,
				agreedCostCurrency: "KES",
				primaryDomain: domain,
				openProviderId: null,
				domainAuthCode: outboundAuthCode,
				expiryDate,
				agreedCommissionRate: null as any,
				agreedCommissionBase: null,
				metadata: null,
			})
			.returning();
		const sub = inserted[0];
		if (!sub) {
			throw new Error("Failed to create Nisc subscription");
		}

		if (order.createdBy) {
			await provisionInitialUsageCreditsForSubscription({
				subscriptionId: sub!.id,
				productId: item.productId,
				productPlanId: item.productPlanId ?? null,
				performedByUserId: order.createdBy,
			});
		}

		return {
			ok: true,
			subscriptionId: sub!.id,
			status: transferResult.pending ? "PENDING" : "PROVISIONED",
			pendingVerification: transferResult.pending,
			rawResponse: transferResult.raw,
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		const errorDetails = buildProvisioningErrorDetails(err);
		return {
			ok: false as const,
			error: message,
			errorDetails,
		};
	}
}

async function processOpenProviderTransferOrderItem(
	order: DomainOrder,
	item: {
		id: string;
		productId: string;
		productPlanId: string | null;
		billingCycle: string | null;
		itemPrice: string;
		itemSubtotal: string;
		primaryDomain: string | null;
		description: string | null;
		metadata: unknown;
		product: { name: string };
		productPlan: { name: string; pricingModel: string; price: string | null; cost: string | null } | null;
	},
): Promise<
	| { ok: true; subscriptionId?: string; status: "PROVISIONED" | "PENDING"; pendingVerification?: boolean; rawResponse?: unknown }
	| { ok: false; error: string; errorDetails?: Record<string, unknown> }
> {
	const domainName = item.primaryDomain;
	if (!domainName) {
		return { ok: false, error: "Primary domain is required for domain transfer." };
	}
	const meta = item.metadata as DomainTransferItemMetadata;
	const authCode = meta?.transferAuthCode?.trim();
	if (!authCode) {
		return { ok: false, error: "Transfer auth code is required. Provide it in the order item metadata (transferAuthCode)." };
	}

	const ownerId = await resolveOwnerId(order, item);
	if (!ownerId || !order.createdBy) {
		return { ok: false, error: "Order must have a team or user and createdBy for domain transfer." };
	}

	try {
		const metadata = item.metadata as DomainTransferItemMetadata & {
			manualRegistrantDetails?: unknown;
		};
		let nameServers = metadata?.nameServers;

		if (!nameServers || nameServers.length === 0) {
			try {
				const { resolveNameserversForDomain } = await import("./tld-resolution");
				nameServers = await resolveNameserversForDomain(domainName);
			} catch (err) {
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
			billingCycle: item.billingCycle,
			itemPrice: item.itemPrice,
			currency: order.currency,
			nameServers,
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
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			ok: false as const,
			error: message,
			errorDetails: buildProvisioningErrorDetails(err),
		};
	}
}

async function processOpenProviderOrderItem(
	order: { teamId: string | null; userId: string | null; createdBy: string | null; id: string; currency: string },
	item: {
		id: string;
		productId: string;
		productPlanId: string | null;
		billingCycle: string | null;
		itemPrice: string;
		itemSubtotal: string;
		primaryDomain: string | null;
		description: string | null;
		product: { name: string };
		productPlan: { name: string; pricingModel: string; price: string | null; cost: string | null } | null;
	},
): Promise<
	| { ok: true; subscriptionId?: string; status: "PROVISIONED" | "PENDING"; pendingVerification?: boolean }
	| { ok: false; error: string; errorDetails?: Record<string, unknown> }
> {
	const domainName = item.primaryDomain;
	if (!domainName) {
		return { ok: false, error: "Primary domain is required for domain registration." };
	}

	const ownerId = await resolveOwnerId(order, item);
	if (!ownerId || !order.createdBy) {
		return { ok: false, error: "Order must have a team or user and createdBy for domain registration." };
	}

	try {
		const metadata = item.metadata as {
			nameServers?: Array<{ name: string; ip?: string }>;
			manualRegistrantDetails?: any;
		} | null;
		let nameServers = metadata?.nameServers;

		if (!nameServers || nameServers.length === 0) {
			try {
				const { resolveNameserversForDomain } = await import("./tld-resolution");
				nameServers = await resolveNameserversForDomain(domainName);
			} catch (err) {
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
			billingCycle: item.billingCycle,
			itemPrice: item.itemPrice,
			currency: order.currency,
			nameServers,
			manualDetails: metadata?.manualRegistrantDetails,
		});
		if (result.subscriptionId) {
			return {
				ok: true,
				subscriptionId: result.subscriptionId,
				status: result.pendingVerification ? "PENDING" : "PROVISIONED",
				pendingVerification: result.pendingVerification,
			};
		}
		return {
			ok: true,
			status: result.pendingVerification ? "PENDING" : "PROVISIONED",
			pendingVerification: result.pendingVerification,
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			ok: false as const,
			error: message,
			errorDetails: buildProvisioningErrorDetails(err),
		};
	}
}
