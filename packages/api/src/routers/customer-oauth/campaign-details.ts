/**
 * Campaign details for a customer-connected Meta ad account.
 * One procedure, a handful of Graph batch calls, same payload the media-buying
 * campaign page renders.
 */

import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { customerPlatformAsset } from "@npanel/db/schema";
import { MetaAdsApiError, MetaAdsClient } from "../../lib/meta-ads-client";
import { decryptToken } from "../../lib/oauth-encryption";
import { protectedProcedure } from "../../trpc";

const CAMPAIGN_FIELDS = [
  "id",
  "name",
  "objective",
  "status",
  "daily_budget",
  "lifetime_budget",
  "budget_remaining",
  "start_time",
  "stop_time",
  "created_time",
  "updated_time",
  "account_id",
].join(",");

const ACCOUNT_FIELDS = [
  "id",
  "account_id",
  "name",
  "currency",
  "timezone_name",
  "account_status",
  "business_name",
].join(",");

const AD_SET_FIELDS = [
  "id",
  "name",
  "status",
  "daily_budget",
  "lifetime_budget",
  "budget_remaining",
  "bid_amount",
  "targeting",
  "publisher_platforms",
  "instagram_positions",
  "start_time",
  "stop_time",
  "created_time",
  "updated_time",
].join(",");

const AD_FIELDS = [
  "id",
  "name",
  "status",
  "effective_status",
  "adset_id",
  "created_time",
  "updated_time",
  "creative{thumbnail_url,title,body,image_url,name}",
].join(",");

const AD_STATUS_FILTER = JSON.stringify([
  {
    field: "effective_status",
    operator: "IN",
    value: [
      "ACTIVE",
      "PAUSED",
      "PENDING_REVIEW",
      "DISAPPROVED",
      "PREAPPROVED",
      "PENDING_BILLING_INFO",
      "CAMPAIGN_PAUSED",
      "ADSET_PAUSED",
      "IN_PROCESS",
      "WITH_ISSUES",
      "ARCHIVED",
    ],
  },
]);

const SUMMARY_METRICS = [
  "impressions",
  "clicks",
  "spend",
  "reach",
  "frequency",
  "ctr",
  "cpc",
  "cpm",
  "cpp",
  "unique_clicks",
  "unique_ctr",
  "purchase_roas",
  "quality_ranking",
  "engagement_rate_ranking",
  "conversion_rate_ranking",
  "inline_link_click_ctr",
  "cost_per_result",
  "cost_per_action_type",
  "actions",
];

const DAILY_METRICS = [
  "impressions",
  "clicks",
  "inline_link_clicks",
  "spend",
  "reach",
  "frequency",
  "ctr",
  "cpc",
  "unique_clicks",
  "unique_ctr",
  "purchase_roas",
  "quality_ranking",
  "engagement_rate_ranking",
  "conversion_rate_ranking",
  "video_p25_watched_actions",
  "video_p50_watched_actions",
  "video_p75_watched_actions",
  "video_p100_watched_actions",
  "date_start",
  "date_stop",
  "actions",
];

const BREAKDOWN_METRICS = ["impressions", "clicks", "spend", "date_start", "date_stop"];

type BatchItem = {
  name: string;
  path: string;
  query?: Record<string, string | number | undefined | null>;
};

type BatchResult =
  | { ok: true; data: any }
  | { ok: false; error: string; code?: number };

