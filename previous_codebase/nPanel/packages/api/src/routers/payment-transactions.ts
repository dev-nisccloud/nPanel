import { TRPCError } from "@trpc/server";
import prisma from "@npanel/db";
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
	const dbUser = await prisma.user.findUnique({
		where: { id: user.id },
		select: { id: true, role: true },
	});

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

			const filters: Record<string, unknown>[] = [];

			// For agency users, show all transactions
			// For customers, filter by their user ID or team
			if (!isAgencyUser(user.role)) {
				const memberships = await prisma.teamMember.findMany({
					where: { userId: user.id },
					select: { teamId: true },
				});

				const accessibleTeams = memberships.map((membership) => membership.teamId);
				const accessConditions: Record<string, unknown>[] = [
					{ userId: user.id },
				];

				if (accessibleTeams.length > 0) {
					accessConditions.push({
						teamId: { in: accessibleTeams },
					});
				}

				filters.push({ OR: accessConditions });
			}

			if (input.status) {
				filters.push({ status: input.status });
			}

			if (input.gateway) {
				filters.push({ gateway: input.gateway });
			}

			const where = filters.length > 0 ? { AND: filters } : undefined;

			const [transactions, total] = await prisma.$transaction([
				prisma.paymentTransaction.findMany({
					where,
					orderBy: { createdAt: "desc" },
					skip: input.offset,
					take: input.limit,
					select: {
						id: true,
						userId: true,
						teamId: true,
						gateway: true,
						status: true,
						amount: true,
						currency: true,
						accountReference: true,
						transactionDesc: true,
						receiptNumber: true,
						initiatedAt: true,
						processedAt: true,
						failedAt: true,
						createdAt: true,
						updatedAt: true,
					},
				}),
				prisma.paymentTransaction.count({ where }),
			]);

			const userIds = [...new Set(transactions.map((t) => t.userId))];
			const users =
				userIds.length > 0
					? await prisma.user.findMany({
							where: { id: { in: userIds } },
							select: { id: true, name: true },
						})
					: [];
			const userMap = new Map(users.map((u) => [u.id, u.name]));

			return {
				transactions: transactions.map((t) =>
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

			const tx = await prisma.paymentTransaction.findUnique({
				where: { id: input.id },
			});
			if (!tx) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Transaction not found",
				});
			}

			const [user, team] = await Promise.all([
				prisma.user.findUnique({
					where: { id: tx.userId },
					select: { name: true },
				}),
				tx.teamId
					? prisma.team.findUnique({
							where: { id: tx.teamId },
							select: { name: true },
						})
					: null,
			]);

			return {
				id: tx.id,
				userId: tx.userId,
				teamId: tx.teamId,
				userName: user?.name ?? null,
				teamName: team?.name ?? null,
				gateway: tx.gateway,
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
				status: tx.status,
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
