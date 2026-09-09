/**
 * Zeepo AI token balance helpers (customer billing).
 * Agency users bypass debits but usage is still logged elsewhere.
 */
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { user as userTable } from "@npanel/db/schema/auth";
import {
	niscClientSubscription,
	niscClientSubscriptionActivityLog,
	niscClientSubscriptionUsage,
	niscClientSubscriptionUsageActivityLog,
} from "@npanel/db/schema/products";
import { zeepoAiTokenLedger } from "@npanel/db/schema/zeepo-ai";
import { randomUUID } from "node:crypto";
import {
	ZEEPO_AI_MIN_TOKENS_TO_START,
	ZEEPO_AI_PRODUCT_ID,
	ZEEPO_AI_PROVIDER,
	ZEEPO_AI_USAGE_KIND,
} from "./zeepo-ai-billing";

export const ZEEPO_AI_AGENCY_ADJUSTMENT_OPERATION = "agency_adjustment";

const ZEEPO_AI_WALLET_LOG_OPERATION_TYPES = [
	ZEEPO_AI_AGENCY_ADJUSTMENT_OPERATION,
	"welcome_grant",
	"top_up",
	"subscription_grant",
] as const;

const AGENCY_ROLES = new Set(["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"]);

export function isZeepoAiAgencyUser(role: string | null | undefined): boolean {
	return AGENCY_ROLES.has(role ?? "");
}

function parseTokenBalance(value: string): number {
	const trimmed = value.trim().toLowerCase();
	if (trimmed === "unlimited" || trimmed === "") return Number.POSITIVE_INFINITY;
	const n = Number.parseFloat(trimmed);
	return Number.isFinite(n) ? n : 0;
}

function formatTokenBalance(n: number): string {
	if (!Number.isFinite(n)) return "0";
	if (Number.isInteger(n)) return String(n);
	return n.toFixed(2).replace(/\.?0+$/, "");
}

export type ZeepoAiTokenBalanceResult = {
	subscriptionId: string;
	subscriptionUsageId: string;
	tokens: number;
};

export async function getZeepoAiTokensForTeam(
	teamId: string,
): Promise<ZeepoAiTokenBalanceResult | null> {
	const rows = await db
		.select({
			subscriptionId: niscClientSubscription.id,
			subscriptionUsageId: niscClientSubscriptionUsage.id,
			credits: niscClientSubscriptionUsage.credits,
		})
		.from(niscClientSubscription)
		.innerJoin(
			niscClientSubscriptionUsage,
			eq(niscClientSubscriptionUsage.subscriptionId, niscClientSubscription.id),
		)
		.where(
			and(
				eq(niscClientSubscription.teamId, teamId),
				eq(niscClientSubscription.productId, ZEEPO_AI_PRODUCT_ID),
				eq(niscClientSubscription.status, "ACTIVE"),
				eq(niscClientSubscriptionUsage.usageKind, ZEEPO_AI_USAGE_KIND),
			),
		)
		.orderBy(desc(niscClientSubscription.updatedAt))
		.limit(1);

	const row = rows[0];
	if (!row) return null;

	return {
		subscriptionId: row.subscriptionId,
		subscriptionUsageId: row.subscriptionUsageId,
		tokens: parseTokenBalance(row.credits),
	};
}

export type ZeepoAiBillingContext = {
	teamId: string | null;
	userId: string;
	userRole: string | null | undefined;
	sessionId?: string | null;
};

export function shouldBillZeepoAiTokens(ctx: ZeepoAiBillingContext): boolean {
	if (isZeepoAiAgencyUser(ctx.userRole)) return false;
	if ((ctx.userRole ?? "").toUpperCase() === "GUEST") return false;
	return Boolean(ctx.teamId);
}

export async function assertZeepoAiCanStartTurn(ctx: ZeepoAiBillingContext): Promise<void> {
	if (isZeepoAiAgencyUser(ctx.userRole)) return;
	if ((ctx.userRole ?? "").toUpperCase() === "GUEST") return;
	if (!ctx.teamId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Zeepo AI requires a team context for billing.",
		});
	}

	const balance = await getZeepoAiTokensForTeam(ctx.teamId);
	if (!balance) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "No active Zeepo AI wallet. Purchase tokens to continue.",
		});
	}

	if (balance.tokens < ZEEPO_AI_MIN_TOKENS_TO_START) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: `Insufficient tokens (${formatTokenBalance(balance.tokens)} remaining). Purchase more tokens to continue.`,
		});
	}
}

