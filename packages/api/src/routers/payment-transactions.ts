import { TRPCError } from "@trpc/server";
import { db } from "@npanel/db";
import { user as userTable } from "@npanel/db/schema/auth";
import { teamMember, team as teamTable } from "@npanel/db/schema/teams";
import {
  paymentTransaction,
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

const isAgencyUser = (role: string) =>
	["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role);

export const paymentTransactionsRouter = router({
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

			const conditions: any[] = [];

			// For agency users, show all transactions
			// For customers, filter by their user ID or team
			if (!isAgencyUser(user.role)) {
				const memberships = await db
					.select({ teamId: teamMember.teamId })
					.from(teamMember)
					.where(eq(teamMember.userId, user.id));

				const accessibleTeams = memberships.map(
					(membership: { teamId: string }) => membership.teamId,
				);
				const accessConditions =
					accessibleTeams.length > 0
						? or(
								eq(paymentTransaction.userId, user.id),
								inArray(paymentTransaction.teamId, accessibleTeams),
							)
						: eq(paymentTransaction.userId, user.id);

				conditions.push(accessConditions);
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
			await getAuthenticatedUser(ctx);

			const [tx] = await db
				.select()
				.from(paymentTransaction)
				.where(eq(paymentTransaction.id, input.id))
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
});
