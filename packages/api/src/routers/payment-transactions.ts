import * as crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { db } from "@npanel/db";
import { user as userTable } from "@npanel/db/schema/auth";
import { teamMember, team as teamTable } from "@npanel/db/schema/teams";
import {
  paymentTransaction,
  paymentTransactionActivityLog,
} from "@npanel/db/schema/payment-transactions";
import { niscOrder } from "@npanel/db/schema/nisc-orders";
import { niscProduct } from "@npanel/db/schema/products";
import { and, count, desc, eq, inArray, isNull, or, sql } from "@npanel/db";
import { z } from "zod";
import { protectedProcedure, router, type Context } from "../trpc";
import { computeCeilVatTotals } from "../lib/convert-price";
import {
  readStoredOrderIntent,
  readUnmatchedResolution,
  storedOrderSubtotalExVat,
} from "../lib/stored-order-intent";

/** A paid order is only listed as unmatched once the customer's browser has had this long to finish it. */
const UNMATCHED_GRACE_MINUTES = 10;

const paymentTransactionStatusSchema = z.enum([
	"PENDING",
	"PROCESSING",
	"SUCCESS",
	"FAILED",
	"CANCELLED",
	"REFUNDED",
	"PARTIALLY_REFUNDED",
]);

const paymentGatewaySchema = z.enum([
	"MPESA",
	"JENGA",
	"STRIPE",
	"PAYPAL",
	"FLUTTERWAVE",
	"OTHER",
]);

const paymentTransactionOutputSchema = z.object({
	id: z.string(),
	userId: z.string(),
	teamId: z.string().nullable(),
	userName: z.string().nullable(),
	teamName: z.string().nullable(),
	gateway: paymentGatewaySchema,
	status: paymentTransactionStatusSchema,
	amount: z.string(),
	currency: z.string(),
	accountReference: z.string().nullable(),
	transactionDesc: z.string().nullable(),
	receiptNumber: z.string().nullable(),
	initiatedAt: z.date(),
	processedAt: z.date().nullable(),
	failedAt: z.date().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

async function getAuthenticatedUser(ctx: Context) {
	const user = ctx.session?.user;
	if (!user?.id) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You must be logged in.",
		});
	}

	// Optimize: Use role from session if available (set by auth hooks)
	// This avoids an unnecessary database query
	const sessionRole = (user as { role?: string })?.role;
	
	if (sessionRole) {
		// Role is in session, no need to query database
		return { id: user.id, role: sessionRole };
	}

	// Fallback: Query database if role not in session (shouldn't happen with proper auth hooks)
	const [dbUser] = await db
		.select({ id: userTable.id, role: userTable.role })
		.from(userTable)
		.where(eq(userTable.id, user.id))
		.limit(1);

	if (!dbUser) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "User not found.",
		});
	}

	return { id: dbUser.id, role: dbUser.role as string };
}

const AGENCY_USER_ROLES = ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"] as const;

function normalizeUserRole(role: string | null | undefined): string {
	return typeof role === "string" ? role.trim().toUpperCase() : "";
}

const isAgencyUser = (role: string | null | undefined) =>
	(AGENCY_USER_ROLES as readonly string[]).includes(normalizeUserRole(role));

/** Authoritative agency check from DB (not session-only) for privileged mutations. */
async function requireAgencyUser(ctx: Context): Promise<{ id: string; role: string }> {
	const { id } = await getAuthenticatedUser(ctx);
	const [row] = await db
		.select({ role: userTable.role, status: userTable.status })
		.from(userTable)
		.where(eq(userTable.id, id))
		.limit(1);

	if (!row) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found." });
	}

	if (row.status !== "ACTIVE") {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Your account must be active to do this.",
		});
	}

	const role = normalizeUserRole(row.role);
	if (!isAgencyUser(role)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Only Nisc HQ staff can do this.",
		});
	}

	return { id, role };
}

async function getAccessibleTeamIds(userId: string): Promise<string[]> {
	const [memberships, ownedTeams] = await Promise.all([
		db
			.select({ teamId: teamMember.teamId })
			.from(teamMember)
			.where(eq(teamMember.userId, userId)),
		db
			.select({ id: teamTable.id })
			.from(teamTable)
			.where(eq(teamTable.createdById, userId)),
	]);

	return [
		...new Set([
			...memberships.map((membership: { teamId: string }) => membership.teamId),
			...ownedTeams.map((teamRow: { id: string }) => teamRow.id),
		]),
	];
}

