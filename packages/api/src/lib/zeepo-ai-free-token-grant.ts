/**
 * One-time free token grant for Zeepo AI (customer teams).
 *
 * Rules (team-scoped, once):
 * - Team must have ≥1 ACTIVE subscription that is NOT the Zeepo AI wallet itself
 *   (hosting, domain, etc.  proves they bought / hold a service with us)
 * - Grant flag on usage metadata must be unset
 * - No prior Zeepo AI messages for this team
 * - Creates PAYG wallet if missing, then credits welcome tokens in one transaction
 */
import { and, eq, ne, sql } from "@npanel/db";
import { db } from "@npanel/db";
import {
	niscClientSubscription,
	niscClientSubscriptionActivityLog,
	niscClientSubscriptionUsage,
	niscClientSubscriptionUsageActivityLog,
	niscProductPlan,
} from "@npanel/db/schema/products";
import { zeepoAiMessage, zeepoAiSession, zeepoAiTokenLedger } from "@npanel/db/schema/zeepo-ai";
import { randomUUID } from "node:crypto";
import {
	ZEEPO_AI_PLAN_IDS,
	ZEEPO_AI_PRODUCT_ID,
	ZEEPO_AI_PROVIDER,
	ZEEPO_AI_USAGE_KIND,
	ZEEPO_AI_WELCOME_TOKEN_GRANT,
} from "./zeepo-ai-billing";

const FREE_TOKEN_GRANT_FLAG = "zeepo_ai_free_tokens_granted";

export type FreeTokenGrantResult =
	| {
			granted: false;
			reason:
				| "already_granted"
				| "no_qualifying_service"
				| "has_prior_usage"
				| "no_payg_plan"
				| "agency_skip";
	  }
	| { granted: true; tokensGranted: number; balanceAfter: number };

function formatTokenBalance(n: number): string {
	if (!Number.isFinite(n)) return "0";
	if (Number.isInteger(n)) return String(n);
	return n.toFixed(2).replace(/\.?0+$/, "");
}

function parseTokenBalance(value: string): number {
	const trimmed = value.trim().toLowerCase();
	if (trimmed === "unlimited" || trimmed === "") return Number.POSITIVE_INFINITY;
	const n = Number.parseFloat(trimmed);
	return Number.isFinite(n) ? n : 0;
}

/** Active non–Zeepo-AI subscription = paid/held service with us. */
export async function teamHasQualifyingService(teamId: string): Promise<boolean> {
	const row = await db
		.select({ id: niscClientSubscription.id })
		.from(niscClientSubscription)
		.where(
			and(
				eq(niscClientSubscription.teamId, teamId),
				eq(niscClientSubscription.status, "ACTIVE"),
				ne(niscClientSubscription.productId, ZEEPO_AI_PRODUCT_ID),
			),
		)
		.limit(1);
	return row.length > 0;
}

async function teamHasZeepoAiHistory(teamId: string): Promise<boolean> {
	const row = await db
		.select({ id: zeepoAiMessage.id })
		.from(zeepoAiMessage)
		.innerJoin(zeepoAiSession, eq(zeepoAiMessage.sessionId, zeepoAiSession.id))
		.where(eq(zeepoAiSession.teamId, teamId))
		.limit(1);
	return row.length > 0;
}