function bareAccountId(value: string): string {
  return value.replace(/^act_/, "");
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatBudget(budget: string | number | null | undefined): string | null {
  if (budget === null || budget === undefined || budget === "") return null;
  const num = typeof budget === "string" ? Number.parseFloat(budget) : budget;
  if (!Number.isFinite(num)) return null;
  return String(num / 100);
}

function textMetric(value: unknown): string | null {
  if (value == null || value === "") return null;
  return String(value);
}

function actionValue(
  actions: Array<{ action_type?: string; value?: string }> | undefined,
  types: string[],
): string | null {
  if (!Array.isArray(actions)) return null;
  const match = actions.find((action) => action.action_type && types.includes(action.action_type));
  return match?.value ? String(match.value) : null;
}

function formatInsights(insights: any) {
  if (!insights) return null;
  const actions = Array.isArray(insights.actions) ? insights.actions : [];
  const costs = Array.isArray(insights.cost_per_action_type) ? insights.cost_per_action_type : [];
  return {
    reach: textMetric(insights.reach),
    impressions: textMetric(insights.impressions),
    clicks: textMetric(insights.clicks),
    link_clicks: actionValue(actions, ["link_click", "inline_link_click"]),
    cpc: textMetric(insights.cpc),
    ctr: textMetric(insights.ctr),
    spend: textMetric(insights.spend),
    cpm: textMetric(insights.cpm),
    cpp: textMetric(insights.cpp),
    frequency: textMetric(insights.frequency),
    unique_clicks: textMetric(insights.unique_clicks),
    unique_ctr: textMetric(insights.unique_ctr),
    purchase_roas: insights.purchase_roas || null,
    quality_ranking: insights.quality_ranking || null,
    engagement_rate_ranking: insights.engagement_rate_ranking || null,
    conversion_rate_ranking: insights.conversion_rate_ranking || null,
    cost_per_result:
      textMetric(insights.cost_per_result) ??
      actionValue(costs, [
        "onsite_conversion.messaging_conversation_started_7d",
        "link_click",
        "offsite_conversion.fb_pixel_purchase",
      ]) ??
      (costs[0]?.value ? String(costs[0].value) : null),
    leads: actionValue(actions, ["lead"]),
    cost_per_lead: actionValue(costs, ["lead"]),
    actions,
  };
}

function mapStatus(status: string | undefined): string {
  const upper = (status || "ACTIVE").toUpperCase();
  if (upper === "ACTIVE" || upper === "PAUSED" || upper === "ARCHIVED" || upper === "DELETED") {
    return upper;
  }
  return upper;
}

function rowsOf(result: BatchResult | undefined): any[] {
  if (!result?.ok) return [];
  return Array.isArray(result.data?.data) ? result.data.data : [];
}

function nextCursor(result: BatchResult | undefined, limit: number): string | null {
  if (!result?.ok) return null;
  const rows = rowsOf(result);
  const after = result.data?.paging?.cursors?.after;
  if (!after || rows.length < limit) return null;
  return String(after);
}

function failureMessage(result: BatchResult | undefined): string | undefined {
  return result && !result.ok ? result.error : undefined;
}

function insightSlice(result: BatchResult | undefined) {
  if (!result) return { success: false, data: [] as any[], error: "Missing response" };
  if (!result.ok) return { success: false, data: [] as any[], error: result.error };
  return { success: true, data: rowsOf(result) };
}

function indexBy(rows: any[], key: string): Record<string, any> {
  const map: Record<string, any> = {};
  for (const row of rows) {
    if (row?.[key]) map[String(row[key])] = row;
  }
  return map;
}

function isRateLimit(result: BatchResult | undefined): boolean {
  if (!result || result.ok) return false;
  return result.code === 4 || result.code === 17 || result.code === 32 || result.code === 613;
}

async function batchPages(
  client: MetaAdsClient,
  items: BatchItem[],
  limitByName: Record<string, number>,
): Promise<Map<string, BatchResult>> {
  const collected = new Map<string, any[]>();
  let pending = items;

  for (let page = 0; page < 4 && pending.length > 0; page += 1) {
    const batch = await client.batchGet(pending);
    const next: BatchItem[] = [];

    for (const item of pending) {
      const result = batch.get(item.name);
      if (!result) continue;
      if (page === 0 && !result.ok) {
        collected.set(item.name, result as any);
        continue;
      }
      if (!result.ok) continue;
      const existing = collected.get(item.name);
      const previousRows = Array.isArray(existing) ? existing : [];
      collected.set(item.name, previousRows.concat(rowsOf(result)));
      const limit = limitByName[item.name] ?? 500;
      const after = nextCursor(result, limit);
      if (after) {
        next.push({
          ...item,
          query: { ...item.query, after, limit },
        });
      }
    }

    pending = next;
  }

  const results = new Map<string, BatchResult>();
  for (const item of items) {
    const value = collected.get(item.name);
    if (value && !Array.isArray(value) && value.ok === false) {
      results.set(item.name, value);
      continue;
    }
    results.set(item.name, { ok: true, data: { data: Array.isArray(value) ? value : [] } });
  }
  return results;
}

const detailsInput = z.object({
  assetId: z.string().min(1),
  campaignId: z.string().min(1),
  timeRange: z
    .object({
      since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    })
    .optional(),
  publisherPlatform: z.enum(["instagram"]).optional(),
});

function withPublisherBreakdown(
  query: Record<string, unknown>,
  publisherPlatform?: "instagram",
  breakdowns: string[] = [],
) {
  if (!publisherPlatform) {
    return breakdowns.length > 0 ? { ...query, breakdowns: breakdowns.join(",") } : query;
  }
  const fields = [...new Set(["publisher_platform", ...breakdowns])];
  return { ...query, breakdowns: fields.join(",") };
}

function rowsForPublisher(rows: any[], publisherPlatform?: "instagram") {
  if (!publisherPlatform) return rows;
  return rows.filter((row) => row?.publisher_platform === publisherPlatform);
}

async function openCampaign(
  ctx: { db: any; session: { user: { id: string } } },
  input: { assetId: string; campaignId: string; timeRange?: { since: string; until: string } },
) {
  const asset = await ctx.db.query.customerPlatformAsset.findFirst({
    where: and(
      eq(customerPlatformAsset.id, input.assetId),
      eq(customerPlatformAsset.userId, ctx.session.user.id),
    ),
    with: { connection: true },
  });

  if (!asset?.connection) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Ad account not found" });
  }
  if (
    asset.assetType !== "meta_ad_account" ||
    (asset.platform !== "meta_facebook" && asset.platform !== "meta_instagram")
  ) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This asset is not a Meta ad account" });
  }
  if (!asset.isActive || asset.connection.status !== "ACTIVE") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This ad account is not active. Reconnect Facebook and import it again.",
    });
  }

  const accessToken = decryptToken(asset.connection.accessToken);
  const client = new MetaAdsClient({
    accessToken,
    apiVersion:
      process.env.CUSTOMER_OAUTH_META_API_VERSION || process.env.META_API_VERSION || "v24.0",
  });
  const accountId = asset.platformAssetId.startsWith("act_")
    ? asset.platformAssetId
    : `act_${asset.platformAssetId}`;

  let header: Map<string, BatchResult>;
  try {
    header = await client.batchGet([
      { name: "campaign", path: `/${input.campaignId}`, query: { fields: CAMPAIGN_FIELDS } },
      { name: "account", path: `/${accountId}`, query: { fields: ACCOUNT_FIELDS } },
    ]);
  } catch (error) {
    throw toTrpcError(error, "Failed to load campaign");
  }

  const campaignResult = header.get("campaign");
  if (!campaignResult?.ok) {
    if (isRateLimit(campaignResult)) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Meta Ads API rate limit reached. Please wait a moment and try again.",
      });
    }
    throw new TRPCError({
      code: "NOT_FOUND",
      message: campaignResult?.error || "Campaign not found or you don't have access to it.",
    });
  }

  const campaignRaw = campaignResult.data;
  const campaignAccount = bareAccountId(String(campaignRaw.account_id ?? ""));
  if (campaignAccount && campaignAccount !== bareAccountId(accountId)) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Campaign not found or you don't have access to it.",
    });
  }

  const today = todayUtc();
  const requested = input.timeRange;
  let timeRange: { since: string; until: string };
  if (requested?.since && requested?.until) {
    const since = requested.since <= requested.until ? requested.since : requested.until;
    const untilRaw = requested.since <= requested.until ? requested.until : requested.since;
    const until = untilRaw > today ? today : untilRaw;
    timeRange = { since: since > until ? until : since, until };
  } else {
    const chartSince = campaignRaw.start_time
      ? String(campaignRaw.start_time).split("T")[0]
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    timeRange = {
      since: chartSince > today ? today : chartSince,
      until: today,
    };
  }
  const summaryWindow =
    requested || campaignRaw.start_time
      ? { time_range: JSON.stringify({ since: timeRange.since, until: timeRange.until }) }
      : { date_preset: "maximum" };
  const insightLimit = 500;
  const chartQuery = {
    time_range: JSON.stringify(timeRange),
    limit: insightLimit,
  };

  return {
    asset,
    client,
    accountId,
    campaignRaw,
    accountRaw: header.get("account")?.ok ? header.get("account")!.data : null,
    timeRange,
    summaryWindow,
    chartQuery,
    insightLimit,
    listLimit: 200,
  };
}

