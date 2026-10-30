/**
 * Google Ads for a customer-connected account.
 * OAuth uses the Google Ads scope plus profile scopes. API calls also send the
 * app developer token. A manager account is expanded into the client customers
 * that hold campaigns.
 */

import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { request } from "undici";
import { z } from "zod";

import { customerPlatformAsset } from "@npanel/db/schema";
import {
  createGoogleAdsClient,
  getAccessibleCustomers,
  getCustomerInstance,
} from "../../lib/google-ads-client";
import {
  getGoogleAdsClientId,
  getGoogleAdsClientSecret,
  getGoogleAdsDeveloperToken,
} from "../../lib/google-ads-credentials";
import { GoogleAdsErrorHandler } from "../../lib/google-ads-error-handler";
import type { MetaUserProfile } from "../../lib/meta-oauth-provider";
import { decryptToken } from "../../lib/oauth-encryption";
import { protectedProcedure, router } from "../../trpc";

export const GOOGLE_ADS_SCOPES = [
  "https://www.googleapis.com/auth/adwords",
  "openid",
  "email",
  "profile",
];

const dateInput = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeRangeInput = z.object({ since: dateInput, until: dateInput }).optional();

type Totals = { impressions: number; clicks: number; spendMicros: number; conversions: number };
type SelectableAsset = {
  platformAssetId: string;
  assetType: "google_ad_account";
  name: string;
  businessId: string | null;
  businessName: string | null;
  metadata: { currency: string | null; timezone: string | null; account_status: string };
};

type AssetRow = {
  id: string;
  name: string;
  platform: string;
  assetType: string;
  platformAssetId: string;
  businessId: string | null;
  currency: string | null;
  isActive: boolean;
  connection: { refreshToken: string | null; status: string } | null;
};

type ContextWithDb = {
  db: {
    query: {
      customerPlatformAsset: {
        findFirst: (args: unknown) => Promise<AssetRow | undefined>;
      };
    };
    update: (table: typeof customerPlatformAsset) => {
      set: (values: { businessId: string | null; updatedAt: Date }) => {
        where: (condition: unknown) => Promise<unknown>;
      };
    };
  };
  session: { user: { id: string } };
};

const CAMPAIGN_STATUS: Record<string, string> = {
  "2": "ACTIVE",
  ENABLED: "ACTIVE",
  "3": "PAUSED",
  PAUSED: "PAUSED",
  "4": "REMOVED",
  REMOVED: "REMOVED",
};

const CUSTOMER_STATUS: Record<string, string> = {
  "2": "ACTIVE",
  ENABLED: "ACTIVE",
  "3": "CANCELED",
  CANCELED: "CANCELED",
  "4": "SUSPENDED",
  SUSPENDED: "SUSPENDED",
  "5": "CLOSED",
  CLOSED: "CLOSED",
};

const CHANNEL: Record<string, string> = {
  "2": "SEARCH",
  "3": "DISPLAY",
  "4": "SHOPPING",
  "5": "HOTEL",
  "6": "VIDEO",
  "7": "MULTI_CHANNEL",
  "8": "LOCAL",
  "9": "SMART",
  "10": "PERFORMANCE_MAX",
  "11": "LOCAL_SERVICES",
  "12": "DISCOVERY",
  "13": "TRAVEL",
  "14": "DEMAND_GEN",
};

const DEVICE: Record<string, string> = {
  "2": "Mobile",
  "3": "Tablet",
  "4": "Desktop",
  "5": "Other",
  "6": "Connected TV",
  MOBILE: "Mobile",
  TABLET: "Tablet",
  DESKTOP: "Desktop",
  OTHER: "Other",
  CONNECTED_TV: "Connected TV",
};

const NETWORK: Record<string, string> = {
  "2": "Search",
  "3": "Search partners",
  "4": "Display",
  "5": "YouTube search",
  "6": "YouTube watch",
  "7": "Cross-network",
  "8": "YouTube",
  SEARCH: "Search",
  SEARCH_PARTNERS: "Search partners",
  CONTENT: "Display",
  YOUTUBE_SEARCH: "YouTube search",
  YOUTUBE_WATCH: "YouTube watch",
  MIXED: "Cross-network",
  YOUTUBE: "YouTube",
};

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

