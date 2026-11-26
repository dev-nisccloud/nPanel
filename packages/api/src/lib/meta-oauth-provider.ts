/**
 * Meta (Facebook/Instagram) OAuth Provider Client
 * Handles Graph API v26.0 interactions for customer OAuth
 * 
 * Supports:
 * - Facebook Pages
 * - Instagram Business Accounts
 * - Ad Accounts
 * - Business Manager
 * - Pixels
 * - Catalogs
 */

import { classifyMetaError, classifyNetworkError, type OAuthErrorDetails } from "./oauth-error-handler";

/**
 * Customer OAuth Meta credentials.
 * These are separate from the existing agency Meta flow (META_APP_ID, META_APP_SECRET, META_API_VERSION).
 */
function getCustomerMetaApiVersion(): string {
  return process.env.CUSTOMER_OAUTH_META_API_VERSION || "v26.0";
}

function getCustomerMetaGraphBaseUrl(): string {
  return `https://graph.facebook.com/${getCustomerMetaApiVersion()}`;
}

function getCustomerMetaOAuthUrl(): string {
  return `https://www.facebook.com/${getCustomerMetaApiVersion()}/dialog/oauth`;
}

function getCustomerMetaTokenUrl(): string {
  return `${getCustomerMetaGraphBaseUrl()}/oauth/access_token`;
}

/**
 * Scopes this Meta app can grant today.
 * Facebook rejects the login dialog when a requested permission is not added
 * to the app and marked ready for testing. Page publishing, Instagram, email,
 * and the retired read_insights permission are left off until those use cases
 * are enabled. ads_read already covers campaign insights.
 */
export const META_OAUTH_SCOPES = {
  pages: ["pages_show_list", "pages_read_engagement"],
  instagram: ["instagram_basic"],
  ads: ["ads_read", "ads_management", "business_management", "catalog_management"],
  basic: ["public_profile"],
} as const;

/**
 * Get all required scopes as flat array
 */
export function getAllMetaScopes(): string[] {
  return [
    ...META_OAUTH_SCOPES.basic,
    ...META_OAUTH_SCOPES.pages,
    ...META_OAUTH_SCOPES.instagram,
    ...META_OAUTH_SCOPES.ads,
  ];
}

/** Page list and Page insights. Kept off the ad-account login. */
export function getFacebookPageScopes(): string[] {
  return [...META_OAUTH_SCOPES.basic, ...META_OAUTH_SCOPES.pages];
}

/**
 * Platform asset returned from Meta API
 */
export interface MetaPlatformAsset {
  platformAssetId: string;
  assetType:
    | "facebook_page"
    | "instagram_business_account"
    | "meta_ad_account"
    | "meta_business_manager"
    | "meta_pixel"
    | "meta_catalog";
  name: string;
  username?: string;
  profilePictureUrl?: string;
  description?: string;
  permissions?: string[];
  capabilities?: Record<string, boolean>;
  businessId?: string;
  businessName?: string;
  parentAssetId?: string;
  accountAccessToken?: string; // For pages
  accountTokenExpiresAt?: number;
  metadata?: Record<string, unknown>;
}

/**
 * User profile from Meta
 */
export interface MetaUserProfile {
  platformUserId: string;
  displayName: string;
  email?: string;
  profilePictureUrl?: string;
}

/**
 * Token response from Meta OAuth
 */
export interface MetaTokenResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
}

/**
 * Meta Graph API error response
 */
interface MetaGraphError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    error_user_title?: string;
    error_user_msg?: string;
    fbtrace_id?: string;
  };
}

type MetaFetchBudget = { rateLimited: boolean };

type InsightApiRow = {
  name?: string;
  values?: Array<{ value?: unknown; end_time?: string }>;
};

type InsightPoint = { date: string; value: unknown };

type InsightSeries = {
  name: string;
  breakdown?: string;
  points: InsightPoint[];
};

export type FacebookPageProfile = {
  name: string | null;
  username: string | null;
  about: string | null;
  description: string | null;
  category: string | null;
  categories: string[];
  link: string | null;
  website: string | null;
  phone: string | null;
  emails: string[];
  whatsapp: string | null;
  address: string | null;
  hours: string[];
  isPublished: boolean | null;
  verificationStatus: string | null;
  likes: number | null;
  followers: number | null;
  rating: number | null;
  ratingCount: number | null;
  founded: string | null;
  companyOverview: string | null;
  mission: string | null;
  products: string | null;
  generalInfo: string | null;
  instagramUsername: string | null;
  coverUrl: string | null;
  pictureUrl: string | null;
};

export type FacebookPagePost = {
  id: string;
  message: string | null;
  createdTime: string | null;
  permalink: string | null;
  pictureUrl: string | null;
  reactions: number | null;
  comments: number | null;
  shares: number | null;
};

export type FacebookPageInsights = {
  followers: number | null;
  views: number;
  viewers: number;
  engagements: number;
  pageVisits: number;
  buttonClicks: number;
  newFollows: number;
  unfollows: number;
  viewsFromAds: number | null;
  viewsOrganic: number | null;
  viewsFromFollowers: number | null;
  viewsFromNonFollowers: number | null;
  reactions: {
    like: number;
    love: number;
    haha: number;
    wow: number;
    sad: number;
    angry: number;
  };
  series: Array<{
    date: string;
    views: number;
    viewers: number;
    engagements: number;
    visits: number;
    newFollows: number;
    unfollows: number;
  }>;
  unavailable: string[];
};

