/**
 * Zeepo AI token balance helpers (customer billing).
 * Agency users bypass debits but usage is still logged elsewhere.
 */
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "@npanel/db";
import { db } from "@npanel/db";
import {
	niscClientSubscription,
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
	const subRow = await db
		.select({ id: niscClientSubscription.id })
		.from(niscClientSubscription)
		.where(
			and(
				eq(niscClientSubscription.teamId, teamId),
				eq(niscClientSubscription.productId, ZEEPO_AI_PRODUCT_ID),
				eq(niscClientSubscription.status, "ACTIVE"),
			),
		)
		.limit(1);

	const sub = subRow[0];
	if (!sub) return null;

	const usage = await db.query.niscClientSubscriptionUsage.findFirst({
		where: and(
			eq(niscClientSubscriptionUsage.subscriptionId, sub.id),
			eq(niscClientSubscriptionUsage.usageKind, ZEEPO_AI_USAGE_KIND),
		),
	});

	if (!usage) return null;

	return {
		subscriptionId: sub.id,
		subscriptionUsageId: usage.id,
		tokens: parseTokenBalance(usage.credits),
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
	return Boolean(ctx.teamId);
}

export async function assertZeepoAiCanStartTurn(ctx: ZeepoAiBillingContext): Promise<void> {
	if (!shouldBillZeepoAiTokens(ctx)) return;
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

	await db.insert(zeepoAiTokenLedger).values({
		id: randomUUID(),
		teamId: params.teamId,
		userId: params.userId,
		sessionId: params.sessionId ?? null,
		subscriptionUsageId: usage.id,
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

	await db.insert(zeepoAiTokenLedger).values({
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

export { formatTokenBalance as formatZeepoAiTokenBalance };
