/**
 * Nisc Payment Gateway - Database Schema
 *
 * SECURITY CRITICAL: This schema handles sensitive payment gateway data
 * - All credentials encrypted at rest (AES-256-GCM)
 * - API keys hashed with bcrypt
 * - Comprehensive audit logging
 * - Row-level access control via merchantId
 *
 * ISOLATION: Prefix all tables with "nisc_payment_gateway_" for clear separation
 */
import { relations } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth";
import { team } from "./teams";
// =============================================================================
// MERCHANT ACCOUNTS
// =============================================================================
/**
 * Merchant Accounts
 *
 * Each merchant represents an external client using the gateway.
 * Can be linked to a team or individual user.
 */
export const niscPaymentGatewayMerchant = pgTable("nisc_payment_gateway_merchant", {
    id: text("id").primaryKey(),
    // Ownership (can be user or team)
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "restrict" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    // Merchant Details
    merchantName: text("merchant_name").notNull(),
    merchantEmail: text("merchant_email").notNull(),
    merchantPhone: text("merchant_phone"),
    merchantWebsite: text("merchant_website"),
    // Business Information
    businessType: text("business_type").notNull().default("BUSINESS"), // INDIVIDUAL, BUSINESS, NGO
    businessName: text("business_name"),
    businessRegistration: text("business_registration"),
    // Status
    status: text("status").notNull().default("PENDING"), // PENDING, ACTIVE, SUSPENDED, CLOSED
    // Settings (stored as JSON)
    settings: jsonb("settings").$type().notNull().default({}),
    // Metadata
    metadata: jsonb("metadata"),
    notes: text("notes"), // Agency internal notes
    // Timestamps
    createdById: text("created_by_id").notNull().references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdateFn(() => new Date()),
    suspendedAt: timestamp("suspended_at"),
    closedAt: timestamp("closed_at"),
}, (table) => [
    index("npg_merchant_userId_idx").on(table.userId),
    index("npg_merchant_teamId_idx").on(table.teamId),
    index("npg_merchant_status_idx").on(table.status),
    index("npg_merchant_email_idx").on(table.merchantEmail),
    index("npg_merchant_createdAt_idx").on(table.createdAt),
]);
// =============================================================================
// MERCHANT CREDENTIALS (ENCRYPTED)
// =============================================================================
/**
 * Encrypted Payment Provider Credentials
 *
 * SECURITY CRITICAL:
 * - credentialsEncrypted field contains AES-256-GCM encrypted JSON
 * - Never log or expose decrypted credentials
 * - Encryption key must be stored securely (env var, secrets manager)
 * - Support key rotation via encryptionVersion
 */
export const niscPaymentGatewayMerchantCredentials = pgTable("nisc_payment_gateway_merchant_credentials", {
    id: text("id").primaryKey(),
    merchantId: text("merchant_id").notNull().references(() => niscPaymentGatewayMerchant.id, { onDelete: "cascade" }),
    // Provider Information
    provider: text("provider").notNull(), // MPESA, STRIPE, PAYPAL, FLUTTERWAVE
    environment: text("environment").notNull(), // SANDBOX, PRODUCTION
    // Encrypted Credentials
    // Example decrypted structure for M-Pesa:
    // {
    //   consumerKey: string,
    //   consumerSecret: string,
    //   shortCode: string,
    //   passkey: string,
    //   callbackUrl: string
    // }
    credentialsEncrypted: text("credentials_encrypted").notNull(),
    // Encryption Metadata
    encryptionVersion: text("encryption_version").notNull().default("v1"),
    encryptedById: text("encrypted_by_id").notNull().references(() => user.id, { onDelete: "restrict" }),
    // Status
    isActive: boolean("is_active").notNull().default(true),
    // Verification
    lastVerifiedAt: timestamp("last_verified_at"),
    verificationStatus: text("verification_status"), // VERIFIED, FAILED, PENDING
    verificationError: text("verification_error"),
    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdateFn(() => new Date()),
}, (table) => [
    // Composite unique: one active credential per merchant per provider per environment
    uniqueIndex("npg_credentials_merchant_provider_env_unique")
        .on(table.merchantId, table.provider, table.environment)
        .where(sql `${table.isActive} = true`),
    index("npg_credentials_merchantId_idx").on(table.merchantId),
    index("npg_credentials_provider_idx").on(table.provider),
    index("npg_credentials_isActive_idx").on(table.isActive),
]);
// =============================================================================
// API KEYS
// =============================================================================
/**
 * API Keys for External Access
 *
 * SECURITY CRITICAL:
 * - keyHash stores bcrypt hash, never plaintext
 * - Full key shown ONCE during creation
 * - Direct merchantId mapping prevents impersonation
 * - Optional IP restrictions per key
 * - Granular permissions per key
 */