export type DebitZeepoAiTokensParams = {
	teamId: string;
	userId: string;
	tokens: number;
	operationType: string;
	description?: string;
	sessionId?: string | null;
	generationId?: string | null;
	usageEventId?: string | null;
	providerRequestId?: string | null;
	modelId?: string | null;
	providerCostUsdMicros?: number | null;
	metadata?: Record<string, unknown>;
};

export async function debitZeepoAiTokens(
	params: DebitZeepoAiTokensParams,
): Promise<{ tokensDebited: number; balanceAfter: number } | null> {
	const amount = params.tokens;
	if (!Number.isFinite(amount) || amount <= 0) return null;

	const balanceRow = await getZeepoAiTokensForTeam(params.teamId);
	if (!balanceRow) return null;

	return db.transaction(async (tx) => {
		const lockedRows = await tx.execute<{ id: string; credits: string }>(
			sql`select id, credits from nisc_client_subscription_usage where id = ${balanceRow.subscriptionUsageId} for update`,
		);
		const row = lockedRows.rows[0];
		if (!row) return null;

		const current = parseTokenBalance(row.credits);
		const debit = Math.min(amount, current);
		if (debit <= 0) return { tokensDebited: 0, balanceAfter: current };

		const balanceBefore = row.credits;
		const newValue = Math.max(0, current - debit);
		const balanceAfter = formatTokenBalance(newValue);

		await tx
			.update(niscClientSubscriptionUsage)
			.set({ credits: balanceAfter })
			.where(eq(niscClientSubscriptionUsage.id, balanceRow.subscriptionUsageId));

		await tx.insert(niscClientSubscriptionUsageActivityLog).values({
			id: randomUUID(),
			subscriptionUsageId: balanceRow.subscriptionUsageId,
			userId: params.userId,
			action: "CREDIT_USE",
			description: params.description ?? `${debit} tokens used for Zeepo AI`,
			metadata: {
				amount: String(-debit),
				previousCredits: balanceBefore,
				newCredits: balanceAfter,
				reason: params.operationType,
				modelId: params.modelId ?? null,
				...params.metadata,
			},
			createdAt: new Date(),
		});

		await tx.insert(zeepoAiTokenLedger).values({
			id: randomUUID(),
			teamId: params.teamId,
			userId: params.userId,
			sessionId: params.sessionId ?? null,
			subscriptionUsageId: balanceRow.subscriptionUsageId,
			usageEventId: params.usageEventId ?? null,
			direction: "DEBIT",
			tokens: formatTokenBalance(debit),
			balanceBefore,
			balanceAfter,
			operationType: params.operationType,
			description: params.description ?? null,
			providerCostUsdMicros: params.providerCostUsdMicros ?? null,
			providerRequestId: params.providerRequestId ?? null,
			modelId: params.modelId ?? null,
			provider: ZEEPO_AI_PROVIDER,
			generationId: params.generationId ?? null,
			metadata: params.metadata ?? null,
		});

		return { tokensDebited: debit, balanceAfter: newValue };
	});
}

/** Require a successful full debit (or agency bypass). Throws if wallet cannot cover amount. */
export async function debitZeepoAiTokensOrThrow(
	params: DebitZeepoAiTokensParams & { userRole?: string | null },
): Promise<{ tokensDebited: number; balanceAfter: number } | null> {
	if (!shouldBillZeepoAiTokens({ teamId: params.teamId, userId: params.userId, userRole: params.userRole })) {
		return null;
	}
	const result = await debitZeepoAiTokens(params);
	if (!result || result.tokensDebited <= 0) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Insufficient tokens. Purchase more tokens to continue.",
		});
	}
	if (result.tokensDebited < params.tokens) {
		// Partial debit  refund and fail closed so we don't under-bill silently for paid work.
		await creditZeepoAiTokens({
			teamId: params.teamId,
			userId: params.userId,
			tokens: result.tokensDebited,
			operationType: "debit_rollback",
			description: "Rolled back partial debit (insufficient balance for full charge)",
			metadata: { requested: params.tokens },
		});
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Insufficient tokens. Purchase more tokens to continue.",
		});
	}
	return result;
}

