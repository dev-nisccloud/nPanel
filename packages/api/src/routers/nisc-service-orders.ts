import * as crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import prisma, { Prisma } from "@nPanel/db";
import { enqueueNiscOrderProcessing } from "../lib/qstash/nisc-order-worker";
import { isKenicDomain } from "../lib/epp/kenic-tlds";
import {
	createFromPaymentInputSchema,
	createOrderInputSchema,
	createOrderItemSchema,
	getAllNiscOrdersInputSchema,
	getNiscOrderByIdInputSchema,
	retryNiscOrderInputSchema,
} from "./nisc-service-orders-schemas";

function generateNiscOrderNumber(): string {
	const year = new Date().getFullYear();
	const timestamp = Date.now().toString().slice(-6);
	const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
	return `NISC-${year}-${timestamp}-${random}`;
}

export const niscServiceOrdersRouter = router({
	getAll: protectedProcedure
		.input(getAllNiscOrdersInputSchema)
		.query(async ({ ctx, input }) => {
			if (!ctx.session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to view NISC orders",
				});
			}

			const where: Prisma.NiscOrderWhereInput = {};
			if (input.userId != null) where.userId = input.userId;
			if (input.teamId != null) where.teamId = input.teamId;
			if (input.status != null) where.status = input.status;

			const [orders, total] = await Promise.all([
				prisma.niscOrder.findMany({
					where,
					include: {
						orderItems: {
							include: {
								product: { select: { id: true, name: true, serviceType: true } },
								productPlan: { select: { id: true, name: true } },
							},
						},
						user: { select: { id: true, name: true, email: true } },
						team: { select: { id: true, name: true } },
					},
					orderBy: { createdAt: "desc" },
					take: input.limit,
					skip: input.offset,
				}),
				prisma.niscOrder.count({ where }),
			]);

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
					message: "You must be logged in to view NISC orders",
				});
			}

			const order = await prisma.niscOrder.findUnique({
				where: { id: input.id },
				include: {
					orderItems: {
						include: {
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
						orderBy: { createdAt: "asc" },
					},
				},
			});

			if (!order) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "NISC order not found",
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
					message: "You must be logged in to create NISC orders",
				});
			}

			const ownerId = input.teamId
				? (await prisma.team.findUnique({
						where: { id: input.teamId },
						select: { createdById: true },
					}))?.createdById ?? input.userId
				: input.userId;

			for (const item of input.items) {
				const product = await prisma.niscProduct.findUnique({
					where: { id: item.productId },
					include: {
						plans: { where: { id: item.productPlanId } },
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

				if (
					product.serviceType === "web_hosting" ||
					product.serviceType === "email_hosting"
				) {
					const domainSubId = item.domainSubscriptionId ?? null;
					if (!domainSubId) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `Hosting item "${product.name}" requires selecting a domain subscription.`,
						});
					}
					const domainSub = await prisma.niscClientSubscription.findFirst({
						where: {
							id: domainSubId,
							product: {
								OR: [
									{ serviceType: { contains: "domain", mode: "insensitive" } },
									{ name: { contains: "domain", mode: "insensitive" } },
								],
							},
							...(input.userId != null && { userId: input.userId }),
							...(input.teamId != null && { teamId: input.teamId }),
						},
						select: { id: true, primaryDomain: true, name: true },
					});
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
				const isDomainService =
					product.serviceType === "domain_transfer" ||
					product.serviceType === "domain_registration" ||
					product.serviceType === "domains" ||
					product.serviceType.toLowerCase().includes("domain");
				const isTransferItem =
					isDomainService && product.serviceType === "domain_transfer";
				if (isTransferItem) {
					const meta =
						item.metadata && typeof item.metadata === "object"
							? (item.metadata as { transferAuthCode?: string })
							: null;
					if (!item.primaryDomain || !meta?.transferAuthCode?.trim()) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `Domain transfer item "${product.name}" requires a primary domain and transfer auth code (metadata.transferAuthCode).`,
						});
					}
				}
			}

			const needsIntegration = await Promise.all(
				input.items.map(async (i) => {
					const p = await prisma.niscProduct.findUnique({
						where: { id: i.productId },
						select: { serviceType: true },
					});
					return (
						p?.serviceType === "web_hosting" ||
						p?.serviceType === "email_hosting" ||
						p?.serviceType === "domain_registration" ||
						p?.serviceType === "domain_transfer"
					);
				}),
			).then((arr) => arr.some(Boolean));

			if (needsIntegration && ownerId) {
				const user = await prisma.user.findUnique({
					where: { id: ownerId },
					include: { profile: true },
				});
				if (!user?.profile) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message:
							"Complete your profile information and retry creating an order.",
					});
				}
				const profile = user.profile;
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
						message:
							"Complete your profile information and retry creating an order.",
					});
				}
			}

			let orderNumber: string;
			let existing: { id: string } | null;
			do {
				orderNumber = generateNiscOrderNumber();
				existing = await prisma.niscOrder.findUnique({
					where: { orderNumber },
					select: { id: true },
				});
			} while (existing);

			const currency = "KES";
			const planPrices = await Promise.all(
				input.items.map(async (item) => {
					const plan = await prisma.niscProductPlan.findUnique({
						where: { id: item.productPlanId },
						select: { price: true },
					});
					const price = plan?.price ?? "0";
					return { price: Number(price) || 0, item };
				}),
			);
			const subtotal = planPrices.reduce((sum, { price }) => sum + price, 0);
			const total = subtotal;

			const order = await prisma.niscOrder.create({
				data: {
					orderNumber,
					userId: input.userId ?? null,
					teamId: input.teamId ?? null,
					createdBy: session.user.id,
					status: "PENDING",
					subtotal: String(subtotal),
					total: String(total),
					currency,
					notes: input.notes ?? null,
				},
			});

			for (const { price, item } of planPrices) {
				const priceStr = String(price);
				const metadata =
					item.metadata && typeof item.metadata === "object"
						? (item.metadata as { transferAuthCode?: string; nameServers?: Array<{ name: string; ip?: string }> })
						: null;
				let primaryDomain = item.primaryDomain ?? null;
				if (item.domainSubscriptionId && !primaryDomain) {
					const sub = await prisma.niscClientSubscription.findFirst({
						where: {
							id: item.domainSubscriptionId,
							product: {
								OR: [
									{ serviceType: { contains: "domain", mode: "insensitive" } },
									{ name: { contains: "domain", mode: "insensitive" } },
								],
							},
						},
						select: { primaryDomain: true, name: true },
					});
					primaryDomain = sub?.primaryDomain ?? sub?.name ?? null;
				}
				await prisma.niscOrderItem.create({
					data: {
						niscOrderId: order.id,
						productId: item.productId,
						productPlanId: item.productPlanId,
						billingCycle: item.billingCycle ?? null,
						itemPrice: priceStr,
						itemSubtotal: priceStr,
						itemCurrency: currency,
						primaryDomain,
						domainSubscriptionId: item.domainSubscriptionId ?? null,
						metadata: metadata ?? undefined,
					},
				});
			}

			let qstashMessageId: string | null = null;
			try {
				const result = await enqueueNiscOrderProcessing(order.id);
				qstashMessageId = result.messageId;
			} catch (err) {
				await prisma.niscOrder.update({
					where: { id: order.id },
					data: { failureReason: (err instanceof Error ? err.message : String(err)).slice(0, 500) },
				});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						err instanceof Error
							? err.message
							: "Failed to enqueue order for processing",
				});
			}

			await prisma.niscOrder.update({
				where: { id: order.id },
				data: { qstashMessageId },
			});

			return prisma.niscOrder.findUnique({
				where: { id: order.id },
				include: {
					orderItems: {
						include: {
							product: { select: { id: true, name: true, serviceType: true } },
							productPlan: { select: { id: true, name: true } },
						},
					},
					user: { select: { id: true, name: true, email: true } },
					team: { select: { id: true, name: true } },
				},
			});
		}),

	/**
	 * Create a NISC order from a successful M-Pesa payment (agency: logged-in user only).
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

			const transaction = await prisma.paymentTransaction.findFirst({
				where: {
					checkoutRequestId: input.checkoutRequestId,
					userId,
					status: "SUCCESS",
				},
			});
			if (!transaction) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payment not found or not yet successful. Wait a moment and try again.",
				});
			}

			for (const item of input.items) {
				const product = await prisma.niscProduct.findUnique({
					where: { id: item.productId },
				});
				if (!product || !product.isActive) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: `Product ${item.productId} not found or inactive`,
					});
				}
				if (
					(product.serviceType === "domain_registration" || product.serviceType === "domain_transfer") &&
					!item.primaryDomain?.trim()
				) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Domain item "${product.name}" requires a primary domain.`,
					});
				}
			}

			const needsProfile = await Promise.all(
				input.items.map(async (i) => {
					const p = await prisma.niscProduct.findUnique({
						where: { id: i.productId },
						select: { serviceType: true },
					});
					return (
						p?.serviceType === "web_hosting" ||
						p?.serviceType === "email_hosting" ||
						p?.serviceType === "domain_registration" ||
						p?.serviceType === "domain_transfer"
					);
				}),
			).then((arr) => arr.some(Boolean));

			if (needsProfile) {
				const user = await prisma.user.findUnique({
					where: { id: userId },
					include: { profile: true },
				});
				if (!user?.profile) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Complete your profile information and retry creating an order.",
					});
				}
				const profile = user.profile;
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
			const transferRequestIdsByIndex: (string | null)[] = [];
			const now = new Date();
			for (let idx = 0; idx < input.items.length; idx++) {
				const item = input.items[idx];
				if (item == null) {
					transferRequestIdsByIndex.push(null);
					continue;
				}
				const product = await prisma.niscProduct.findUnique({
					where: { id: item.productId },
					select: { serviceType: true },
				});
				const isDomainService =
					product?.serviceType === "domain_transfer" ||
					product?.serviceType === "domain_registration" ||
					product?.serviceType === "domains" ||
					(product?.serviceType?.toLowerCase().includes("domain") ?? false);
				const isTransferItem =
					isDomainService &&
					(item.description === "transfer" || product?.serviceType === "domain_transfer");
				if (!isTransferItem || !item.primaryDomain?.trim()) {
					transferRequestIdsByIndex.push(null);
					continue;
				}
				const meta = item.metadata && typeof item.metadata === "object"
					? (item.metadata as { transferAuthCode?: string })
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
				await prisma.domainTransferRequest.create({
					data: {
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
					},
				});
				transferRequestIdsByIndex.push(requestId);
			}

			let orderNumber: string;
			let existing: { id: string } | null;
			do {
				orderNumber = generateNiscOrderNumber();
				existing = await prisma.niscOrder.findUnique({
					where: { orderNumber },
					select: { id: true },
				});
			} while (existing);

			const subtotalNum = input.items.reduce((sum, i) => sum + parseFloat(i.itemSubtotal || "0"), 0);
			const totalNum = subtotalNum;
			const subtotal = String(subtotalNum);
			const total = String(totalNum);
			const currency = input.currency || "KES";

			const order = await prisma.niscOrder.create({
				data: {
					orderNumber,
					userId: userId,
					teamId: input.teamId ?? null,
					createdBy: session.user.id,
					status: "PENDING",
					subtotal,
					total,
					currency,
					paymentTransactionId: transaction.id,
				},
			});

			for (let idx = 0; idx < input.items.length; idx++) {
				const item = input.items[idx]!;
				const metadata =
					item.metadata && typeof item.metadata === "object"
						? (item.metadata as { transferAuthCode?: string; nameServers?: Array<{ name: string; ip?: string }> })
						: null;
				const domainTransferRequestId = transferRequestIdsByIndex[idx] ?? undefined;
				const mergedMetadata =
					domainTransferRequestId != null
						? { ...(metadata ?? {}), domainTransferRequestId }
						: (metadata ?? undefined);
				await prisma.niscOrderItem.create({
					data: {
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
						metadata: mergedMetadata ?? undefined,
					},
				});
			}

			// Link DomainTransferRequest(s) to this order for tracking
			for (const requestId of transferRequestIdsByIndex) {
				if (requestId) {
					await prisma.domainTransferRequest.update({
						where: { id: requestId },
						data: { niscOrder: { connect: { id: order.id } }, updatedAt: new Date() },
					});
				}
			}

			let qstashMessageId: string | null = null;
			try {
				const result = await enqueueNiscOrderProcessing(order.id);
				qstashMessageId = result.messageId;
			} catch (err) {
				await prisma.niscOrder.update({
					where: { id: order.id },
					data: { failureReason: (err instanceof Error ? err.message : String(err)).slice(0, 500) },
				});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						err instanceof Error ? err.message : "Failed to enqueue order for processing",
				});
			}

			await prisma.niscOrder.update({
				where: { id: order.id },
				data: { qstashMessageId },
			});

			// Fire-and-forget: send "order received" email to the logged-in user
			void (async () => {
				try {
					const orderWithUser = await prisma.niscOrder.findUnique({
						where: { id: order.id },
						include: {
							orderItems: {
								include: {
									product: { select: { name: true } },
								},
							},
							user: { select: { id: true, name: true, email: true } },
						},
					});
					if (!orderWithUser?.user?.email) return;
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
				} catch (e) {
					console.error("Failed to send order received email:", e);
				}
			})();

			return prisma.niscOrder.findUnique({
				where: { id: order.id },
				include: {
					orderItems: {
						include: {
							product: { select: { id: true, name: true, serviceType: true } },
							productPlan: { select: { id: true, name: true } },
						},
					},
					user: { select: { id: true, name: true, email: true } },
					team: { select: { id: true, name: true } },
				},
			});
		}),

	retry: protectedProcedure
		.input(retryNiscOrderInputSchema)
		.mutation(async ({ ctx, input }) => {
			if (!ctx.session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to retry NISC orders",
				});
			}

			const order = await prisma.niscOrder.findUnique({
				where: { id: input.niscOrderId },
			});

			if (!order) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "NISC order not found",
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
			} catch (err) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						err instanceof Error
							? err.message
							: "Failed to re-enqueue order for processing",
				});
			}

			await prisma.$transaction([
				prisma.niscOrder.update({
					where: { id: order.id },
					data: {
						status: "PENDING",
						failureReason: null,
						processedAt: null,
						completedAt: null,
					},
				}),
				prisma.niscOrderItem.updateMany({
					where: {
						niscOrderId: order.id,
						status: { in: ["FAILED", "SKIPPED"] },
					},
					data: { status: "PENDING", provisioningError: null },
				}),
			]);

			return { success: true, niscOrderId: order.id };
		}),
});