function shiftYmd(ymd: string, days: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function resolveWindow(input?: { since: string; until: string } | null) {
  const today = todayYmd();
  if (!input) return { since: shiftYmd(today, -29), until: today };
  const since = input.since <= input.until ? input.since : input.until;
  const until = input.since <= input.until ? input.until : input.since;
  return { since, until: until > today ? today : until };
}

function digits(value: unknown): string {
  const raw = String(value ?? "");
  const fromResource = raw.match(/customers\/(\d+)/);
  if (fromResource) return fromResource[1];
  return raw.replace(/\D/g, "");
}

function assertId(value: string): string {
  const id = digits(value);
  if (!id) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid Google Ads id" });
  return id;
}

function mapped(table: Record<string, string>, value: unknown, fallback = "UNKNOWN"): string {
  const raw = value == null ? "" : String(value);
  return table[raw] ?? table[raw.toUpperCase()] ?? (raw ? raw.replace(/_/g, " ") : fallback);
}

function isManager(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

function emptyTotals(): Totals {
  return { impressions: 0, clicks: 0, spendMicros: 0, conversions: 0 };
}

function addMetrics(totals: Totals, metrics: Record<string, unknown> | undefined) {
  totals.impressions += Number(metrics?.impressions || 0);
  totals.clicks += Number(metrics?.clicks || 0);
  totals.spendMicros += Number(metrics?.cost_micros || 0);
  totals.conversions += Number(metrics?.conversions || 0);
}

function insightView(totals: Totals | undefined) {
  if (!totals) return null;
  const spend = totals.spendMicros / 1_000_000;
  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  return {
    impressions: totals.impressions,
    clicks: totals.clicks,
    spend,
    ctr: String(ctr),
    cpc: totals.clicks > 0 ? spend / totals.clicks : null,
    conversions: totals.conversions,
    results: totals.conversions,
    costPerResult: totals.conversions > 0 ? spend / totals.conversions : null,
  };
}

function microsToAmount(value: unknown): number | null {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount / 1_000_000;
}

function campaignDay(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
  if (!match?.[1]) return null;
  const year = Number(match[1].slice(0, 4));
  if (!Number.isFinite(year) || year >= 2037) return null;
  return match[1];
}

const BUDGET_PERIOD: Record<string, string> = {
  "2": "DAILY",
  DAILY: "DAILY",
  "5": "CUSTOM_PERIOD",
  CUSTOM_PERIOD: "CUSTOM_PERIOD",
};

/** Inclusive days shared by the report window and the campaign schedule. */
function overlapDays(since: string, until: string, start: string | null, end: string | null): number {
  const from = start && start > since ? start : since;
  const to = end && end < until ? end : until;
  if (to < from) return 0;
  const [fromYear, fromMonth, fromDay] = from.split("-").map(Number);
  const [toYear, toMonth, toDay] = to.split("-").map(Number);
  const span = Date.UTC(toYear, toMonth - 1, toDay) - Date.UTC(fromYear, fromMonth - 1, fromDay);
  return Math.floor(span / 86_400_000) + 1;
}

/**
 * `amount_micros` on a DAILY budget is one day's budget, while spend is the
 * selected date range. Scale the daily amount across the days in that range
 * so the list can show spend against the budget for the same period.
 */
function budgetForWindow(
  amount: number | null,
  period: string,
  since: string,
  until: string,
  start: string | null,
  end: string | null,
): number | null {
  if (amount == null) return null;
  if (period !== "DAILY") return amount;
  const days = overlapDays(since, until, start, end);
  return days > 0 ? amount * days : amount;
}

function labelFrom(table: Record<string, string>, value: unknown): string {
  const raw = value == null ? "Unknown" : String(value);
  return table[raw] ?? table[raw.toUpperCase()] ?? raw.replace(/^AGE_RANGE_/, "").replace(/_/g, " ");
}

type GoogleFailure = { messages: string[]; codes: string[]; requestId: string | null };

function googleFailure(error: unknown): GoogleFailure {
  const messages: string[] = [];
  const codes: string[] = [];
  let requestId: string | null = null;
  const seen = new Set<unknown>();

  const visit = (value: unknown, depth: number) => {
    if (value == null || depth > 6 || (typeof value === "object" && seen.has(value))) return;
    if (typeof value === "string") {
      const text = value.trim();
      if (text && text !== "An unexpected error occurred with Google Ads API") messages.push(text);
      return;
    }
    if (typeof value !== "object") return;
    seen.add(value);
    const record = value as Record<string, unknown> & { toJSON?: () => unknown };
    if (typeof record.toJSON === "function") {
      try {
        visit(record.toJSON(), depth + 1);
      } catch {
        // Some protobuf objects cannot be serialized. The fields below are still readable.
      }
    }
    if (Array.isArray(record.errors)) {
      for (const item of record.errors) {
        if (!item || typeof item !== "object") continue;
        const row = item as Record<string, unknown>;
        if (typeof row.message === "string" && row.message.trim()) messages.push(row.message.trim());
        const code = row.error_code ?? row.errorCode;
        if (code && typeof code === "object") {
          for (const [key, codeValue] of Object.entries(code as Record<string, unknown>)) {
            if (codeValue == null || codeValue === 0 || codeValue === "UNSPECIFIED" || codeValue === "UNKNOWN") continue;
            codes.push(String(codeValue));
            codes.push(key);
          }
        }
      }
    }
    if (typeof record.request_id === "string") requestId = record.request_id;
    if (typeof record.requestId === "string") requestId = record.requestId;
    if (value instanceof Error && value.message.trim()) messages.push(value.message.trim());
    if ("cause" in record) visit(record.cause, depth + 1);
    if ("response" in record) visit(record.response, depth + 1);
  };

  visit(error, 0);
  return {
    messages: [...new Set(messages)],
    codes: [...new Set(codes)],
    requestId,
  };
}

function failureText(error: unknown): string {
  const failure = googleFailure(error);
  return `${failure.codes.join(" ")} ${failure.messages.join(" ")}`.toLowerCase();
}

function failureHas(error: unknown, code: string): boolean {
  return failureText(error).includes(code.toLowerCase());
}

function needsManagerLogin(error: unknown): boolean {
  const text = failureText(error);
  return text.includes("user_permission_denied") || text.includes("login-customer-id") || text.includes("login_customer_id");
}

function managerAccountError(): TRPCError {
  return new TRPCError({
    code: "BAD_REQUEST",
    message:
      "Metrics cannot be requested for a manager account. To retrieve metrics, issue separate requests against each client account under the manager account.",
  });
}

function googleError(error: unknown): TRPCError {
  if (error instanceof TRPCError) return error;
  const failure = googleFailure(error);
  const apiMessage = failure.messages.find((message) => !message.startsWith("{") && !message.startsWith("[")) ?? failure.messages[0];
  console.error("Google Ads request failed", {
    message: apiMessage ?? null,
    codes: failure.codes,
    requestId: failure.requestId,
  });
  if (failureHas(error, "REQUESTED_METRICS_FOR_MANAGER")) return managerAccountError();
  if (apiMessage) {
    const permission = needsManagerLogin(error) || failureHas(error, "CUSTOMER_NOT_ENABLED");
    return new TRPCError({
      code: permission ? "FORBIDDEN" : "BAD_REQUEST",
      message: apiMessage,
    });
  }
  const info = GoogleAdsErrorHandler.handleError(error);
  return new TRPCError({
    code: info.type === "refresh-token" || info.type === "permission" ? "UNAUTHORIZED" : "INTERNAL_SERVER_ERROR",
    message: info.message || "Google Ads request failed",
  });
}

export function googleAuthorizeUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: getGoogleAdsClientId(),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_ADS_SCOPES.join(" "),
    state,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string, redirectUri: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: getGoogleAdsClientId(),
    client_secret: getGoogleAdsClientSecret(),
  });
  const response = await request("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = (await response.body.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    error?: string;
    error_description?: string;
  };
  if (!data.access_token) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: data.error_description || data.error || "Google token exchange failed",
    });
  }

  const profileResponse = await request("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  const profileData = (await profileResponse.body.json()) as {
    id?: string;
    email?: string;
    name?: string;
    picture?: string;
    error?: { message?: string };
  };
  if (!profileData.id) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: profileData.error?.message || "Google did not return an account profile",
    });
  }

  const profile: MetaUserProfile = {
    platformUserId: String(profileData.id),
    displayName: profileData.name || profileData.email || "Google Ads",
    email: profileData.email,
    profilePictureUrl: profileData.picture,
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresIn: data.expires_in ?? 3600,
    scopes: data.scope ? data.scope.split(" ").filter(Boolean) : GOOGLE_ADS_SCOPES,
    profile,
  };
}