function insightDate(endTime: string | undefined): string {
  if (!endTime) return "";
  const end = new Date(endTime);
  if (Number.isNaN(end.getTime())) return endTime.slice(0, 10);
  const day = new Date(end.getTime() - 12 * 60 * 60 * 1000);
  return day.toISOString().slice(0, 10);
}

function numericValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function joinAddress(location: Record<string, unknown> | null): string | null {
  if (!location) return null;
  const parts = ["street", "city", "state", "zip", "country"]
    .map((key) => textOrNull(location[key]))
    .filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(", ") : null;
}

function formatPageHours(hours: unknown, alwaysOpen: boolean): string[] {
  if (alwaysOpen) return ["Open 24 hours"];
  if (!hours || typeof hours !== "object") return [];
  const record = hours as Record<string, unknown>;
  const days = [
    ["mon", "Mon"],
    ["tue", "Tue"],
    ["wed", "Wed"],
    ["thu", "Thu"],
    ["fri", "Fri"],
    ["sat", "Sat"],
    ["sun", "Sun"],
  ] as const;
  const lines: string[] = [];
  for (const [key, label] of days) {
    const open = textOrNull(record[`${key}_1_open`]);
    const close = textOrNull(record[`${key}_1_close`]);
    if (open && close) lines.push(`${label} ${open}–${close}`);
  }
  return lines;
}

function summaryCount(value: unknown): number | null {
  if (!value || typeof value !== "object") return null;
  const summary = (value as Record<string, unknown>).summary;
  if (!summary || typeof summary !== "object") return null;
  return numericValue((summary as Record<string, unknown>).total_count);
}

function sumPoints(series: InsightSeries | undefined): number {
  if (!series) return 0;
  return series.points.reduce((sum, point) => sum + (numericValue(point.value) ?? 0), 0);
}

function lastNumber(series: InsightSeries | undefined): number | null {
  if (!series) return null;
  for (let index = series.points.length - 1; index >= 0; index -= 1) {
    const value = numericValue(series.points[index]?.value);
    if (value != null) return value;
  }
  return null;
}

function pointValue(series: InsightSeries | undefined, date: string): number {
  const point = series?.points.find((entry) => entry.date === date);
  return numericValue(point?.value) ?? 0;
}

function splitBreakdown(series: InsightSeries | undefined): { positive: number | null; negative: number | null } {
  if (!series) return { positive: null, negative: null };
  let positive = 0;
  let negative = 0;
  let saw = false;
  for (const point of series.points) {
    if (!point.value || typeof point.value !== "object") continue;
    saw = true;
    for (const [key, raw] of Object.entries(point.value as Record<string, unknown>)) {
      const amount = numericValue(raw) ?? 0;
      const paidOrFollower = key === "1" || key === "true" || key === "yes";
      if (paidOrFollower) positive += amount;
      else negative += amount;
    }
  }
  if (!saw) return { positive: null, negative: null };
  return { positive, negative };
}

function isMetaRateLimit(error: unknown): boolean {
  return error instanceof MetaProviderError && error.details.type === "rate_limit";
}

/**
 * Meta provider client for OAuth and API operations
 */
export class MetaOAuthProvider {
  private readonly apiVersion: string;
  private readonly graphBaseUrl: string;

  constructor() {
    this.apiVersion = getCustomerMetaApiVersion();
    this.graphBaseUrl = getCustomerMetaGraphBaseUrl();
  }