export const niscPaymentGatewayApiKey = pgTable("nisc_payment_gateway_api_key", {
    id: text("id").primaryKey(),
    // CRITICAL: Direct merchant mapping (1:1 at request time)
    merchantId: text("merchant_id").notNull().references(() => niscPaymentGatewayMerchant.id, { onDelete: "cascade" }),
    // Key Information
    name: text("name").notNull(), // e.g., "Production Website", "WordPress Plugin"
    keyPrefix: text("key_prefix").notNull(), // e.g., "npg_live_", "npg_test_"
    keyHash: text("key_hash").notNull().unique(), // bcrypt hash
    // Permissions (scoped to what this key can do)
    permissions: jsonb("permissions").$type().notNull().default([]), // ['PAYMENT_CREATE', 'PAYMENT_READ', 'REFUND_CREATE']
    environment: text("environment").notNull(), // test | live (npg_test_ / npg_live_)
    // Rate Limiting (per key)
    rateLimit: integer("rate_limit").notNull().default(100), // requests per minute
    // IP Restrictions (optional)
    allowedIps: jsonb("allowed_ips").$type(), // Optional IP whitelist
    // Status
    isActive: boolean("is_active").notNull().default(true),
    expiresAt: timestamp("expires_at"),
    lastUsedAt: timestamp("last_used_at"),
    // Metadata
    metadata: jsonb("metadata"),
    // Timestamps
    createdById: text("created_by_id").notNull().references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    revokedAt: timestamp("revoked_at"),
    revokedById: text("revoked_by_id").references(() => user.id, { onDelete: "restrict" }),
}, (table) => [
    index("npg_apikey_merchantId_idx").on(table.merchantId),
    index("npg_apikey_keyHash_idx").on(table.keyHash),
    index("npg_apikey_isActive_idx").on(table.isActive),
    index("npg_apikey_environment_idx").on(table.environment),
    index("npg_apikey_createdAt_idx").on(table.createdAt),
]);
// =============================================================================
// GATEWAY TRANSACTIONS
// =============================================================================
/**
 * Gateway Transaction Records
 *
 * Links merchant API requests to internal payment_transaction records.
 * Tracks webhook delivery status for client notifications.
 */
export const niscPaymentGatewayTransaction = pgTable("nisc_payment_gateway_transaction", {
    id: text("id").primaryKey(),
    // Merchant Context
    merchantId: text("merchant_id").notNull().references(() => niscPaymentGatewayMerchant.id, { onDelete: "restrict" }),
    apiKeyId: text("api_key_id").notNull().references(() => niscPaymentGatewayApiKey.id, { onDelete: "restrict" }),
    // M-Pesa Transaction IDs (CheckoutRequestID used for webhook lookup)
    paymentTransactionId: text("payment_transaction_id").notNull(), // M-Pesa CheckoutRequestID
    merchantRequestId: text("merchant_request_id"), // M-Pesa MerchantRequestID
    // Transaction Details
    amount: integer("amount"), // Amount in minor units (cents/kobo)
    currency: text("currency").default("KES"), // ISO 4217 currency code
    phoneNumber: text("phone_number"), // Customer phone number (masked in logs)
    accountReference: text("account_reference"), // Account reference sent to M-Pesa
    transactionDescription: text("transaction_description"), // Transaction description
    // M-Pesa Response Details
    mpesaResponseCode: text("mpesa_response_code"), // M-Pesa response code
    mpesaResponseDescription: text("mpesa_response_description"), // M-Pesa response message
    mpesaCustomerMessage: text("mpesa_customer_message"), // Message shown to customer
    mpesaReceiptNumber: text("mpesa_receipt_number"), // M-Pesa receipt number (from callback)
    mpesaTransactionDate: text("mpesa_transaction_date"), // Transaction date from M-Pesa
    // Client Information
    clientReferenceId: text("client_reference_id"), // Merchant's reference ID
    clientMetadata: jsonb("client_metadata"), // Merchant's custom data
    // Provider Information
    provider: text("provider").notNull(), // MPESA, STRIPE, etc.
    providerEnvironment: text("provider_environment"), // SANDBOX, PRODUCTION
    // Webhook Information
    webhookDeliveryStatus: text("webhook_delivery_status").notNull().default("PENDING"), // PENDING, DELIVERED, FAILED, NOT_CONFIGURED
    webhookDeliveryAttempts: integer("webhook_delivery_attempts").notNull().default(0),
    lastWebhookAttemptAt: timestamp("last_webhook_attempt_at"),
    webhookDeliveredAt: timestamp("webhook_delivered_at"),
    // Status
    status: text("status").notNull().default("PENDING"), // PENDING, PROCESSING, SUCCESS, FAILED, CANCELLED
    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdateFn(() => new Date()),
}, (table) => [
    index("npg_transaction_merchantId_idx").on(table.merchantId),
    index("npg_transaction_apiKeyId_idx").on(table.apiKeyId),
    index("npg_transaction_paymentTxId_idx").on(table.paymentTransactionId),
    index("npg_transaction_clientRefId_idx").on(table.clientReferenceId),
    index("npg_transaction_status_idx").on(table.status),
    index("npg_transaction_webhookStatus_idx").on(table.webhookDeliveryStatus),
    index("npg_transaction_createdAt_idx").on(table.createdAt),
]);
// =============================================================================
// WEBHOOK DELIVERY LOGS
// =============================================================================
/**
 * Webhook Delivery Logs
 *
 * Tracks all attempts to deliver webhooks to merchant endpoints.
 * Used for retry logic and debugging.
 */