function chartBatchItems(
  campaignId: string,
  chartQuery: { time_range: string; limit: number },
  publisherPlatform?: "instagram",
): BatchItem[] {
  return [
    {
      name: "daily",
      path: `/${campaignId}/insights`,
      query: withPublisherBreakdown(
        {
          level: "campaign",
          fields: DAILY_METRICS.join(","),
          time_increment: 1,
          ...chartQuery,
        },
        publisherPlatform,
      ),
    },
    breakdownItem("gender", campaignId, ["gender"], chartQuery, publisherPlatform),
    breakdownItem("platform", campaignId, ["publisher_platform"], chartQuery, publisherPlatform),
    breakdownItem("device", campaignId, ["publisher_platform", "device_platform"], chartQuery, publisherPlatform),
    breakdownItem("region", campaignId, ["region"], chartQuery, publisherPlatform),
    breakdownItem("placement", campaignId, ["publisher_platform", "platform_position"], chartQuery, publisherPlatform),
    breakdownItem("age", campaignId, ["age"], chartQuery, publisherPlatform),
    breakdownItem("hourly", campaignId, ["hourly_stats_aggregated_by_audience_time_zone"], chartQuery, publisherPlatform),
  ];
}

export const getCustomerCampaignDetails = protectedProcedure
  .input(detailsInput)
  .query(async ({ ctx, input }) => {
    const opened = await openCampaign(ctx, input);
    const { asset, client, accountId, campaignRaw, accountRaw, timeRange, summaryWindow, chartQuery, insightLimit, listLimit } = opened;

    let details: Map<string, BatchResult>;
    try {
      details = await batchPages(
        client,
        [
          {
            name: "campaignInsights",
            path: `/${input.campaignId}/insights`,
            query: withPublisherBreakdown(
              {
                level: "campaign",
                fields: SUMMARY_METRICS.join(","),
                limit: 25,
                ...summaryWindow,
              },
              input.publisherPlatform,
            ),
          },
          {
            name: "adSets",
            path: `/${input.campaignId}/adsets`,
            query: { fields: AD_SET_FIELDS, limit: listLimit },
          },
          {
            name: "adSetInsights",
            path: `/${input.campaignId}/insights`,
            query: withPublisherBreakdown(
              {
                level: "adset",
                fields: ["adset_id", ...SUMMARY_METRICS].join(","),
                ...chartQuery,
              },
              input.publisherPlatform,
            ),
          },
          {
            name: "ads",
            path: `/${input.campaignId}/ads`,
            query: { fields: AD_FIELDS, filtering: AD_STATUS_FILTER, limit: listLimit },
          },
          {
            name: "adInsights",
            path: `/${input.campaignId}/insights`,
            query: withPublisherBreakdown(
              {
                level: "ad",
                fields: ["ad_id", ...SUMMARY_METRICS].join(","),
                ...chartQuery,
              },
              input.publisherPlatform,
            ),
          },
        ],
        {
          campaignInsights: 25,
          adSets: listLimit,
          adSetInsights: insightLimit,
          ads: listLimit,
          adInsights: insightLimit,
        },
      );
    } catch (error) {
      throw toTrpcError(error, "Failed to load campaign details");
    }

    const adsResult = details.get("ads");
    if (adsResult && !adsResult.ok) {
      try {
        const fallback = await client.getAds(input.campaignId, {
          fields: [
            "id",
            "name",
            "status",
            "effective_status",
            "adset_id",
            "created_time",
            "updated_time",
            "creative",
          ],
          filtering: JSON.parse(AD_STATUS_FILTER),
          limit: listLimit,
        });
        details.set("ads", { ok: true, data: fallback });
      } catch (error) {
        console.warn("Ad list fallback failed:", error);
      }
    }

    const adSetInsightRows = rowsForPublisher(rowsOf(details.get("adSetInsights")), input.publisherPlatform);
    const adInsightRows = rowsForPublisher(rowsOf(details.get("adInsights")), input.publisherPlatform);
    const adSetInsights = indexBy(adSetInsightRows, "adset_id");
    const adInsights = indexBy(adInsightRows, "ad_id");
    const adSetRows = rowsOf(details.get("adSets")).filter((adSet) => {
      if (!input.publisherPlatform) return true;
      if (adSetInsights[String(adSet.id)]) return true;
      const platforms = Array.isArray(adSet.publisher_platforms) ? adSet.publisher_platforms : null;
      if (!platforms || platforms.length === 0) return true;
      return platforms.includes(input.publisherPlatform);
    });
    const adSetIds = new Set(adSetRows.map((adSet) => String(adSet.id)));
    const adRows = rowsOf(details.get("ads")).filter((ad) => {
      if (!input.publisherPlatform) return true;
      const adSetId = String(ad.adset_id || ad.adset?.id || "");
      return adSetIds.has(adSetId);
    });

    const targeting = await loadTargetingLines(
      client,
      adSetRows.map((adSet) => String(adSet.id)).filter(Boolean),
    );

    return {
      success: true as const,
      timeRange,
      campaign: {
        success: true as const,
        data: {
          ...campaignRaw,
          daily_budget: formatBudget(campaignRaw.daily_budget),
          lifetime_budget: formatBudget(campaignRaw.lifetime_budget),
          budget_remaining: formatBudget(campaignRaw.budget_remaining),
          insights: formatInsights(
            rowsForPublisher(rowsOf(details.get("campaignInsights")), input.publisherPlatform)[0],
          ),
        },
      },
      account: {
        success: true as const,
        data: {
          id: accountRaw?.id || accountId,
          account_id: accountRaw?.account_id || bareAccountId(accountId),
          name: accountRaw?.name || asset.name,
          currency: accountRaw?.currency || asset.currency || "USD",
          timezone_name: accountRaw?.timezone_name || asset.timezone || null,
          business_name: accountRaw?.business_name || asset.businessName || null,
          account_status: accountRaw?.account_status ?? null,
        },
      },
      adSets: {
        success: details.get("adSets")?.ok === true,
        error: failureMessage(details.get("adSets")),
        data: adSetRows.map((adSet) => ({
          id: adSet.id,
          name: adSet.name || `Ad Set ${adSet.id}`,
          ad_set_name: adSet.name || `Ad Set ${adSet.id}`,
          status: mapStatus(adSet.status),
          daily_budget: formatBudget(adSet.daily_budget),
          lifetime_budget: formatBudget(adSet.lifetime_budget),
          budget_remaining: formatBudget(adSet.budget_remaining),
          bid_amount: adSet.bid_amount || null,
          targeting: adSet.targeting || null,
          publisher_platforms: adSet.publisher_platforms || null,
          instagram_positions: adSet.instagram_positions || null,
          start_time: adSet.start_time || null,
          stop_time: adSet.stop_time || null,
          created_time: adSet.created_time || null,
          updated_time: adSet.updated_time || null,
          insights: formatInsights(adSetInsights[String(adSet.id)]),
        })),
      },
      ads: {
        success: details.get("ads")?.ok === true,
        error: failureMessage(details.get("ads")),
        data: adRows.map((ad) => ({
          id: ad.id,
          adset_id: ad.adset_id || ad.adset?.id || null,
          name: ad.name || `Ad ${ad.id}`,
          ad_name: ad.name || `Ad ${ad.id}`,
          status: mapStatus(ad.effective_status || ad.status),
          creative: ad.creative || null,
          created_time: ad.created_time || null,
          updated_time: ad.updated_time || null,
          insights: formatInsights(adInsights[String(ad.id)]),
        })),
      },
      targeting: { data: targeting },
    };
  });