  /**
   * Generate OAuth authorization URL
   */
  generateAuthUrl(params: {
    redirectUri: string;
    state: string;
    scopes?: string[];
  }): string {
    const scopes = params.scopes || getAllMetaScopes();

    const url = new URL(getCustomerMetaOAuthUrl());
    url.searchParams.set("client_id", this.getAppId());
    url.searchParams.set("redirect_uri", params.redirectUri);
    url.searchParams.set("state", params.state);
    url.searchParams.set("scope", scopes.join(","));
    url.searchParams.set("response_type", "code");

    return url.toString();
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(params: {
    code: string;
    redirectUri: string;
  }): Promise<MetaTokenResponse> {
    try {
      // Step 1: Get short-lived token
      const shortTokenUrl = new URL(getCustomerMetaTokenUrl());
      shortTokenUrl.searchParams.set("client_id", this.getAppId());
      shortTokenUrl.searchParams.set("client_secret", this.getAppSecret());
      shortTokenUrl.searchParams.set("redirect_uri", params.redirectUri);
      shortTokenUrl.searchParams.set("code", params.code);

      const shortTokenRes = await fetch(shortTokenUrl.toString());
      if (!shortTokenRes.ok) {
        throw await this.handleErrorResponse(shortTokenRes);
      }

      const shortTokenData = await shortTokenRes.json();

      // Step 2: Exchange for long-lived token (60 days)
      const longTokenUrl = new URL(getCustomerMetaTokenUrl());
      longTokenUrl.searchParams.set("grant_type", "fb_exchange_token");
      longTokenUrl.searchParams.set("client_id", this.getAppId());
      longTokenUrl.searchParams.set("client_secret", this.getAppSecret());
      longTokenUrl.searchParams.set("fb_exchange_token", shortTokenData.access_token);

      const longTokenRes = await fetch(longTokenUrl.toString());
      if (!longTokenRes.ok) {
        throw await this.handleErrorResponse(longTokenRes);
      }

      const longTokenData = await longTokenRes.json();

      return {
        accessToken: longTokenData.access_token,
        expiresIn: longTokenData.expires_in || 5184000, // 60 days default
        tokenType: "Bearer",
      };
    } catch (error) {
      if (error instanceof MetaProviderError) {
        throw error;
      }
      throw new MetaProviderError(classifyNetworkError(error as Error));
    }
  }

  /**
   * Fetch user profile information
   */
  async fetchUserProfile(accessToken: string): Promise<MetaUserProfile> {
    const url = new URL(`${this.graphBaseUrl}/me`);
    url.searchParams.set("fields", "id,name,email,picture.type(large)");
    url.searchParams.set("access_token", accessToken);

    const response = await this.fetchWithErrorHandling(url.toString());

    return {
      platformUserId: response.id,
      displayName: response.name,
      email: response.email,
      profilePictureUrl: response.picture?.data?.url,
    };
  }

  /**
   * Verify granted scopes match required scopes
   */
  async verifyScopes(accessToken: string, requiredScopes: string[]): Promise<boolean> {
    const url = new URL(`${this.graphBaseUrl}/me/permissions`);
    url.searchParams.set("access_token", accessToken);

    const response = await this.fetchWithErrorHandling(url.toString());

    const grantedScopes = (response.data || [])
      .filter((permission: any) => permission.status === "granted")
      .map((permission: any) => permission.permission);

    return requiredScopes.every((scope) => grantedScopes.includes(scope));
  }

  /**
   * Facebook pages and Marketing API ad accounts.
   * Instagram uses fetchInstagramAdAccounts instead.
   */
  async fetchFacebookAssets(accessToken: string): Promise<MetaPlatformAsset[]> {
    const budget: MetaFetchBudget = { rateLimited: false };
    const adAccounts: MetaPlatformAsset[] = [];
    const seenAdAccountIds = new Set<string>();
    const accountFields = "id,account_id,name,account_status,currency,timezone_name,business";
    await this.fetchEdge("me/adaccounts", accessToken, { fields: accountFields }, (accountData) => {
      this.collectAdAccount(adAccounts, seenAdAccountIds, accountData, { ownership: "user" });
    }, budget);

    const businesses = budget.rateLimited ? [] : await this.fetchBusinessesInternal(accessToken, budget);
    if (!budget.rateLimited) {
      const portfolioAccounts = await this.fetchAdAccounts(accessToken, businesses, budget);
      for (const account of portfolioAccounts) {
        if (seenAdAccountIds.has(account.platformAssetId)) continue;
        seenAdAccountIds.add(account.platformAssetId);
        adAccounts.push(account);
      }
    }
    const pages = await this.fetchPages(accessToken, businesses, budget);

    const assets: MetaPlatformAsset[] = [
      ...pages,
      ...adAccounts,
      ...businesses.map((business) => ({
        platformAssetId: business.id,
        assetType: "meta_business_manager" as const,
        name: business.name,
        profilePictureUrl: business.picture?.data?.url,
        capabilities: { can_manage_business: true },
      })),
    ];

    if (adAccounts.length === 0 && budget.rateLimited) {
      throw new MetaProviderError({
        type: "rate_limit",
        severity: "low",
        platform: "Meta",
        platformErrorCode: 4,
        platformErrorMessage: "Application request limit reached",
        requiresReconnect: false,
        retryable: true,
      });
    }

    return assets;
  }

  async fetchAllAssets(accessToken: string): Promise<MetaPlatformAsset[]> {
    return this.fetchFacebookAssets(accessToken);
  }

  /**
   * Pages the user can manage. Uses /me/accounts so a pages-only token
   * does not need Business Manager access.
   */
  async fetchFacebookPages(accessToken: string): Promise<MetaPlatformAsset[]> {
    const budget: MetaFetchBudget = { rateLimited: false };
    const pages = await this.fetchPages(accessToken, [], budget);
    if (pages.length === 0 && budget.rateLimited) {
      throw new MetaProviderError({
        type: "rate_limit",
        severity: "low",
        platform: "Meta",
        platformErrorCode: 4,
        platformErrorMessage: "Application request limit reached",
        requiresReconnect: false,
        retryable: true,
      });
    }
    return pages;
  }

  /**
   * Ad accounts an Instagram professional account is allowed to advertise with.
   * GET /{ig-user-id}/authorized_adaccounts?business={business-id}
   */
  async fetchInstagramAdAccounts(accessToken: string): Promise<MetaPlatformAsset[]> {
    const budget: MetaFetchBudget = { rateLimited: false };
    const businesses = await this.fetchBusinessesInternal(accessToken, budget);
    const pages = await this.fetchPages(accessToken, businesses, budget);
    const instagramAccounts = await this.fetchInstagramAccounts(accessToken, pages, budget);
    const adAccounts = await this.fetchInstagramAuthorizedAdAccounts(
      accessToken,
      instagramAccounts,
      businesses.map((business) => ({
        platformAssetId: business.id,
        assetType: "meta_business_manager" as const,
        name: business.name,
      })),
      budget,
    );

    if (adAccounts.length === 0 && budget.rateLimited) {
      throw new MetaProviderError({
        type: "rate_limit",
        severity: "low",
        platform: "Meta",
        platformErrorCode: 4,
        platformErrorMessage: "Application request limit reached",
        requiresReconnect: false,
        retryable: true,
      });
    }

    return adAccounts;
  }

  /**
   * Fetch Facebook Pages
   */
  private async fetchPages(
    accessToken: string,
    businesses: Array<{ id: string; name: string }>,
    budget: MetaFetchBudget,
  ): Promise<MetaPlatformAsset[]> {
    const pages: MetaPlatformAsset[] = [];
    const seenIds = new Set<string>();

    await this.fetchEdge(
      "me/accounts",
      accessToken,
      { fields: "id,username,name,access_token,picture.type(large),category" },
      (pageData: any) => {
        if (!seenIds.has(pageData.id)) {
          seenIds.add(pageData.id);
          pages.push({
            platformAssetId: pageData.id,
            assetType: "facebook_page",
            name: pageData.name,
            username: pageData.username,
            profilePictureUrl: pageData.picture?.data?.url,
            description: pageData.category,
            accountAccessToken: pageData.access_token, // Page token never expires
            capabilities: {
              can_post: true,
              can_moderate: true,
              can_view_insights: true,
            },
          });
        }
      },
      budget,
    );

    for (const business of businesses) {
      if (budget.rateLimited) break;
      await this.fetchEdge(
        `${business.id}/owned_pages`,
        accessToken,
        { fields: "id,username,name,access_token,picture.type(large)" },
        (pageData: any) => {
            if (!seenIds.has(pageData.id) && pageData.access_token) {
              seenIds.add(pageData.id);
              pages.push({
                platformAssetId: pageData.id,
                assetType: "facebook_page",
                name: pageData.name,
                username: pageData.username,
                profilePictureUrl: pageData.picture?.data?.url,
                businessId: business.id,
                businessName: business.name,
                accountAccessToken: pageData.access_token,
                capabilities: {
                  can_post: true,
                  can_moderate: true,
                  can_view_insights: true,
                },
                metadata: {
                  ownership: "owned",
                },
              });
            }
          },
          budget,
        );

      if (budget.rateLimited) break;
      await this.fetchEdge(
        `${business.id}/client_pages`,
        accessToken,
        { fields: "id,username,name,access_token,picture.type(large)" },
        (pageData: any) => {
            if (!seenIds.has(pageData.id) && pageData.access_token) {
              seenIds.add(pageData.id);
              pages.push({
                platformAssetId: pageData.id,
                assetType: "facebook_page",
                name: pageData.name,
                username: pageData.username,
                profilePictureUrl: pageData.picture?.data?.url,
                businessId: business.id,
                businessName: business.name,
                accountAccessToken: pageData.access_token,
                capabilities: {
                  can_post: true,
                  can_moderate: true,
                  can_view_insights: true,
                },
                metadata: {
                  ownership: "client",
                },
              });
            }
          },
          budget,
        );
    }

    return pages;
  }

  /**
   * Every ad account the token can see.
   * /me/adaccounts is only the user's personal roles. A Business Manager portfolio
   * also includes owned accounts, client accounts, asset-group accounts, and
   * accounts on child businesses.
   */
  private async fetchAdAccounts(
    accessToken: string,
    businesses: Array<{ id: string; name: string }>,
    budget: MetaFetchBudget,
  ): Promise<MetaPlatformAsset[]> {
    const adAccounts: MetaPlatformAsset[] = [];
    const seenIds = new Set<string>();
    const fields = "id,account_id,name,account_status,currency,timezone_name,business";

    for (const business of businesses) {
      if (budget.rateLimited) break;
      await this.fetchEdge(`${business.id}/owned_ad_accounts`, accessToken, { fields }, (accountData) => {
        this.collectAdAccount(adAccounts, seenIds, accountData, {
          businessId: business.id,
          businessName: business.name,
          ownership: "owned",
        });
      }, budget);
      if (budget.rateLimited) break;
      await this.fetchEdge(`${business.id}/client_ad_accounts`, accessToken, { fields }, (accountData) => {
        this.collectAdAccount(adAccounts, seenIds, accountData, {
          businessId: business.id,
          businessName: business.name,
          ownership: "client",
        });
      }, budget);

      const groups: Array<{ id: string }> = [];
      await this.fetchEdge(
        `${business.id}/business_asset_groups`,
        accessToken,
        { fields: "id,name" },
        (group) => {
          if (group?.id) groups.push({ id: String(group.id) });
        },
        budget,
      );
      for (const group of groups) {
        if (budget.rateLimited) break;
        await this.fetchEdge(`${group.id}/contained_adaccounts`, accessToken, { fields }, (accountData) => {
          this.collectAdAccount(adAccounts, seenIds, accountData, {
            businessId: business.id,
            businessName: business.name,
            ownership: "asset_group",
          });
        }, budget);
      }
    }

    const businessUsers: Array<{ id: string; business?: { id?: string; name?: string } }> = [];
    await this.fetchEdge("me/business_users", accessToken, { fields: "id,business{id,name}" }, (businessUser) => {
      if (businessUser?.id) businessUsers.push(businessUser);
    }, budget);
    for (const businessUser of businessUsers) {
      if (budget.rateLimited) break;
      await this.fetchEdge(`${businessUser.id}/assigned_ad_accounts`, accessToken, { fields }, (accountData) => {
        this.collectAdAccount(adAccounts, seenIds, accountData, {
          businessId: businessUser.business?.id,
          businessName: businessUser.business?.name,
          ownership: "assigned",
        });
      }, budget);
    }

    return adAccounts;
  }

  private async fetchEdge(
    path: string,
    accessToken: string,
    params: Record<string, string>,
    onItem: (item: any) => void,
    budget?: MetaFetchBudget,
  ) {
    if (budget?.rateLimited) return;
    try {
      await this.fetchPaginated(
        `${this.graphBaseUrl}/${path}`,
        { ...params, access_token: accessToken },
        onItem,
      );
    } catch (error) {
      if (budget && isMetaRateLimit(error)) budget.rateLimited = true;
      console.warn(`Meta edge ${path} failed:`, error);
    }
  }

  private collectAdAccount(
    adAccounts: MetaPlatformAsset[],
    seenIds: Set<string>,
    accountData: any,
    extra: { businessId?: string; businessName?: string; ownership?: string },
  ) {
    const accountId = String(accountData?.account_id || String(accountData?.id || "").replace(/^act_/, ""));
    if (!accountId || seenIds.has(accountId)) return;
    seenIds.add(accountId);
    adAccounts.push({
      platformAssetId: accountId,
      assetType: "meta_ad_account",
      name: accountData.name || `Ad account ${accountId}`,
      businessId: extra.businessId || accountData.business?.id,
      businessName: extra.businessName || accountData.business?.name,
      capabilities: {
        can_create_campaigns: true,
        can_manage_ads: true,
        can_view_insights: true,
      },
      metadata: {
        currency: accountData.currency,
        timezone: accountData.timezone_name,
        spend_cap: accountData.spend_cap,
        amount_spent: accountData.amount_spent,
        balance: accountData.balance,
        account_status: accountData.account_status,
        ownership: extra.ownership,
      },
    });
  }

  /**
   * Ad accounts a business has authorized for an Instagram professional account.
   * GET /{ig-user-id}/authorized_adaccounts?business={business-id}
   */
  private async fetchInstagramAuthorizedAdAccounts(
    accessToken: string,
    instagramAccounts: MetaPlatformAsset[],
    businesses: MetaPlatformAsset[],
    budget: MetaFetchBudget,
  ): Promise<MetaPlatformAsset[]> {
    const adAccounts: MetaPlatformAsset[] = [];
    const seenIds = new Set<string>();
    if (instagramAccounts.length === 0 || businesses.length === 0 || budget.rateLimited) return adAccounts;

    for (const instagramAccount of instagramAccounts) {
      if (budget.rateLimited) break;
      for (const business of businesses) {
        if (budget.rateLimited) break;
        await this.fetchEdge(
          `${instagramAccount.platformAssetId}/authorized_adaccounts`,
          accessToken,
          {
            business: business.platformAssetId,
            fields: "id,account_id,name,account_status,currency,timezone_name",
          },
          (accountData: any) => {
            this.collectAdAccount(adAccounts, seenIds, accountData, {
              businessId: business.platformAssetId,
              businessName: business.name,
              ownership: "instagram",
            });
          },
          budget,
        );
      }
    }

    return adAccounts;
  }

  /**
   * Fetch Business Managers
   */
  private async fetchBusinesses(accessToken: string): Promise<MetaPlatformAsset[]> {
    const businesses = await this.fetchBusinessesInternal(accessToken);

    return businesses.map((business) => ({
      platformAssetId: business.id,
      assetType: "meta_business_manager",
      name: business.name,
      profilePictureUrl: business.picture?.data?.url,
      capabilities: {
        can_manage_business: true,
      },
    }));
  }

  /**
   * Internal: Fetch businesses as raw data
   */
  private async fetchBusinessesInternal(
    accessToken: string,
    budget: MetaFetchBudget = { rateLimited: false },
  ): Promise<Array<{ id: string; name: string; picture?: any }>> {
    const businesses = new Map<string, { id: string; name: string; picture?: any }>();
    const add = (businessData: any) => {
      const id = String(businessData?.id || "");
      if (!id || businesses.has(id)) return;
      businesses.set(id, {
        id,
        name: businessData.name || id,
        picture: businessData.picture,
      });
    };

    await this.fetchEdge("me/businesses", accessToken, { fields: "id,name,picture" }, add, budget);
    await this.fetchEdge("me/business_users", accessToken, { fields: "id,business{id,name}" }, (row) => {
      if (row?.business) add(row.business);
    }, budget);

    const pending = [...businesses.keys()];
    const visited = new Set<string>();
    while (pending.length > 0 && visited.size < 50 && !budget.rateLimited) {
      const parentId = pending.shift();
      if (!parentId || visited.has(parentId)) continue;
      visited.add(parentId);
      await this.fetchEdge(`${parentId}/owned_businesses`, accessToken, { fields: "id,name" }, (child) => {
        const childId = String(child?.id || "");
        const alreadyKnown = businesses.has(childId);
        add(child);
        if (childId && !alreadyKnown) pending.push(childId);
      }, budget);
    }

    return [...businesses.values()];
  }

  /**
   * Fetch Instagram accounts linked to pages
   */
  private async fetchInstagramAccounts(
    accessToken: string,
    pages: MetaPlatformAsset[],
    budget: MetaFetchBudget,
  ): Promise<MetaPlatformAsset[]> {
    const instagramAccounts: MetaPlatformAsset[] = [];

    for (const page of pages) {
      if (budget.rateLimited) break;
      try {
        const url = new URL(`${this.graphBaseUrl}/${page.platformAssetId}`);
        url.searchParams.set(
          "fields",
          "instagram_business_account{id,username,name,profile_picture_url,followers_count}"
        );
        url.searchParams.set("access_token", accessToken);

        const response = await this.fetchWithErrorHandling(url.toString());

        if (response.instagram_business_account) {
          const ig = response.instagram_business_account;
          instagramAccounts.push({
            platformAssetId: ig.id,
            assetType: "instagram_business_account",
            name: ig.name || ig.username,
            username: ig.username,
            profilePictureUrl: ig.profile_picture_url,
            parentAssetId: page.platformAssetId,
            capabilities: {
              can_post: true,
              can_view_insights: true,
            },
            metadata: {
              linked_page_id: page.platformAssetId,
              followers_count: ig.followers_count,
            },
          });
        }
      } catch (error) {
        if (isMetaRateLimit(error)) {
          budget.rateLimited = true;
          break;
        }
        console.warn(`No Instagram account for page ${page.platformAssetId}`);
      }
    }

    return instagramAccounts;
  }

  /**
   * Generic paginated fetch helper
   */
  private async fetchPaginated(
    baseUrl: string,
    params: Record<string, string>,
    onItem: (item: any) => void
  ): Promise<void> {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    if (!url.searchParams.has("limit")) url.searchParams.set("limit", "100");
    const pageSize = Number(url.searchParams.get("limit")) || 100;

    let nextUrl: string | undefined = url.toString();
    const seenCursors = new Set<string>();

    while (nextUrl) {
      const response = await this.fetchWithErrorHandling(nextUrl);
      const rows = Array.isArray(response.data) ? response.data : [];
      rows.forEach(onItem);

      const after = typeof response.paging?.cursors?.after === "string" ? response.paging.cursors.after : "";
      if (response.paging?.next) {
        nextUrl = response.paging.next;
      } else if (after && !seenCursors.has(after) && rows.length >= pageSize) {
        seenCursors.add(after);
        const cursorUrl = new URL(url.toString());
        cursorUrl.searchParams.set("after", after);
        nextUrl = cursorUrl.toString();
      } else {
        nextUrl = undefined;
      }
    }
  }

  /**
   * Fetch with error handling
   */
  private async fetchWithErrorHandling(url: string): Promise<any> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw await this.handleErrorResponse(response);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof MetaProviderError) {
        throw error;
      }
      throw new MetaProviderError(classifyNetworkError(error as Error));
    }
  }

  /**
   * Handle error response from Graph API
   */
  private async handleErrorResponse(response: Response): Promise<MetaProviderError> {
    try {
      const errorData: MetaGraphError = await response.json();
      const details = classifyMetaError(errorData.error);
      return new MetaProviderError(details);
    } catch {
      // Failed to parse error response
      return new MetaProviderError({
        type: "platform_error",
        severity: "medium",
        platform: "Meta",
        platformErrorCode: response.status,
        platformErrorMessage: response.statusText,
        retryable: false,
      });
    }
  }

  /**
   * Get Meta App ID from environment
   */
  private getAppId(): string {
    const appId = process.env.CUSTOMER_OAUTH_META_APP_ID;
    if (!appId) {
      throw new Error("CUSTOMER_OAUTH_META_APP_ID environment variable is required");
    }
    return appId;
  }

  /**
   * Page profile fields.
   * https://developers.facebook.com/docs/graph-api/reference/page/
   * Each group is requested on its own so one rejected field does not blank the Page.
   */
  async fetchPageProfile(pageId: string, pageAccessToken: string): Promise<FacebookPageProfile> {
    const groups = await Promise.all([
      this.pageFieldGroup(pageId, pageAccessToken, [
        "id",
        "name",
        "username",
        "about",
        "description",
        "category",
        "link",
        "website",
        "fan_count",
        "followers_count",
        "is_published",
        "verification_status",
      ].join(",")),
      this.pageFieldGroup(pageId, pageAccessToken, [
        "phone",
        "emails",
        "single_line_address",
        "whatsapp_number",
        "location",
      ].join(",")),
      this.pageFieldGroup(pageId, pageAccessToken, [
        "company_overview",
        "mission",
        "products",
        "founded",
        "general_info",
      ].join(",")),
      this.pageFieldGroup(pageId, pageAccessToken, "overall_star_rating,rating_count"),
      this.pageFieldGroup(pageId, pageAccessToken, "hours,is_always_open"),
      this.pageFieldGroup(pageId, pageAccessToken, "category_list"),
      this.pageFieldGroup(pageId, pageAccessToken, "cover,picture"),
      this.pageFieldGroup(pageId, pageAccessToken, "connected_instagram_account{username}"),
    ]);

    const page: Record<string, unknown> = {};
    for (const group of groups) {
      if (group.data) Object.assign(page, group.data);
    }

    const location = page.location && typeof page.location === "object"
      ? page.location as Record<string, unknown>
      : null;
    const address = textOrNull(page.single_line_address) ?? joinAddress(location);
    const categories = Array.isArray(page.category_list)
      ? page.category_list
          .map((item) => (item && typeof item === "object" ? textOrNull((item as Record<string, unknown>).name) : null))
          .filter((name): name is string => Boolean(name))
      : [];
    const emails = Array.isArray(page.emails)
      ? page.emails.filter((email): email is string => typeof email === "string" && email.length > 0)
      : [];
    const instagram = page.connected_instagram_account && typeof page.connected_instagram_account === "object"
      ? textOrNull((page.connected_instagram_account as Record<string, unknown>).username)
      : null;
    const cover = page.cover && typeof page.cover === "object"
      ? textOrNull((page.cover as Record<string, unknown>).source)
      : null;
    const picture = page.picture && typeof page.picture === "object"
      ? (page.picture as Record<string, unknown>).data
      : null;
    const pictureUrl = picture && typeof picture === "object"
      ? textOrNull((picture as Record<string, unknown>).url)
      : null;

    return {
      name: textOrNull(page.name),
      username: textOrNull(page.username),
      about: textOrNull(page.about),
      description: textOrNull(page.description),
      category: textOrNull(page.category),
      categories,
      link: textOrNull(page.link),
      website: textOrNull(page.website),
      phone: textOrNull(page.phone),
      emails,
      whatsapp: textOrNull(page.whatsapp_number),
      address,
      hours: formatPageHours(page.hours, page.is_always_open === true),
      isPublished: typeof page.is_published === "boolean" ? page.is_published : null,
      verificationStatus: textOrNull(page.verification_status),
      likes: numericValue(page.fan_count),
      followers: numericValue(page.followers_count),
      rating: numericValue(page.overall_star_rating),
      ratingCount: numericValue(page.rating_count),
      founded: textOrNull(page.founded),
      companyOverview: textOrNull(page.company_overview),
      mission: textOrNull(page.mission),
      products: textOrNull(page.products),
      generalInfo: textOrNull(page.general_info),
      instagramUsername: instagram,
      coverUrl: cover,
      pictureUrl,
    };
  }

  /**
   * Recent published posts, with reaction, comment, and share counts.
   * https://developers.facebook.com/docs/graph-api/reference/page/feed/
   */
  async fetchRecentPagePosts(pageId: string, pageAccessToken: string): Promise<FacebookPagePost[]> {
    try {
      const body = await this.graphGet(`${pageId}/published_posts`, pageAccessToken, {
        fields: "id,message,created_time,permalink_url,full_picture,shares,reactions.summary(true).limit(0),comments.summary(true).limit(0)",
        limit: "6",
      });
      const rows = Array.isArray(body.data) ? body.data : [];
      return rows.map((row) => {
        const post = row as Record<string, unknown>;
        const reactions = summaryCount(post.reactions);
        const comments = summaryCount(post.comments);
        const shares = post.shares && typeof post.shares === "object"
          ? numericValue((post.shares as Record<string, unknown>).count)
          : null;
        return {
          id: String(post.id ?? ""),
          message: textOrNull(post.message),
          createdTime: textOrNull(post.created_time),
          permalink: textOrNull(post.permalink_url),
          pictureUrl: textOrNull(post.full_picture),
          reactions,
          comments,
          shares,
        };
      }).filter((post) => post.id);
    } catch {
      return [];
    }
  }

  /**
   * Page insights for a date window.
   * https://developers.facebook.com/docs/graph-api/reference/page/insights/
   * Views use page_media_view. Older impression metrics are deprecated.
   */
  async fetchPageInsights(
    pageId: string,
    pageAccessToken: string,
    since: number,
    until: number,
  ): Promise<FacebookPageInsights> {
    const window = { since: String(since), until: String(until), period: "day" };
    const groups = await Promise.all([
      this.insightGroup(pageId, pageAccessToken, [
        "page_media_view",
        "page_total_media_view_unique",
      ], window),
      this.insightGroup(pageId, pageAccessToken, [
        "page_post_engagements",
        "page_follows",
        "page_daily_follows_unique",
        "page_daily_unfollows_unique",
        "page_views_total",
        "page_total_actions",
      ], window),
      this.insightGroup(pageId, pageAccessToken, [
        "page_actions_post_reactions_like_total",
        "page_actions_post_reactions_love_total",
        "page_actions_post_reactions_wow_total",
        "page_actions_post_reactions_haha_total",
        "page_actions_post_reactions_sorry_total",
        "page_actions_post_reactions_anger_total",
      ], window),
      this.insightGroup(pageId, pageAccessToken, ["page_media_view"], {
        ...window,
        breakdown: "is_from_ads",
      }),
      this.insightGroup(pageId, pageAccessToken, ["page_media_view"], {
        ...window,
        breakdown: "is_from_followers",
      }),
    ]);

    const byName = new Map<string, InsightSeries>();
    const unavailable: string[] = [];
    for (const group of groups) {
      if (group.error) unavailable.push(group.error);
      for (const series of group.series) {
        const key = series.breakdown ? `${series.name}:${series.breakdown}` : series.name;
        byName.set(key, series);
      }
    }

    let followersCount: number | null = null;
    try {
      const page = await this.graphGet(`${pageId}`, pageAccessToken, {
        fields: "followers_count",
      });
      if (typeof page.followers_count === "number") followersCount = page.followers_count;
    } catch {
      unavailable.push("followers_count");
    }

    const views = byName.get("page_media_view");
    const viewers = byName.get("page_total_media_view_unique");
    const engagements = byName.get("page_post_engagements");
    const follows = byName.get("page_follows");
    const dailyFollows = byName.get("page_daily_follows_unique");
    const dailyUnfollows = byName.get("page_daily_unfollows_unique");
    const visits = byName.get("page_views_total");
    const actions = byName.get("page_total_actions");
    const adsSplit = splitBreakdown(byName.get("page_media_view:is_from_ads"));
    const followerSplit = splitBreakdown(byName.get("page_media_view:is_from_followers"));

    const dates = new Set<string>();
    for (const series of [views, viewers, engagements, visits, dailyFollows, dailyUnfollows]) {
      for (const point of series?.points ?? []) dates.add(point.date);
    }
    const series = [...dates].filter(Boolean).sort().map((date) => ({
      date,
      views: pointValue(views, date),
      viewers: pointValue(viewers, date),
      engagements: pointValue(engagements, date),
      visits: pointValue(visits, date),
      newFollows: pointValue(dailyFollows, date),
      unfollows: pointValue(dailyUnfollows, date),
    }));

    const latestFollows = lastNumber(follows);
    return {
      followers: latestFollows ?? followersCount,
      views: sumPoints(views),
      viewers: sumPoints(viewers),
      engagements: sumPoints(engagements),
      pageVisits: sumPoints(visits),
      buttonClicks: sumPoints(actions),
      newFollows: sumPoints(dailyFollows),
      unfollows: sumPoints(dailyUnfollows),
      viewsFromAds: adsSplit.positive,
      viewsOrganic: adsSplit.negative,
      viewsFromFollowers: followerSplit.positive,
      viewsFromNonFollowers: followerSplit.negative,
      reactions: {
        like: sumPoints(byName.get("page_actions_post_reactions_like_total")),
        love: sumPoints(byName.get("page_actions_post_reactions_love_total")),
        haha: sumPoints(byName.get("page_actions_post_reactions_haha_total")),
        wow: sumPoints(byName.get("page_actions_post_reactions_wow_total")),
        sad: sumPoints(byName.get("page_actions_post_reactions_sorry_total")),
        angry: sumPoints(byName.get("page_actions_post_reactions_anger_total")),
      },
      series,
      unavailable,
    };
  }

  private async insightGroup(
    pageId: string,
    pageAccessToken: string,
    metrics: string[],
    params: Record<string, string>,
  ): Promise<{ series: InsightSeries[]; error?: string }> {
    try {
      const body = await this.graphGet(`${pageId}/insights`, pageAccessToken, {
        metric: metrics.join(","),
        ...params,
      });
      const rows = Array.isArray(body.data) ? body.data : [];
      return {
        series: rows.map((row: InsightApiRow) => ({
          name: String(row.name ?? ""),
          breakdown: params.breakdown,
          points: (row.values ?? []).map((entry) => ({
            date: insightDate(entry.end_time),
            value: entry.value,
          })),
        })),
      };
    } catch (error) {
      return { series: [], error: error instanceof Error ? error.message : "Page insights request failed" };
    }
  }

  private async pageFieldGroup(
    pageId: string,
    pageAccessToken: string,
    fields: string,
  ): Promise<{ data?: Record<string, unknown> }> {
    try {
      const body = await this.graphGet(pageId, pageAccessToken, { fields });
      return { data: body };
    } catch {
      return {};
    }
  }

  private async graphGet(
    path: string,
    accessToken: string,
    params: Record<string, string>,
  ): Promise<Record<string, any>> {
    const url = new URL(`${this.graphBaseUrl}/${path}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    url.searchParams.set("access_token", accessToken);
    const response = await fetch(url.toString());
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body?.error) {
      throw new Error(body?.error?.message || "Facebook Page request failed");
    }
    return body;
  }

  /**
   * Get Meta App Secret from environment
   */
  private getAppSecret(): string {
    const appSecret = process.env.CUSTOMER_OAUTH_META_APP_SECRET;
    if (!appSecret) {
      throw new Error("CUSTOMER_OAUTH_META_APP_SECRET environment variable is required");
    }
    return appSecret;
  }
}

/**
 * Custom error class for Meta provider
 */
export class MetaProviderError extends Error {
  constructor(public readonly details: OAuthErrorDetails) {
    super(details.platformErrorMessage || "Meta provider error");
    this.name = "MetaProviderError";
  }
}
