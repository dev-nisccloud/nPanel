import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, count, eq, gte, lte, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { niscProduct, niscProductPlan } from "@npanel/db/schema/products";
import { user } from "@npanel/db/schema/auth";
import { team } from "@npanel/db/schema/teams";
import { zeepoAiUsageEvent } from "@npanel/db/schema/zeepo-ai";
import { router } from "../../trpc";
import { zeepoAiProcedure } from "./procedures";
import {
	getBalanceSchema,
	listBillingActivitySchema,
	listUsageActivitySchema,
} from "./schemas";
import {
	assertZeepoAiTeamAccess,
	getZeepoAiSubscriptionSummary,
} from "../../lib/zeepo-ai-access";
import {
	isZeepoAiAgencyUser,
	listZeepoAiTokenLedger,
} from "../../lib/zeepo-ai-tokens";
import { ZEEPO_AI_SUPPORT_FAB_SURFACE } from "../../lib/zeepo-ai-support";
import { convertPriceWithCeil } from "../../lib/convert-price";
import {
	checkWelcomeTokenEligibility,
	teamHasQualifyingService,
} from "../../lib/zeepo-ai-free-token-grant";
import {
	ZEEPO_AI_MIN_TOKENS_TO_START,
	ZEEPO_AI_WELCOME_TOKEN_GRANT,
} from "../../lib/zeepo-ai-billing";

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

function endOfDay(d: Date): Date {
	const out = new Date(d);
	out.setHours(23, 59, 59, 999);
	return out;
}

function startOfDay(d: Date): Date {
	const out = new Date(d);
	out.setHours(0, 0, 0, 0);
	return out;
}