export const getCustomerCampaignCharts = protectedProcedure
  .input(detailsInput)
  .query(async ({ ctx, input }) => {
    const { client, timeRange, chartQuery, insightLimit } = await openCampaign(ctx, input);
    let charts: Map<string, BatchResult>;
    try {
      charts = await batchPages(client, chartBatchItems(input.campaignId, chartQuery, input.publisherPlatform), {
        daily: insightLimit,
        gender: insightLimit,
        platform: insightLimit,
        device: insightLimit,
        region: insightLimit,
        placement: insightLimit,
        age: insightLimit,
        hourly: insightLimit,
      });
    } catch (error) {
      throw toTrpcError(error, "Failed to load campaign charts");
    }

    const sliced = (name: string) => {
      const slice = insightSlice(charts.get(name));
      return {
        ...slice,
        data: rowsForPublisher(slice.data, input.publisherPlatform),
      };
    };

    return {
      success: true as const,
      timeRange,
      dailyPerformance: sliced("daily"),
      gender: sliced("gender"),
      platform: sliced("platform"),
      device: sliced("device"),
      region: sliced("region"),
      placement: sliced("placement"),
      age: sliced("age"),
      hourly: sliced("hourly"),
    };
  });

function breakdownItem(
  name: string,
  campaignId: string,
  breakdowns: string[],
  chartQuery: { time_range: string; limit: number },
  publisherPlatform?: "instagram",
): BatchItem {
  return {
    name,
    path: `/${campaignId}/insights`,
    query: withPublisherBreakdown(
      {
        level: "campaign",
        fields: BREAKDOWN_METRICS.join(","),
        ...chartQuery,
      },
      publisherPlatform,
      breakdowns,
    ),
  };
}