export const niscPaymentGatewayWebhookLog = pgTable("nisc_payment_gateway_webhook_log", {
    id: text("id").primaryKey(),
    // Context
    gatewayTransactionId: text("gateway_transaction_id").notNull().references(() => niscPaymentGatewayTransaction.id, { onDelete: "cascade" }),
    merchantId: text("merchant_id").notNull().references(() => niscPaymentGatewayMerchant.id, { onDelete: "restrict" }),
    // Request Details
    webhookUrl: text("webhook_url").notNull(),
    requestPayload: jsonb("request_payload").notNull(),
    requestHeaders: jsonb("request_headers").notNull(),
    // Response Details
    responseStatus: integer("response_status"),
    responseBody: text("response_body"),
    responseHeaders: jsonb("response_headers"),
    // Timing
    sentAt: timestamp("sent_at").notNull(),
    respondedAt: timestamp("responded_at"),
    durationMs: integer("duration_ms"),
    // Result
    success: boolean("success").notNull(),
    errorMessage: text("error_message"),
    // Retry Information
    attemptNumber: integer("attempt_number").notNull(),
    willRetry: boolean("will_retry").notNull().default(false),
    nextRetryAt: timestamp("next_retry_at"),
}, (table) => [
    index("npg_webhook_log_gatewayTxId_idx").on(table.gatewayTransactionId),
    index("npg_webhook_log_merchantId_idx").on(table.merchantId),
    index("npg_webhook_log_success_idx").on(table.success),
    index("npg_webhook_log_sentAt_idx").on(table.sentAt),
]);
// =============================================================================
// DETAILED REQUEST LOGS
// =============================================================================
/**
 * Detailed Request/Response Logs
 *
 * SECURITY CONSIDERATIONS:
 * - Sanitize sensitive data (phone numbers masked, API keys redacted)
 * - Optional raw request/response for deep debugging
 * - 7-year retention for financial transactions
 * - 90-day retention for other requests
 */