async function ensurePaygWallet(params: {
	teamId: string;
	userId: string;
}): Promise<{ subscriptionId: string; usageId: string } | null> {
	const existing = await db
		.select({ id: niscClientSubscription.id })
		.from(niscClientSubscription)
		.where(
			and(
				eq(niscClientSubscription.teamId, params.teamId),
				eq(niscClientSubscription.productId, ZEEPO_AI_PRODUCT_ID),
				eq(niscClientSubscription.status, "ACTIVE"),
			),
		)
		.limit(1);

	if (existing[0]) {
		let usage = await db.query.niscClientSubscriptionUsage.findFirst({
			where: and(
				eq(niscClientSubscriptionUsage.subscriptionId, existing[0].id),
				eq(niscClientSubscriptionUsage.usageKind, ZEEPO_AI_USAGE_KIND),
			),
			columns: { id: true },
		});
		if (!usage) {
			const inserted = await db
				.insert(niscClientSubscriptionUsage)
				.values({
					id: randomUUID(),
					subscriptionId: existing[0].id,
					usageKind: ZEEPO_AI_USAGE_KIND,
					credits: "0",
					metadata: {},
				})
				.returning({ id: niscClientSubscriptionUsage.id });
			usage = inserted[0]!;
		}
		return { subscriptionId: existing[0].id, usageId: usage.id };
	}

	const plan = await db.query.niscProductPlan.findFirst({
		where: eq(niscProductPlan.id, ZEEPO_AI_PLAN_IDS.payAsYouGo),
		columns: { id: true, name: true },
		with: { product: { columns: { name: true } } },
	});
	if (!plan) return null;

	const subId = randomUUID();
	const usageId = randomUUID();
	const now = new Date();

	await db.insert(niscClientSubscription).values({
		id: subId,
		name: `${plan.product?.name ?? "Zeepo AI"} - ${plan.name}`,
		description: "Pay-as-you-go Zeepo AI wallet",
		userId: params.userId,
		teamId: params.teamId,
		productId: ZEEPO_AI_PRODUCT_ID,
		productPlanId: plan.id,
		orderId: null,
		niscOrderId: null,
		subscribedBy: params.userId,
		status: "ACTIVE",
		subscriptionDate: now,
		billingCycle: "ONE_TIME",
		pricingModel: "USAGE",
		agreedPrice: "0",
		agreedCurrency: "USD",
		agreedCost: "0",
		agreedCostCurrency: "USD",
		providerCost: "0",
		providerCostCurrency: "USD",
		autoRenew: false,
		metadata: {
			zeepoPlanType: "pay_as_you_go",
			source: "welcome_wallet_bootstrap",
			noInvoice: true,
		},
	});

	await db.insert(niscClientSubscriptionUsage).values({
		id: usageId,
		subscriptionId: subId,
		usageKind: ZEEPO_AI_USAGE_KIND,
		credits: "0",
		metadata: {},
	});

	await db.insert(niscClientSubscriptionActivityLog).values({
		id: randomUUID(),
		subscriptionId: subId,
		userId: params.userId,
		action: "CREATE",
		description: "Zeepo AI PAYG wallet created for welcome grant",
		metadata: { source: "welcome_wallet_bootstrap", teamId: params.teamId },
	});

	return { subscriptionId: subId, usageId };
}

/**
 * Attempt to grant welcome tokens. Safe for concurrent callers (FOR UPDATE + flag).
 */
