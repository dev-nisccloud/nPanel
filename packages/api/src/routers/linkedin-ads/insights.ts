import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../../trpc";
import { LinkedInAdsClient } from "../../lib/linkedin-ads-client";
import { getStoredLinkedInAccessTokenForSession } from "../../lib/linkedin-credentials";
import { request } from "undici";

const LI_BASE = "https://api.linkedin.com";
const LI_VERSION =
  process.env.LINKEDIN_MARKETING_API_VERSION || process.env.LINKEDIN_API_VERSION || "202603";

function liHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "LinkedIn-Version": LI_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
  };
}

async function callLinkedInV2(
  accessToken: string,
  path: string,
  params: Record<string, string | number> = {}
): Promise<any> {
  const url = new URL(`${LI_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  const { statusCode, body } = await request(url.toString(), {
    method: "GET",
    headers: liHeaders(accessToken),
  });

  const text = await body.text();
  if (statusCode >= 400) {
    throw new Error(`LinkedIn API ${statusCode} on ${path}: ${text}`);
  }
  return JSON.parse(text);
}

function humanizeCompanySize(pivotValue: string): string {
  // LinkedIn returns enum tokens like SIZE_2_TO_10, SIZE_10001_OR_MORE, SIZE_1
  const v = pivotValue.toUpperCase();
  if (!v.startsWith("SIZE_")) return pivotValue;
  const raw = v.replace(/^SIZE_/, "");
  if (raw === "1") return "1 employee";
  if (raw.endsWith("_OR_MORE")) {
    const num = raw.replace("_OR_MORE", "");
    return `${num.replace(/_/g, ",")}+ employees`;
  }
  const m = raw.match(/^(\d+)_TO_(\d+)$/);
  if (m) return `${Number(m[1]).toLocaleString()}–${Number(m[2]).toLocaleString()} employees`;
  return raw.replace(/_/g, " ");
}

function pivotRawFromElem(elem: any): string {
  const pv = Array.isArray(elem?.pivotValues) ? elem.pivotValues[0] : elem?.pivotValue;
  if (!pv) return "Unknown";
  return String(pv);
}

function pivotIdFromRaw(raw: string): string {
  if (!raw) return "Unknown";
  return raw.startsWith("urn:li:") ? raw.split(":").pop() || raw : raw;
}

async function batchGetV2NamesByIds(args: {
  accessToken: string;
  endpointPath: string; // e.g. "/v2/industries"
  ids: string[];
  localeParam?: { key: string; value: string }[]; // e.g. [{key:"locale", value:"en_US"}]
}): Promise<Record<string, string>> {
  const { accessToken, endpointPath, ids, localeParam } = args;
  if (ids.length === 0) return {};

  // IMPORTANT: keep ids=List(...) syntax raw (not URLSearchParams-encoded)
  const base = new URL(`${LI_BASE}${endpointPath}`);
  for (const p of localeParam || []) base.searchParams.set(p.key, p.value);
  const rawIds = `ids=List(${ids.slice(0, 100).join(",")})`;
  const urlStr = base.toString() + (base.search ? "&" : "?") + rawIds;

  const { statusCode, body } = await request(urlStr, { method: "GET", headers: liHeaders(accessToken) });
  const text = await body.text();
  if (statusCode >= 400) {
    throw new Error(`LinkedIn API ${statusCode} on ${endpointPath} batch get: ${text}`);
  }
  const data = JSON.parse(text);

  const out: Record<string, string> = {};
  for (const [id, ent] of Object.entries<any>(data?.results || {})) {
    const loc = ent?.name?.localized;
    const name = loc?.en_US ?? loc?.[Object.keys(loc || {})[0]];
    if (name) out[String(id)] = String(name);
  }
  return out;
}

async function resolveAdTargetingEntitiesByUrns(args: {
  accessToken: string;
  urns: string[]; // full urns like urn:li:industry:406
}): Promise<Record<string, string>> {
  const { accessToken, urns } = args;
  if (urns.length === 0) return {};

  // Docs: /rest/adTargetingEntities?q=urns&queryVersion=QUERY_USES_URNS&urns=List(<encoded URNs>)&locale=(language:en,country:US)
  const base = new URL(`${LI_BASE}/rest/adTargetingEntities`);
  base.searchParams.set("q", "urns");
  base.searchParams.set("queryVersion", "QUERY_USES_URNS");
  base.searchParams.set("locale", "(language:en,country:US)");

  const encodedUrns = urns.slice(0, 100).map((u) => encodeURIComponent(u));
  const rawUrns = `urns=List(${encodedUrns.join(",")})`;
  const urlStr = base.toString() + (base.search ? "&" : "?") + rawUrns;

  const { statusCode, body } = await request(urlStr, { method: "GET", headers: liHeaders(accessToken) });
  const text = await body.text();
  if (statusCode >= 400) {
    throw new Error(`LinkedIn API ${statusCode} on /rest/adTargetingEntities: ${text}`);
  }

  const data = JSON.parse(text);
  const out: Record<string, string> = {};

  const elements: any[] = Array.isArray(data?.elements) ? data.elements : Array.isArray(data?.results) ? data.results : [];
  for (const el of elements) {
    const urn: string = (el as any)?.urn ?? (el as any)?.$URN ?? "";
    const id = urn ? urn.split(":").pop() : "";
    const name =
      (typeof (el as any)?.name === "string" && (el as any).name) ||
      (el as any)?.name?.localized?.en_US ||
      (el as any)?.name?.localized?.[Object.keys((el as any)?.name?.localized || {})[0]] ||
      (el as any)?.localizedName ||
      "";
    if (id && name) out[String(id)] = String(name);
  }
  return out;
}

async function getUserIntegration(userId: string, role?: string | null) {
  const tokenData = await getStoredLinkedInAccessTokenForSession({ userId, role });
  if (!tokenData) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No active LinkedIn integration found. Please connect your account first.",
    });
  }
  return tokenData;
}

function formatDateForLinkedIn(date: Date): { year: number; month: number; day: number } {
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

function dateFromLinkedInRangeStart(v: any): string | null {
  const y = v?.year;
  const m = v?.month;
  const d = v?.day;
  if (!y || !m || !d) return null;
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

function pivotLabelFromElem(elem: any): string {
  return pivotIdFromRaw(pivotRawFromElem(elem));
}

export const linkedInAdsInsightsRouter = router({
  /**
   * Daily time series for a campaign group (LinkedIn "campaign group details" page)
   * Uses adAnalytics with timeGranularity=DAILY and pivot=CAMPAIGN_GROUP.
   */
  getDailyPerformance: protectedProcedure
    .input(
      z.object({
        accountId: z.string().min(1),
        campaignGroupId: z.string().min(1),
        timeRange: z.object({
          since: z.string().min(1), // YYYY-MM-DD
          until: z.string().min(1), // YYYY-MM-DD
        }),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const userId = ctx.session?.user?.id;
        if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

        const { accessToken } = await getUserIntegration(userId, ctx.session?.user?.role);
        const client = new LinkedInAdsClient({ accessToken });

        const startDate = new Date(input.timeRange.since);
        const endDate = new Date(input.timeRange.until);

        const analytics = await client.getAnalytics({
          dateRange: { start: formatDateForLinkedIn(startDate), end: formatDateForLinkedIn(endDate) },
          accounts: [input.accountId],
          campaignGroups: [input.campaignGroupId],
          timeGranularity: "DAILY",
          fields: [
            "dateRange",
            "pivotValues",
            "impressions",
            "clicks",
            "costInLocalCurrency",
            "externalWebsiteConversions",
            "oneClickLeads",
            "videoViews",
            "videoCompletions",
            "landingPageClicks",
            "totalEngagements",
          ],
          pivots: [{ pivot: "CAMPAIGN_GROUP" }],
        });

        const byDate = new Map<
          string,
          {
            date: string;
            impressions: number;
            clicks: number;
            spend: number;
            conversions: number;
            leads: number;
            landingPageClicks: number;
            engagements: number;
            videoViews: number;
            videoCompletions: number;
          }
        >();

        for (const elem of analytics.elements || []) {
          const date = dateFromLinkedInRangeStart(elem?.dateRange?.start);
          if (!date) continue;

          const acc =
            byDate.get(date) || {
              date,
              impressions: 0,
              clicks: 0,
              spend: 0,
              conversions: 0,
              leads: 0,
              landingPageClicks: 0,
              engagements: 0,
              videoViews: 0,
              videoCompletions: 0,
            };

          acc.impressions += Number((elem as any).impressions || 0);
          acc.clicks += Number((elem as any).clicks || 0);
          acc.spend += Number((elem as any).costInLocalCurrency || 0);
          acc.conversions += Number((elem as any).externalWebsiteConversions || 0);
          acc.leads += Number((elem as any).oneClickLeads || 0);
          acc.landingPageClicks += Number((elem as any).landingPageClicks || 0);
          acc.engagements += Number((elem as any).totalEngagements || 0);
          acc.videoViews += Number((elem as any).videoViews || 0);
          acc.videoCompletions += Number((elem as any).videoCompletions || 0);

          byDate.set(date, acc);
        }

        const data = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));

        return {
          success: true,
          data,
          meta: { retrieved_at: new Date().toISOString(), points: data.length },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch LinkedIn daily performance",
        });
      }
    }),

  /**
   * Breakdowns using official pivot enums (device, placement, serving location, objective, demographics, etc.)
   * Uses adAnalytics timeGranularity=ALL.
   */
  getBreakdown: protectedProcedure
    .input(
      z.object({
        accountId: z.string().min(1),
        campaignGroupId: z.string().min(1),
        timeRange: z.object({
          since: z.string().min(1),
          until: z.string().min(1),
        }),
        pivot: z.enum([
          "IMPRESSION_DEVICE_TYPE",
          "PLACEMENT_NAME",
          "SERVING_LOCATION",
          "CAMPAIGN",
          "CREATIVE",
          "OBJECTIVE_TYPE",
          "MEMBER_COMPANY_SIZE",
          "MEMBER_INDUSTRY",
          "MEMBER_SENIORITY",
          "MEMBER_JOB_TITLE",
          "MEMBER_JOB_FUNCTION",
          "MEMBER_COUNTRY_V2",
          "MEMBER_REGION_V2",
          "MEMBER_COMPANY",
        ]),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const userId = ctx.session?.user?.id;
        if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

        const { accessToken } = await getUserIntegration(userId, ctx.session?.user?.role);
        const client = new LinkedInAdsClient({ accessToken });

        const startDate = new Date(input.timeRange.since);
        const endDate = new Date(input.timeRange.until);

        // NOTE: Objective type pivot is only documented for Statistics finder.
        if (input.pivot === "OBJECTIVE_TYPE") {
          // Minimal implementation: use analytics pivot fallback (LinkedIn may reject this pivot in analytics finder).
          // If rejected in practice, we will add a dedicated `getStatistics` client method.
          const analytics = await client.getAnalytics({
            dateRange: { start: formatDateForLinkedIn(startDate), end: formatDateForLinkedIn(endDate) },
            accounts: [input.accountId],
            campaignGroups: [input.campaignGroupId],
            timeGranularity: "ALL",
            fields: ["pivotValues", "impressions", "clicks", "costInLocalCurrency"],
            pivots: [{ pivot: "OBJECTIVE_TYPE" }],
          });

          const rows = (analytics.elements || []).map((e: any) => ({
            pivot: pivotLabelFromElem(e),
            impressions: Number(e.impressions || 0),
            clicks: Number(e.clicks || 0),
            spend: Number(e.costInLocalCurrency || 0),
          }));

          return { success: true, data: rows, meta: { retrieved_at: new Date().toISOString(), pivot: input.pivot } };
        }

        const analytics = await client.getAnalytics({
          dateRange: { start: formatDateForLinkedIn(startDate), end: formatDateForLinkedIn(endDate) },
          accounts: [input.accountId],
          campaignGroups: [input.campaignGroupId],
          timeGranularity: "ALL",
          fields: [
            "pivotValues",
            "impressions",
            "clicks",
            "costInLocalCurrency",
            "externalWebsiteConversions",
            "oneClickLeads",
            "videoViews",
          ],
          pivots: [{ pivot: input.pivot }],
        });

        let elements = analytics.elements || [];

        // LinkedIn professional demographic pivots can return an empty response due to
        // privacy thresholds / delayed availability / facet restrictions. If we get
        // an empty response for MEMBER_* pivots, retry at the account level so the UI
        // can still show something useful (and we can confirm the pivot works).
        let fallbackUsed = false;
        if (elements.length === 0 && input.pivot.startsWith("MEMBER_")) {
          const retry = await client.getAnalytics({
            dateRange: { start: formatDateForLinkedIn(startDate), end: formatDateForLinkedIn(endDate) },
            accounts: [input.accountId],
            timeGranularity: "ALL",
            fields: [
              "pivotValues",
              "impressions",
              "clicks",
              "costInLocalCurrency",
              "externalWebsiteConversions",
              "oneClickLeads",
              "videoViews",
            ],
            pivots: [{ pivot: input.pivot }],
          });
          elements = retry.elements || [];
          fallbackUsed = elements.length > 0;
        }

        // -------------------------------------------------------------------
        // Resolve pivot IDs to human-readable names where possible (docs recommend
        // resolving pivotValues URNs/ids via standardized-data and URN resolution APIs).
        // -------------------------------------------------------------------

        const uniqueIds = Array.from(
          new Set(elements.map((e: any) => pivotIdFromRaw(pivotRawFromElem(e))).filter(Boolean))
        );

        let idToName: Record<string, string> = {};

        if (input.pivot === "MEMBER_SENIORITY") {
          const res = await callLinkedInV2(accessToken, "/v2/seniorities", { start: 0, count: 100 });
          for (const ent of res?.elements || []) {
            const name = ent?.name?.localized?.en_US ?? ent?.name?.localized?.[Object.keys(ent?.name?.localized || {})[0]];
            if (ent?.id !== undefined && name) idToName[String(ent.id)] = String(name);
          }
        } else if (input.pivot === "MEMBER_JOB_FUNCTION") {
          const res = await callLinkedInV2(accessToken, "/v2/functions", { locale: "en_US", start: 0, count: 100 });
          for (const ent of res?.elements || []) {
            const name = ent?.name?.localized?.en_US ?? ent?.name?.localized?.[Object.keys(ent?.name?.localized || {})[0]];
            if (ent?.id !== undefined && name) idToName[String(ent.id)] = String(name);
          }
        } else if (input.pivot === "MEMBER_INDUSTRY") {
          // IMPORTANT:
          // Industry pivot values can include IDs that are not present in /v2/industries (legacy standardized set),
          // but are still resolvable via the URN resolver used for targeting.
          // So we resolve by URN first (covers urn:li:industry:406, etc). If we only have numeric IDs,
          // generate URNs and resolve those too, then fall back to /v2/industries.
          const rawUrns = Array.from(
            new Set(
              elements
                .map((e: any) => pivotRawFromElem(e))
                .filter((v: any) => typeof v === "string" && String(v).startsWith("urn:li:industry:"))
                .map((v: any) => String(v))
            )
          );

          const generatedUrns = uniqueIds
            .filter((id) => id && !String(id).startsWith("urn:li:"))
            .map((id) => `urn:li:industry:${id}`);

          const urnsToResolve = Array.from(new Set([...rawUrns, ...generatedUrns]));

          let byUrn: Record<string, string> = {};
          try {
            byUrn = await resolveAdTargetingEntitiesByUrns({ accessToken, urns: urnsToResolve });
          } catch {
            byUrn = {};
          }

          let byV2: Record<string, string> = {};
          try {
            byV2 = await batchGetV2NamesByIds({
              accessToken,
              endpointPath: "/v2/industries",
              ids: uniqueIds,
            });
          } catch {
            byV2 = {};
          }

          idToName = { ...byV2, ...byUrn };
        } else if (input.pivot === "MEMBER_JOB_TITLE" && uniqueIds.length > 0) {
          // Batch resolve the top N title IDs we actually need (avoid fetching all titles).
          const url = new URL(`${LI_BASE}/v2/titles`);
          for (const id of uniqueIds.slice(0, 100)) url.searchParams.append("ids", id);
          url.searchParams.set("locale", "en_US");
          const { statusCode, body } = await request(url.toString(), { method: "GET", headers: liHeaders(accessToken) });
          const text = await body.text();
          if (statusCode < 400) {
            const data = JSON.parse(text);
            for (const [id, ent] of Object.entries<any>(data?.results || {})) {
              const loc = ent?.name?.localized;
              const name = loc?.en_US ?? loc?.[Object.keys(loc || {})[0]];
              if (name) idToName[String(id)] = String(name);
            }
          }
        }

        const rows = elements.map((e: any) => {
          const raw = pivotRawFromElem(e);
          const id = pivotIdFromRaw(raw);

          let pivotDisplay = idToName[id] || id;
          if (input.pivot === "MEMBER_COMPANY_SIZE") pivotDisplay = humanizeCompanySize(id);
          if (input.pivot === "IMPRESSION_DEVICE_TYPE") pivotDisplay = id.replace(/_/g, " ");
          if (input.pivot === "PLACEMENT_NAME") pivotDisplay = id.replace(/_/g, " ");
          if (input.pivot === "SERVING_LOCATION") pivotDisplay = id.replace(/_/g, " ");

          return {
            pivot: pivotDisplay,
            rawPivot: raw,
            pivotId: id,
            impressions: Number(e.impressions || 0),
            clicks: Number(e.clicks || 0),
            spend: Number(e.costInLocalCurrency || 0),
            conversions: Number(e.externalWebsiteConversions || 0),
            leads: Number(e.oneClickLeads || 0),
            videoViews: Number(e.videoViews || 0),
          };
        });

        return {
          success: true,
          data: rows,
          meta: {
            retrieved_at: new Date().toISOString(),
            pivot: input.pivot,
            fallbackUsed,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch LinkedIn breakdown",
        });
      }
    }),
});

