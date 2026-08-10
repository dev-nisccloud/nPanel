import { TRPCError } from "@trpc/server";
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { niscProductPlan } from "@npanel/db/schema/products";
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
import { ZEEPO_AI_PLAN_IDS, ZEEPO_AI_PRODUCT_ID } from "../../lib/zeepo-ai-billing";

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
			};
		}

		const teamId = await assertZeepoAiTeamAccess({
			userId,
			userRole: role,
			teamId: input.teamId,
		});
		if (!teamId) {
			return { unlimited: false, tokens: 0, hasSubscription: false };
		}

		const summary = await getZeepoAiSubscriptionSummary(teamId);
		return {
			unlimited: false,
			tokens: summary.tokens,
			hasSubscription: summary.hasSubscription,
			subscriptionId: summary.subscriptionId,
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
});