export type CreditZeepoAiTokensParams = {
	teamId: string;
	userId: string;
	tokens: number;
	operationType: string;
	description?: string;
	metadata?: Record<string, unknown>;
};

export async function creditZeepoAiTokens(
	params: CreditZeepoAiTokensParams,
): Promise<{ balanceAfter: number } | null> {
	const amount = params.tokens;
	if (!Number.isFinite(amount) || amount <= 0) return null;

	const balanceRow = await getZeepoAiTokensForTeam(params.teamId);
	if (!balanceRow) return null;

	return db.transaction(async (tx) => {
		const lockedRows = await tx.execute<{ id: string; credits: string }>(
			sql`select id, credits from nisc_client_subscription_usage where id = ${balanceRow.subscriptionUsageId} for update`,
		);
		const row = lockedRows.rows[0];
		if (!row) return null;

		const current = parseTokenBalance(row.credits);
		const balanceBefore = row.credits;
		const newValue = current + amount;
		const balanceAfter = formatTokenBalance(newValue);

		await tx
			.update(niscClientSubscriptionUsage)
			.set({ credits: balanceAfter })
			.where(eq(niscClientSubscriptionUsage.id, balanceRow.subscriptionUsageId));

		await tx.insert(niscClientSubscriptionUsageActivityLog).values({
			id: randomUUID(),
			subscriptionUsageId: balanceRow.subscriptionUsageId,
			userId: params.userId,
			action: "CREDIT_ADD",
			description: params.description ?? `${amount} tokens added`,
			metadata: {
				amount: String(amount),
				previousCredits: balanceBefore,
				newCredits: balanceAfter,
				reason: params.operationType,
				...params.metadata,
			},
			createdAt: new Date(),
		});

		await tx.insert(zeepoAiTokenLedger).values({
			id: randomUUID(),
			teamId: params.teamId,
			userId: params.userId,
			sessionId: null,
			subscriptionUsageId: balanceRow.subscriptionUsageId,
			direction: "CREDIT",
			tokens: formatTokenBalance(amount),
			balanceBefore,
			balanceAfter,
			operationType: params.operationType,
			description: params.description ?? null,
			metadata: params.metadata ?? null,
		});

		return { balanceAfter: newValue };
	});
}

/** Agency monitoring row  no balance change, tokens recorded as 0. */
export async function logZeepoAiAgencyUsage(params: {
	teamId: string | null;
	userId: string;
	sessionId?: string | null;
	usageEventId?: string | null;
	operationType: string;
	modelId: string;
	providerRequestId?: string | null;
	providerCostUsdMicros?: number | null;
	estimatedTokens: number;
	metadata?: Record<string, unknown>;
}): Promise<void> {
	if (!params.teamId) return;

	await db.insert(zeepoAiTokenLedger).values({
		id: randomUUID(),
		teamId: params.teamId,
		userId: params.userId,
		sessionId: params.sessionId ?? null,
		subscriptionUsageId: null,
		usageEventId: params.usageEventId ?? null,
		direction: "DEBIT",
		tokens: "0",
		balanceBefore: "unlimited",
		balanceAfter: "unlimited",
		operationType: params.operationType,
		description: `Agency usage (unlimited)  est. ${params.estimatedTokens} tokens`,
		providerCostUsdMicros: params.providerCostUsdMicros ?? null,
		providerRequestId: params.providerRequestId ?? null,
		modelId: params.modelId,
		provider: ZEEPO_AI_PROVIDER,
		generationId: null,
		metadata: {
			agencyUnlimited: true,
			estimatedTokens: params.estimatedTokens,
			...params.metadata,
		},
	});
}

export async function listZeepoAiTokenLedger(params: {
	teamId: string;
	limit?: number;
}) {
	const limit = Math.min(params.limit ?? 30, 100);
	return db.query.zeepoAiTokenLedger.findMany({
		where: eq(zeepoAiTokenLedger.teamId, params.teamId),
		orderBy: [desc(zeepoAiTokenLedger.createdAt)],
		limit,
		columns: {
			id: true,
			direction: true,
			tokens: true,
			balanceAfter: true,
			operationType: true,
			description: true,
			createdAt: true,
			modelId: true,
		},
	});
}

export type ZeepoAiWalletForSubscription = {
	subscriptionId: string;
	subscriptionUsageId: string;
	teamId: string;
	tokens: number;
};