async function gaql(customer: { query: (query: string) => Promise<unknown> }, query: string) {
  const rows = await customer.query(query);
  return Array.isArray(rows) ? (rows as Array<Record<string, any>>) : [];
}

function customerClient(refreshToken: string, customerId: string, loginCustomerId?: string | null) {
  const client = createGoogleAdsClient({
    developerToken: getGoogleAdsDeveloperToken(),
    clientId: getGoogleAdsClientId(),
    clientSecret: getGoogleAdsClientSecret(),
    refreshToken,
  });
  return getCustomerInstance(client, customerId, refreshToken, loginCustomerId || undefined);
}

export async function listGoogleSelectableAssets(refreshToken: string): Promise<SelectableAsset[]> {
  const client = createGoogleAdsClient({
    developerToken: getGoogleAdsDeveloperToken(),
    clientId: getGoogleAdsClientId(),
    clientSecret: getGoogleAdsClientSecret(),
    refreshToken,
  });
  const accessible = await getAccessibleCustomers(client, refreshToken);
  const accounts = new Map<string, SelectableAsset>();

  const add = (row: {
    id: string;
    name: string | null;
    currency: string | null;
    timezone: string | null;
    status: string;
    businessId: string | null;
    businessName: string | null;
  }) => {
    if (!row.id) return;
    const existing = accounts.get(row.id);
    if (existing) {
      if (!existing.businessId && row.businessId) {
        existing.businessId = row.businessId;
        existing.businessName = row.businessName;
      }
      return;
    }
    accounts.set(row.id, {
      platformAssetId: row.id,
      assetType: "google_ad_account",
      name: row.name || `Google Ads ${row.id}`,
      businessId: row.businessId,
      businessName: row.businessName,
      metadata: {
        currency: row.currency,
        timezone: row.timezone,
        account_status: row.status,
      },
    });
  };

  const readCustomer = async (customerId: string, loginCustomerId?: string) => {
    const customer = getCustomerInstance(client, customerId, refreshToken, loginCustomerId);
    const rows = await gaql(
      customer,
      `SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone, customer.status, customer.manager FROM customer LIMIT 1`,
    );
    const record = rows[0]?.customer ?? {};
    return {
      id: digits(record.id) || customerId,
      name: typeof record.descriptive_name === "string" ? record.descriptive_name : null,
      currency: typeof record.currency_code === "string" ? record.currency_code : null,
      timezone: typeof record.time_zone === "string" ? record.time_zone : null,
      status: mapped(CUSTOMER_STATUS, record.status, "ACTIVE"),
      manager: isManager(record.manager),
    };
  };

  const managers: Array<{ id: string; name: string | null }> = [];
  for (const entry of accessible) {
    const customerId = digits(entry.customerId);
    if (!customerId) continue;
    try {
      const info = await readCustomer(customerId);
      if (info.manager) managers.push({ id: info.id, name: info.name });
      else {
        add({
          id: info.id,
          name: info.name,
          currency: info.currency,
          timezone: info.timezone,
          status: info.status,
          businessId: null,
          businessName: null,
        });
      }
    } catch (error) {
      console.warn(`Google Ads customer ${customerId} could not be read:`, error);
    }
  }

  const visited = new Set<string>();
  const expand = async (rootId: string, rootName: string | null, managerId: string, depth: number) => {
    if (depth > 4 || visited.has(managerId)) return;
    visited.add(managerId);
    try {
      const customer = getCustomerInstance(client, managerId, refreshToken, rootId);
      const rows = await gaql(
        customer,
        `SELECT customer_client.id, customer_client.descriptive_name, customer_client.currency_code, customer_client.time_zone, customer_client.status, customer_client.manager, customer_client.level FROM customer_client WHERE customer_client.level <= 1`,
      );
      for (const row of rows) {
        const record = row.customer_client ?? {};
        const id = digits(record.id);
        const level = record.level == null || record.level === "" ? null : Number(record.level);
        if (!id || id === managerId || level === 0) continue;
        if (isManager(record.manager)) {
          await expand(rootId, rootName, id, depth + 1);
          continue;
        }
        add({
          id,
          name: typeof record.descriptive_name === "string" ? record.descriptive_name : null,
          currency: typeof record.currency_code === "string" ? record.currency_code : null,
          timezone: typeof record.time_zone === "string" ? record.time_zone : null,
          status: mapped(CUSTOMER_STATUS, record.status, "ACTIVE"),
          businessId: rootId,
          businessName: rootName,
        });
      }
    } catch (error) {
      console.warn(`Google Ads manager ${managerId} clients could not be read:`, error);
    }
  };

  for (const manager of managers) {
    await expand(manager.id, manager.name, manager.id, 0);
  }

  return [...accounts.values()];
}