function buildUsageWhere(
	input: z.infer<typeof listUsageActivitySchema>,
	surface: z.infer<typeof listUsageActivitySchema>["surface"] = input.surface,
) {
	const from = startOfDay(input.from);
	const to = endOfDay(input.to);
	const conditions = [
		gte(zeepoAiUsageEvent.createdAt, from),
		lte(zeepoAiUsageEvent.createdAt, to),
	];

	if (input.provider === "anthropic") {
		conditions.push(eq(zeepoAiUsageEvent.provider, "anthropic"));
	} else if (input.provider === "google") {
		conditions.push(eq(zeepoAiUsageEvent.provider, "google"));
	}

	if (input.eventType === "other") {
		conditions.push(
			sql`${zeepoAiUsageEvent.eventType} not in ('chat_turn', 'generation', 'image_edit')`,
		);
	} else if (input.eventType !== "all") {
		conditions.push(eq(zeepoAiUsageEvent.eventType, input.eventType));
	}

	if (input.status !== "all") {
		conditions.push(eq(zeepoAiUsageEvent.status, input.status));
	}

	if (input.teamId) {
		conditions.push(eq(zeepoAiUsageEvent.teamId, input.teamId));
	}

	if (surface === "support_fab") {
		conditions.push(
			sql`coalesce(${zeepoAiUsageEvent.metadata}->>'surface','') = ${ZEEPO_AI_SUPPORT_FAB_SURFACE}`,
		);
	} else if (surface === "zeepo_ai") {
		conditions.push(
			sql`coalesce(${zeepoAiUsageEvent.metadata}->>'surface','') <> ${ZEEPO_AI_SUPPORT_FAB_SURFACE}`,
		);
	}

	return and(...conditions);
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
				minTokensToStart: ZEEPO_AI_MIN_TOKENS_TO_START,
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
				minTokensToStart: ZEEPO_AI_MIN_TOKENS_TO_START,
			};
		}

		const [summary, hasQualifyingService, welcome] = await Promise.all([
			getZeepoAiSubscriptionSummary(teamId),
			teamHasQualifyingService(teamId),
			checkWelcomeTokenEligibility(teamId),
		]);

		return {
			unlimited: false,
			/** Always a number for customers  0 when wallet not initialized. */
			tokens: summary.hasSubscription ? summary.tokens : 0,
			hasSubscription: summary.hasSubscription,
			subscriptionId: summary.subscriptionId,
			isAgency: false,
			walletInitialized: summary.hasSubscription,
			hasQualifyingService,
			welcomeEligible: welcome.eligible,
			welcomeTokenGrant: ZEEPO_AI_WELCOME_TOKEN_GRANT,
			minTokensToStart: ZEEPO_AI_MIN_TOKENS_TO_START,
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

	/**
	 * Agency ops: Claude + Google usage rolled up by user (agency) or team (customers).
	 * Sourced from zeepo_ai_usage_event (product truth), not provider Admin APIs.
	 */
	listUsageActivity: zeepoAiProcedure
		.input(listUsageActivitySchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
			if (!isZeepoAiAgencyUser(ctx.session?.user?.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Activity usage is available to agency users only.",
				});
			}

			const where = buildUsageWhere(input);
			const page = input.page;
			const limit = input.limit;
			const offset = (page - 1) * limit;
			const groupBy = input.groupBy;

			const summarySelect = {
				events: count(),
				inputTokens: sql<number>`coalesce(sum(${zeepoAiUsageEvent.inputTokens}), 0)`,
				outputTokens: sql<number>`coalesce(sum(${zeepoAiUsageEvent.outputTokens}), 0)`,
				providerCostUsdMicros: sql<number>`coalesce(sum(${zeepoAiUsageEvent.providerCostUsdMicros}), 0)`,
				tokensDebited: sql<number>`coalesce(sum(nullif(${zeepoAiUsageEvent.tokensDebited}, '')::numeric), 0)`,
				failed: sql<number>`coalesce(sum(case when ${zeepoAiUsageEvent.status} = 'failed' then 1 else 0 end), 0)`,
				avgLatencyMs: sql<number>`coalesce(avg(${zeepoAiUsageEvent.latencyMs}), 0)`,
			};

			const [
				groupedRows,
				groupCountRow,
				summaryRow,
				byProviderRows,
				byEventTypeRows,
				byModelRows,
				supportFabSummaryRow,
				zeepoSummaryRow,
			] = await Promise.all([
				groupBy === "user"
					? db
							.select({
								userId: zeepoAiUsageEvent.userId,
								userName: user.name,
								userEmail: user.email,
								events: count(),
								inputTokens: sql<number>`coalesce(sum(${zeepoAiUsageEvent.inputTokens}), 0)`,
								outputTokens: sql<number>`coalesce(sum(${zeepoAiUsageEvent.outputTokens}), 0)`,
								providerCostUsdMicros: sql<number>`coalesce(sum(${zeepoAiUsageEvent.providerCostUsdMicros}), 0)`,
								tokensDebited: sql<number>`coalesce(sum(nullif(${zeepoAiUsageEvent.tokensDebited}, '')::numeric), 0)`,
								failed: sql<number>`coalesce(sum(case when ${zeepoAiUsageEvent.status} = 'failed' then 1 else 0 end), 0)`,
								teamsTouched: sql<number>`count(distinct ${zeepoAiUsageEvent.teamId})`,
								lastAt: sql<Date>`max(${zeepoAiUsageEvent.createdAt})`,
							})
							.from(zeepoAiUsageEvent)
							.leftJoin(user, eq(zeepoAiUsageEvent.userId, user.id))
							.where(where)
							.groupBy(zeepoAiUsageEvent.userId, user.name, user.email)
							.orderBy(
								sql`coalesce(sum(${zeepoAiUsageEvent.providerCostUsdMicros}), 0) desc`,
							)
							.limit(limit)
							.offset(offset)
					: db
							.select({
								teamId: zeepoAiUsageEvent.teamId,
								teamName: team.name,
								teamSlug: team.slug,
								events: count(),
								inputTokens: sql<number>`coalesce(sum(${zeepoAiUsageEvent.inputTokens}), 0)`,
								outputTokens: sql<number>`coalesce(sum(${zeepoAiUsageEvent.outputTokens}), 0)`,
								providerCostUsdMicros: sql<number>`coalesce(sum(${zeepoAiUsageEvent.providerCostUsdMicros}), 0)`,
								tokensDebited: sql<number>`coalesce(sum(nullif(${zeepoAiUsageEvent.tokensDebited}, '')::numeric), 0)`,
								failed: sql<number>`coalesce(sum(case when ${zeepoAiUsageEvent.status} = 'failed' then 1 else 0 end), 0)`,
								usersTouched: sql<number>`count(distinct ${zeepoAiUsageEvent.userId})`,
								lastAt: sql<Date>`max(${zeepoAiUsageEvent.createdAt})`,
							})
							.from(zeepoAiUsageEvent)
							.leftJoin(team, eq(zeepoAiUsageEvent.teamId, team.id))
							.where(where)
							.groupBy(zeepoAiUsageEvent.teamId, team.name, team.slug)
							.orderBy(
								sql`coalesce(sum(${zeepoAiUsageEvent.providerCostUsdMicros}), 0) desc`,
							)
							.limit(limit)
							.offset(offset),
				groupBy === "user"
					? db
							.select({
								value: sql<number>`count(distinct ${zeepoAiUsageEvent.userId})`,
							})
							.from(zeepoAiUsageEvent)
							.where(where)
					: db
							.select({
								value: sql<number>`count(distinct ${zeepoAiUsageEvent.teamId})`,
							})
							.from(zeepoAiUsageEvent)
							.where(where),
				db.select(summarySelect).from(zeepoAiUsageEvent).where(where),
				db
					.select({
						provider: zeepoAiUsageEvent.provider,
						events: count(),
						providerCostUsdMicros: sql<number>`coalesce(sum(${zeepoAiUsageEvent.providerCostUsdMicros}), 0)`,
						inputTokens: sql<number>`coalesce(sum(${zeepoAiUsageEvent.inputTokens}), 0)`,
						outputTokens: sql<number>`coalesce(sum(${zeepoAiUsageEvent.outputTokens}), 0)`,
					})
					.from(zeepoAiUsageEvent)
					.where(where)
					.groupBy(zeepoAiUsageEvent.provider),
				db
					.select({
						eventType: zeepoAiUsageEvent.eventType,
						events: count(),
						providerCostUsdMicros: sql<number>`coalesce(sum(${zeepoAiUsageEvent.providerCostUsdMicros}), 0)`,
					})
					.from(zeepoAiUsageEvent)
					.where(where)
					.groupBy(zeepoAiUsageEvent.eventType),
				db
					.select({
						modelId: zeepoAiUsageEvent.modelId,
						provider: zeepoAiUsageEvent.provider,
						events: count(),
						providerCostUsdMicros: sql<number>`coalesce(sum(${zeepoAiUsageEvent.providerCostUsdMicros}), 0)`,
					})
					.from(zeepoAiUsageEvent)
					.where(where)
					.groupBy(zeepoAiUsageEvent.modelId, zeepoAiUsageEvent.provider)
					.orderBy(
						sql`coalesce(sum(${zeepoAiUsageEvent.providerCostUsdMicros}), 0) desc`,
					)
					.limit(8),
				db
					.select(summarySelect)
					.from(zeepoAiUsageEvent)
					.where(buildUsageWhere(input, "support_fab")),
				db
					.select(summarySelect)
					.from(zeepoAiUsageEvent)
					.where(buildUsageWhere(input, "zeepo_ai")),
			]);

			const summaryRaw = summaryRow[0];
			const total = Number(groupCountRow[0]?.value ?? 0);

			const items =
				groupBy === "user"
					? (
							groupedRows as Array<{
								userId: string;
								userName: string | null;
								userEmail: string | null;
								events: number;
								inputTokens: number;
								outputTokens: number;
								providerCostUsdMicros: number;
								tokensDebited: number;
								failed: number;
								teamsTouched: number;
								lastAt: Date;
							}>
						).map((r) => ({
							groupBy: "user" as const,
							userId: r.userId,
							userName: r.userName,
							userEmail: r.userEmail,
							teamId: null as string | null,
							teamName: null as string | null,
							teamSlug: null as string | null,
							events: Number(r.events ?? 0),
							inputTokens: Number(r.inputTokens ?? 0),
							outputTokens: Number(r.outputTokens ?? 0),
							providerCostUsd: Number(r.providerCostUsdMicros ?? 0) / 1_000_000,
							tokensDebited: Number(r.tokensDebited ?? 0),
							failed: Number(r.failed ?? 0),
							teamsTouched: Number(r.teamsTouched ?? 0),
							usersTouched: 1,
							lastAt: r.lastAt,
						}))
					: (
							groupedRows as Array<{
								teamId: string | null;
								teamName: string | null;
								teamSlug: string | null;
								events: number;
								inputTokens: number;
								outputTokens: number;
								providerCostUsdMicros: number;
								tokensDebited: number;
								failed: number;
								usersTouched: number;
								lastAt: Date;
							}>
						).map((r) => ({
							groupBy: "team" as const,
							userId: null as string | null,
							userName: null as string | null,
							userEmail: null as string | null,
							teamId: r.teamId,
							teamName: r.teamName ?? (r.teamId ? "Unknown team" : "Agency"),
							teamSlug: r.teamSlug,
							events: Number(r.events ?? 0),
							inputTokens: Number(r.inputTokens ?? 0),
							outputTokens: Number(r.outputTokens ?? 0),
							providerCostUsd: Number(r.providerCostUsdMicros ?? 0) / 1_000_000,
							tokensDebited: Number(r.tokensDebited ?? 0),
							failed: Number(r.failed ?? 0),
							teamsTouched: 1,
							usersTouched: Number(r.usersTouched ?? 0),
							lastAt: r.lastAt,
						}));

			return {
				groupBy,
				items,
				page,
				limit,
				total,
				summary: {
					events: Number(summaryRaw?.events ?? 0),
					inputTokens: Number(summaryRaw?.inputTokens ?? 0),
					outputTokens: Number(summaryRaw?.outputTokens ?? 0),
					providerCostUsd: Number(summaryRaw?.providerCostUsdMicros ?? 0) / 1_000_000,
					tokensDebited: Number(summaryRaw?.tokensDebited ?? 0),
					failed: Number(summaryRaw?.failed ?? 0),
					avgLatencyMs: Math.round(Number(summaryRaw?.avgLatencyMs ?? 0)),
					liveAiSupport: {
						events: Number(supportFabSummaryRow[0]?.events ?? 0),
						providerCostUsd:
							Number(supportFabSummaryRow[0]?.providerCostUsdMicros ?? 0) / 1_000_000,
						inputTokens: Number(supportFabSummaryRow[0]?.inputTokens ?? 0),
						outputTokens: Number(supportFabSummaryRow[0]?.outputTokens ?? 0),
					},
					zeepoAi: {
						events: Number(zeepoSummaryRow[0]?.events ?? 0),
						providerCostUsd:
							Number(zeepoSummaryRow[0]?.providerCostUsdMicros ?? 0) / 1_000_000,
						inputTokens: Number(zeepoSummaryRow[0]?.inputTokens ?? 0),
						outputTokens: Number(zeepoSummaryRow[0]?.outputTokens ?? 0),
					},
				},
				byProvider: byProviderRows.map((r) => ({
					provider: r.provider ?? "unknown",
					events: Number(r.events ?? 0),
					providerCostUsd: Number(r.providerCostUsdMicros ?? 0) / 1_000_000,
					inputTokens: Number(r.inputTokens ?? 0),
					outputTokens: Number(r.outputTokens ?? 0),
				})),
				byEventType: byEventTypeRows.map((r) => ({
					eventType: r.eventType,
					events: Number(r.events ?? 0),
					providerCostUsd: Number(r.providerCostUsdMicros ?? 0) / 1_000_000,
				})),
				byModel: byModelRows.map((r) => ({
					modelId: r.modelId ?? "unknown",
					provider: r.provider ?? "unknown",
					events: Number(r.events ?? 0),
					providerCostUsd: Number(r.providerCostUsdMicros ?? 0) / 1_000_000,
				})),
			};
		}),

	listPaygPacks: zeepoAiProcedure.query(async () => {
		const packs = await db.query.niscProductPlan.findMany({
			where: and(
				eq(niscProductPlan.productId, ZEEPO_AI_PRODUCT_ID),
				eq(niscProductPlan.isActive, true),
				eq(niscProductPlan.hidden, false),
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
	 * PAYG plan is hidden  wallet is bootstrapped by welcome grant / first top-up.
	 */
	listPurchasePlans: zeepoAiProcedure
		.input(z.object({ displayCurrency: z.string().default("KES") }))
		.query(async ({ input }) => {
			const product = await db.query.niscProduct.findFirst({
				where: eq(niscProduct.id, ZEEPO_AI_PRODUCT_ID),
			});
			if (!product?.isActive || product.hidden) {
				return { data: [] as Array<Record<string, unknown>> };
			}

			const plans = await db.query.niscProductPlan.findMany({
				where: and(
					eq(niscProductPlan.productId, ZEEPO_AI_PRODUCT_ID),
					eq(niscProductPlan.isActive, true),
					eq(niscProductPlan.hidden, false),
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