function extractLedgerReason(metadata: unknown): string | null {
	if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
	const reason = (metadata as Record<string, unknown>).reason;
	return typeof reason === "string" && reason.trim() ? reason.trim() : null;
}

async function getOrCreateZeepoAiWalletForSubscription(
	subscriptionId: string,
): Promise<ZeepoAiWalletForSubscription> {
	const sub = await db.query.niscClientSubscription.findFirst({
		where: eq(niscClientSubscription.id, subscriptionId),
		columns: { id: true, productId: true, teamId: true },
	});
	if (!sub) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found" });
	}
	if (sub.productId !== ZEEPO_AI_PRODUCT_ID) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Token adjustments are only available for Zeepo AI subscriptions",
		});
	}
	if (!sub.teamId) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "This Zeepo AI subscription is not linked to an organization",
		});
	}

	const existing = await db.query.niscClientSubscriptionUsage.findFirst({
		where: and(
			eq(niscClientSubscriptionUsage.subscriptionId, subscriptionId),
			eq(niscClientSubscriptionUsage.usageKind, ZEEPO_AI_USAGE_KIND),
		),
		columns: { id: true, credits: true },
	});
	if (existing) {
		return {
			subscriptionId: sub.id,
			subscriptionUsageId: existing.id,
			teamId: sub.teamId,
			tokens: parseTokenBalance(existing.credits),
		};
	}

	const usageId = randomUUID();
	await db.insert(niscClientSubscriptionUsage).values({
		id: usageId,
		subscriptionId: sub.id,
		usageKind: ZEEPO_AI_USAGE_KIND,
		credits: "0",
		metadata: { source: "agency_wallet_bootstrap" },
	});

	return {
		subscriptionId: sub.id,
		subscriptionUsageId: usageId,
		teamId: sub.teamId,
		tokens: 0,
	};
}

export async function getZeepoAiWalletForSubscription(
	subscriptionId: string,
): Promise<ZeepoAiWalletForSubscription> {
	return getOrCreateZeepoAiWalletForSubscription(subscriptionId);
}

export async function adjustZeepoAiTokensForSubscription(params: {
	subscriptionId: string;
	actorUserId: string;
	tokens: number;
	direction: "add" | "remove";
	reason?: string;
}): Promise<{
	tokens: number;
	balanceBefore: number;
	balanceAfter: number;
	direction: "CREDIT" | "DEBIT";
}> {
	const amount = params.tokens;
	if (!Number.isFinite(amount) || amount <= 0) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Token amount must be greater than zero",
		});
	}

	const wallet = await getOrCreateZeepoAiWalletForSubscription(params.subscriptionId);
	const reason = params.reason?.trim() || undefined;
	const ledgerDirection = params.direction === "add" ? "CREDIT" : "DEBIT";

	return db.transaction(async (tx) => {
		const lockedRows = await tx.execute<{ id: string; credits: string }>(
			sql`select id, credits from nisc_client_subscription_usage where id = ${wallet.subscriptionUsageId} for update`,
		);
		const row = lockedRows.rows[0];
		if (!row) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Zeepo AI wallet not found for this subscription",
			});
		}

		const current = parseTokenBalance(row.credits);
		if (params.direction === "remove" && amount > current) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: `Cannot remove ${formatTokenBalance(amount)} tokens. Current balance is ${formatTokenBalance(current)}.`,
			});
		}

		const balanceBefore = row.credits;
		const newValue =
			params.direction === "add" ? current + amount : Math.max(0, current - amount);
		const balanceAfter = formatTokenBalance(newValue);
		const formattedAmount = formatTokenBalance(amount);
		const verb = params.direction === "add" ? "Added" : "Removed";
		const description = `${verb} ${formattedAmount} tokens (${formatTokenBalance(current)} → ${balanceAfter})`;

		await tx
			.update(niscClientSubscriptionUsage)
			.set({ credits: balanceAfter })
			.where(eq(niscClientSubscriptionUsage.id, wallet.subscriptionUsageId));

		await tx.insert(niscClientSubscriptionUsageActivityLog).values({
			id: randomUUID(),
			subscriptionUsageId: wallet.subscriptionUsageId,
			userId: params.actorUserId,
			action: params.direction === "add" ? "CREDIT_ADD" : "CREDIT_USE",
			description,
			metadata: {
				amount: params.direction === "add" ? String(amount) : String(-amount),
				previousCredits: balanceBefore,
				newCredits: balanceAfter,
				reason: ZEEPO_AI_AGENCY_ADJUSTMENT_OPERATION,
				note: reason ?? null,
				source: "agency_subscription_sheet",
			},
			createdAt: new Date(),
		});

		await tx.insert(niscClientSubscriptionActivityLog).values({
			id: randomUUID(),
			subscriptionId: wallet.subscriptionId,
			userId: params.actorUserId,
			action: "ZEEPO_AI_TOKEN_ADJUST",
			description,
			metadata: {
				previousCredits: balanceBefore,
				newCredits: balanceAfter,
				delta: params.direction === "add" ? amount : -amount,
				direction: params.direction,
				reason: reason ?? null,
				source: "agency_subscription_sheet",
			},
			ipAddress: null,
			userAgent: null,
			createdAt: new Date(),
		});

		await tx.insert(zeepoAiTokenLedger).values({
			id: randomUUID(),
			teamId: wallet.teamId,
			userId: params.actorUserId,
			sessionId: null,
			subscriptionUsageId: wallet.subscriptionUsageId,
			direction: ledgerDirection,
			tokens: formattedAmount,
			balanceBefore,
			balanceAfter,
			operationType: ZEEPO_AI_AGENCY_ADJUSTMENT_OPERATION,
			description,
			metadata: {
				reason: reason ?? null,
				source: "agency_subscription_sheet",
				actorUserId: params.actorUserId,
				previousCredits: balanceBefore,
				newCredits: balanceAfter,
			},
			provider: ZEEPO_AI_PROVIDER,
		});

		return {
			tokens: amount,
			balanceBefore: current,
			balanceAfter: newValue,
			direction: ledgerDirection,
		};
	});
}

