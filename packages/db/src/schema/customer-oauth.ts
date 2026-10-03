import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  numeric,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { team } from "./teams";
import { metaAdsAccount } from "./meta-ads";

// ============================================================================
// CUSTOMER SELF-SERVICE OAUTH SYSTEM
// For customers to connect their own social/ads accounts without admin access
// ============================================================================

/**
 * Core OAuth connections - one per platform per customer
 * Customer authenticates with platform and grants access to their accounts
 */
export const customerOAuthConnection = pgTable(
  "customer_oauth_connection",
  {
    id: text("id").primaryKey(),
    
    // Multi-tenant isolation
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "cascade" }),
    
    // Platform identification
    platform: text("platform").notNull(), // 'meta_facebook', 'google_ads', 'linkedin_ads', etc.
    platformUserId: text("platform_user_id").notNull(), // Meta user ID, Google account ID, etc.
    platformBusinessId: text("platform_business_id"), // Meta Business Manager ID, Google MCC ID, etc.
    
    // OAuth credentials (ENCRYPTED - never store plain text)
    accessToken: text("access_token").notNull(), // Encrypted
    refreshToken: text("refresh_token"), // Encrypted (if platform supports)
    tokenType: text("token_type").default("Bearer"),
    tokenExpiresAt: timestamp("token_expires_at"),
    
    // Granted scopes (what customer approved)
    scopes: text("scopes").array(), // ['pages_manage_posts', 'ads_management', etc.]
    
    // Connection metadata
    displayName: text("display_name"),
    email: text("email"),
    profilePictureUrl: text("profile_picture_url"),
    
    // Connection status
    status: text("status").default("ACTIVE").notNull(), 
    // ACTIVE, EXPIRED, REVOKED, ERROR, PENDING_SELECTION
    requiresReconnect: boolean("requires_reconnect").default(false).notNull(),
    lastVerifiedAt: timestamp("last_verified_at"),
    lastRefreshAt: timestamp("last_refresh_at"),
    lastError: text("last_error"),
    errorCount: integer("error_count").default(0).notNull(),
    
    // Two-step flow support (like Facebook page selection)
    awaitingAccountSelection: boolean("awaiting_account_selection").default(false).notNull(),
    selectionExpiresAt: timestamp("selection_expires_at"),
    selectionData: jsonb("selection_data"), // Temporary storage for available accounts during selection
    
    // Audit
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => user.id),
  },
  (table) => [
    uniqueIndex("customer_oauth_connection_user_platform_unique").on(
      table.userId,
      table.platform,
      table.platformUserId
    ),
    index("customer_oauth_connection_userId_idx").on(table.userId),
    index("customer_oauth_connection_teamId_idx").on(table.teamId),
    index("customer_oauth_connection_platform_idx").on(table.platform),
    index("customer_oauth_connection_status_idx").on(table.status),
    index("customer_oauth_connection_expires_idx").on(table.tokenExpiresAt),
    index("customer_oauth_connection_needs_refresh_idx").on(table.requiresReconnect),
    index("customer_oauth_connection_business_idx").on(table.platformBusinessId),
  ]
);

/**
 * Platform assets under each OAuth connection
 * Pages, Ad Accounts, Instagram accounts, Pixels, Catalogs, etc.
 */
