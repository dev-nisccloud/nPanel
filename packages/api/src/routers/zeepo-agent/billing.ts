import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { niscProduct, niscProductPlan } from "@npanel/db/schema/products";
import { router } from "../../trpc";
import { zeepoAgentProcedure } from "./procedures";
import { ZEEPO_AI_AGENT_PRODUCT_ID } from "../../lib/zeepo-agent-billing";
import {
	getZeepoAgentTokensForTeam,
	isZeepoAgentAgencyUser,
	listZeepoAgentTokenLedger,
} from "../../lib/zeepo-agent-tokens";
import { convertPriceWithCeil } from "../../lib/convert-price";
import { assertZeepoAgentTeamAccess } from "../../lib/zeepo-agent-access";

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

const teamIdSchema = z.object({
	teamId: z.string().min(1),
});

export const zeepoAgentBillingRouter = router({
	/** Customer token balance for a team (agency users see balance but are not debited). */
	/** Live token balance from `nisc_client_subscription_usage.credits` (not the ledger audit table). */
	getTokenBalance: zeepoAgentProcedure.input(teamIdSchema).query(async ({ ctx, input }) => {
		const userId = ctx.session?.user?.id;
		if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

		await assertZeepoAgentTeamAccess({
			userId,
			userRole: ctx.session?.user?.role,
			teamId: input.teamId,
		});

		const balance = await getZeepoAgentTokensForTeam(input.teamId);
		const isAgency = isZeepoAgentAgencyUser(ctx.session?.user?.role);

		return {
			tokens: balance?.tokens ?? 0,
			hasSubscription: Boolean(balance),
			isAgency,
			unlimited: isAgency,
		};
	}),

	/** Customer-facing usage history (tokens only - no USD). */
	listTokenActivity: zeepoAgentProcedure
		.input(
			teamIdSchema.extend({
				limit: z.number().int().min(1).max(100).optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

			await assertZeepoAgentTeamAccess({
				userId,
				userRole: ctx.session?.user?.role,
				teamId: input.teamId,
			});

			const rows = await listZeepoAgentTokenLedger({
				teamId: input.teamId,
				limit: input.limit,
			});

			return { data: rows };
		}),

	/**
	 * Plans for purchase UI. Prices stored in USD; pass displayCurrency=KES to get
	 * converted retail prices using the same ceil FX strategy as domains.
	 */
	listPurchasePlans: zeepoAgentProcedure
		.input(
			z.object({
				displayCurrency: z.string().default("KES"),
			}),
		)
		.query(async ({ input }) => {
			const product = await db.query.niscProduct.findFirst({
				where: eq(niscProduct.id, ZEEPO_AI_AGENT_PRODUCT_ID),
			});
			if (!product?.isActive || product.hidden) {
				return { data: [] as Array<Record<string, unknown>> };
			}

			const plans = await db.query.niscProductPlan.findMany({
				where: and(
					eq(niscProductPlan.productId, ZEEPO_AI_AGENT_PRODUCT_ID),
					eq(niscProductPlan.isActive, true),
					eq(niscProductPlan.hidden, false),
				),
				orderBy: (p, { asc }) => [asc(p.sortOrder)],
			});

			let kesRate: number | null = null;
			if (input.displayCurrency === "KES") {
				kesRate = await fetchUsdToKesRate();
			}

			const data = plans.map((plan) => {
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
					zeepoPlanType: meta.zeepoPlanType ?? "subscription",
					tokenGrant,
					billingCycle: plan.billingCycle,
					isPopular: plan.isPopular,
					isRecommended: plan.isRecommended,
					isDefault: plan.isDefault,
					highlights: plan.highlights,
					/** Retail price for checkout display */
					displayPrice,
					displayCurrency,
					/** Stored backend price (USD) - omit from customer UI components */
					priceUsd: displayPriceUsd,
					currencyUsd: plan.currency ?? "USD",
				};
			});

			return { data, productId: ZEEPO_AI_AGENT_PRODUCT_ID, productName: product.name };
		}),
});
