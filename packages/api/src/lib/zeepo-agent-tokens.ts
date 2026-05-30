/**
 * Zeepo AI Agent token balance helpers (customer billing).
 * Agency users bypass all checks and debits.
 */
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "@npanel/db";
import { db } from "@npanel/db";
import {
	niscClientSubscription,
	niscClientSubscriptionUsage,
	niscClientSubscriptionUsageActivityLog,
} from "@npanel/db/schema/products";
import { zeepoAgentTokenLedger } from "@npanel/db/schema/zeepo-agent";
import { randomUUID } from "node:crypto";
import {
	ZEEPO_AGENT_MIN_TOKENS_TO_START,
	ZEEPO_AGENT_USAGE_KIND,
	ZEEPO_AI_AGENT_PRODUCT_ID,
} from "./zeepo-agent-billing";

const AGENCY_ROLES = new Set(["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"]);

export function isZeepoAgentAgencyUser(role: string | null | undefined): boolean {
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

export type ZeepoAgentTokenBalanceResult = {
	subscriptionId: string;
	subscriptionUsageId: string;
	tokens: number;
};

/** Active Zeepo AI Agent subscription + token usage row for a team.
 *  Source of truth for balance: `nisc_client_subscription_usage.credits` (usage_kind zeepo_agent_tokens).
 *  `zeepo_agent_token_ledger` is audit history only — editing it does not change the live balance.
 */
export async function getZeepoAgentTokensForTeam(
	teamId: string,
): Promise<ZeepoAgentTokenBalanceResult | null> {
	const subRow = await db
		.select({ id: niscClientSubscription.id })
		.from(niscClientSubscription)
		.where(
			and(
				eq(niscClientSubscription.teamId, teamId),
				eq(niscClientSubscription.productId, ZEEPO_AI_AGENT_PRODUCT_ID),
				eq(niscClientSubscription.status, "ACTIVE"),
			),
		)
		.limit(1);

	const sub = subRow[0];
	if (!sub) return null;

	const usage = await db.query.niscClientSubscriptionUsage.findFirst({
		where: and(
			eq(niscClientSubscriptionUsage.subscriptionId, sub.id),
			eq(niscClientSubscriptionUsage.usageKind, ZEEPO_AGENT_USAGE_KIND),
		),
	});

	if (!usage) return null;

	return {
		subscriptionId: sub.id,
		subscriptionUsageId: usage.id,
		tokens: parseTokenBalance(usage.credits),
	};
}

export type ZeepoBillingContext = {
	teamId: string | null;
	userId: string;
	userRole: string | null | undefined;
	sessionId?: string | null;
};

/** True when token billing applies for this request. */
export function shouldBillZeepoAgentTokens(ctx: ZeepoBillingContext): boolean {
	if (isZeepoAgentAgencyUser(ctx.userRole)) return false;
	return Boolean(ctx.teamId);
}

/** Pre-flight: block customer turns when balance is too low. */
export async function assertZeepoAgentCanStartTurn(ctx: ZeepoBillingContext): Promise<void> {
	if (!shouldBillZeepoAgentTokens(ctx)) return;
	if (!ctx.teamId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Zeepo AI Agent requires a team context for billing.",
		});
	}

	const balance = await getZeepoAgentTokensForTeam(ctx.teamId);
	if (!balance) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "No active Zeepo AI Agent subscription. Purchase a plan or token top-up to continue.",
		});
	}

	if (balance.tokens < ZEEPO_AGENT_MIN_TOKENS_TO_START) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: `Insufficient tokens (${formatTokenBalance(balance.tokens)} remaining). Purchase more tokens to continue.`,
		});
	}
}

/** Returns false when a mid-turn operation should stop (balance exhausted). */
export async function zeepoAgentHasTokensRemaining(
	teamId: string,
	minTokens = 1,
): Promise<boolean> {
	const balance = await getZeepoAgentTokensForTeam(teamId);
	if (!balance) return false;
	return balance.tokens >= minTokens;
}

export type DebitZeepoTokensParams = {
	teamId: string;
	userId: string;
	tokens: number;
	operationType: string;
	description?: string;
	sessionId?: string | null;
	generationId?: string | null;
	predictionId?: string | null;
	modelId?: string | null;
	providerCostUsdMicros?: number | null;
	metadata?: Record<string, unknown>;
};

export type DebitZeepoTokensResult = {
	tokensDebited: number;
	balanceAfter: number;
};

/** Debit tokens after a successful billable operation. No-op for zero/negative amounts. */
export async function debitZeepoAgentTokens(
	params: DebitZeepoTokensParams,
): Promise<DebitZeepoTokensResult | null> {
	const amount = params.tokens;
	if (!Number.isFinite(amount) || amount <= 0) return null;

	const balanceRow = await getZeepoAgentTokensForTeam(params.teamId);
	if (!balanceRow) return null;

	const usage = await db.query.niscClientSubscriptionUsage.findFirst({
		where: eq(niscClientSubscriptionUsage.id, balanceRow.subscriptionUsageId),
	});
	if (!usage) return null;

	const current = parseTokenBalance(usage.credits);
	const debit = Math.min(amount, current);
	if (debit <= 0) return { tokensDebited: 0, balanceAfter: current };

	const balanceBefore = usage.credits;
	const newValue = Math.max(0, current - debit);
	const balanceAfter = formatTokenBalance(newValue);

	await db
		.update(niscClientSubscriptionUsage)
		.set({ credits: balanceAfter })
		.where(eq(niscClientSubscriptionUsage.id, usage.id));

	await db.insert(niscClientSubscriptionUsageActivityLog).values({
		id: randomUUID(),
		subscriptionUsageId: usage.id,
		userId: params.userId,
		action: "CREDIT_USE",
		description: params.description ?? `${debit} tokens used for Zeepo AI Agent`,
		metadata: {
			amount: String(-debit),
			previousCredits: balanceBefore,
			newCredits: balanceAfter,
			reason: params.operationType,
			...params.metadata,
		},
		createdAt: new Date(),
	});

	await db.insert(zeepoAgentTokenLedger).values({
		id: randomUUID(),
		teamId: params.teamId,
		userId: params.userId,
		sessionId: params.sessionId ?? null,
		subscriptionUsageId: usage.id,
		direction: "DEBIT",
		tokens: formatTokenBalance(debit),
		balanceBefore,
		balanceAfter,
		operationType: params.operationType,
		description: params.description ?? null,
		providerCostUsdMicros: params.providerCostUsdMicros ?? null,
		predictionId: params.predictionId ?? null,
		modelId: params.modelId ?? null,
		generationId: params.generationId ?? null,
		metadata: params.metadata ?? null,
	});

	return { tokensDebited: debit, balanceAfter: newValue };
}