export const niscPaymentGatewayRequestLog = pgTable("nisc_payment_gateway_request_log", {
    id: text("id").primaryKey(),
    // Identity
    merchantId: text("merchant_id").notNull().references(() => niscPaymentGatewayMerchant.id, { onDelete: "restrict" }),
    apiKeyId: text("api_key_id").notNull().references(() => niscPaymentGatewayApiKey.id, { onDelete: "restrict" }),
    // Request Details (sanitized)
    endpoint: text("endpoint").notNull(),
    method: text("method").notNull(),
    path: text("path").notNull(),
    requestHeaders: jsonb("request_headers").notNull(), // Sanitized (API keys redacted)
    requestBody: jsonb("request_body"), // Sanitized (phone numbers masked)
    requestSize: integer("request_size"),
    rawRequest: text("raw_request"), // Optional: full raw request for deep debugging
    // Context
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    country: text("country"), // From IP geolocation
    // Response Details (sanitized)
    statusCode: integer("status_code").notNull(),
    success: boolean("success").notNull(),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    responseBody: jsonb("response_body"), // Sanitized
    responseSize: integer("response_size"),
    rawResponse: text("raw_response"), // Optional: full raw response for deep debugging
    // Timing
    timestamp: timestamp("timestamp").notNull(),
    durationMs: integer("duration_ms").notNull(),
    // Related Records
    gatewayTransactionId: text("gateway_transaction_id").references(() => niscPaymentGatewayTransaction.id, { onDelete: "set null" }),
    paymentTransactionId: text("payment_transaction_id"), // Link to payment_transaction.id
    // Rate Limiting
    rateLimitRemaining: integer("rate_limit_remaining"),
    rateLimitHit: boolean("rate_limit_hit").notNull().default(false),
    // Time-Series Indexing (for fast analytics)
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    day: integer("day").notNull(),
    hour: integer("hour").notNull(),
    // Metadata
    metadata: jsonb("metadata"),
}, (table) => [
    index("npg_request_log_merchantId_time_idx").on(table.merchantId, table.timestamp.desc()),
    index("npg_request_log_apiKeyId_time_idx").on(table.apiKeyId, table.timestamp.desc()),
    index("npg_request_log_gatewayTxId_idx").on(table.gatewayTransactionId),
    index("npg_request_log_statusCode_idx").on(table.statusCode),
    index("npg_request_log_endpoint_idx").on(table.endpoint),
    index("npg_request_log_ipAddress_idx").on(table.ipAddress),
    index("npg_request_log_timeseries_idx").on(table.year, table.month, table.day, table.hour),
    // Index for finding financial transactions (long retention)
    index("npg_request_log_financial_idx")
        .on(table.timestamp)
        .where(sql `${table.gatewayTransactionId} IS NOT NULL`),
]);
// =============================================================================
// ACCESS LOGS (AGGREGATED FOR BILLING)
// =============================================================================
/**
 * Access Logs - Aggregated by Hour
 *
 * PURPOSE: Fast billing calculations and quota enforcement
 * - One row per merchant per hour
 * - Atomic increments on each request
 * - Ready for future billing system
 */
