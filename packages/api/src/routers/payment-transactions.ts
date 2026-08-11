import * as crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { db } from "@npanel/db";
import { user as userTable } from "@npanel/db/schema/auth";
import { teamMember, team as teamTable } from "@npanel/db/schema/teams";
import {
  paymentTransaction,
  paymentTransactionActivityLog,
} from "@npanel/db/schema/payment-transactions";
import { and, count, desc, eq, inArray, or } from "@npanel/db";
import { z } from "zod";
import { protectedProcedure, router, type Context } from "../trpc";

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
			message: "Your account must be active to record manual payments.",
		});
	}

	const role = normalizeUserRole(row.role);
	if (!isAgencyUser(role)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Only agency users can record manual payment transactions.",
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
				/** How the customer actually paid — stored on payment_transaction.gateway. */
				gateway: z.enum(["MPESA", "JENGA", "OTHER"]).default("OTHER"),
				accountReference: z.string().max(64).optional(),
				transactionDesc: z.string().max(200).optional(),
				teamId: z.string().optional(),
				notes: z.string().max(500).optional(),
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
				userId: agencyUser.id,
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
				},
				notes: input.notes ?? null,
				metadata: {
					source: "agency_manual_checkout",
					recordedBy: agencyUser.id,
					recordedByRole: agencyUser.role,
					gateway,
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

	list: protectedProcedure
		.input(
			z.object({
				limit: z.number().int().min(1).max(100).optional().default(50),
				offset: z.number().int().min(0).optional().default(0),
				status: paymentTransactionStatusSchema.optional(),
				gateway: paymentGatewaySchema.optional(),
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

			const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

			const [transactions, totalRes] = await Promise.all([
				db
					.select({
						id: paymentTransaction.id,
						userId: paymentTransaction.userId,
						teamId: paymentTransaction.teamId,
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
					message: "Only agency users can view transaction summary.",
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
