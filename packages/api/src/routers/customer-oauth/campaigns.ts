/**
 * Campaigns for a customer-connected Meta ad account.
 * Reads live from the Marketing API with the customer OAuth token.
 */

import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { customerPlatformAsset } from "@npanel/db/schema";
import { MetaAdsClient } from "../../lib/meta-ads-client";
import { decryptToken } from "../../lib/oauth-encryption";
import { router, protectedProcedure } from "../../trpc";
import { getCustomerCampaignCharts, getCustomerCampaignDetails } from "./campaign-details";

function asNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function budgetMajor(value: unknown): number | null {
  const minor = asNumber(value);
  if (minor == null) return null;
  return minor / 100;
}

function actionValue(
  actions: Array<{ action_type?: string; value?: string }> | undefined,
  types: string[],
): number | null {
  if (!Array.isArray(actions)) return null;
  for (const type of types) {
    const match = actions.find((action) => action.action_type === type);
    const value = asNumber(match?.value);
    if (value != null) return value;
  }
  return asNumber(actions[0]?.value);
}

const RESULT_ACTION_TYPES = [
  "onsite_conversion.messaging_conversation_started_7d",
  "offsite_conversion.fb_pixel_purchase",
  "link_click",
  "inline_link_click",
];

export const customerOAuthCampaignsRouter = router({
  getDetails: getCustomerCampaignDetails,
  getCharts: getCustomerCampaignCharts,
  list: protectedProcedure
    .input(
      z.object({
        assetId: z.string().min(1),
        timeRange: z
          .object({
            since: z.string(),
            until: z.string(),
          })
          .optional(),
        publisherPlatform: z.enum(["instagram"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const asset = await ctx.db.query.customerPlatformAsset.findFirst({
        where: and(
          eq(customerPlatformAsset.id, input.assetId),
          eq(customerPlatformAsset.userId, ctx.session.user.id),
        ),
        with: { connection: true },
      });

      if (!asset || !asset.connection) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ad account not found" });
      }

      if (
        asset.assetType !== "meta_ad_account" ||
        (asset.platform !== "meta_facebook" && asset.platform !== "meta_instagram")
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This asset is not a Meta ad account",
        });
      }

      if (!asset.isActive || asset.connection.status !== "ACTIVE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This ad account is not active. Reconnect Facebook and import it again.",
        });
      }

      const accessToken = decryptToken(asset.connection.accessToken);
      const client = new MetaAdsClient({ accessToken });
      const accountId = asset.platformAssetId.startsWith("act_")
        ? asset.platformAssetId
        : `act_${asset.platformAssetId}`;

      try {
        const response = await client.getCampaigns(accountId);
        const insightsByCampaign = new Map<string, Record<string, unknown>>();
        let insightsUnavailable = false;

        try {
          const insightsResponse = await client.getInsights(accountId, {
            level: "campaign",
            timeRange: input.timeRange,
            datePreset: input.timeRange ? undefined : "last_30d",
            breakdowns: input.publisherPlatform ? ["publisher_platform"] : undefined,
            metrics: [
              "campaign_id",
              "impressions",
              "clicks",
              "spend",
              "reach",
              "ctr",
              "actions",
              "cost_per_action_type",
              "cost_per_result",
            ],
          });

          for (const row of insightsResponse.data ?? []) {
            if (input.publisherPlatform && row?.publisher_platform !== input.publisherPlatform) continue;
            if (row?.campaign_id) {
              insightsByCampaign.set(String(row.campaign_id), row);
            }
          }
        } catch (error) {
          insightsUnavailable = true;
          console.error("Failed to fetch campaign insights:", error);
        }

        const campaigns = (response.data ?? [])
          .filter(
            (campaign) =>
              !input.publisherPlatform ||
              insightsUnavailable ||
              insightsByCampaign.has(String(campaign.id)),
          )
          .map((campaign) => {
          const insight = insightsByCampaign.get(String(campaign.id));
          const actions = insight?.actions as Array<{ action_type?: string; value?: string }> | undefined;
          const costActions = insight?.cost_per_action_type as
            | Array<{ action_type?: string; value?: string }>
            | undefined;
          const dailyBudget = budgetMajor(campaign.daily_budget);
          const lifetimeBudget = budgetMajor(campaign.lifetime_budget);
          const results = actionValue(actions, RESULT_ACTION_TYPES);
          const costPerResult =
            asNumber(insight?.cost_per_result) ?? actionValue(costActions, RESULT_ACTION_TYPES);

          return {
            id: String(campaign.id),
            name: String(campaign.name ?? "Untitled campaign"),
            objective: typeof campaign.objective === "string" ? campaign.objective : "",
            status: typeof campaign.status === "string" ? campaign.status : "UNKNOWN",
            startTime: typeof campaign.start_time === "string" ? campaign.start_time : null,
            stopTime: typeof campaign.stop_time === "string" ? campaign.stop_time : null,
            budget: dailyBudget ?? lifetimeBudget,
            insights: insight
              ? {
                  reach: asNumber(insight.reach) ?? 0,
                  impressions: asNumber(insight.impressions) ?? 0,
                  clicks: asNumber(insight.clicks) ?? 0,
                  ctr: insight.ctr == null || insight.ctr === "" ? "0" : String(insight.ctr),
                  spend: asNumber(insight.spend) ?? 0,
                  results,
                  costPerResult,
                }
              : null,
          };
        });

        return { campaigns };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Customer OAuth list campaigns error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to list campaigns",
        });
      }
    }),
});