function buildTransactionReadCondition(params: {
	isAgency: boolean;
	userId: string;
	teamIds: string[];
}) {
	const { isAgency, userId, teamIds } = params;
	if (isAgency) return undefined;

	return teamIds.length > 0
		? or(eq(paymentTransaction.userId, userId), inArray(paymentTransaction.teamId, teamIds))
		: eq(paymentTransaction.userId, userId);
}

export const paymentTransactionsRouter = router({
	/**
	 * Agency only: record an external payment (M-Pesa receipt, bank transfer, etc.) in payment_transaction
	 * so checkout can proceed via createFromPayment using the returned checkoutRequestId.
	 */
	recordManual: protectedProcedure
		.input(
			z.object({
				transactionReference: z.string().min(1).max(64),
				amount: z.number().positive(),
				currency: z.string().min(1).max(8).default("KES"),
				/** How the customer actually paid  stored on payment_transaction.gateway. */
				gateway: z.enum(["MPESA", "JENGA", "OTHER"]).default("OTHER"),
				accountReference: z.string().max(64).optional(),
				transactionDesc: z.string().max(200).optional(),
				teamId: z.string().optional(),
				notes: z.string().max(500).optional(),
				billedForUserId: z.string().min(1).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const agencyUser = await requireAgencyUser(ctx);

			const transactionReference = input.transactionReference.trim();
			if (!transactionReference) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Transaction reference is required.",
				});
			}

			const billedFor = input.billedForUserId?.trim() || null;
			let transactionUserId = agencyUser.id;
			if (billedFor) {
				const [targetUser] = await db
					.select({ id: userTable.id })
					.from(userTable)
					.where(eq(userTable.id, billedFor))
					.limit(1);
				if (!targetUser) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Selected user was not found.",
					});
				}
				if (input.teamId) {
					const [membership] = await db
						.select({ id: teamMember.id })
						.from(teamMember)
						.where(and(eq(teamMember.teamId, input.teamId), eq(teamMember.userId, billedFor)))
						.limit(1);
					const [ownedTeam] = membership
						? []
						: await db
								.select({ id: teamTable.id })
								.from(teamTable)
								.where(and(eq(teamTable.id, input.teamId), eq(teamTable.createdById, billedFor)))
								.limit(1);
					if (!membership && !ownedTeam) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Selected user is not a member of this team.",
						});
					}
				}
				transactionUserId = billedFor;
			}

			const [existing] = await db
				.select({ id: paymentTransaction.id })
				.from(paymentTransaction)
				.where(eq(paymentTransaction.checkoutRequestId, transactionReference))
				.limit(1);
			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "A payment with this transaction reference already exists.",
				});
			}

			const now = new Date();
			const transactionId = crypto.randomUUID();
			const amountStr = String(input.amount);
			const gateway = input.gateway;

			await db.insert(paymentTransaction).values({
				id: transactionId,
				userId: transactionUserId,
				teamId: input.teamId ?? null,
				gateway,
				gatewayStatus: "MANUAL",
				gatewayMessage: `Recorded manually by agency (${gateway})`,
				gatewayTransactionId: transactionReference,
				checkoutRequestId: transactionReference,
				receiptNumber: transactionReference,
				amount: amountStr,
				paidAmount: amountStr,
				currency: input.currency,
				accountReference: input.accountReference ?? null,
				transactionDesc: input.transactionDesc ?? null,
				phoneNumber: null,
				status: "SUCCESS",
				rawResponse: {
					source: "agency_manual_checkout",
					recordedBy: agencyUser.id,
					recordedAt: now.toISOString(),
					gateway,
					billedForUserId: billedFor,
				},
				notes: input.notes ?? null,
				metadata: {
					source: "agency_manual_checkout",
					recordedBy: agencyUser.id,
					recordedByRole: agencyUser.role,
					gateway,
					billedForUserId: billedFor,
				},
				initiatedAt: now,
				processedAt: now,
				createdAt: now,
				updatedAt: now,
			});

			await db.insert(paymentTransactionActivityLog).values({
				id: crypto.randomUUID(),
				transactionId,
				userId: agencyUser.id,
				action: "MANUAL_RECORD",
				description: `Manual payment recorded. Reference: ${transactionReference}`,
				metadata: {
					amount: amountStr,
					currency: input.currency,
					accountReference: input.accountReference ?? null,
				},
				createdAt: now,
			});

			return {
				transactionId,
				checkoutRequestId: transactionReference,
			};
		}),

	/**
	 * Staff only: payments that succeeded but never produced an order (browser closed, a network
	 * error after paying, ...). Only payments whose cart was saved at checkout can be listed.
	 */
	listUnmatched: protectedProcedure.query(async ({ ctx }) => {
		await requireAgencyUser(ctx);
		const cutoff = new Date(Date.now() - UNMATCHED_GRACE_MINUTES * 60_000);

		const rows = await db
			.select({
				id: paymentTransaction.id,
				userId: paymentTransaction.userId,
				userName: userTable.name,
				userEmail: userTable.email,
				teamName: teamTable.name,
				gateway: paymentTransaction.gateway,
				amount: paymentTransaction.amount,
				paidAmount: paymentTransaction.paidAmount,
				currency: paymentTransaction.currency,
				checkoutRequestId: paymentTransaction.checkoutRequestId,
				receiptNumber: paymentTransaction.receiptNumber,
				phoneNumber: paymentTransaction.phoneNumber,
				processedAt: paymentTransaction.processedAt,
				updatedAt: paymentTransaction.updatedAt,
				metadata: paymentTransaction.metadata,
			})
			.from(paymentTransaction)
			.leftJoin(niscOrder, eq(niscOrder.paymentTransactionId, paymentTransaction.id))
			.leftJoin(userTable, eq(userTable.id, paymentTransaction.userId))
			.leftJoin(teamTable, eq(teamTable.id, paymentTransaction.teamId))
			.where(
				and(
					eq(paymentTransaction.status, "SUCCESS"),
					isNull(niscOrder.id),
					sql`jsonb_exists(${paymentTransaction.metadata}, 'items')`,
					sql`(${paymentTransaction.metadata} -> 'unmatchedResolution') is null`,
					sql`coalesce(${paymentTransaction.processedAt}, ${paymentTransaction.updatedAt}) < ${cutoff}`,
				),
			)
			.orderBy(desc(paymentTransaction.updatedAt))
			.limit(100);

		const intents = rows.map((r: { metadata: unknown }) => readStoredOrderIntent(r.metadata));
		const productIds = [
			...new Set(
				intents.flatMap((intent: ReturnType<typeof readStoredOrderIntent>) =>
					intent ? intent.items.map((i) => i.productId) : [],
				),
			),
		];
		const products =
			productIds.length > 0
				? await db
						.select({ id: niscProduct.id, name: niscProduct.name })
						.from(niscProduct)
						.where(inArray(niscProduct.id, productIds))
				: [];
		const productName = new Map(products.map((p: { id: string; name: string }) => [p.id, p.name]));

		return rows.map((r: (typeof rows)[number], idx: number) => {
			const intent = intents[idx] ?? null;
			const paid = Math.ceil(Number.parseFloat(r.paidAmount ?? r.amount) || 0);
			const expected = intent
				? computeCeilVatTotals(storedOrderSubtotalExVat(intent.items)).totalIncVat
				: null;
			return {
				id: r.id,
				customerName: r.userName ?? null,
				customerEmail: r.userEmail ?? null,
				organization: r.teamName ?? null,
				gateway: r.gateway,
				currency: r.currency,
				paidAmount: paid,
				expectedAmount: expected,
				reference: r.receiptNumber ?? r.checkoutRequestId,
				phoneNumber: r.phoneNumber ?? null,
				paidAt: r.processedAt ?? r.updatedAt,
				lines: (intent?.items ?? []).map((i) => ({
					product: productName.get(i.productId) ?? "Service",
					detail: i.primaryDomain ?? i.description ?? null,
				})),
				canComplete: intent != null && expected != null && paid >= expected,
			};
		});
	}),

	/** Staff only: create the order for a paid-but-unmatched payment from the cart saved at checkout. */
	completeUnmatched: protectedProcedure
		.input(z.object({ transactionId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const staff = await requireAgencyUser(ctx);

			const [tx] = await db
				.select()
				.from(paymentTransaction)
				.where(eq(paymentTransaction.id, input.transactionId))
				.limit(1);
			if (!tx || tx.status !== "SUCCESS" || !tx.checkoutRequestId) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Successful payment not found." });
			}
			const [existing] = await db
				.select({ id: niscOrder.id })
				.from(niscOrder)
				.where(eq(niscOrder.paymentTransactionId, tx.id))
				.limit(1);
			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "This payment already has an order.",
				});
			}
			const intent = readStoredOrderIntent(tx.metadata);
			if (!intent) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No order details were saved with this payment. Create the order manually.",
				});
			}
			const paid = Math.ceil(Number.parseFloat(tx.paidAmount ?? tx.amount) || 0);
			const expected = computeCeilVatTotals(storedOrderSubtotalExVat(intent.items)).totalIncVat;
			if (paid < expected) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `The payment (${tx.currency} ${paid}) is less than the order total (${expected}). Create the order manually.`,
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
					createFromPayment: (data: Record<string, unknown>) => Promise<unknown>;
				};
			};
			// Runs as staff, billed to the customer who paid, so the order lands on their account.
			await caller.niscServiceOrders.createFromPayment({
				checkoutRequestId: tx.checkoutRequestId,
				items: intent.items,
				currency: intent.currency,
				teamId: intent.teamId ?? tx.teamId ?? undefined,
				billedForUserId: tx.userId,
				skipInvoice: intent.skipInvoice,
			});

			const now = new Date();
			await db.insert(paymentTransactionActivityLog).values({
				id: crypto.randomUUID(),
				transactionId: tx.id,
				userId: staff.id,
				action: "UNMATCHED_COMPLETED",
				description: "Order created by staff from an unmatched payment.",
				metadata: { receipt: tx.receiptNumber ?? tx.checkoutRequestId },
				createdAt: now,
			});
			return { success: true };
		}),

	/** Staff only: take a payment off the unmatched list, flagging it for a refund or dismissing it. */
	resolveUnmatched: protectedProcedure
		.input(
			z.object({
				transactionId: z.string().min(1),
				action: z.enum(["REFUND_NEEDED", "DISMISSED"]),
				note: z.string().trim().max(500).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staff = await requireAgencyUser(ctx);
			const [tx] = await db
				.select({ id: paymentTransaction.id, metadata: paymentTransaction.metadata })
				.from(paymentTransaction)
				.where(eq(paymentTransaction.id, input.transactionId))
				.limit(1);
			if (!tx) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found." });
			}
			if (readUnmatchedResolution(tx.metadata)) {
				throw new TRPCError({ code: "CONFLICT", message: "This payment was already resolved." });
			}
			const now = new Date();
			const base =
				tx.metadata && typeof tx.metadata === "object" ? (tx.metadata as Record<string, unknown>) : {};
			await db
				.update(paymentTransaction)
				.set({
					metadata: {
						...base,
						unmatchedResolution: {
							action: input.action,
							by: staff.id,
							at: now.toISOString(),
							...(input.note ? { note: input.note } : {}),
						},
					},
					updatedAt: now,
				})
				.where(eq(paymentTransaction.id, tx.id));
			await db.insert(paymentTransactionActivityLog).values({
				id: crypto.randomUUID(),
				transactionId: tx.id,
				userId: staff.id,
				action: `UNMATCHED_${input.action}`,
				description:
					input.action === "REFUND_NEEDED"
						? "Marked as needing a refund (no order was created)."
						: "Removed from the unmatched payments list.",
				metadata: input.note ? { note: input.note } : null,
				createdAt: now,
			});
			return { success: true };
		}),

	list: protectedProcedure
		.input(
			z.object({
				limit: z.number().int().min(1).max(200).optional().default(50),
				offset: z.number().int().min(0).optional().default(0),
				status: paymentTransactionStatusSchema.optional(),
				gateway: paymentGatewaySchema.optional(),
				teamId: z.string().uuid().optional(),
				unassignedOnly: z.boolean().optional(),
			}),
		)
		.output(
			z.object({
				transactions: z.array(paymentTransactionOutputSchema),
				total: z.number().int().nonnegative(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);
			const agencyUser = isAgencyUser(user.role);
			const accessibleTeams = agencyUser ? [] : await getAccessibleTeamIds(user.id);

			const conditions: any[] = [];

			// For agency users, show all transactions
			// For customers, filter by their user ID or team
			if (!agencyUser) {
				conditions.push(
					buildTransactionReadCondition({
						isAgency: agencyUser,
						userId: user.id,
						teamIds: accessibleTeams,
					}),
				);
			}

			if (input.status) {
				conditions.push(eq(paymentTransaction.status, input.status));
			}

			if (input.gateway) {
				conditions.push(eq(paymentTransaction.gateway, input.gateway));
			}

			if (input.unassignedOnly) {
				conditions.push(isNull(paymentTransaction.teamId));
			} else if (input.teamId) {
				conditions.push(eq(paymentTransaction.teamId, input.teamId));
			}

			const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

			const [transactions, totalRes] = await Promise.all([
				db
					.select({
						id: paymentTransaction.id,
						userId: paymentTransaction.userId,
						teamId: paymentTransaction.teamId,
						teamName: teamTable.name,
						gateway: paymentTransaction.gateway,
						status: paymentTransaction.status,
						amount: paymentTransaction.amount,
						currency: paymentTransaction.currency,
						accountReference: paymentTransaction.accountReference,
						transactionDesc: paymentTransaction.transactionDesc,
						receiptNumber: paymentTransaction.receiptNumber,
						initiatedAt: paymentTransaction.initiatedAt,
						processedAt: paymentTransaction.processedAt,
						failedAt: paymentTransaction.failedAt,
						createdAt: paymentTransaction.createdAt,
						updatedAt: paymentTransaction.updatedAt,
					})
					.from(paymentTransaction)
					.leftJoin(teamTable, eq(paymentTransaction.teamId, teamTable.id))
					.where(whereClause)
					.orderBy(desc(paymentTransaction.createdAt))
					.limit(input.limit)
					.offset(input.offset),
				db
					.select({ total: count() })
					.from(paymentTransaction)
					.where(whereClause),
			]);
			const total = totalRes[0]?.total ?? 0;

			const userIds = [...new Set(transactions.map((t: { userId: string }) => t.userId))];
			const users =
				userIds.length > 0
					? await db
							.select({ id: userTable.id, name: userTable.name })
							.from(userTable)
							.where(inArray(userTable.id, userIds))
					: [];
			const userMap = new Map(users.map((u: { id: string; name: string }) => [u.id, u.name]));

			return {
				transactions: transactions.map((t: any) =>
					paymentTransactionOutputSchema.parse({
						id: t.id,
						userId: t.userId,
						teamId: t.teamId,
						userName: userMap.get(t.userId) ?? null,
						teamName: t.teamName ?? null,
						gateway: t.gateway,
						status: t.status,
						amount: t.amount,
						currency: t.currency,
						accountReference: t.accountReference,
						transactionDesc: t.transactionDesc,
						receiptNumber: t.receiptNumber,
						initiatedAt: t.initiatedAt,
						processedAt: t.processedAt,
						failedAt: t.failedAt,
						createdAt: t.createdAt,
						updatedAt: t.updatedAt,
					}),
				),
				total,
			};
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.output(
			z.object({
				id: z.string(),
				userId: z.string(),
				teamId: z.string().nullable(),
				userName: z.string().nullable(),
				teamName: z.string().nullable(),
				gateway: paymentGatewaySchema,
				gatewayStatus: z.string().nullable(),
				gatewayMessage: z.string().nullable(),
				gatewayTransactionId: z.string().nullable(),
				merchantRequestId: z.string().nullable(),
				checkoutRequestId: z.string().nullable(),
				receiptNumber: z.string().nullable(),
				amount: z.string(),
				paidAmount: z.string().nullable(),
				currency: z.string(),
				accountReference: z.string().nullable(),
				transactionDesc: z.string().nullable(),
				phoneNumber: z.string().nullable(),
				status: paymentTransactionStatusSchema,
				rawResponse: z.unknown().nullable(),
				rawError: z.unknown().nullable(),
				initiatedAt: z.date(),
				processedAt: z.date().nullable(),
				failedAt: z.date().nullable(),
				refundedAt: z.date().nullable(),
				notes: z.string().nullable(),
				metadata: z.unknown().nullable(),
				createdAt: z.date(),
				updatedAt: z.date(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);
			const agencyUser = isAgencyUser(user.role);
			const accessibleTeams = agencyUser ? [] : await getAccessibleTeamIds(user.id);

			const [tx] = await db
				.select()
				.from(paymentTransaction)
				.where(
					and(
						eq(paymentTransaction.id, input.id),
						buildTransactionReadCondition({
							isAgency: agencyUser,
							userId: user.id,
							teamIds: accessibleTeams,
						}),
					),
				)
				.limit(1);
			if (!tx) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Transaction not found",
				});
			}

			const [userRow, teamRow] = await Promise.all([
				db
					.select({ name: userTable.name })
					.from(userTable)
					.where(eq(userTable.id, tx.userId))
					.limit(1),
				tx.teamId
					? db
							.select({ name: teamTable.name })
							.from(teamTable)
							.where(eq(teamTable.id, tx.teamId))
							.limit(1)
					: Promise.resolve([]),
			]);
			const userName = userRow[0]?.name ?? null;
			const teamName = teamRow[0]?.name ?? null;

			return {
				id: tx.id,
				userId: tx.userId,
				teamId: tx.teamId,
				userName,
				teamName,
				gateway: paymentGatewaySchema.parse(tx.gateway),
				gatewayStatus: tx.gatewayStatus,
				gatewayMessage: tx.gatewayMessage,
				gatewayTransactionId: tx.gatewayTransactionId,
				merchantRequestId: tx.merchantRequestId,
				checkoutRequestId: tx.checkoutRequestId,
				receiptNumber: tx.receiptNumber,
				amount: tx.amount,
				paidAmount: tx.paidAmount,
				currency: tx.currency,
				accountReference: tx.accountReference,
				transactionDesc: tx.transactionDesc,
				phoneNumber: tx.phoneNumber,
				status: paymentTransactionStatusSchema.parse(tx.status),
				rawResponse: tx.rawResponse as unknown,
				rawError: tx.rawError as unknown,
				initiatedAt: tx.initiatedAt,
				processedAt: tx.processedAt,
				failedAt: tx.failedAt,
				refundedAt: tx.refundedAt,
				notes: tx.notes,
				metadata: tx.metadata as unknown,
				createdAt: tx.createdAt,
				updatedAt: tx.updatedAt,
			};
		}),

	/**
	 * Get summary statistics for payment transactions
	 */
	getSummary: protectedProcedure
		.query(async ({ ctx }) => {
			const user = await getAuthenticatedUser(ctx);
			const agencyUser = isAgencyUser(user.role);
			
			if (!agencyUser) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only Nisc HQ staff can view transaction summary.",
				});
			}

			const [totalRes, successRes, pendingRes, failedRes, processingRes] = await Promise.all([
				db.select({ count: count() }).from(paymentTransaction),
				db.select({ count: count() }).from(paymentTransaction).where(eq(paymentTransaction.status, "SUCCESS")),
				db.select({ count: count() }).from(paymentTransaction).where(eq(paymentTransaction.status, "PENDING")),
				db.select({ count: count() }).from(paymentTransaction).where(eq(paymentTransaction.status, "FAILED")),
				db.select({ count: count() }).from(paymentTransaction).where(eq(paymentTransaction.status, "PROCESSING")),
			]);

			const total = totalRes[0]?.count ?? 0;
			const success = successRes[0]?.count ?? 0;
			const pending = pendingRes[0]?.count ?? 0;
			const failed = failedRes[0]?.count ?? 0;
			const processing = processingRes[0]?.count ?? 0;

			return {
				total,
				success,
				pending,
				failed,
				processing,
				completedTotal: success,
				activeTotal: pending + processing,
			};
		}),
});
