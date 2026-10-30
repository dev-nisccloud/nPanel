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