export type CreditZeepoTokensParams = {
	teamId: string;
	userId: string;
	tokens: number;
	operationType: string;
	description?: string;
	metadata?: Record<string, unknown>;
};

/** Add tokens (top-up, subscription grant). */
export async function creditZeepoAgentTokens(
	params: CreditZeepoTokensParams,
): Promise<{ balanceAfter: number } | null> {
	const amount = params.tokens;
	if (!Number.isFinite(amount) || amount <= 0) return null;

	const balanceRow = await getZeepoAgentTokensForTeam(params.teamId);
	if (!balanceRow) return null;

	const usage = await db.query.niscClientSubscriptionUsage.findFirst({
		where: eq(niscClientSubscriptionUsage.id, balanceRow.subscriptionUsageId),
	});
	if (!usage) return null;

	const current = parseTokenBalance(usage.credits);
	const balanceBefore = usage.credits;
	const newValue = current + amount;
	const balanceAfter = formatTokenBalance(newValue);

	await db
		.update(niscClientSubscriptionUsage)
		.set({ credits: balanceAfter })
		.where(eq(niscClientSubscriptionUsage.id, usage.id));

	await db.insert(niscClientSubscriptionUsageActivityLog).values({
		id: randomUUID(),
		subscriptionUsageId: usage.id,
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

	await db.insert(zeepoAgentTokenLedger).values({
		id: randomUUID(),
		teamId: params.teamId,
		userId: params.userId,
		sessionId: null,
		subscriptionUsageId: usage.id,
		direction: "CREDIT",
		tokens: formatTokenBalance(amount),
		balanceBefore,
		balanceAfter,
		operationType: params.operationType,
		description: params.description ?? null,
		metadata: params.metadata ?? null,
	});

	return { balanceAfter: newValue };
}

export type SetZeepoTokenBalanceParams = {
	teamId: string;
	userId: string;
	tokens: number;
	operationType: string;
	description?: string;
	metadata?: Record<string, unknown>;
};

/** Set token balance to an exact amount (agency overrides, admin adjustments). */
export async function setZeepoAgentTokenBalance(
	params: SetZeepoTokenBalanceParams,
): Promise<{ balanceAfter: number } | null> {
	const amount = params.tokens;
	if (!Number.isFinite(amount) || amount < 0) return null;

	const balanceRow = await getZeepoAgentTokensForTeam(params.teamId);
	if (!balanceRow) return null;

	const usage = await db.query.niscClientSubscriptionUsage.findFirst({
		where: eq(niscClientSubscriptionUsage.id, balanceRow.subscriptionUsageId),
	});
	if (!usage) return null;

	const balanceBefore = usage.credits;
	const balanceAfter = formatTokenBalance(amount);

	await db
		.update(niscClientSubscriptionUsage)
		.set({ credits: balanceAfter })
		.where(eq(niscClientSubscriptionUsage.id, usage.id));

	await db.insert(niscClientSubscriptionUsageActivityLog).values({
		id: randomUUID(),
		subscriptionUsageId: usage.id,
		userId: params.userId,
		action: "CREDIT_ADD",
		description: params.description ?? `Token balance set to ${amount}`,
		metadata: {
			amount: String(amount),
			previousCredits: balanceBefore,
			newCredits: balanceAfter,
			reason: params.operationType,
			...params.metadata,
		},
		createdAt: new Date(),
	});

	await db.insert(zeepoAgentTokenLedger).values({
		id: randomUUID(),
		teamId: params.teamId,
		userId: params.userId,
		sessionId: null,
		subscriptionUsageId: usage.id,
		direction: "CREDIT",
		tokens: formatTokenBalance(amount),
		balanceBefore,
		balanceAfter,
		operationType: params.operationType,
		description: params.description ?? null,
		metadata: params.metadata ?? null,
	});

	return { balanceAfter: amount };
}

export async function listZeepoAgentTokenLedger(params: {
	teamId: string;
	limit?: number;
}) {
	const limit = Math.min(params.limit ?? 30, 100);
	return db.query.zeepoAgentTokenLedger.findMany({
		where: eq(zeepoAgentTokenLedger.teamId, params.teamId),
		orderBy: [desc(zeepoAgentTokenLedger.createdAt)],
		limit,
		columns: {
			id: true,
			direction: true,
			tokens: true,
			balanceAfter: true,
			operationType: true,
			description: true,
			createdAt: true,
			// omit providerCostUsdMicros, predictionId, modelId from customer-facing queries
		},
	});
}