async function loadAccount(ctx: ContextWithDb, assetId: string) {
  const asset = await ctx.db.query.customerPlatformAsset.findFirst({
    where: and(eq(customerPlatformAsset.id, assetId), eq(customerPlatformAsset.userId, ctx.session.user.id)),
    with: { connection: true },
  });
  if (!asset?.connection) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Ad account not found" });
  }
  if (asset.assetType !== "google_ad_account" || asset.platform !== "google_ads") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This asset is not a Google Ads account" });
  }
  if (!asset.isActive || asset.connection.status !== "ACTIVE") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This ad account is not active. Reconnect Google Ads and import it again.",
    });
  }
  if (!asset.connection.refreshToken) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Reconnect Google Ads to refresh access." });
  }
  const refreshToken = decryptToken(asset.connection.refreshToken);
  return {
    asset,
    refreshToken,
    customer: customerClient(refreshToken, asset.platformAssetId, asset.businessId),
  };
}

async function managerIdFor(refreshToken: string, customerId: string): Promise<string | null> {
  try {
    const assets = await listGoogleSelectableAssets(refreshToken);
    const match = assets.find((asset) => asset.platformAssetId === customerId);
    return match?.businessId ? digits(match.businessId) : null;
  } catch (error) {
    console.error("Google Ads manager lookup failed", googleFailure(error).messages[0] ?? "lookup failed");
    return null;
  }
}