export const customerPlatformAsset = pgTable(
  "customer_platform_asset",
  {
    id: text("id").primaryKey(),
    connectionId: text("connection_id")
      .notNull()
      .references(() => customerOAuthConnection.id, { onDelete: "cascade" }),
    
    // Multi-tenant (denormalized for query performance)
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "cascade" }),
    
    // Asset identification
    platform: text("platform").notNull(),
    assetType: text("asset_type").notNull(), 
    // 'facebook_page', 'instagram_business_account', 'meta_ad_account', 
    // 'meta_business_manager', 'meta_pixel', 'meta_catalog',
    // 'google_ad_account', 'linkedin_organization', 'linkedin_ad_account', etc.
    
    platformAssetId: text("platform_asset_id").notNull(), // act_123, page_456, ig_789
    platformParentId: text("platform_parent_id"), // Parent asset ID on platform
    
    // Asset-specific access token (for assets like FB pages with own tokens)
    assetAccessToken: text("asset_access_token"), // ENCRYPTED
    assetTokenExpiresAt: timestamp("asset_token_expires_at"),
    
    // Asset metadata
    name: text("name").notNull(),
    username: text("username"),
    profilePictureUrl: text("profile_picture_url"),
    description: text("description"),
    
    // Business hierarchy
    parentAssetId: text("parent_asset_id").references(() => customerPlatformAsset.id, { 
      onDelete: "set null" 
    }),
    businessId: text("business_id"), // Meta Business ID, Google MCC ID
    businessName: text("business_name"),
    
    // Permissions & capabilities (platform-specific)
    permissions: jsonb("permissions"), // ['MANAGE', 'EDIT', 'CREATE_CONTENT', etc.]
    capabilities: jsonb("capabilities"), // {can_post: true, can_create_ads: true, etc.}
    limits: jsonb("limits"), // Rate limits, spend limits
    
    // Asset settings (platform-specific)
    currency: text("currency"),
    timezone: text("timezone"),
    spendLimit: numeric("spend_limit", { precision: 15, scale: 2 }),
    amountSpent: numeric("amount_spent", { precision: 15, scale: 2 }),
    balance: numeric("balance", { precision: 15, scale: 2 }),
    accountStatus: text("account_status"), // ACTIVE, DISABLED, PENDING, etc.
    
    // Health & verification
    isActive: boolean("is_active").default(true).notNull(),
    isVerified: boolean("is_verified").default(false).notNull(),
    lastVerifiedAt: timestamp("last_verified_at"),
    verificationError: text("verification_error"),
    healthScore: integer("health_score"), // 0-100
    
    // Usage tracking
    lastUsedAt: timestamp("last_used_at"),
    usageCount: integer("usage_count").default(0).notNull(),
    lastPostAt: timestamp("last_post_at"),
    lastCampaignAt: timestamp("last_campaign_at"),
    
    // Platform-specific metadata
    metadata: jsonb("metadata"),
    
    // Audit
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("customer_platform_asset_connection_asset_unique").on(
      table.connectionId,
      table.platform,
      table.platformAssetId
    ),
    index("customer_platform_asset_connectionId_idx").on(table.connectionId),
    index("customer_platform_asset_userId_idx").on(table.userId),
    index("customer_platform_asset_teamId_idx").on(table.teamId),
    index("customer_platform_asset_type_idx").on(table.assetType),
    index("customer_platform_asset_platformAssetId_idx").on(table.platformAssetId),
    index("customer_platform_asset_active_idx").on(table.isActive),
    index("customer_platform_asset_businessId_idx").on(table.businessId),
    index("customer_platform_asset_parentAssetId_idx").on(table.parentAssetId),
    index("customer_platform_asset_accountStatus_idx").on(table.accountStatus),
  ]
);

/**
 * Bridge table linking OAuth assets to existing campaign data tables
 * Allows gradual migration from admin-access to OAuth without breaking existing data
 */
export const customerAssetMapping = pgTable(
  "customer_asset_mapping",
  {
    id: text("id").primaryKey(),
    assetId: text("asset_id")
      .notNull()
      .references(() => customerPlatformAsset.id, { onDelete: "cascade" }),
    
    // Links to existing tables (add more as needed)
    metaAdsAccountId: text("meta_ads_account_id").references(() => metaAdsAccount.id, { 
      onDelete: "set null" 
    }),
    // googleAdsAccountId: text("google_ads_account_id").references(...),
    // linkedinAdsAccountId: text("linkedin_ads_account_id").references(...),
    
    // Generic mapping for flexibility
    targetTable: text("target_table"), // 'meta_ads_account', 'google_ads_account', etc.
    targetId: text("target_id"),
    
    // Sync status
    syncStatus: text("sync_status").default("SYNCED").notNull(), 
    // SYNCED, PENDING, ERROR
    lastSyncedAt: timestamp("last_synced_at"),
    syncError: text("sync_error"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("customer_asset_mapping_asset_target_unique").on(
      table.assetId,
      table.targetTable,
      table.targetId
    ),
    index("customer_asset_mapping_assetId_idx").on(table.assetId),
    index("customer_asset_mapping_metaAdsAccountId_idx").on(table.metaAdsAccountId),
    index("customer_asset_mapping_target_idx").on(table.targetTable, table.targetId),
  ]
);

/**
 * OAuth state management for secure flow tracking
 * Temporary records that expire after 1 hour
 */
export const customerOAuthState = pgTable(
  "customer_oauth_state",
  {
    stateToken: text("state_token").primaryKey(),
    
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "cascade" }),
    
    platform: text("platform").notNull(),
    codeVerifier: text("code_verifier"), // For PKCE
    nonce: text("nonce"), // Additional security
    
    // Flow type & context
    flowType: text("flow_type").notNull(), 
    // 'connect', 'reconnect', 'add_assets', 'refresh'
    reconnectConnectionId: text("reconnect_connection_id").references(
      () => customerOAuthConnection.id, 
      { onDelete: "cascade" }
    ),
    returnUrl: text("return_url"),
    
    // Request metadata
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    referer: text("referer"),
    
    // Expiry
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at")
      .notNull()
      .$default(() => new Date(Date.now() + 3600000)), // 1 hour
  },
  (table) => [
    index("customer_oauth_state_expiresAt_idx").on(table.expiresAt),
    index("customer_oauth_state_userId_idx").on(table.userId),
    index("customer_oauth_state_reconnectConnectionId_idx").on(table.reconnectConnectionId),
  ]
);