export type ZeepoAiWalletLogEntry = {
	id: string;
	direction: string;
	tokens: string;
	balanceBefore: string;
	balanceAfter: string;
	operationType: string;
	description: string | null;
	createdAt: Date;
	actorUserId: string;
	actorName: string | null;
	actorEmail: string | null;
	reason: string | null;
};

export async function listZeepoAiWalletLogsForSubscription(params: {
	subscriptionId: string;
	limit?: number;
}): Promise<ZeepoAiWalletLogEntry[]> {
	const wallet = await getOrCreateZeepoAiWalletForSubscription(params.subscriptionId);
	const limit = Math.min(params.limit ?? 50, 100);

	const rows = await db
		.select({
			id: zeepoAiTokenLedger.id,
			direction: zeepoAiTokenLedger.direction,
			tokens: zeepoAiTokenLedger.tokens,
			balanceBefore: zeepoAiTokenLedger.balanceBefore,
			balanceAfter: zeepoAiTokenLedger.balanceAfter,
			operationType: zeepoAiTokenLedger.operationType,
			description: zeepoAiTokenLedger.description,
			createdAt: zeepoAiTokenLedger.createdAt,
			actorUserId: zeepoAiTokenLedger.userId,
			actorName: userTable.name,
			actorEmail: userTable.email,
			metadata: zeepoAiTokenLedger.metadata,
		})
		.from(zeepoAiTokenLedger)
		.leftJoin(userTable, eq(userTable.id, zeepoAiTokenLedger.userId))
		.where(
			and(
				eq(zeepoAiTokenLedger.subscriptionUsageId, wallet.subscriptionUsageId),
				inArray(zeepoAiTokenLedger.operationType, [...ZEEPO_AI_WALLET_LOG_OPERATION_TYPES]),
			),
		)
		.orderBy(desc(zeepoAiTokenLedger.createdAt))
		.limit(limit);

	return rows.map((row) => ({
		id: row.id,
		direction: row.direction,
		tokens: row.tokens,
		balanceBefore: row.balanceBefore,
		balanceAfter: row.balanceAfter,
		operationType: row.operationType,
		description: row.description,
		createdAt: row.createdAt,
		actorUserId: row.actorUserId,
		actorName: row.actorName,
		actorEmail: row.actorEmail,
		reason: extractLedgerReason(row.metadata),
	}));
}

export { formatTokenBalance as formatZeepoAiTokenBalance };