async function openCustomer(ctx: ContextWithDb, assetId: string) {
  const loaded = await loadAccount(ctx, assetId);
  const customerId = digits(loaded.asset.platformAssetId);
  const storedLogin = loaded.asset.businessId ? digits(loaded.asset.businessId) : null;
  const attempts: Array<string | null> = [storedLogin];
  let lastError: unknown;

  for (let index = 0; index < attempts.length; index += 1) {
    const loginId = attempts[index] ?? null;
    try {
      const customer = customerClient(loaded.refreshToken, customerId, loginId);
      const rows = await gaql(customer, `SELECT customer.id, customer.manager FROM customer LIMIT 1`);
      if (isManager(rows[0]?.customer?.manager)) throw managerAccountError();
      if (loginId !== storedLogin) {
        await ctx.db
          .update(customerPlatformAsset)
          .set({ businessId: loginId, updatedAt: new Date() })
          .where(eq(customerPlatformAsset.id, loaded.asset.id));
      }
      return { asset: loaded.asset, refreshToken: loaded.refreshToken, customer };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      lastError = error;
      if (!needsManagerLogin(error) || index > 0) continue;
      const managerId = await managerIdFor(loaded.refreshToken, customerId);
      if (managerId && !attempts.includes(managerId)) attempts.push(managerId);
      if (storedLogin && !attempts.includes(null)) attempts.push(null);
    }
  }

  throw googleError(lastError);
}

function sumBy(rows: Array<Record<string, any>>, keyOf: (row: Record<string, any>) => string) {
  const totals = new Map<string, Totals>();
  for (const row of rows) {
    const key = keyOf(row);
    if (!key) continue;
    const current = totals.get(key) ?? emptyTotals();
    addMetrics(current, row.metrics);
    totals.set(key, current);
  }
  return totals;
}

async function safeQuery(customer: { query: (query: string) => Promise<unknown> }, query: string) {
  try {
    return await gaql(customer, query);
  } catch (error) {
    const failure = googleFailure(error);
    console.warn("Google Ads query failed", failure.messages[0] ?? "query failed", failure.codes);
    return [];
  }
}

function firstUrl(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const url = value.find((item) => typeof item === "string" && item);
  return typeof url === "string" ? url : null;
}

function plainLabel(value: unknown): string {
  if (value == null || value === "") return "";
  return String(value).replace(/_/g, " ");
}

function httpsUrl(value: unknown): string | null {
  return typeof value === "string" && value.startsWith("https://") ? value : null;
}

function assetMedia(row: Record<string, any>): { kind: "image" | "video"; url: string; previewUrl: string } | null {
  const imageUrl = httpsUrl(row.asset?.image_asset?.full_size?.url);
  if (imageUrl) return { kind: "image", url: imageUrl, previewUrl: imageUrl };
  const videoId = typeof row.asset?.youtube_video_asset?.youtube_video_id === "string"
    ? row.asset.youtube_video_asset.youtube_video_id.trim()
    : "";
  if (/^[\w-]{6,}$/.test(videoId)) {
    return {
      kind: "video",
      url: `https://www.youtube.com/watch?v=${videoId}`,
      previewUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    };
  }
  return null;
}