async function loadTargetingLines(client: MetaAdsClient, adSetIds: string[]) {
  const targeting: Record<string, Array<{ content?: string; children?: string[] }>> = {};
  if (adSetIds.length === 0) return targeting;

  try {
    const batch = await client.batchGet(
      adSetIds.map((id) => ({
        name: id,
        path: `/${id}/targetingsentencelines`,
      })),
    );
    for (const id of adSetIds) {
      const result = batch.get(id);
      targeting[id] = result?.ok ? result.data?.targetingsentencelines || [] : [];
    }
  } catch (error) {
    console.warn("Failed to load targeting sentence lines:", error);
    for (const id of adSetIds) targeting[id] = [];
  }
  return targeting;
}

function toTrpcError(error: unknown, fallback: string): TRPCError {
  if (error instanceof TRPCError) return error;
  if (error instanceof MetaAdsApiError) {
    const rateLimited = error.code === 4 || error.code === 17 || error.code === 32 || error.code === 613;
    return new TRPCError({
      code: rateLimited ? "TOO_MANY_REQUESTS" : "INTERNAL_SERVER_ERROR",
      message: rateLimited
        ? "Meta Ads API rate limit reached. Please wait a moment and try again."
        : error.message || fallback,
    });
  }
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: error instanceof Error ? error.message : fallback,
  });
}
