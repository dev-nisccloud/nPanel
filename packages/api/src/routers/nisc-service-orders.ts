import * as crypto from "crypto";
import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, count, desc, eq, ilike, inArray, or, sql } from "@npanel/db";

import { db } from "@npanel/db";
import { user } from "@npanel/db/schema/auth";
import { userProfile } from "@npanel/db/schema/auth-extras";
import { domainTransferRequest } from "@npanel/db/schema/domain-transfer-requests";
import { niscOrder, niscOrderItem } from "@npanel/db/schema/nisc-orders";
import {
	niscClientSubscription,
	niscProduct,
	niscProductPlan,
} from "@npanel/db/schema/products";
import { paymentTransaction } from "@npanel/db/schema/payment-transactions";
import { team, teamMember, teamBillingSettings } from "@npanel/db/schema/teams";
import { protectedProcedure, router } from "../trpc";
import {
	computeCeilVatTotals,
	paymentTotalString,
	reverseCeilVatToExVat,
} from "../lib/convert-price";
import { enqueueNiscOrderProcessing } from "../lib/qstash/nisc-order-worker";
import { userIsAgencyStaff } from "../lib/domain-transfer-access";
import { isKenicDomain } from "../lib/epp/kenic-tlds";
import {
	isDomainBundleLeadItem,
	orderItemsIncludeDomainBundle,
} from "../lib/domain-bundle-order";
import { processNiscOrder } from "../lib/nisc-order-processor";
import { runPreProvisioningInvoiceForOrder } from "../lib/nisc-order-invoice-delivery";
import { isZeepoAiAgentProduct } from "../lib/zeepo-agent-order-provisioning";
import { resolveActiveNiscProductById } from "../lib/planless-product-resolver";
import { resolveDomainBillingCycle } from "../lib/nisc-subscription-dates";
import {
	createFromPaymentInputSchema,
	createOrderInputSchema,
	getAllNiscOrdersInputSchema,
	getNiscOrderByIdInputSchema,
	retryNiscOrderInputSchema,
	hivelocityItemMetadataSchema,
	HIVELOCITY_SERVICE_TYPES,
} from "./nisc-service-orders-schemas";

function generateNiscOrderNumber(): string {
	const year = new Date().getFullYear();
	const timestamp = Date.now().toString().slice(-6);
	const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
	return `Nisc-${year}-${timestamp}-${random}`;
}

async function processNiscOrderWithPreInvoice(niscOrderId: string) {
	await runPreProvisioningInvoiceForOrder(niscOrderId);
	return processNiscOrder(niscOrderId);
}

function isAgencyUserRole(role: string | null | undefined): boolean {
	return ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");
}

/** Match app-side agency detection for checkout assignee (e.g. domains portfolio buy now). */
function canAssignBilledForUserId(role: string | null | undefined): boolean {
	if (isAgencyUserRole(role)) return true;
	return (role ?? "").toUpperCase().includes("AGENCY");
}

function isAgencySuperAdminRole(role: string | null | undefined): boolean {
	return role === "AGENCY_SUPER_ADMIN";
}

function resolveOrderServiceType(serviceType: string): string {
	return serviceType === "domains" ? "domain_registration" : serviceType;
}

function requiresExternalProvisioning(serviceType: string): boolean {
	const resolved = resolveOrderServiceType(serviceType);
	return (
		resolved === "web_hosting" ||
		resolved === "email_hosting" ||
		resolved === "wordpress_hosting" ||
		resolved === "website_hosting" ||
		resolved === "domain_registration" ||
		resolved === "domain_transfer" ||
		HIVELOCITY_SERVICE_TYPES.includes(resolved as (typeof HIVELOCITY_SERVICE_TYPES)[number])
	);
}

function isHostingServiceType(serviceType: string): boolean {
	const st = serviceType.trim().toLowerCase();
	return (
		st === "web_hosting" ||
		st === "email_hosting" ||
		st === "wordpress_hosting" ||
		st === "website_hosting"
	);
}

async function isTeamMember(teamId: string, userId: string): Promise<boolean> {
	const [member] = await db
		.select({ id: teamMember.id })
		.from(teamMember)
		.where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)))
		.limit(1);
	return Boolean(member);
}

