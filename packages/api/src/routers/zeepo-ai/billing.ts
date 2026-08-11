import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { niscProduct, niscProductPlan } from "@npanel/db/schema/products";
import { router } from "../../trpc";
import { zeepoAiProcedure } from "./procedures";
import { getBalanceSchema, listBillingActivitySchema } from "./schemas";
import {
	assertZeepoAiTeamAccess,
	getZeepoAiSubscriptionSummary,
} from "../../lib/zeepo-ai-access";
import {
	isZeepoAiAgencyUser,
	listZeepoAiTokenLedger,
} from "../../lib/zeepo-ai-tokens";
import { ZEEPO_AI_PLAN_IDS, ZEEPO_AI_PRODUCT_ID, ZEEPO_AI_WELCOME_TOKEN_GRANT } from "../../lib/zeepo-ai-billing";
import { convertPriceWithCeil } from "../../lib/convert-price";
import { checkWelcomeTokenEligibility, teamHasQualifyingService } from "../../lib/zeepo-ai-free-token-grant";

async function fetchUsdToKesRate(): Promise<number | null> {
	try {
		const resp = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
		if (!resp.ok) return null;
		const data = (await resp.json()) as { rates?: Record<string, number> };
		const rate = data.rates?.KES;
		return typeof rate === "number" && Number.isFinite(rate) ? rate : null;
	} catch {
		return null;
	}
}

export const zeepoAiBillingRouter = router({
	getTokenBalance: zeepoAiProcedure.input(getBalanceSchema).query(async ({ ctx, input }) => {
		const userId = ctx.session?.user?.id;
		if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

		const role = ctx.session?.user?.role;
		if (isZeepoAiAgencyUser(role)) {
			return {
				unlimited: true,
				tokens: null as number | null,
				hasSubscription: true,
				isAgency: true,
				walletInitialized: true,
				hasQualifyingService: true,
				welcomeEligible: false,
				welcomeTokenGrant: ZEEPO_AI_WELCOME_TOKEN_GRANT,
			};
		}

		const teamId = await assertZeepoAiTeamAccess({
			userId,
			userRole: role,
			teamId: input.teamId,
		});
		if (!teamId) {
			return {
				unlimited: false,
				tokens: 0,
				hasSubscription: false,
				isAgency: false,
				walletInitialized: false,
				hasQualifyingService: false,
				welcomeEligible: false,
				welcomeTokenGrant: ZEEPO_AI_WELCOME_TOKEN_GRANT,
			};
		}

		const [summary, hasQualifyingService, welcome] = await Promise.all([
			getZeepoAiSubscriptionSummary(teamId),
			teamHasQualifyingService(teamId),
			checkWelcomeTokenEligibility(teamId),
		]);

		return {
			unlimited: false,
			/** Always a number for customers — 0 when wallet not initialized. */
			tokens: summary.hasSubscription ? summary.tokens : 0,
			hasSubscription: summary.hasSubscription,
			subscriptionId: summary.subscriptionId,
			isAgency: false,
			walletInitialized: summary.hasSubscription,
			hasQualifyingService,
			welcomeEligible: welcome.eligible,
			welcomeTokenGrant: ZEEPO_AI_WELCOME_TOKEN_GRANT,
		};
	}),

	listTokenActivity: zeepoAiProcedure
		.input(listBillingActivitySchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

			await assertZeepoAiTeamAccess({
				userId,
				userRole: ctx.session?.user?.role,
				teamId: input.teamId,
			});

			return listZeepoAiTokenLedger({
				teamId: input.teamId,
				limit: input.limit,
			});
		}),

	listPaygPacks: zeepoAiProcedure.query(async () => {
		const packs = await db.query.niscProductPlan.findMany({
			where: and(
				eq(niscProductPlan.productId, ZEEPO_AI_PRODUCT_ID),
				eq(niscProductPlan.isActive, true),
			),
			orderBy: (t, { asc }) => [asc(t.sortOrder)],
		});

		return packs.filter((p) => {
			const meta = (p.metadata ?? {}) as { zeepoPlanType?: string };
			return (
				p.id === ZEEPO_AI_PLAN_IDS.payAsYouGo ||
				meta.zeepoPlanType === "top_up" ||
				meta.zeepoPlanType === "pay_as_you_go"
			);
		});
	}),

	/**
	 * Top-up packs for purchase UI (invoice via BuyNowDialog → nisc order).
	 * PAYG plan is hidden — wallet is bootstrapped by welcome grant / first top-up.
	 */
	listPurchasePlans: zeepoAiProcedure
		.input(z.object({ displayCurrency: z.string().default("KES") }))
		.query(async ({ input }) => {
			const product = await db.query.niscProduct.findFirst({
				where: eq(niscProduct.id, ZEEPO_AI_PRODUCT_ID),
			});
			if (!product?.isActive) {
				return { data: [] as Array<Record<string, unknown>> };
			}

			const plans = await db.query.niscProductPlan.findMany({
				where: and(
					eq(niscProductPlan.productId, ZEEPO_AI_PRODUCT_ID),
					eq(niscProductPlan.isActive, true),
				),
				orderBy: (p, { asc }) => [asc(p.sortOrder)],
			});

			let kesRate: number | null = null;
			if (input.displayCurrency === "KES") {
				kesRate = await fetchUsdToKesRate();
			}

			const data = plans
				.filter((plan) => {
					const meta = (plan.metadata ?? {}) as { zeepoPlanType?: string };
					return meta.zeepoPlanType === "top_up";
				})
				.map((plan) => {
					const meta = (plan.metadata ?? {}) as Record<string, unknown>;
					const usdPrice = Number.parseFloat(plan.price ?? "0");
					const tokenGrant =
						typeof meta.tokenGrant === "number"
							? meta.tokenGrant
							: Number.parseInt(String(meta.tokenGrant ?? "0"), 10) || 0;

					const displayPriceUsd = Number.isFinite(usdPrice) ? usdPrice : 0;
					const displayPrice =
						input.displayCurrency === "KES" && kesRate
							? convertPriceWithCeil(displayPriceUsd, "USD", "KES", kesRate)
							: displayPriceUsd;
					const displayCurrency =
						input.displayCurrency === "KES" && kesRate ? "KES" : "USD";

					return {
						id: plan.id,
						name: plan.name,
						description: plan.description,
						zeepoPlanType: "top_up",
						tokenGrant,
						billingCycle: plan.billingCycle,
						isPopular: plan.isPopular,
						isRecommended: plan.isRecommended,
						isDefault: plan.isDefault,
						highlights: plan.highlights,
						displayPrice,
						displayCurrency,
						priceUsd: displayPriceUsd,
						currencyUsd: plan.currency ?? "USD",
					};
				});

			return { data, productId: ZEEPO_AI_PRODUCT_ID, productName: product.name };
		}),
});
