import * as crypto from "crypto";
import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, ilike, inArray, or, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { userProfile } from "@npanel/db/schema/auth-extras";
import { domainTransferRequest } from "@npanel/db/schema/domain-transfer-requests";
import { niscOrder, niscOrderItem } from "@npanel/db/schema/nisc-orders";
import { niscClientSubscription, niscProduct, niscProductPlan, } from "@npanel/db/schema/products";
import { paymentTransaction } from "@npanel/db/schema/payment-transactions";
import { team } from "@npanel/db/schema/teams";
import { protectedProcedure, router } from "../trpc";
import { enqueueNiscOrderProcessing } from "../lib/qstash/nisc-order-worker";
import { isKenicDomain } from "../lib/epp/kenic-tlds";
import { createFromPaymentInputSchema, createOrderInputSchema, getAllNiscOrdersInputSchema, getNiscOrderByIdInputSchema, retryNiscOrderInputSchema, } from "./nisc-service-orders-schemas";
function generateNiscOrderNumber() {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `Nisc-${year}-${timestamp}-${random}`;
}
export const niscServiceOrdersRouter = router({
    getAll: protectedProcedure
        .input(getAllNiscOrdersInputSchema)
        .query(async ({ ctx, input }) => {
        if (!ctx.session?.user?.id) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "You must be logged in to view Nisc orders",
            });
        }
        const conditions = [];
        if (input.userId != null)
            conditions.push(eq(niscOrder.userId, input.userId));
        if (input.teamId != null)
            conditions.push(eq(niscOrder.teamId, input.teamId));
        if (input.status != null)
            conditions.push(eq(niscOrder.status, input.status));
        const whereClause = conditions.length ? and(...conditions) : undefined;
        const [orders, totalRow] = await Promise.all([
            db.query.niscOrder.findMany({
                where: whereClause,
                orderBy: [desc(niscOrder.createdAt)],
                limit: input.limit,
                offset: input.offset,
                with: {
                    orderItems: {
                        with: {
                            product: { columns: { id: true, name: true, serviceType: true } },
                            productPlan: { columns: { id: true, name: true } },
                        },
                    },
                    user: { columns: { id: true, name: true, email: true } },
                    team: { columns: { id: true, name: true } },
                },
            }),
            db
                .select({ c: count() })
                .from(niscOrder)
                .where(whereClause ?? sql `true`),
        ]);
        const total = Number(totalRow[0]?.c ?? 0);
        return {
            orders: orders.map((o) => ({
                id: o.id,
                orderNumber: o.orderNumber,
                userId: o.userId,
                teamId: o.teamId,
                status: o.status,
                subtotal: o.subtotal,
                total: o.total,
                currency: o.currency,
                notes: o.notes,
                failureReason: o.failureReason,
                createdAt: o.createdAt,
                completedAt: o.completedAt,
                user: o.user,
                team: o.team,
                orderItems: o.orderItems.map((i) => ({
                    id: i.id,
                    productId: i.productId,
                    productPlanId: i.productPlanId,
                    productName: i.product.name,
                    planName: i.productPlan?.name ?? null,
                    serviceType: i.product.serviceType,
                    description: i.description,
                    itemPrice: i.itemPrice,
                    itemSubtotal: i.itemSubtotal,
                    status: i.status,
                    provisioningError: i.provisioningError,
                    niscClientSubscriptionId: i.niscClientSubscriptionId,
                })),
            })),
            total,
        };
    }),
    getById: protectedProcedure
        .input(getNiscOrderByIdInputSchema)
        .query(async ({ ctx, input }) => {
        if (!ctx.session?.user?.id) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "You must be logged in to view Nisc orders",
            });
        }
        const order = await db.query.niscOrder.findFirst({
            where: eq(niscOrder.id, input.id),
            with: {
                orderItems: {
                    with: {
                        product: true,
                        productPlan: true,
                        niscClientSubscription: true,
                        domainSubscription: true,
                    },
                },
                user: true,
                team: true,
                niscProductPromo: true,
                processingLogs: {
                    orderBy: (l, { asc: a }) => [a(l.createdAt)],
                },
            },
        });
        if (!order) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Nisc order not found",
            });
        }
        return order;
    }),
    create: protectedProcedure
        .input(createOrderInputSchema)
        .mutation(async ({ ctx, input }) => {
        const session = ctx.session;
        if (!session?.user?.id) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "You must be logged in to create Nisc orders",
            });
        }
        const teamRow = input.teamId
            ? await db
                .select({ createdById: team.createdById })
                .from(team)
                .where(eq(team.id, input.teamId))
                .limit(1)
                .then((r) => r[0])
            : null;
        const ownerId = teamRow?.createdById ?? input.userId;
        for (const item of input.items) {
            const product = await db.query.niscProduct.findFirst({
                where: eq(niscProduct.id, item.productId),
                with: {
                    plans: { where: eq(niscProductPlan.id, item.productPlanId) },
                },
            });
            if (!product || !product.isActive) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: `Product ${item.productId} not found or inactive`,
                });
            }
            const plan = product.plans[0];
            if (!plan || !plan.isActive) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: `Plan ${item.productPlanId} not found or inactive`,
                });
            }
            if (product.serviceType === "web_hosting" ||
                product.serviceType === "email_hosting") {
                const domainSubId = item.domainSubscriptionId ?? null;
                if (!domainSubId) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `Hosting item "${product.name}" requires selecting a domain subscription.`,
                    });
                }
                const domainParts = [
                    eq(niscClientSubscription.id, domainSubId),
                    or(ilike(niscProduct.serviceType, "%domain%"), ilike(niscProduct.name, "%domain%")),
                ];
                if (input.userId != null) {
                    domainParts.push(eq(niscClientSubscription.userId, input.userId));
                }
                if (input.teamId != null) {
                    domainParts.push(eq(niscClientSubscription.teamId, input.teamId));
                }
                const domainSubRows = await db
                    .select({
                    id: niscClientSubscription.id,
                    primaryDomain: niscClientSubscription.primaryDomain,
                    name: niscProduct.name,
                })
                    .from(niscClientSubscription)
                    .innerJoin(niscProduct, eq(niscClientSubscription.productId, niscProduct.id))
                    .where(and(...domainParts))
                    .limit(1);
                const domainSub = domainSubRows[0];
                if (!domainSub) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `Invalid or inaccessible domain subscription for "${product.name}".`,
                    });
                }
            }
            if (product.serviceType === "domain_registration" && !item.primaryDomain) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `Domain registration item "${product.name}" requires a primary domain name.`,
                });
            }
            const isDomainService = product.serviceType === "domain_transfer" ||
                product.serviceType === "domain_registration" ||
                product.serviceType === "domains" ||
                product.serviceType.toLowerCase().includes("domain");
            const isTransferItem = isDomainService && product.serviceType === "domain_transfer";
            if (isTransferItem) {
                const meta = item.metadata && typeof item.metadata === "object"
                    ? item.metadata
                    : null;
                if (!item.primaryDomain || !meta?.transferAuthCode?.trim()) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `Domain transfer item "${product.name}" requires a primary domain and transfer auth code (metadata.transferAuthCode).`,
                    });
                }
            }
        }
        const needsIntegration = await Promise.all(input.items.map(async (i) => {
            const pRows = await db
                .select({ serviceType: niscProduct.serviceType })
                .from(niscProduct)
                .where(eq(niscProduct.id, i.productId))
                .limit(1);
            const p = pRows[0];
            return (p?.serviceType === "web_hosting" ||
                p?.serviceType === "email_hosting" ||
                p?.serviceType === "domain_registration" ||
                p?.serviceType === "domain_transfer");
        })).then((arr) => arr.some(Boolean));
        if (needsIntegration && ownerId) {
            const profileRows = await db
                .select()
                .from(userProfile)
                .where(eq(userProfile.userId, ownerId))
                .limit(1);
            const profile = profileRows[0];
            if (!profile) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Complete your profile information and retry creating an order.",
                });
            }
            const required = [
                profile.firstName,
                profile.lastName,
                profile.address,
                profile.city,
                profile.country,
                profile.postalCode,
                profile.phone,
            ];
            if (required.some((f) => !f || String(f).trim() === "")) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Complete your profile information and retry creating an order.",
                });
            }
        }
        let orderNumber;
        let existing;
        do {
            orderNumber = generateNiscOrderNumber();
            const rows = await db
                .select({ id: niscOrder.id })
                .from(niscOrder)
                .where(eq(niscOrder.orderNumber, orderNumber))
                .limit(1);
            existing = rows[0];
        } while (existing);
        const currency = "KES";
        const planPrices = await Promise.all(input.items.map(async (item) => {
            const planRows = await db
                .select({ price: niscProductPlan.price })
                .from(niscProductPlan)
                .where(eq(niscProductPlan.id, item.productPlanId))
                .limit(1);
            const plan = planRows[0];
            const price = plan?.price ?? "0";
            return { price: Number(price) || 0, item };
        }));
        const subtotal = planPrices.reduce((sum, { price }) => sum + price, 0);
        const total = subtotal;
        const insertedOrder = await db
            .insert(niscOrder)
            .values({
            id: randomUUID(),
            orderNumber,
            userId: input.userId ?? null,
            teamId: input.teamId ?? null,
            createdBy: session.user.id,
            status: "PENDING",
            subtotal: String(subtotal),
            total: String(total),
            currency,
            notes: input.notes ?? null,
        })
            .returning();
        const order = insertedOrder[0];
        if (!order) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create Nisc order",
            });
        }
        for (const { price, item } of planPrices) {
            const priceStr = String(price);
            const metadata = item.metadata && typeof item.metadata === "object"
                ? item.metadata
                : null;
            let primaryDomain = item.primaryDomain ?? null;
            if (item.domainSubscriptionId && !primaryDomain) {
                const subRows = await db
                    .select({
                    primaryDomain: niscClientSubscription.primaryDomain,
                    name: niscProduct.name,
                })
                    .from(niscClientSubscription)
                    .innerJoin(niscProduct, eq(niscClientSubscription.productId, niscProduct.id))
                    .where(and(eq(niscClientSubscription.id, item.domainSubscriptionId), or(ilike(niscProduct.serviceType, "%domain%"), ilike(niscProduct.name, "%domain%"))))
                    .limit(1);
                const sub = subRows[0];
                primaryDomain = sub?.primaryDomain ?? sub?.name ?? null;
            }
            await db.insert(niscOrderItem).values({
                id: randomUUID(),
                niscOrderId: order.id,
                productId: item.productId,
                productPlanId: item.productPlanId,
                billingCycle: item.billingCycle ?? null,
                itemPrice: priceStr,
                itemSubtotal: priceStr,
                itemCurrency: currency,
                primaryDomain,
                domainSubscriptionId: item.domainSubscriptionId ?? null,
                metadata: metadata ?? null,
            });
        }
        let qstashMessageId = null;
        try {
            const result = await enqueueNiscOrderProcessing(order.id);
            qstashMessageId = result.messageId;
        }
        catch (err) {
            await db
                .update(niscOrder)
                .set({
                failureReason: (err instanceof Error ? err.message : String(err)).slice(0, 500),
            })
                .where(eq(niscOrder.id, order.id));
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: err instanceof Error
                    ? err.message
                    : "Failed to enqueue order for processing",
            });
        }
        await db
            .update(niscOrder)
            .set({ qstashMessageId })
            .where(eq(niscOrder.id, order.id));
        return db.query.niscOrder.findFirst({
            where: eq(niscOrder.id, order.id),
            with: {
                orderItems: {
                    with: {
                        product: { columns: { id: true, name: true, serviceType: true } },
                        productPlan: { columns: { id: true, name: true } },
                    },
                },
                user: { columns: { id: true, name: true, email: true } },
                team: { columns: { id: true, name: true } },
            },
        });
    }),
    /**
     * Create a Nisc order from a successful M-Pesa payment (agency: logged-in user only).
     * Verifies payment by checkoutRequestId, creates order with paymentTransactionId, enqueues processing, sends "order received" email.
     */
    createFromPayment: protectedProcedure
        .input(createFromPaymentInputSchema)
        .mutation(async ({ ctx, input }) => {
        const session = ctx.session;
        if (!session?.user?.id) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "You must be logged in to create an order from payment",
            });
        }
        const userId = session.user.id;
        const txRows = await db
            .select()
            .from(paymentTransaction)
            .where(and(eq(paymentTransaction.checkoutRequestId, input.checkoutRequestId), eq(paymentTransaction.userId, userId), eq(paymentTransaction.status, "SUCCESS")))
            .limit(1);
        const transaction = txRows[0];
        if (!transaction) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Payment not found or not yet successful. Wait a moment and try again.",
            });
        }
        for (const item of input.items) {
            const productRows = await db
                .select()
                .from(niscProduct)
                .where(eq(niscProduct.id, item.productId))
                .limit(1);
            const product = productRows[0];
            if (!product || !product.isActive) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: `Product ${item.productId} not found or inactive`,
                });
            }
            if ((product.serviceType === "domain_registration" || product.serviceType === "domain_transfer") &&
                !item.primaryDomain?.trim()) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `Domain item "${product.name}" requires a primary domain.`,
                });
            }
        }
        const needsProfile = await Promise.all(input.items.map(async (i) => {
            const pRows = await db
                .select({ serviceType: niscProduct.serviceType })
                .from(niscProduct)
                .where(eq(niscProduct.id, i.productId))
                .limit(1);
            const p = pRows[0];
            return (p?.serviceType === "web_hosting" ||
                p?.serviceType === "email_hosting" ||
                p?.serviceType === "domain_registration" ||
                p?.serviceType === "domain_transfer");
        })).then((arr) => arr.some(Boolean));
        if (needsProfile) {
            const payProfileRows = await db
                .select()
                .from(userProfile)
                .where(eq(userProfile.userId, userId))
                .limit(1);
            const profile = payProfileRows[0];
            if (!profile) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Complete your profile information and retry creating an order.",
                });
            }
            const required = [
                profile.firstName,
                profile.lastName,
                profile.address,
                profile.city,
                profile.country,
                profile.postalCode,
                profile.phone,
            ];
            if (required.some((f) => !f || String(f).trim() === "")) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Complete your profile information and retry creating an order.",
                });
            }
        }
        // For domain_transfer items: create DomainTransferRequest (PENDING) so processor can update status later
        const transferRequestIdsByIndex = [];
        const now = new Date();
        for (let idx = 0; idx < input.items.length; idx++) {
            const item = input.items[idx];
            if (item == null) {
                transferRequestIdsByIndex.push(null);
                continue;
            }
            const xferProdRows = await db
                .select({ serviceType: niscProduct.serviceType })
                .from(niscProduct)
                .where(eq(niscProduct.id, item.productId))
                .limit(1);
            const product = xferProdRows[0];
            const isDomainService = product?.serviceType === "domain_transfer" ||
                product?.serviceType === "domain_registration" ||
                product?.serviceType === "domains" ||
                (product?.serviceType?.toLowerCase().includes("domain") ?? false);
            const isTransferItem = isDomainService &&
                (item.description === "transfer" || product?.serviceType === "domain_transfer");
            if (!isTransferItem || !item.primaryDomain?.trim()) {
                transferRequestIdsByIndex.push(null);
                continue;
            }
            const meta = item.metadata && typeof item.metadata === "object"
                ? item.metadata
                : null;
            const authCode = meta?.transferAuthCode?.trim();
            if (!authCode) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `Domain transfer item requires metadata.transferAuthCode.`,
                });
            }
            const domainName = item.primaryDomain.trim();
            const provider = isKenicDomain(domainName) ? "KENIC" : "OPENPROVIDER";
            const requestId = crypto.randomUUID();
            await db.insert(domainTransferRequest).values({
                id: requestId,
                domainName,
                authCode,
                provider,
                status: "PENDING",
                customerPriceAmount: item.itemSubtotal ?? null,
                customerPriceCurrency: input.currency ?? "KES",
                teamId: input.teamId ?? null,
                createdById: userId,
                createdAt: now,
                updatedAt: now,
            });
            transferRequestIdsByIndex.push(requestId);
        }
        let orderNumber;
        let existing;
        do {
            orderNumber = generateNiscOrderNumber();
            const rows = await db
                .select({ id: niscOrder.id })
                .from(niscOrder)
                .where(eq(niscOrder.orderNumber, orderNumber))
                .limit(1);
            existing = rows[0];
        } while (existing);
        const subtotalNum = input.items.reduce((sum, i) => sum + parseFloat(i.itemSubtotal || "0"), 0);
        const totalNum = subtotalNum;
        const subtotal = String(subtotalNum);
        const total = String(totalNum);
        const currency = input.currency || "KES";
        const payOrderIns = await db
            .insert(niscOrder)
            .values({
            id: randomUUID(),
            orderNumber,
            userId: userId,
            teamId: input.teamId ?? null,
            createdBy: session.user.id,
            status: "PENDING",
            subtotal,
            total,
            currency,
            paymentTransactionId: transaction.id,
        })
            .returning();
        const order = payOrderIns[0];
        if (!order) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create Nisc order",
            });
        }
        for (let idx = 0; idx < input.items.length; idx++) {
            const item = input.items[idx];
            const metadata = item.metadata && typeof item.metadata === "object"
                ? item.metadata
                : null;
            const domainTransferRequestId = transferRequestIdsByIndex[idx] ?? undefined;
            const mergedMetadata = domainTransferRequestId != null
                ? { ...(metadata ?? {}), domainTransferRequestId }
                : (metadata ?? undefined);
            await db.insert(niscOrderItem).values({
                id: randomUUID(),
                niscOrderId: order.id,
                productId: item.productId,
                productPlanId: item.productPlanId ?? null,
                billingCycle: item.billingCycle ?? null,
                itemPrice: item.itemPrice,
                itemSubtotal: item.itemSubtotal,
                itemCurrency: currency,
                primaryDomain: item.primaryDomain ?? null,
                domainSubscriptionId: item.domainSubscriptionId ?? null,
                description: item.description ?? null,
                metadata: mergedMetadata ?? null,
            });
        }
        // Link DomainTransferRequest(s) to this order for tracking
        for (const requestId of transferRequestIdsByIndex) {
            if (requestId) {
                await db
                    .update(domainTransferRequest)
                    .set({ niscOrderId: order.id, updatedAt: new Date() })
                    .where(eq(domainTransferRequest.id, requestId));
            }
        }
        let qstashMessageId = null;
        try {
            const result = await enqueueNiscOrderProcessing(order.id);
            qstashMessageId = result.messageId;
        }
        catch (err) {
            await db
                .update(niscOrder)
                .set({
                failureReason: (err instanceof Error ? err.message : String(err)).slice(0, 500),
            })
                .where(eq(niscOrder.id, order.id));
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: err instanceof Error ? err.message : "Failed to enqueue order for processing",
            });
        }
        await db
            .update(niscOrder)
            .set({ qstashMessageId })
            .where(eq(niscOrder.id, order.id));
        // Fire-and-forget: send "order received" email to the logged-in user
        void (async () => {
            try {
                const orderWithUser = await db.query.niscOrder.findFirst({
                    where: eq(niscOrder.id, order.id),
                    with: {
                        orderItems: {
                            with: {
                                product: { columns: { name: true } },
                            },
                        },
                        user: { columns: { id: true, name: true, email: true } },
                    },
                });
                if (!orderWithUser?.user?.email)
                    return;
                const { sendEmail } = await import("../lib/email");
                const { renderNiscOrderReceivedEmail } = await import("../lib/email-templates");
                const orderItems = orderWithUser.orderItems.map((i) => ({
                    name: i.primaryDomain || (i.product?.name ?? "Order item"),
                    description: i.description ?? undefined,
                    price: i.itemPrice,
                }));
                const html = await renderNiscOrderReceivedEmail({
                    customerName: orderWithUser.user.name ?? undefined,
                    orderNumber: orderWithUser.orderNumber,
                    orderDate: orderWithUser.createdAt.toISOString().replace("T", " ").slice(0, 16),
                    totalAmount: orderWithUser.total,
                    currency: orderWithUser.currency,
                    orderItems,
                });
                await sendEmail({
                    to: orderWithUser.user.email,
                    subject: `Order ${orderWithUser.orderNumber} received`,
                    html,
                });
            }
            catch (e) {
                console.error("Failed to send order received email:", e);
            }
        })();
        return db.query.niscOrder.findFirst({
            where: eq(niscOrder.id, order.id),
            with: {
                orderItems: {
                    with: {
                        product: { columns: { id: true, name: true, serviceType: true } },
                        productPlan: { columns: { id: true, name: true } },
                    },
                },
                user: { columns: { id: true, name: true, email: true } },
                team: { columns: { id: true, name: true } },
            },
        });
    }),
    retry: protectedProcedure
        .input(retryNiscOrderInputSchema)
        .mutation(async ({ ctx, input }) => {
        if (!ctx.session?.user?.id) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "You must be logged in to retry Nisc orders",
            });
        }
        const retryOrderRows = await db
            .select()
            .from(niscOrder)
            .where(eq(niscOrder.id, input.niscOrderId))
            .limit(1);
        const order = retryOrderRows[0];
        if (!order) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Nisc order not found",
            });
        }
        if (order.status !== "FAILED" && order.status !== "PARTIAL") {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Only failed or partial orders can be retried",
            });
        }
        try {
            await enqueueNiscOrderProcessing(order.id);
        }
        catch (err) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: err instanceof Error
                    ? err.message
                    : "Failed to re-enqueue order for processing",
            });
        }
        await db.transaction(async (tx) => {
            await tx
                .update(niscOrder)
                .set({
                status: "PENDING",
                failureReason: null,
                processedAt: null,
                completedAt: null,
            })
                .where(eq(niscOrder.id, order.id));
            await tx
                .update(niscOrderItem)
                .set({ status: "PENDING", provisioningError: null })
                .where(and(eq(niscOrderItem.niscOrderId, order.id), inArray(niscOrderItem.status, ["FAILED", "SKIPPED"])));
        });
        return { success: true, niscOrderId: order.id };
    }),
});