export const customerOAuthGoogleRouter = router({
  list: protectedProcedure
    .input(z.object({ assetId: z.string().min(1), timeRange: timeRangeInput }))
    .query(async ({ ctx, input }) => {
      const { customer } = await openCustomer(ctx as ContextWithDb, input.assetId);
      const window = resolveWindow(input.timeRange);
      try {
        const entities = await gaql(
          customer,
          `SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign.start_date_time, campaign.end_date_time, campaign_budget.amount_micros, campaign_budget.period FROM campaign WHERE campaign.status != 'REMOVED'`,
        );
        let metricRows: Array<Record<string, any>> = [];
        try {
          metricRows = await gaql(
            customer,
            `SELECT campaign.id, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM campaign WHERE campaign.status != 'REMOVED' AND segments.date BETWEEN '${window.since}' AND '${window.until}'`,
          );
        } catch (error) {
          if (failureHas(error, "REQUESTED_METRICS_FOR_MANAGER")) throw managerAccountError();
          const failure = googleFailure(error);
          console.error("Google Ads campaign metrics failed", {
            message: failure.messages[0] ?? null,
            codes: failure.codes,
            requestId: failure.requestId,
          });
        }
        const insights = sumBy(metricRows, (row) => digits(row.campaign?.id));
        const campaigns = entities
          .map((row) => {
            const id = digits(row.campaign?.id);
            if (!id) return null;
            const start = campaignDay(row.campaign?.start_date_time);
            const stop = campaignDay(row.campaign?.end_date_time);
            return {
              id,
              name: row.campaign?.name || `Campaign ${id}`,
              status: mapped(CAMPAIGN_STATUS, row.campaign?.status),
              objective: mapped(CHANNEL, row.campaign?.advertising_channel_type, ""),
              startTime: start,
              stopTime: stop,
              createdAt: start,
              budget: budgetForWindow(
                microsToAmount(row.campaign_budget?.amount_micros),
                mapped(BUDGET_PERIOD, row.campaign_budget?.period, "DAILY"),
                window.since,
                window.until,
                start,
                stop,
              ),
              insights: insightView(insights.get(id) ?? emptyTotals()),
            };
          })
          .filter((campaign): campaign is NonNullable<typeof campaign> => campaign != null)
          .sort((a, b) => {
            const aTime = Date.parse(a.startTime || "") || 0;
            const bTime = Date.parse(b.startTime || "") || 0;
            if (aTime !== bTime) return bTime - aTime;
            return Number(b.id) - Number(a.id);
          });
        return { campaigns };
      } catch (error) {
        throw googleError(error);
      }
    }),

  getDetails: protectedProcedure
    .input(z.object({ assetId: z.string().min(1), campaignId: z.string().min(1), timeRange: timeRangeInput }))
    .query(async ({ ctx, input }) => {
      const { asset, customer } = await openCustomer(ctx as ContextWithDb, input.assetId);
      const window = resolveWindow(input.timeRange);
      const campaignId = assertId(input.campaignId);
      const between = `segments.date BETWEEN '${window.since}' AND '${window.until}'`;
      try {
        const campaigns = await gaql(
          customer,
          `SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign.start_date_time, campaign.end_date_time, campaign_budget.amount_micros, campaign_budget.period FROM campaign WHERE campaign.id = ${campaignId}`,
        );
        const campaign = campaigns[0];
        if (!campaign?.campaign) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
        }
        const channel = mapped(CHANNEL, campaign.campaign.advertising_channel_type, "");
        // Performance Max has no ad_group or ad_group_ad rows. Google documents
        // asset_group as the structure to query instead.
        const performanceMax = channel === "PERFORMANCE_MAX";

        const [summaryRows, keywordRows, locationRows] = await Promise.all([
          safeQuery(
            customer,
            `SELECT metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM campaign WHERE campaign.id = ${campaignId} AND ${between}`,
          ),
          safeQuery(
            customer,
            `SELECT campaign_criterion.negative, campaign_criterion.keyword.text FROM campaign_criterion WHERE campaign.id = ${campaignId} AND campaign_criterion.type = 'KEYWORD' AND campaign_criterion.status != 'REMOVED'`,
          ),
          safeQuery(
            customer,
            `SELECT campaign_criterion.location.geo_target_constant FROM campaign_criterion WHERE campaign.id = ${campaignId} AND campaign_criterion.type = 'LOCATION' AND campaign_criterion.status != 'REMOVED'`,
          ),
        ]);

        let structure: "ad_groups" | "asset_groups" = performanceMax ? "asset_groups" : "ad_groups";
        let adGroupRows: Array<Record<string, any>> = [];
        let adGroupMetrics: Array<Record<string, any>> = [];
        let adRows: Array<Record<string, any>> = [];
        let adMetrics: Array<Record<string, any>> = [];
        let assetGroupRows: Array<Record<string, any>> = [];
        let assetGroupMetrics: Array<Record<string, any>> = [];
        let assetRows: Array<Record<string, any>> = [];
        let assetMetrics: Array<Record<string, any>> = [];

        if (!performanceMax) {
          [adGroupRows, adGroupMetrics, adRows, adMetrics] = await Promise.all([
            gaql(
              customer,
              `SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.cpc_bid_micros FROM ad_group WHERE campaign.id = ${campaignId} AND ad_group.status != 'REMOVED'`,
            ),
            safeQuery(
              customer,
              `SELECT ad_group.id, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM ad_group WHERE campaign.id = ${campaignId} AND ad_group.status != 'REMOVED' AND ${between}`,
            ),
            gaql(
              customer,
              `SELECT ad_group.id, ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.ad.type, ad_group_ad.status, ad_group_ad.ad.final_urls FROM ad_group_ad WHERE campaign.id = ${campaignId} AND ad_group_ad.status != 'REMOVED'`,
            ),
            safeQuery(
              customer,
              `SELECT ad_group.id, ad_group_ad.ad.id, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM ad_group_ad WHERE campaign.id = ${campaignId} AND ad_group_ad.status != 'REMOVED' AND ${between}`,
            ),
          ]);
        }

        if (performanceMax || adGroupRows.length === 0) {
          [assetGroupRows, assetGroupMetrics, assetRows, assetMetrics] = await Promise.all([
            gaql(
              customer,
              `SELECT asset_group.id, asset_group.name, asset_group.status, asset_group.final_urls FROM asset_group WHERE campaign.id = ${campaignId} AND asset_group.status != 'REMOVED'`,
            ),
            safeQuery(
              customer,
              `SELECT asset_group.id, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM asset_group WHERE campaign.id = ${campaignId} AND asset_group.status != 'REMOVED' AND ${between}`,
            ),
            gaql(
              customer,
              `SELECT asset_group.id, asset.id, asset.name, asset.type, asset.text_asset.text, asset.image_asset.full_size.url, asset.youtube_video_asset.youtube_video_id, asset.youtube_video_asset.youtube_video_title, asset_group_asset.field_type, asset_group_asset.status FROM asset_group_asset WHERE campaign.id = ${campaignId} AND asset_group_asset.status != 'REMOVED'`,
            ),
            safeQuery(
              customer,
              `SELECT asset_group.id, asset.id, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM asset_group_asset WHERE campaign.id = ${campaignId} AND asset_group_asset.status != 'REMOVED' AND ${between}`,
            ),
          ]);
          if (assetGroupRows.length > 0) structure = "asset_groups";
        }

        const summary = emptyTotals();
        for (const row of summaryRows) addMetrics(summary, row.metrics);
        const adGroupInsight = sumBy(adGroupMetrics, (row) => digits(row.ad_group?.id));
        const adInsight = sumBy(adMetrics, (row) => `${digits(row.ad_group?.id)}:${digits(row.ad_group_ad?.ad?.id)}`);
        const assetGroupInsight = sumBy(assetGroupMetrics, (row) => digits(row.asset_group?.id));
        const assetInsight = sumBy(assetMetrics, (row) => `${digits(row.asset_group?.id)}:${digits(row.asset?.id)}`);

        const keywords: string[] = [];
        const excludedKeywords: string[] = [];
        const geoIds = new Set<string>();
        for (const row of keywordRows) {
          const criterion = row.campaign_criterion ?? {};
          const text = criterion.keyword?.text;
          if (typeof text === "string" && text) {
            if (criterion.negative === true || criterion.negative === 1 || criterion.negative === "true") {
              excludedKeywords.push(text);
            } else keywords.push(text);
          }
        }
        for (const row of locationRows) {
          const geo = digits(row.campaign_criterion?.location?.geo_target_constant);
          if (geo) geoIds.add(geo);
        }

        const locationNames: string[] = [];
        const geoList = [...geoIds].slice(0, 100);
        if (geoList.length > 0) {
          const locations = await safeQuery(
            customer,
            `SELECT geo_target_constant.id, geo_target_constant.canonical_name FROM geo_target_constant WHERE geo_target_constant.id IN (${geoList.join(",")})`,
          );
          for (const row of locations) {
            const name = row.geo_target_constant?.canonical_name;
            if (typeof name === "string" && name) locationNames.push(name);
          }
        }

        const targeting = [
          keywords.length ? { label: "Keywords", values: [...new Set(keywords)].join(", ") } : null,
          excludedKeywords.length
            ? { label: "Excluded keywords", values: [...new Set(excludedKeywords)].join(", ") }
            : null,
          locationNames.length ? { label: "Locations", values: [...new Set(locationNames)].join(", ") } : null,
        ].filter((section): section is { label: string; values: string } => section != null);

        const adsByGroup = new Map<string, Array<Record<string, unknown>>>();
        for (const row of adRows) {
          const groupId = digits(row.ad_group?.id);
          const adId = digits(row.ad_group_ad?.ad?.id);
          if (!groupId || !adId) continue;
          const urls = row.ad_group_ad?.ad?.final_urls;
          const finalUrl = Array.isArray(urls) ? urls.find((url) => typeof url === "string") : null;
          const list = adsByGroup.get(groupId) ?? [];
          list.push({
            id: adId,
            name: row.ad_group_ad?.ad?.name || `Ad ${adId}`,
            status: mapped(CAMPAIGN_STATUS, row.ad_group_ad?.status),
            type: row.ad_group_ad?.ad?.type ? String(row.ad_group_ad.ad.type) : null,
            finalUrl: typeof finalUrl === "string" ? finalUrl : null,
            media: null,
            insights: insightView(adInsight.get(`${groupId}:${adId}`) ?? emptyTotals()),
          });
          adsByGroup.set(groupId, list);
        }

        const assetsByGroup = new Map<string, Array<Record<string, unknown>>>();
        for (const row of assetRows) {
          const groupId = digits(row.asset_group?.id);
          const assetId = digits(row.asset?.id);
          if (!groupId || !assetId) continue;
          const fieldType = plainLabel(row.asset_group_asset?.field_type);
          const text = typeof row.asset?.text_asset?.text === "string" ? row.asset.text_asset.text : "";
          const videoTitle = typeof row.asset?.youtube_video_asset?.youtube_video_title === "string"
            ? row.asset.youtube_video_asset.youtube_video_title
            : "";
          const assetName = typeof row.asset?.name === "string" ? row.asset.name : "";
          const list = assetsByGroup.get(groupId) ?? [];
          list.push({
            id: assetId,
            name: text || videoTitle || assetName || fieldType || `Asset ${assetId}`,
            status: mapped(CAMPAIGN_STATUS, row.asset_group_asset?.status),
            type: fieldType || (row.asset?.type ? plainLabel(row.asset.type) : null),
            finalUrl: null,
            media: assetMedia(row),
            insights: insightView(assetInsight.get(`${groupId}:${assetId}`) ?? emptyTotals()),
          });
          assetsByGroup.set(groupId, list);
        }

        const adSets =
          structure === "asset_groups"
            ? assetGroupRows
                .map((row) => {
                  const id = digits(row.asset_group?.id);
                  if (!id) return null;
                  return {
                    id,
                    name: row.asset_group?.name || `Asset group ${id}`,
                    status: mapped(CAMPAIGN_STATUS, row.asset_group?.status),
                    unitCost: null,
                    finalUrl: firstUrl(row.asset_group?.final_urls),
                    insights: insightView(assetGroupInsight.get(id) ?? emptyTotals()),
                    ads: assetsByGroup.get(id) ?? [],
                  };
                })
                .filter((group): group is NonNullable<typeof group> => group != null)
            : adGroupRows
                .map((row) => {
                  const id = digits(row.ad_group?.id);
                  if (!id) return null;
                  return {
                    id,
                    name: row.ad_group?.name || `Ad group ${id}`,
                    status: mapped(CAMPAIGN_STATUS, row.ad_group?.status),
                    unitCost: microsToAmount(row.ad_group?.cpc_bid_micros),
                    finalUrl: null,
                    insights: insightView(adGroupInsight.get(id) ?? emptyTotals()),
                    ads: adsByGroup.get(id) ?? [],
                  };
                })
                .filter((group): group is NonNullable<typeof group> => group != null);

        const start = campaignDay(campaign.campaign.start_date_time);
        return {
          success: true as const,
          currency: asset.currency || "USD",
          accountName: asset.name,
          timeRange: window,
          campaign: {
            id: campaignId,
            name: campaign.campaign.name || `Campaign ${campaignId}`,
            status: mapped(CAMPAIGN_STATUS, campaign.campaign.status),
            objective: mapped(CHANNEL, campaign.campaign.advertising_channel_type, ""),
            startTime: start,
            stopTime: campaignDay(campaign.campaign.end_date_time),
            dailyBudget: microsToAmount(campaign.campaign_budget?.amount_micros),
            budgetPeriod: campaign.campaign_budget?.period
              ? mapped({ "2": "DAILY", DAILY: "DAILY", "5": "CUSTOM_PERIOD", CUSTOM_PERIOD: "CUSTOM_PERIOD" }, campaign.campaign_budget.period, "")
              : null,
            insights: insightView(summary),
            targeting,
          },
          structure,
          adSets,
        };
      } catch (error) {
        throw googleError(error);
      }
    }),

  getCharts: protectedProcedure
    .input(z.object({ assetId: z.string().min(1), campaignId: z.string().min(1), timeRange: timeRangeInput }))
    .query(async ({ ctx, input }) => {
      const { customer } = await openCustomer(ctx as ContextWithDb, input.assetId);
      const window = resolveWindow(input.timeRange);
      const campaignId = assertId(input.campaignId);
      const between = `campaign.id = ${campaignId} AND segments.date BETWEEN '${window.since}' AND '${window.until}'`;

      const [dailyRows, deviceRows, networkRows, ageRows, genderRows] = await Promise.all([
        safeQuery(
          customer,
          `SELECT segments.date, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM campaign WHERE ${between}`,
        ),
        safeQuery(
          customer,
          `SELECT segments.device, metrics.impressions, metrics.clicks, metrics.cost_micros FROM campaign WHERE ${between}`,
        ),
        safeQuery(
          customer,
          `SELECT segments.ad_network_type, metrics.impressions, metrics.clicks, metrics.cost_micros FROM campaign WHERE ${between}`,
        ),
        safeQuery(
          customer,
          `SELECT ad_group_criterion.age_range.type, metrics.impressions, metrics.clicks, metrics.cost_micros FROM age_range_view WHERE ${between}`,
        ),
        safeQuery(
          customer,
          `SELECT ad_group_criterion.gender.type, metrics.impressions, metrics.clicks, metrics.cost_micros FROM gender_view WHERE ${between}`,
        ),
      ]);

      const dailyMap = new Map<string, Totals & { date: string }>();
      for (const row of dailyRows) {
        const date = typeof row.segments?.date === "string" ? row.segments.date : "";
        if (!date) continue;
        const current = dailyMap.get(date) ?? { ...emptyTotals(), date };
        addMetrics(current, row.metrics);
        dailyMap.set(date, current);
      }

      const breakdown = (rows: Array<Record<string, any>>, labelOf: (row: Record<string, any>) => string) => {
        const totals = sumBy(rows, labelOf);
        return [...totals.entries()]
          .map(([label, totals]) => ({
            label,
            impressions: totals.impressions,
            clicks: totals.clicks,
            spend: totals.spendMicros / 1_000_000,
          }))
          .sort((a, b) => b.impressions - a.impressions);
      };

      return {
        success: true as const,
        timeRange: window,
        daily: [...dailyMap.values()]
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((point) => ({
            date: point.date,
            impressions: point.impressions,
            clicks: point.clicks,
            spend: point.spendMicros / 1_000_000,
          })),
        device: breakdown(deviceRows, (row) => labelFrom(DEVICE, row.segments?.device)),
        network: breakdown(networkRows, (row) => labelFrom(NETWORK, row.segments?.ad_network_type)),
        age: breakdown(ageRows, (row) => labelFrom({}, row.ad_group_criterion?.age_range?.type).replace(/(\d+) (\d+)/, "$1–$2")),
        gender: breakdown(genderRows, (row) => labelFrom({}, row.ad_group_criterion?.gender?.type)),
      };
    }),
});