export const niscPaymentGatewayAccessLog = pgTable("nisc_payment_gateway_access_log", {
    id: text("id").primaryKey(),
    // Identity
    merchantId: text("merchant_id").notNull().references(() => niscPaymentGatewayMerchant.id, { onDelete: "restrict" }),
    apiKeyId: text("api_key_id").notNull().references(() => niscPaymentGatewayApiKey.id, { onDelete: "restrict" }),
    // Aggregation Period (composite unique key)
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    day: integer("day").notNull(),
    hour: integer("hour").notNull(),
    // Counts by Category
    totalRequests: integer("total_requests").notNull().default(0),
    successfulRequests: integer("successful_requests").notNull().default(0),
    failedRequests: integer("failed_requests").notNull().default(0),
    // Counts by Endpoint Type
    paymentCreateRequests: integer("payment_create_requests").notNull().default(0),
    paymentReadRequests: integer("payment_read_requests").notNull().default(0),
    paymentListRequests: integer("payment_list_requests").notNull().default(0),
    refundRequests: integer("refund_requests").notNull().default(0),
    // Counts by Status
    status2xxCount: integer("status_2xx_count").notNull().default(0),
    status4xxCount: integer("status_4xx_count").notNull().default(0),
    status5xxCount: integer("status_5xx_count").notNull().default(0),
    // Rate Limiting
    rateLimitHits: integer("rate_limit_hits").notNull().default(0),
    // Billing Metrics (for future billing system)
    billableRequests: integer("billable_requests").notNull().default(0), // Successful payment creations only
    // Period Boundaries
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),
    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdateFn(() => new Date()),
}, (table) => [
    // Composite unique: one record per merchant per hour
    uniqueIndex("npg_access_log_merchant_period_unique")
        .on(table.merchantId, table.year, table.month, table.day, table.hour),
    // Fast monthly billing queries
    index("npg_access_log_merchant_month_idx").on(table.merchantId, table.year, table.month),
    // Fast daily usage queries
    index("npg_access_log_merchant_day_idx").on(table.merchantId, table.year, table.month, table.day),
    // Per-key analytics
    index("npg_access_log_apikey_month_idx").on(table.apiKeyId, table.year, table.month),
]);
// =============================================================================
// RELATIONS
// =============================================================================
export const niscPaymentGatewayMerchantRelations = relations(niscPaymentGatewayMerchant, ({ one, many }) => ({
    user: one(user, {
        fields: [niscPaymentGatewayMerchant.userId],
        references: [user.id],
    }),
    team: one(team, {
        fields: [niscPaymentGatewayMerchant.teamId],
        references: [team.id],
    }),
    createdBy: one(user, {
        fields: [niscPaymentGatewayMerchant.createdById],
        references: [user.id],
    }),
    credentials: many(niscPaymentGatewayMerchantCredentials),
    apiKeys: many(niscPaymentGatewayApiKey),
    transactions: many(niscPaymentGatewayTransaction),
    webhookLogs: many(niscPaymentGatewayWebhookLog),
    requestLogs: many(niscPaymentGatewayRequestLog),
    accessLogs: many(niscPaymentGatewayAccessLog),
}));
export const niscPaymentGatewayMerchantCredentialsRelations = relations(niscPaymentGatewayMerchantCredentials, ({ one }) => ({
    merchant: one(niscPaymentGatewayMerchant, {
        fields: [niscPaymentGatewayMerchantCredentials.merchantId],
        references: [niscPaymentGatewayMerchant.id],
    }),
    encryptedBy: one(user, {
        fields: [niscPaymentGatewayMerchantCredentials.encryptedById],
        references: [user.id],
    }),
}));
export const niscPaymentGatewayApiKeyRelations = relations(niscPaymentGatewayApiKey, ({ one, many }) => ({
    merchant: one(niscPaymentGatewayMerchant, {
        fields: [niscPaymentGatewayApiKey.merchantId],
        references: [niscPaymentGatewayMerchant.id],
    }),
    createdBy: one(user, {
        fields: [niscPaymentGatewayApiKey.createdById],
        references: [user.id],
    }),
    revokedBy: one(user, {
        fields: [niscPaymentGatewayApiKey.revokedById],
        references: [user.id],
    }),
    transactions: many(niscPaymentGatewayTransaction),
    requestLogs: many(niscPaymentGatewayRequestLog),
    accessLogs: many(niscPaymentGatewayAccessLog),
}));
export const niscPaymentGatewayTransactionRelations = relations(niscPaymentGatewayTransaction, ({ one, many }) => ({
    merchant: one(niscPaymentGatewayMerchant, {
        fields: [niscPaymentGatewayTransaction.merchantId],
        references: [niscPaymentGatewayMerchant.id],
    }),
    apiKey: one(niscPaymentGatewayApiKey, {
        fields: [niscPaymentGatewayTransaction.apiKeyId],
        references: [niscPaymentGatewayApiKey.id],
    }),
    webhookLogs: many(niscPaymentGatewayWebhookLog),
}));
export const niscPaymentGatewayWebhookLogRelations = relations(niscPaymentGatewayWebhookLog, ({ one }) => ({
    gatewayTransaction: one(niscPaymentGatewayTransaction, {
        fields: [niscPaymentGatewayWebhookLog.gatewayTransactionId],
        references: [niscPaymentGatewayTransaction.id],
    }),
    merchant: one(niscPaymentGatewayMerchant, {
        fields: [niscPaymentGatewayWebhookLog.merchantId],
        references: [niscPaymentGatewayMerchant.id],
    }),
}));
export const niscPaymentGatewayRequestLogRelations = relations(niscPaymentGatewayRequestLog, ({ one }) => ({
    merchant: one(niscPaymentGatewayMerchant, {
        fields: [niscPaymentGatewayRequestLog.merchantId],
        references: [niscPaymentGatewayMerchant.id],
    }),
    apiKey: one(niscPaymentGatewayApiKey, {
        fields: [niscPaymentGatewayRequestLog.apiKeyId],
        references: [niscPaymentGatewayApiKey.id],
    }),
    gatewayTransaction: one(niscPaymentGatewayTransaction, {
        fields: [niscPaymentGatewayRequestLog.gatewayTransactionId],
        references: [niscPaymentGatewayTransaction.id],
    }),
}));
export const niscPaymentGatewayAccessLogRelations = relations(niscPaymentGatewayAccessLog, ({ one }) => ({
    merchant: one(niscPaymentGatewayMerchant, {
        fields: [niscPaymentGatewayAccessLog.merchantId],
        references: [niscPaymentGatewayMerchant.id],
    }),
    apiKey: one(niscPaymentGatewayApiKey, {
        fields: [niscPaymentGatewayAccessLog.apiKeyId],
        references: [niscPaymentGatewayApiKey.id],
    }),
}));
