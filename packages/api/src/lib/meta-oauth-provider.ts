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
 * Meta OAuth scopes for full platform access
 */
export const META_OAUTH_SCOPES = {
  // Pages & posting
  pages: [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "pages_manage_engagement",
    "pages_read_user_content",
    "pages_manage_metadata",
  ],
  // Instagram
  instagram: [
    "instagram_basic",
    "instagram_content_publish",
    "instagram_manage_comments",
    "instagram_manage_insights",
  ],
  // Ads & Business
  ads: [
    "ads_read",
    "ads_management",
    "business_management",
    "read_insights",
    "catalog_management",
  ],
  // User info
  basic: ["public_profile", "email"],
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
   * Fetch all assets customer has access to
   */
  async fetchAllAssets(accessToken: string): Promise<MetaPlatformAsset[]> {
    const assets: MetaPlatformAsset[] = [];

    // Fetch in parallel for performance
    const [pages, adAccounts, businesses] = await Promise.all([
      this.fetchPages(accessToken),
      this.fetchAdAccounts(accessToken),
      this.fetchBusinesses(accessToken),
    ]);

    assets.push(...pages);
    assets.push(...adAccounts);
    assets.push(...businesses);

    // Fetch Instagram accounts linked to pages
    const instagramAccounts = await this.fetchInstagramAccounts(accessToken, pages);
    assets.push(...instagramAccounts);

    // Fetch pixels for ad accounts (optional, can be slow)
    // const pixels = await this.fetchPixels(accessToken, adAccounts);
    // assets.push(...pixels);

    return assets;
  }

  /**
   * Fetch Facebook Pages
   */
  private async fetchPages(accessToken: string): Promise<MetaPlatformAsset[]> {
    const pages: MetaPlatformAsset[] = [];
    const seenIds = new Set<string>();

    // Fetch from /me/accounts
    await this.fetchPaginated(
      `${this.graphBaseUrl}/me/accounts`,
      {
        fields: "id,username,name,access_token,picture.type(large),category",
        access_token: accessToken,
      },
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
      }
    );

    // Also fetch from Business Manager (if accessible)
    try {
      const businesses = await this.fetchBusinessesInternal(accessToken);

      for (const business of businesses) {
        // Owned pages
        await this.fetchPaginated(
          `${this.graphBaseUrl}/${business.id}/owned_pages`,
          {
            fields: "id,username,name,access_token,picture.type(large)",
            access_token: accessToken,
          },
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
          }
        );

        // Client pages
        await this.fetchPaginated(
          `${this.graphBaseUrl}/${business.id}/client_pages`,
          {
            fields: "id,username,name,access_token,picture.type(large)",
            access_token: accessToken,
          },
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
          }
        );
      }
    } catch (error) {
      console.warn("Failed to fetch Business Manager pages:", error);
    }

    return pages;
  }

  /**
   * Fetch Ad Accounts
   */
  private async fetchAdAccounts(accessToken: string): Promise<MetaPlatformAsset[]> {
    const adAccounts: MetaPlatformAsset[] = [];
    const seenIds = new Set<string>();

    // Fetch from /me/adaccounts
    await this.fetchPaginated(
      `${this.graphBaseUrl}/me/adaccounts`,
      {
        fields:
          "id,account_id,name,account_status,currency,timezone_name,spend_cap,amount_spent,balance,business,capabilities",
        access_token: accessToken,
      },
      (accountData: any) => {
        if (!seenIds.has(accountData.account_id)) {
          seenIds.add(accountData.account_id);
          adAccounts.push({
            platformAssetId: accountData.account_id,
            assetType: "meta_ad_account",
            name: accountData.name,
            businessId: accountData.business?.id,
            businessName: accountData.business?.name,
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
              raw_capabilities: accountData.capabilities || [],
            },
          });
        }
      }
    );

    // Also fetch from Business Manager
    try {
      const businesses = await this.fetchBusinessesInternal(accessToken);

      for (const business of businesses) {
        // Owned ad accounts
        await this.fetchPaginated(
          `${this.graphBaseUrl}/${business.id}/owned_ad_accounts`,
          {
            fields:
              "id,account_id,name,account_status,currency,timezone_name,spend_cap,amount_spent,balance",
            access_token: accessToken,
          },
          (accountData: any) => {
            if (!seenIds.has(accountData.account_id)) {
              seenIds.add(accountData.account_id);
              adAccounts.push({
                platformAssetId: accountData.account_id,
                assetType: "meta_ad_account",
                name: accountData.name,
                businessId: business.id,
                businessName: business.name,
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
                  ownership: "owned",
                },
              });
            }
          }
        );

        // Client ad accounts
        await this.fetchPaginated(
          `${this.graphBaseUrl}/${business.id}/client_ad_accounts`,
          {
            fields:
              "id,account_id,name,account_status,currency,timezone_name,spend_cap,amount_spent,balance",
            access_token: accessToken,
          },
          (accountData: any) => {
            if (!seenIds.has(accountData.account_id)) {
              seenIds.add(accountData.account_id);
              adAccounts.push({
                platformAssetId: accountData.account_id,
                assetType: "meta_ad_account",
                name: accountData.name,
                businessId: business.id,
                businessName: business.name,
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
                  ownership: "client",
                },
              });
            }
          }
        );
      }
    } catch (error) {
      console.warn("Failed to fetch Business Manager ad accounts:", error);
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
    accessToken: string
  ): Promise<Array<{ id: string; name: string; picture?: any }>> {
    const businesses: Array<{ id: string; name: string; picture?: any }> = [];

    await this.fetchPaginated(
      `${this.graphBaseUrl}/me/businesses`,
      {
        access_token: accessToken,
      },
      (businessData: any) => {
        businesses.push({
          id: businessData.id,
          name: businessData.name,
          picture: businessData.picture,
        });
      }
    );

    return businesses;
  }

  /**
   * Fetch Instagram accounts linked to pages
   */
  private async fetchInstagramAccounts(
    accessToken: string,
    pages: MetaPlatformAsset[]
  ): Promise<MetaPlatformAsset[]> {
    const instagramAccounts: MetaPlatformAsset[] = [];

    for (const page of pages) {
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
        // Page might not have Instagram linked, continue
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
    url.searchParams.set("limit", "100");

    let nextUrl: string | undefined = url.toString();

    while (nextUrl) {
      const response = await this.fetchWithErrorHandling(nextUrl);

      if (response.data && Array.isArray(response.data)) {
        response.data.forEach(onItem);
      }

      nextUrl = response.paging?.next;
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