/**
 * Token refresh queue for background workers
 * Handles automatic token refresh before expiration
 */
export const customerTokenRefreshQueue = pgTable(
  "customer_token_refresh_queue",
  {
    id: text("id").primaryKey(),
    connectionId: text("connection_id")
      .notNull()
      .references(() => customerOAuthConnection.id, { onDelete: "cascade" }),
    
    // Scheduling
    priority: integer("priority").default(0).notNull(), // 0-10, higher = more urgent
    scheduledFor: timestamp("scheduled_for").notNull(),
    
    // Retry logic
    retryCount: integer("retry_count").default(0).notNull(),
    maxRetries: integer("max_retries").default(3).notNull(),
    lastAttemptAt: timestamp("last_attempt_at"),
    lastError: text("last_error"),
    
    // Status
    status: text("status").default("PENDING").notNull(), 
    // PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
    
    // Metadata
    metadata: jsonb("metadata"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("customer_token_refresh_queue_scheduled_idx").on(
      table.scheduledFor,
      table.status
    ),
    index("customer_token_refresh_queue_connectionId_idx").on(table.connectionId),
    index("customer_token_refresh_queue_status_idx").on(table.status),
  ]
);

/**
 * Platform configuration (optional - can also be code-based)
 * Stores platform-specific OAuth and API settings
 */
export const customerPlatformConfig = pgTable(
  "customer_platform_config",
  {
    platform: text("platform").primaryKey(),
    
    displayName: text("display_name").notNull(),
    isEnabled: boolean("is_enabled").default(true).notNull(),
    requiresApproval: boolean("requires_approval").default(false).notNull(),
    
    // OAuth configuration
    authUrlTemplate: text("auth_url_template").notNull(),
    tokenUrlTemplate: text("token_url_template").notNull(),
    revokeUrlTemplate: text("revoke_url_template"),
    
    // Requirements
    requiredScopes: text("required_scopes").array().notNull(),
    optionalScopes: text("optional_scopes").array(),
    supportsRefresh: boolean("supports_refresh").default(true).notNull(),
    requiresAssetSelection: boolean("requires_asset_selection").default(false).notNull(),
    
    // Token lifecycle
    defaultTokenTtlSeconds: integer("default_token_ttl_seconds"),
    refreshBeforeExpirySeconds: integer("refresh_before_expiry_seconds").default(86400),
    
    // Rate limits
    rateLimitPerMinute: integer("rate_limit_per_minute"),
    rateLimitPerHour: integer("rate_limit_per_hour"),
    
    // API configuration
    apiBaseUrl: text("api_base_url"),
    apiVersion: text("api_version"), // e.g., 'v26.0' for Meta
    
    // Platform-specific config
    config: jsonb("config"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  }
);

/**
 * Activity logs for compliance, debugging, and audit trail
 * Tracks all OAuth-related actions
 */
export const customerOAuthActivityLog = pgTable(
  "customer_oauth_activity_log",
  {
    id: text("id").primaryKey(),
    
    connectionId: text("connection_id").references(() => customerOAuthConnection.id, { 
      onDelete: "cascade" 
    }),
    assetId: text("asset_id").references(() => customerPlatformAsset.id, { 
      onDelete: "cascade" 
    }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    
    action: text("action").notNull(), 
    // 'connect', 'disconnect', 'refresh', 'verify', 'select_assets', 'api_call', etc.
    status: text("status").notNull(), // SUCCESS, FAILURE, WARNING
    
    description: text("description"),
    errorMessage: text("error_message"),
    metadata: jsonb("metadata"),
    
    // Request context
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("customer_oauth_activity_log_connectionId_idx").on(table.connectionId),
    index("customer_oauth_activity_log_assetId_idx").on(table.assetId),
    index("customer_oauth_activity_log_userId_idx").on(table.userId),
    index("customer_oauth_activity_log_action_idx").on(table.action),
    index("customer_oauth_activity_log_createdAt_idx").on(table.createdAt),
  ]
);

/**
 * Webhooks from platforms for real-time updates
 * Receives events like account_disabled, token_revoked, etc.
 */
export const customerPlatformWebhook = pgTable(
  "customer_platform_webhook",
  {
    id: text("id").primaryKey(),
    
    platform: text("platform").notNull(),
    webhookId: text("webhook_id"), // Platform-specific webhook ID
    eventType: text("event_type").notNull(),
    
    // Associated resources
    connectionId: text("connection_id").references(() => customerOAuthConnection.id, { 
      onDelete: "cascade" 
    }),
    assetId: text("asset_id").references(() => customerPlatformAsset.id, { 
      onDelete: "cascade" 
    }),
    
    // Payload
    payload: jsonb("payload").notNull(),
    signature: text("signature"),
    
    // Processing
    status: text("status").default("PENDING").notNull(), 
    // PENDING, PROCESSED, FAILED, IGNORED
    processedAt: timestamp("processed_at"),
    errorMessage: text("error_message"),
    
    receivedAt: timestamp("received_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("customer_platform_webhook_status_idx").on(table.status),
    index("customer_platform_webhook_platform_idx").on(table.platform),
    index("customer_platform_webhook_connectionId_idx").on(table.connectionId),
    index("customer_platform_webhook_receivedAt_idx").on(table.receivedAt),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const customerOAuthConnectionRelations = relations(
  customerOAuthConnection,
  ({ one, many }) => ({
    user: one(user, {
      fields: [customerOAuthConnection.userId],
      references: [user.id],
    }),
    team: one(team, {
      fields: [customerOAuthConnection.teamId],
      references: [team.id],
    }),
    assets: many(customerPlatformAsset),
    activityLogs: many(customerOAuthActivityLog),
    webhooks: many(customerPlatformWebhook),
    refreshQueue: many(customerTokenRefreshQueue),
  })
);

export const customerPlatformAssetRelations = relations(
  customerPlatformAsset,
  ({ one, many }) => ({
    connection: one(customerOAuthConnection, {
      fields: [customerPlatformAsset.connectionId],
      references: [customerOAuthConnection.id],
    }),
    user: one(user, {
      fields: [customerPlatformAsset.userId],
      references: [user.id],
    }),
    team: one(team, {
      fields: [customerPlatformAsset.teamId],
      references: [team.id],
    }),
    parentAsset: one(customerPlatformAsset, {
      fields: [customerPlatformAsset.parentAssetId],
      references: [customerPlatformAsset.id],
    }),
    childAssets: many(customerPlatformAsset),
    mappings: many(customerAssetMapping),
    activityLogs: many(customerOAuthActivityLog),
    webhooks: many(customerPlatformWebhook),
  })
);

export const customerAssetMappingRelations = relations(
  customerAssetMapping,
  ({ one }) => ({
    asset: one(customerPlatformAsset, {
      fields: [customerAssetMapping.assetId],
      references: [customerPlatformAsset.id],
    }),
    metaAdsAccount: one(metaAdsAccount, {
      fields: [customerAssetMapping.metaAdsAccountId],
      references: [metaAdsAccount.id],
    }),
  })
);

export const customerOAuthStateRelations = relations(
  customerOAuthState,
  ({ one }) => ({
    user: one(user, {
      fields: [customerOAuthState.userId],
      references: [user.id],
    }),
    team: one(team, {
      fields: [customerOAuthState.teamId],
      references: [team.id],
    }),
    reconnectConnection: one(customerOAuthConnection, {
      fields: [customerOAuthState.reconnectConnectionId],
      references: [customerOAuthConnection.id],
    }),
  })
);

export const customerTokenRefreshQueueRelations = relations(
  customerTokenRefreshQueue,
  ({ one }) => ({
    connection: one(customerOAuthConnection, {
      fields: [customerTokenRefreshQueue.connectionId],
      references: [customerOAuthConnection.id],
    }),
  })
);

export const customerOAuthActivityLogRelations = relations(
  customerOAuthActivityLog,
  ({ one }) => ({
    connection: one(customerOAuthConnection, {
      fields: [customerOAuthActivityLog.connectionId],
      references: [customerOAuthConnection.id],
    }),
    asset: one(customerPlatformAsset, {
      fields: [customerOAuthActivityLog.assetId],
      references: [customerPlatformAsset.id],
    }),
    user: one(user, {
      fields: [customerOAuthActivityLog.userId],
      references: [user.id],
    }),
  })
);

export const customerPlatformWebhookRelations = relations(
  customerPlatformWebhook,
  ({ one }) => ({
    connection: one(customerOAuthConnection, {
      fields: [customerPlatformWebhook.connectionId],
      references: [customerOAuthConnection.id],
    }),
    asset: one(customerPlatformAsset, {
      fields: [customerPlatformWebhook.assetId],
      references: [customerPlatformAsset.id],
    }),
  })
);