export async function tryGrantWelcomeTokens(params: {
	teamId: string;
	userId: string;
}): Promise<FreeTokenGrantResult> {
	const { teamId, userId } = params;

	const hasService = await teamHasQualifyingService(teamId);
	if (!hasService) {
		return { granted: false, reason: "no_qualifying_service" };
	}

	if (await teamHasZeepoAiHistory(teamId)) {
		return { granted: false, reason: "has_prior_usage" };
	}

	const wallet = await ensurePaygWallet({ teamId, userId });
	if (!wallet) {
		return { granted: false, reason: "no_payg_plan" };
	}

	return db.transaction(async (tx) => {
		const usageRows = await tx.execute<{
			id: string;
			credits: string;
			metadata: Record<string, unknown> | null;
		}>(
			sql`
        SELECT id, credits, metadata
        FROM nisc_client_subscription_usage
        WHERE id = ${wallet.usageId}
        FOR UPDATE
      `,
		);

		const usage = usageRows.rows[0];
		if (!usage) {
			return { granted: false, reason: "no_payg_plan" };
		}

		const metadata = (usage.metadata ?? {}) as Record<string, unknown>;
		if (metadata[FREE_TOKEN_GRANT_FLAG] === true) {
			return { granted: false, reason: "already_granted" };
		}

		// Re-check history inside the lock window (best-effort; flag is the hard stop)
		const historyInside = await tx
			.select({ id: zeepoAiMessage.id })
			.from(zeepoAiMessage)
			.innerJoin(zeepoAiSession, eq(zeepoAiMessage.sessionId, zeepoAiSession.id))
			.where(eq(zeepoAiSession.teamId, teamId))
			.limit(1);
		if (historyInside.length > 0) {
			return { granted: false, reason: "has_prior_usage" };
		}

		const current = parseTokenBalance(usage.credits);
		const safeCurrent = Number.isFinite(current) ? current : 0;
		const newBalance = safeCurrent + ZEEPO_AI_WELCOME_TOKEN_GRANT;
		const balanceBefore = usage.credits;
		const balanceAfter = formatTokenBalance(newBalance);

		const nextMeta = {
			...metadata,
			[FREE_TOKEN_GRANT_FLAG]: true,
			welcomeGrantedAt: new Date().toISOString(),
			welcomeGrantedBy: userId,
			welcomeGrantAmount: ZEEPO_AI_WELCOME_TOKEN_GRANT,
		};

		await tx
			.update(niscClientSubscriptionUsage)
			.set({
				credits: balanceAfter,
				metadata: nextMeta,
			})
			.where(eq(niscClientSubscriptionUsage.id, usage.id));

		await tx.insert(niscClientSubscriptionUsageActivityLog).values({
			id: randomUUID(),
			subscriptionUsageId: usage.id,
			userId,
			action: "CREDIT_ADD",
			description: `Welcome grant: ${ZEEPO_AI_WELCOME_TOKEN_GRANT} free tokens`,
			metadata: {
				amount: String(ZEEPO_AI_WELCOME_TOKEN_GRANT),
				previousCredits: balanceBefore,
				newCredits: balanceAfter,
				reason: "welcome_grant",
			},
			createdAt: new Date(),
		});

		await tx.insert(zeepoAiTokenLedger).values({
			id: randomUUID(),
			teamId,
			userId,
			sessionId: null,
			subscriptionUsageId: usage.id,
			direction: "CREDIT",
			tokens: formatTokenBalance(ZEEPO_AI_WELCOME_TOKEN_GRANT),
			balanceBefore,
			balanceAfter,
			operationType: "welcome_grant",
			description: `Welcome grant: ${ZEEPO_AI_WELCOME_TOKEN_GRANT} free tokens`,
			metadata: {
				grantType: "first_time_customer",
				grantAmount: ZEEPO_AI_WELCOME_TOKEN_GRANT,
			},
			provider: ZEEPO_AI_PROVIDER,
		});

		return {
			granted: true,
			tokensGranted: ZEEPO_AI_WELCOME_TOKEN_GRANT,
			balanceAfter: newBalance,
		};
	});
}

/** Read-only eligibility (does not grant). */
export async function checkWelcomeTokenEligibility(teamId: string): Promise<{
	eligible: boolean;
	reason?: string;
	tokensIfGranted: number;
}> {
	const tokensIfGranted = ZEEPO_AI_WELCOME_TOKEN_GRANT;

	const hasService = await teamHasQualifyingService(teamId);
	if (!hasService) {
		return { eligible: false, reason: "no_qualifying_service", tokensIfGranted };
	}

	if (await teamHasZeepoAiHistory(teamId)) {
		return { eligible: false, reason: "has_prior_usage", tokensIfGranted };
	}

	const sub = await db
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

	if (sub[0]) {
		const usage = await db.query.niscClientSubscriptionUsage.findFirst({
			where: and(
				eq(niscClientSubscriptionUsage.subscriptionId, sub[0].id),
				eq(niscClientSubscriptionUsage.usageKind, ZEEPO_AI_USAGE_KIND),
			),
			columns: { metadata: true },
		});
		const meta = (usage?.metadata ?? {}) as Record<string, unknown>;
		if (meta[FREE_TOKEN_GRANT_FLAG] === true) {
			return { eligible: false, reason: "already_granted", tokensIfGranted };
		}
	}

	return { eligible: true, tokensIfGranted };
}

export { ZEEPO_AI_WELCOME_TOKEN_GRANT };