async function canAccessOrderRead(orderId: string, userId: string, role: string | null | undefined) {
	const [order] = await db
		.select({
			id: niscOrder.id,
			userId: niscOrder.userId,
			teamId: niscOrder.teamId,
		})
		.from(niscOrder)
		.where(eq(niscOrder.id, orderId))
		.limit(1);

	if (!order) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Nisc order not found" });
	}

	if (isAgencyUserRole(role)) return order;
	if (order.userId === userId) return order;
	if (order.teamId && (await isTeamMember(order.teamId, userId))) return order;

	throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
}

async function canAccessOrderMutation(orderId: string, userId: string, role: string | null | undefined) {
	const [order] = await db
		.select({
			id: niscOrder.id,
			userId: niscOrder.userId,
		})
		.from(niscOrder)
		.where(eq(niscOrder.id, orderId))
		.limit(1);

	if (!order) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Nisc order not found" });
	}

	if (!isAgencySuperAdminRole(role) && order.userId !== userId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Only the order creator can modify it",
		});
	}

	return order;
}

export const niscServiceOrdersRouter = router({
	getSummary: protectedProcedure
		.output(
			z.object({
				total: z.number(),
				completed: z.number(),
				failed: z.number(),
				pending: z.number(),
			}),
		)
		.query(async ({ ctx }) => {
			const userId = ctx.session?.user?.id;
			const userRole = ctx.session?.user?.role;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to view Nisc order summary",
				});
			}

			const whereClause = isAgencyUserRole(userRole)
				? undefined
				: eq(niscOrder.userId, userId);

			const [totalRows, completedRows, failedRows, pendingRows] = await Promise.all([
				db
					.select({ c: count() })
					.from(niscOrder)
					.where(whereClause ?? sql`true`),
				db
					.select({ c: count() })
					.from(niscOrder)
					.where(
						whereClause
							? and(whereClause, eq(niscOrder.status, "COMPLETED"))
							: eq(niscOrder.status, "COMPLETED"),
					),
				db
					.select({ c: count() })
					.from(niscOrder)
					.where(
						whereClause
							? and(whereClause, eq(niscOrder.status, "FAILED"))
							: eq(niscOrder.status, "FAILED"),
					),
				db
					.select({ c: count() })
					.from(niscOrder)
					.where(
						whereClause
							? and(whereClause, inArray(niscOrder.status, ["PENDING", "PROCESSING", "PARTIAL"]))
							: inArray(niscOrder.status, ["PENDING", "PROCESSING", "PARTIAL"]),
					),
			]);

			return {
				total: Number(totalRows[0]?.c ?? 0),
				completed: Number(completedRows[0]?.c ?? 0),
				failed: Number(failedRows[0]?.c ?? 0),
				pending: Number(pendingRows[0]?.c ?? 0),
			};
		}),

	getAll: protectedProcedure
		.input(getAllNiscOrdersInputSchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			const userRole = ctx.session?.user?.role;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to view Nisc orders",
				});
			}

			const conditions = [];
			if (!isAgencyUserRole(userRole)) {
				conditions.push(eq(niscOrder.userId, userId));
			}
			if (input.userId != null) conditions.push(eq(niscOrder.userId, input.userId));
			if (input.teamId != null) conditions.push(eq(niscOrder.teamId, input.teamId));
			if (input.status != null) conditions.push(eq(niscOrder.status, input.status));
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
					.where(whereClause ?? sql`true`),
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
					invoiceId: o.invoiceId,
					invoiceNumber: o.invoiceNumber,
					metadata: o.metadata,
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
			const userId = ctx.session?.user?.id;
			const userRole = ctx.session?.user?.role;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to view Nisc orders",
				});
			}

			await canAccessOrderRead(input.id, userId, userRole);

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
			const userRole = session.user.role;
			if (!isAgencySuperAdminRole(userRole)) {
				if (input.userId && input.userId !== session.user.id) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only agency super admin can create orders for other users",
					});
				}
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
				const resolvedProduct = await resolveActiveNiscProductById(item.productId);
				if (!resolvedProduct) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: `Product ${item.productId} not found or inactive`,
					});
				}
				if (resolvedProduct.id !== item.productId) {
					item.productId = resolvedProduct.id;
				}
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

				if (isHostingServiceType(product.serviceType)) {
					const domainSubId = item.domainSubscriptionId?.trim() || null;
					const primaryDomain = item.primaryDomain?.trim() || null;
					// Hosting needs a FQDN for Plesk / primaryDomain  not a separate Domains subscription.
					if (!domainSubId && !primaryDomain) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `Hosting item "${product.name}" requires a domain name (primaryDomain).`,
						});
					}
					if (domainSubId) {
						const domainParts = [
							eq(niscClientSubscription.id, domainSubId),
							or(
								ilike(niscProduct.serviceType, "%domain%"),
								ilike(niscProduct.name, "%domain%"),
							),
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
					const pRows = await db
						.select({ serviceType: niscProduct.serviceType })
						.from(niscProduct)
						.where(eq(niscProduct.id, i.productId))
						.limit(1);
					const p = pRows[0];
					return (
						p?.serviceType === "web_hosting" ||
						p?.serviceType === "email_hosting" ||
						p?.serviceType === "wordpress_hosting" ||
						p?.serviceType === "website_hosting" ||
						p?.serviceType === "domain_registration" ||
						p?.serviceType === "domain_transfer"
					);
				}),
			).then((arr) => arr.some(Boolean));

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
						message:
							"Complete your profile information and retry creating an order.",
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
						message:
							"Complete your profile information and retry creating an order.",
					});
				}
			}

			let orderNumber: string;
			let existing: { id: string } | undefined;
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
			const planPrices = await Promise.all(
				input.items.map(async (item) => {
					const planRows = await db
						.select({ price: niscProductPlan.price })
						.from(niscProductPlan)
						.where(eq(niscProductPlan.id, item.productPlanId))
						.limit(1);
					const plan = planRows[0];
					const price = plan?.price ?? "0";
					return { price: Number(price) || 0, item };
				}),
			);
			const subtotal = planPrices.reduce((sum, { price }) => sum + price, 0);
			const { totalIncVat } = computeCeilVatTotals(subtotal);
			const total = totalIncVat;

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
				const metadata =
					item.metadata && typeof item.metadata === "object"
						? (item.metadata as { transferAuthCode?: string; nameServers?: Array<{ name: string; ip?: string }> })
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
						.where(
							and(
								eq(niscClientSubscription.id, item.domainSubscriptionId),
								or(
									ilike(niscProduct.serviceType, "%domain%"),
									ilike(niscProduct.name, "%domain%"),
								),
							),
						)
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

			let qstashMessageId: string | null = null;
			try {
				const result = await enqueueNiscOrderProcessing(order.id);
				qstashMessageId = result.messageId;
			} catch (err) {
				await db
					.update(niscOrder)
					.set({
						failureReason: (err instanceof Error ? err.message : String(err)).slice(0, 500),
					})
					.where(eq(niscOrder.id, order.id));
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						err instanceof Error
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
			const userRole = session.user.role;

			const billedFor = input.billedForUserId?.trim();
			const isAgencyUser =
				canAssignBilledForUserId(userRole as string | undefined) ||
				(await userIsAgencyStaff(userId));

			const txConditions = [
				eq(paymentTransaction.checkoutRequestId, input.checkoutRequestId),
				eq(paymentTransaction.status, "SUCCESS"),
			];
			if (!isAgencyUser) {
				txConditions.push(eq(paymentTransaction.userId, userId));
			}

			const txRows = await db
				.select()
				.from(paymentTransaction)
				.where(and(...txConditions))
				.limit(1);
			const transaction = txRows[0];
			if (!transaction) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payment not found or not yet successful. Wait a moment and try again.",
				});
			}

			// Idempotency: one payment → one order (retries / card-return remounts must not double-create).
			const existingForPayment = await db.query.niscOrder.findFirst({
				where: eq(niscOrder.paymentTransactionId, transaction.id),
				columns: { id: true },
			});
			if (existingForPayment) {
				return db.query.niscOrder.findFirst({
					where: eq(niscOrder.id, existingForPayment.id),
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
			}

			// Paid STK amounts are tax-inclusive. Never allow underpayment vs checkout lines.
			// Agency overpay may scale lines UP only; underpay is always rejected.
			const paidAmountRaw = transaction.paidAmount ?? transaction.amount;
			const paidAmountNum = Number.parseFloat(paidAmountRaw);
			const clientSubtotalExVat = input.items.reduce(
				(sum, i) => sum + (Number.parseFloat(i.itemSubtotal || i.itemPrice || "0") || 0),
				0,
			);
			const { totalIncVat: expectedPaidIncVat } = computeCeilVatTotals(clientSubtotalExVat);
			if (!Number.isFinite(paidAmountNum) || paidAmountNum <= 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Payment amount is missing or invalid.",
				});
			}
		const paidIncVat = Math.ceil(paidAmountNum);
		// Partial payments are now allowed - removed underpayment validation
		const isBundleOrder = orderItemsIncludeDomainBundle(input.items);
			const bundleLeadIndex = isBundleOrder
				? input.items.findIndex((item) => isDomainBundleLeadItem(item.metadata))
				: -1;
			// Scale lines only when paid more than expected (agency overpay / tip).
			if (paidIncVat > expectedPaidIncVat) {
				const paidExVat = reverseCeilVatToExVat(paidIncVat);
				if (input.items.length === 1) {
					const exVatStr = String(paidExVat);
					input.items[0]!.itemPrice = exVatStr;
					input.items[0]!.itemSubtotal = exVatStr;
				} else if (bundleLeadIndex >= 0) {
					const exVatStr = String(paidExVat);
					input.items[bundleLeadIndex]!.itemPrice = exVatStr;
					input.items[bundleLeadIndex]!.itemSubtotal = exVatStr;
				} else {
					const currentSum = input.items.reduce(
						(sum, i) => sum + (Number.parseFloat(i.itemSubtotal || "0") || 0),
						0,
					);
					if (currentSum > 0) {
						let allocated = 0;
						for (let i = 0; i < input.items.length; i++) {
							const item = input.items[i]!;
							const raw = Number.parseFloat(item.itemSubtotal || "0") || 0;
							const next =
								i === input.items.length - 1
									? Math.max(0, paidExVat - allocated)
									: Math.round((raw / currentSum) * paidExVat);
							allocated += next;
							const nextStr = String(next);
							item.itemPrice = nextStr;
							item.itemSubtotal = nextStr;
						}
					}
				}
			}

			for (const item of input.items) {
				const product = await resolveActiveNiscProductById(item.productId);
				if (!product) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: `Product ${item.productId} not found or inactive`,
					});
				}
				if (product.id !== item.productId) {
					item.productId = product.id;
				}
				const serviceType = product.serviceType;
				if (
					serviceType === "domain_registration" ||
					serviceType === "domain_transfer" ||
					serviceType === "domains"
				) {
					item.billingCycle = resolveDomainBillingCycle(item.billingCycle) as
						| "YEARLY"
						| "BIENNIALLY"
						| "MONTHLY";
				}
				if (isZeepoAiAgentProduct(item.productId)) {
					if (!input.teamId?.trim()) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message:
								"Zeepo AI Agent checkout requires a team. Open Zeepo from your team dashboard.",
						});
					}
					if (!item.productPlanId?.trim()) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Zeepo AI Agent checkout requires a plan.",
						});
					}
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
				if (
					HIVELOCITY_SERVICE_TYPES.includes(
						product.serviceType as (typeof HIVELOCITY_SERVICE_TYPES)[number],
					)
				) {
					const parsed = hivelocityItemMetadataSchema.safeParse(item.metadata);
					if (!parsed.success) {
						const detail = parsed.error.issues
							.map((i) => `${i.path.join(".") || "metadata"}: ${i.message}`)
							.join("; ");
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `Server item "${product.name}" requires valid Hivelocity configuration metadata. ${detail}`,
						});
					}
					const meta = parsed.data;
					if (meta.hivelocityPeriod === "hourly") {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Hourly billing is not available for server orders.",
						});
					}
					if (
						meta.operation !== "vps_upgrade" &&
						meta.operation !== "vps_reload" &&
						meta.operation !== "vps_reactivate"
					) {
						if (
							!/^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(
								meta.hivelocityHostname.trim(),
							)
						) {
							throw new TRPCError({
								code: "BAD_REQUEST",
								message: "Server hostname must be a valid FQDN.",
							});
						}
					} else if (
						meta.operation === "vps_reactivate" ||
						meta.operation === "vps_upgrade" ||
						meta.operation === "vps_reload"
					) {
						if (product.serviceType !== "vps_hosting") {
							throw new TRPCError({
								code: "BAD_REQUEST",
								message: "VPS in-place orders must use the VPS hosting product.",
							});
						}
					}
				}
			}

			const serviceTypeByProductId = new Map<string, string>();
			{
				const productIds = Array.from(new Set(input.items.map((i) => i.productId)));
				const rows = await db
					.select({ id: niscProduct.id, serviceType: niscProduct.serviceType })
					.from(niscProduct)
					.where(inArray(niscProduct.id, productIds));
				for (const row of rows) {
					serviceTypeByProductId.set(row.id, row.serviceType);
				}
			}

			for (const item of input.items) {
				const serviceType = serviceTypeByProductId.get(item.productId);
				const isDomain =
					serviceType === "domains" ||
					serviceType === "domain_registration" ||
					serviceType === "domain_transfer";
				const metadata = item.metadata as { useRegistrantInfo?: string } | null;

				if (isDomain) {
					if (metadata?.useRegistrantInfo === "myself") {
						const profRows = await db
							.select()
							.from(userProfile)
							.where(eq(userProfile.userId, userId))
							.limit(1);
						const prof = profRows[0];
						if (
							!prof ||
							[
								prof.firstName,
								prof.lastName,
								prof.address,
								prof.city,
								prof.country,
								prof.postalCode,
								prof.phone,
							].some((f) => !f || String(f).trim() === "")
						) {
							throw new TRPCError({
								code: "BAD_REQUEST",
								message:
									"Complete your profile details before using your own details for registration.",
							});
						}
					} else if (metadata?.useRegistrantInfo === "customer") {
						const manual = (metadata as any).manualRegistrantDetails;
						if (
							!manual ||
							[
								manual.firstName,
								manual.lastName,
								manual.email,
								manual.address,
								manual.city,
								manual.country,
								manual.phone,
							].some((f) => !f || String(f).trim() === "")
						) {
							throw new TRPCError({
								code: "BAD_REQUEST",
								message:
									"Customer registration details are incomplete. Please fill all required fields.",
							});
						}
					} else {
						// Fallback/Legacy: check user profile
						const profRows = await db
							.select()
							.from(userProfile)
							.where(eq(userProfile.userId, userId))
							.limit(1);
						const prof = profRows[0];
						if (
							!prof ||
							[
								prof.firstName,
								prof.lastName,
								prof.address,
								prof.city,
								prof.country,
								prof.postalCode,
								prof.phone,
							].some((f) => !f || String(f).trim() === "")
						) {
							throw new TRPCError({
								code: "BAD_REQUEST",
								message: "Complete your profile details before proceeding.",
							});
						}
					}
				}
			}

			// For domain_transfer items: create DomainTransferRequest (PENDING) so processor can update status later
			const transferRequestIdsByIndex: (string | null)[] = [];
			const newlyCreatedTransferRequestIds: string[] = [];
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
					? (item.metadata as {
							transferAuthCode?: string;
							domainTransferRequestId?: string;
						})
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
				const existingRequestId = meta?.domainTransferRequestId?.trim();
				let requestId: string;

				let existing: {
					id: string;
					createdById: string;
					teamId: string | null;
					status: string;
					niscOrderId: string | null;
				} | undefined;

				if (existingRequestId) {
					const [row] = await db
						.select({
							id: domainTransferRequest.id,
							createdById: domainTransferRequest.createdById,
							teamId: domainTransferRequest.teamId,
							status: domainTransferRequest.status,
							niscOrderId: domainTransferRequest.niscOrderId,
						})
						.from(domainTransferRequest)
						.where(eq(domainTransferRequest.id, existingRequestId))
						.limit(1);
					existing = row;
				}

				if (existing) {
					if (existing.niscOrderId) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "This transfer request is already linked to an order.",
						});
					}
					if (!["AWAITING_PAYMENT", "PENDING"].includes(existing.status)) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `Transfer request cannot be updated (status: ${existing.status}).`,
						});
					}
					requestId = existing.id;
					const billedFor = input.billedForUserId?.trim();
					const transferOwnerId =
						billedFor &&
						(canAssignBilledForUserId(userRole) || (await userIsAgencyStaff(userId)))
							? billedFor
							: existing.createdById;
					await db
						.update(domainTransferRequest)
						.set({
							domainName: domainName.toLowerCase(),
							authCode,
							provider,
							status: "PENDING",
							customerPriceAmount: item.itemSubtotal ?? null,
							customerPriceCurrency: input.currency ?? "KES",
							teamId: input.teamId ?? existing.teamId ?? null,
							createdById: transferOwnerId,
							updatedAt: now,
						})
						.where(eq(domainTransferRequest.id, requestId));
				} else if (existingRequestId) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Transfer request not found.",
					});
				} else {
					const billedFor = input.billedForUserId?.trim();
					const newOwnerId =
						billedFor &&
						(canAssignBilledForUserId(userRole) || (await userIsAgencyStaff(userId)))
							? billedFor
							: userId;
					requestId = crypto.randomUUID();
					await db.insert(domainTransferRequest).values({
						id: requestId,
						domainName: domainName.toLowerCase(),
						authCode,
						provider,
						status: "PENDING",
						customerPriceAmount: item.itemSubtotal ?? null,
						customerPriceCurrency: input.currency ?? "KES",
						teamId: input.teamId ?? null,
						createdById: newOwnerId,
						createdAt: now,
						updatedAt: now,
					});
					newlyCreatedTransferRequestIds.push(requestId);
				}
				transferRequestIdsByIndex.push(requestId);
			}

			let orderNumber: string;
			let existing: { id: string } | undefined;
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
			const { totalIncVat } = computeCeilVatTotals(subtotalNum);
			const paidIncVatRounded = Number.isFinite(paidAmountNum) && paidAmountNum > 0
				? Math.ceil(paidAmountNum)
				: 0;
			const subtotal = String(subtotalNum);
			const total = paymentTotalString(totalIncVat);
			const currency = input.currency || "KES";
			const isPartialPayment = paidIncVatRounded > 0 && paidIncVatRounded < totalIncVat;

			let orderUserId = userId;
			const orderTeamId = input.teamId?.trim() || null;
			if (billedFor) {
				const role = session.user.role as string | undefined;
				if (!canAssignBilledForUserId(role) && !(await userIsAgencyStaff(userId))) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only agency users can assign an order to another user.",
					});
				}
				const targetRows = await db.select({ id: user.id }).from(user).where(eq(user.id, billedFor)).limit(1);
				if (!targetRows[0]) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Selected user was not found.",
					});
				}
				if (orderTeamId && !(await isTeamMember(orderTeamId, billedFor))) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Selected user is not a member of this team.",
					});
				}
				orderUserId = billedFor;
			}

			const skipInvoiceRequested = input.skipInvoice === true;
			if (skipInvoiceRequested) {
				const role = session.user.role as string | undefined;
				if (!canAssignBilledForUserId(role) && !(await userIsAgencyStaff(userId))) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only agency users can create orders without invoices.",
					});
				}
			}
			const skipInvoice = skipInvoiceRequested;
			const loadOrderById = (id: string) =>
				db.query.niscOrder.findFirst({
					where: eq(niscOrder.id, id),
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

			const isUniqueViolation = (err: unknown): boolean => {
				let current: unknown = err;
				for (let i = 0; i < 5 && current; i++) {
					if (
						typeof current === "object" &&
						current !== null &&
						"code" in current &&
						(current as { code?: string }).code === "23505"
					) {
						return true;
					}
					current =
						typeof current === "object" && current !== null && "cause" in current
							? (current as { cause?: unknown }).cause
							: undefined;
				}
				return false;
			};

			let order: typeof niscOrder.$inferSelect;
			try {
				order = await db.transaction(async (tx) => {
					const payOrderIns = await tx
						.insert(niscOrder)
						.values({
							id: randomUUID(),
							orderNumber,
							userId: orderUserId,
							teamId: orderTeamId,
							createdBy: session.user.id,
							status: "PENDING",
							subtotal,
							total,
							currency,
							paymentTransactionId: transaction.id,
							metadata: {
								...(skipInvoice
									? {
											skipInvoice: true,
											agencyManualCreate: true,
										}
									: {}),
								amountPaid: String(paidIncVatRounded),
								expectedTotalIncVat: String(totalIncVat),
								isPartialPayment,
							},
						})
						.returning();
					const created = payOrderIns[0];
					if (!created) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Failed to create Nisc order",
						});
					}

					for (let idx = 0; idx < input.items.length; idx++) {
						const item = input.items[idx]!;
						const metadata =
							item.metadata && typeof item.metadata === "object"
								? (item.metadata as {
										transferAuthCode?: string;
										nameServers?: Array<{ name: string; ip?: string }>;
									})
								: null;
						const domainTransferRequestId = transferRequestIdsByIndex[idx] ?? undefined;
						const mergedMetadata =
							domainTransferRequestId != null
								? { ...(metadata ?? {}), domainTransferRequestId }
								: (metadata ?? undefined);
						await tx.insert(niscOrderItem).values({
							id: randomUUID(),
							niscOrderId: created.id,
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

					for (const requestId of transferRequestIdsByIndex) {
						if (requestId) {
							await tx
								.update(domainTransferRequest)
								.set({ niscOrderId: created.id, updatedAt: new Date() })
								.where(eq(domainTransferRequest.id, requestId));
						}
					}

					return created;
				});
			} catch (err) {
				const cancelOrphanTransfers = async (reason: string) => {
					const ids = isUniqueViolation(err)
						? transferRequestIdsByIndex.filter((id): id is string => Boolean(id))
						: newlyCreatedTransferRequestIds;
					for (const requestId of ids) {
						await db
							.update(domainTransferRequest)
							.set({
								status: "CANCELLED",
								providerResponse: {
									reason,
									paymentTransactionId: transaction.id,
								},
								updatedAt: new Date(),
							})
							.where(
								and(
									eq(domainTransferRequest.id, requestId),
									eq(domainTransferRequest.status, "PENDING"),
								),
							)
							.catch(() => undefined);
					}
				};
				if (!isUniqueViolation(err)) {
					await cancelOrphanTransfers("order_create_failed_after_transfer_request");
					throw err;
				}
				// Race lost: cancel transfer requests we created that never linked to an order.
				await cancelOrphanTransfers("superseded_by_existing_order_for_payment");
				const raced = await db.query.niscOrder.findFirst({
					where: eq(niscOrder.paymentTransactionId, transaction.id),
					columns: { id: true },
				});
				if (!raced) throw err;
				return loadOrderById(raced.id);
			}

			const hasExternalProvisioningItems = input.items.some((item) => {
				const serviceType = serviceTypeByProductId.get(item.productId);
				return serviceType ? requiresExternalProvisioning(serviceType) : true;
			});

			if (hasExternalProvisioningItems) {
				let qstashMessageId: string | null = null;
				try {
					const result = await enqueueNiscOrderProcessing(order.id);
					qstashMessageId = result.messageId;
					await db
						.update(niscOrder)
						.set({ qstashMessageId })
						.where(eq(niscOrder.id, order.id));
				} catch (enqueueErr) {
					// QStash unavailable (e.g. local dev without ngrok) - invoice then provision inline.
					const processResult = await processNiscOrderWithPreInvoice(order.id);
					if (!processResult.ok) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: processResult.failureReason || "Failed to complete order processing",
						});
					}
				}
			} else {
				const processResult = await processNiscOrderWithPreInvoice(order.id);
				if (!processResult.ok) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: processResult.failureReason || "Failed to complete order processing",
					});
				}
			}

			// Fire-and-forget: send "order received" email (skipped for agency manual provision).
			if (!skipInvoice) {
				void (async () => {
					try {
						const orderWithUser = await db.query.niscOrder.findFirst({
							where: eq(niscOrder.id, order.id),
							with: {
								orderItems: {
									with: {
										product: { columns: { name: true, serviceType: true } },
										productPlan: { columns: { name: true } },
									},
								},
								user: { columns: { id: true, name: true, email: true } },
							},
						});
						if (!orderWithUser?.user?.email) return;
						const { sendEmail } = await import("../lib/email");
						const { renderNiscOrderReceivedEmail } = await import("../lib/email-templates");
						const { buildNiscOrderReceivedEmailItems } = await import(
							"../lib/nisc-order-received-email"
						);
						const { formatNiscDateTime } = await import("../lib/nisc-datetime-format");
						const { orderItems, totalAmount } = buildNiscOrderReceivedEmailItems({
							createdAt: orderWithUser.createdAt,
							currency: orderWithUser.currency,
							subtotal: orderWithUser.subtotal,
							orderItems: orderWithUser.orderItems.map((i) => ({
								itemPrice: i.itemPrice,
								itemSubtotal: i.itemSubtotal,
								primaryDomain: i.primaryDomain,
								billingCycle: i.billingCycle,
								description: i.description,
								product: {
									name: i.product?.name ?? "Service",
									serviceType: i.product?.serviceType ?? null,
								},
								productPlan: i.productPlan,
							})),
						});
						const html = await renderNiscOrderReceivedEmail({
							customerName: orderWithUser.user.name ?? undefined,
							orderNumber: orderWithUser.orderNumber,
							orderDate: formatNiscDateTime(orderWithUser.createdAt),
							totalAmount,
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
			}

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
			const userId = ctx.session?.user?.id;
			const userRole = ctx.session?.user?.role;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to retry Nisc orders",
				});
			}

			await canAccessOrderMutation(input.niscOrderId, userId, userRole);

			const retryOrderRows = await db.select().from(niscOrder).where(eq(niscOrder.id, input.niscOrderId)).limit(1);
			const order = retryOrderRows[0];

			if (!order) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Nisc order not found",
				});
			}

			if (
				order.status !== "FAILED" &&
				order.status !== "PARTIAL" &&
				order.status !== "PROCESSING"
			) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Only failed, partial, or stuck processing orders can be retried",
				});
			}

				// Reset status to PENDING BEFORE enqueuing so the worker never sees a non-PENDING order.
			// Previously the enqueue happened first, causing a race condition: QStash delivered the
			// message before the DB update completed, so the worker loaded the order in FAILED status
			// and skipped it with worker_order_skip_not_pending.
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
					.where(
						and(
							eq(niscOrderItem.niscOrderId, order.id),
							inArray(niscOrderItem.status, ["FAILED", "SKIPPED", "PROCESSING"]),
						),
					);
			});

			try {
				await enqueueNiscOrderProcessing(order.id);
			} catch (err) {
				// Enqueue failed - roll back the status so the order doesn't get stuck in PENDING
				// without a worker running. Best-effort: ignore errors from this rollback.
				await db
					.update(niscOrder)
					.set({ status: "FAILED", failureReason: "Failed to re-enqueue for processing" })
					.where(eq(niscOrder.id, order.id))
					.catch(() => undefined);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						err instanceof Error
							? err.message
							: "Failed to re-enqueue order for processing",
				});
			}

			return { success: true, niscOrderId: order.id };
		}),

	/**
	 * Create order from a SUCCESS Jenga card payment using metadata stored at initiate time.
	 * Used by the post-redirect return page so the closed dialog payload is not required.
	 */
	createFromJengaPayment: protectedProcedure
		.input(z.object({ orderReference: z.string().min(8).max(32) }))
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
				.where(
					and(
						eq(paymentTransaction.checkoutRequestId, input.orderReference),
						eq(paymentTransaction.gateway, "JENGA"),
						eq(paymentTransaction.userId, userId),
					),
				)
				.limit(1);
			const transaction = txRows[0];
			if (!transaction) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payment not found",
				});
			}
			if (transaction.status !== "SUCCESS") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						transaction.status === "FAILED"
							? "Payment failed. Please try again."
							: "Payment not yet confirmed. Wait a moment and try again.",
				});
			}

			const metadata = (transaction.metadata ?? {}) as {
				items?: unknown[];
				currency?: string;
				teamId?: string;
				billedForUserId?: string;
				skipInvoice?: boolean;
			};

			const parsed = createFromPaymentInputSchema.safeParse({
				checkoutRequestId: input.orderReference,
				items: metadata.items,
				currency: metadata.currency ?? transaction.currency ?? "KES",
				teamId: metadata.teamId,
				billedForUserId: metadata.billedForUserId,
				skipInvoice: metadata.skipInvoice,
			});

			if (!parsed.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Order details were not saved with this payment. Contact support with your reference.",
				});
			}

			const createCaller = ctx.createCaller;
			if (!createCaller) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Order creation is temporarily unavailable. Please try again.",
				});
			}

			const caller = createCaller(ctx) as {
				niscServiceOrders: {
					createFromPayment: (
						data: z.infer<typeof createFromPaymentInputSchema>,
					) => Promise<unknown>;
				};
			};

			return caller.niscServiceOrders.createFromPayment(parsed.data);
		}),
});
