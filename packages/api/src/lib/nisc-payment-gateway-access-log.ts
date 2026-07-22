/**
 * Nisc Payment Gateway - Access Log Aggregation
 * 
 * PURPOSE: Lightweight, aggregated logging for billing and quota enforcement
 * 
 * STRATEGY:
 * - One row per merchant per hour
 * - Atomic increments on each request
 * - Fast monthly billing calculations
 * - Minimal storage overhead
 * 
 * RELATION TO REQUEST LOGS:
 * - Request logs: Detailed (request/response, debugging)
 * - Access logs: Aggregated (counts, billing)
 * - Both logs written on EVERY request
 */

import { eq, and, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { nanoid } from "nanoid";

import { niscPaymentGatewayAccessLog } from "@npanel/db/schema/nisc-payment-gateway";

// =============================================================================
// TYPES
// =============================================================================

export type AccessLogIncrement = {
  merchantId: string;
  apiKeyId: string;
  endpoint: string; // e.g., "/v1/payments/create"
  method: string; // e.g., "POST"
  statusCode: number;
  success: boolean;
  rateLimitHit: boolean;
};

export type AccessLogStats = {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  billableRequests: number;
  rateLimitHits: number;
  paymentCreateRequests: number;
  paymentReadRequests: number;
  paymentListRequests: number;
  refundRequests: number;
  status2xxCount: number;
  status4xxCount: number;
  status5xxCount: number;
};

// =============================================================================
// TIME HELPERS
// =============================================================================

/**
 * Get current hour boundaries
 * 
 * @param date - Date to get boundaries for (defaults to now)
 * @returns Object with year, month, day, hour, periodStart, periodEnd
 */
export function getCurrentHourBoundaries(date: Date = new Date()) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1; // 1-12
  const day = date.getUTCDate(); // 1-31
  const hour = date.getUTCHours(); // 0-23

  // Period start: beginning of current hour
  const periodStart = new Date(Date.UTC(year, month - 1, day, hour, 0, 0, 0));

  // Period end: beginning of next hour
  const periodEnd = new Date(Date.UTC(year, month - 1, day, hour + 1, 0, 0, 0));

  return {
    year,
    month,
    day,
    hour,
    periodStart,
    periodEnd,
  };
}

/**
 * Get month boundaries
 * 
 * @param year - Year
 * @param month - Month (1-12)
 * @returns Object with start and end dates
 */
export function getMonthBoundaries(year: number, month: number) {
  const periodStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const periodEnd = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  return {
    periodStart,
    periodEnd,
  };
}

// =============================================================================
// ENDPOINT CLASSIFICATION
// =============================================================================

/**
 * Determine if request is billable (for future billing system)
 * 
 * BILLABLE: Only successful payment creation requests
 * NOT BILLABLE: Read, list, status checks, failed requests
 * 
 * @param endpoint - API endpoint path
 * @param method - HTTP method
 * @param success - Whether request succeeded
 * @returns true if billable
 */
export function isBillableRequest(
  endpoint: string,
  method: string,
  success: boolean
): boolean {
  // Only successful requests
  if (!success) return false;

  // Only payment creation (POST to /payments)
  if (method === "POST" && endpoint.includes("/payments") && !endpoint.includes("/refund")) {
    return true;
  }

  return false;
}

/**
 * Classify endpoint type for granular tracking
 * 
 * @param endpoint - API endpoint path
 * @param method - HTTP method
 * @returns Endpoint type
 */
export function classifyEndpoint(endpoint: string, method: string): string {
  if (method === "POST" && endpoint.includes("/payments") && !endpoint.includes("/refund")) {
    return "PAYMENT_CREATE";
  }
  if (method === "GET" && endpoint.match(/\/payments\/[^/]+$/)) {
    return "PAYMENT_READ";
  }
  if (method === "GET" && endpoint.includes("/payments")) {
    return "PAYMENT_LIST";
  }
  if (endpoint.includes("/refund")) {
    return "REFUND";
  }
  return "OTHER";
}

/**
 * Classify status code range
 * 
 * @param statusCode - HTTP status code
 * @returns Range string (2xx, 4xx, 5xx)
 */
export function classifyStatusCode(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 300) return "2xx";
  if (statusCode >= 400 && statusCode < 500) return "4xx";
  if (statusCode >= 500 && statusCode < 600) return "5xx";
  return "OTHER";
}

// =============================================================================
// ACCESS LOG INCREMENT
// =============================================================================

/**
 * Increment access log for current hour
 * 
 * STRATEGY: Atomic upsert with increments
 * - If row exists for this hour: increment counters
 * - If row doesn't exist: insert new row with initial values
 * 
 * PERFORMANCE: Single SQL query (no read-then-write)
 * 
 * @param db - Database instance
 * @param data - Access log increment data
 * 
 * @example
 * await incrementAccessLog(db, {
 *   merchantId: "mch_123",
 *   apiKeyId: "key_456",
 *   endpoint: "/v1/payments/create",
 *   method: "POST",
 *   statusCode: 200,
 *   success: true,
 *   rateLimitHit: false
 * });
 */
export async function incrementAccessLog(
  db: PostgresJsDatabase<any>,
  data: AccessLogIncrement
): Promise<void> {
  const { year, month, day, hour, periodStart, periodEnd } = getCurrentHourBoundaries();

  const endpointType = classifyEndpoint(data.endpoint, data.method);
  const statusRange = classifyStatusCode(data.statusCode);
  const billable = isBillableRequest(data.endpoint, data.method, data.success);

  // Build increment values
  const increments: Record<string, number> = {
    totalRequests: 1,
    successfulRequests: data.success ? 1 : 0,
    failedRequests: data.success ? 0 : 1,
    rateLimitHits: data.rateLimitHit ? 1 : 0,
    billableRequests: billable ? 1 : 0,
  };

  // Increment endpoint-specific counters
  switch (endpointType) {
    case "PAYMENT_CREATE":
      increments.paymentCreateRequests = 1;
      break;
    case "PAYMENT_READ":
      increments.paymentReadRequests = 1;
      break;
    case "PAYMENT_LIST":
      increments.paymentListRequests = 1;
      break;
    case "REFUND":
      increments.refundRequests = 1;
      break;
  }

  // Increment status code counters
  switch (statusRange) {
    case "2xx":
      increments.status2xxCount = 1;
      break;
    case "4xx":
      increments.status4xxCount = 1;
      break;
    case "5xx":
      increments.status5xxCount = 1;
      break;
  }

  // Atomic upsert with conflict resolution
  await db
    .insert(niscPaymentGatewayAccessLog)
    .values({
      id: nanoid(),
      merchantId: data.merchantId,
      apiKeyId: data.apiKeyId,
      year,
      month,
      day,
      hour,
      periodStart,
      periodEnd,
      ...Object.fromEntries(Object.entries(increments).map(([key, value]) => [key, value])),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        niscPaymentGatewayAccessLog.merchantId,
        niscPaymentGatewayAccessLog.year,
        niscPaymentGatewayAccessLog.month,
        niscPaymentGatewayAccessLog.day,
        niscPaymentGatewayAccessLog.hour,
      ],
      set: {
        totalRequests: sql`${niscPaymentGatewayAccessLog.totalRequests} + ${increments.totalRequests}`,
        successfulRequests: sql`${niscPaymentGatewayAccessLog.successfulRequests} + ${increments.successfulRequests}`,
        failedRequests: sql`${niscPaymentGatewayAccessLog.failedRequests} + ${increments.failedRequests}`,
        rateLimitHits: sql`${niscPaymentGatewayAccessLog.rateLimitHits} + ${increments.rateLimitHits}`,
        billableRequests: sql`${niscPaymentGatewayAccessLog.billableRequests} + ${increments.billableRequests}`,
        paymentCreateRequests: sql`${niscPaymentGatewayAccessLog.paymentCreateRequests} + ${increments.paymentCreateRequests || 0}`,
        paymentReadRequests: sql`${niscPaymentGatewayAccessLog.paymentReadRequests} + ${increments.paymentReadRequests || 0}`,
        paymentListRequests: sql`${niscPaymentGatewayAccessLog.paymentListRequests} + ${increments.paymentListRequests || 0}`,
        refundRequests: sql`${niscPaymentGatewayAccessLog.refundRequests} + ${increments.refundRequests || 0}`,
        status2xxCount: sql`${niscPaymentGatewayAccessLog.status2xxCount} + ${increments.status2xxCount || 0}`,
        status4xxCount: sql`${niscPaymentGatewayAccessLog.status4xxCount} + ${increments.status4xxCount || 0}`,
        status5xxCount: sql`${niscPaymentGatewayAccessLog.status5xxCount} + ${increments.status5xxCount || 0}`,
        updatedAt: new Date(),
      },
    });
}

// =============================================================================
// QUERY HELPERS
// =============================================================================

/**
 * Get monthly stats for merchant
 * 
 * @param db - Database instance
 * @param merchantId - Merchant ID
 * @param year - Year
 * @param month - Month (1-12)
 * @returns Aggregated stats for the month
 */
export async function getMonthlyStats(
  db: PostgresJsDatabase<any>,
  merchantId: string,
  year: number,
  month: number
): Promise<AccessLogStats> {
  const result = await db
    .select({
      totalRequests: sql<number>`COALESCE(SUM(${niscPaymentGatewayAccessLog.totalRequests}), 0)`,
      successfulRequests: sql<number>`COALESCE(SUM(${niscPaymentGatewayAccessLog.successfulRequests}), 0)`,
      failedRequests: sql<number>`COALESCE(SUM(${niscPaymentGatewayAccessLog.failedRequests}), 0)`,
      billableRequests: sql<number>`COALESCE(SUM(${niscPaymentGatewayAccessLog.billableRequests}), 0)`,
      rateLimitHits: sql<number>`COALESCE(SUM(${niscPaymentGatewayAccessLog.rateLimitHits}), 0)`,
      paymentCreateRequests: sql<number>`COALESCE(SUM(${niscPaymentGatewayAccessLog.paymentCreateRequests}), 0)`,
      paymentReadRequests: sql<number>`COALESCE(SUM(${niscPaymentGatewayAccessLog.paymentReadRequests}), 0)`,
      paymentListRequests: sql<number>`COALESCE(SUM(${niscPaymentGatewayAccessLog.paymentListRequests}), 0)`,
      refundRequests: sql<number>`COALESCE(SUM(${niscPaymentGatewayAccessLog.refundRequests}), 0)`,
      status2xxCount: sql<number>`COALESCE(SUM(${niscPaymentGatewayAccessLog.status2xxCount}), 0)`,
      status4xxCount: sql<number>`COALESCE(SUM(${niscPaymentGatewayAccessLog.status4xxCount}), 0)`,
      status5xxCount: sql<number>`COALESCE(SUM(${niscPaymentGatewayAccessLog.status5xxCount}), 0)`,
    })
    .from(niscPaymentGatewayAccessLog)
    .where(
      and(
        eq(niscPaymentGatewayAccessLog.merchantId, merchantId),
        eq(niscPaymentGatewayAccessLog.year, year),
        eq(niscPaymentGatewayAccessLog.month, month)
      )
    );

  return result[0] || {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    billableRequests: 0,
    rateLimitHits: 0,
    paymentCreateRequests: 0,
    paymentReadRequests: 0,
    paymentListRequests: 0,
    refundRequests: 0,
    status2xxCount: 0,
    status4xxCount: 0,
    status5xxCount: 0,
  };
}

/**
 * Get current month stats (for quota enforcement)
 * 
 * @param db - Database instance
 * @param merchantId - Merchant ID
 * @returns Stats for current month
 */
export async function getCurrentMonthStats(
  db: PostgresJsDatabase<any>,
  merchantId: string
): Promise<AccessLogStats> {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  return getMonthlyStats(db, merchantId, year, month);
}

/**
 * Get daily stats for merchant
 * 
 * @param db - Database instance
 * @param merchantId - Merchant ID
 * @param year - Year
 * @param month - Month (1-12)
 * @param day - Day (1-31)
 * @returns Aggregated stats for the day
 */
export async function getDailyStats(
  db: PostgresJsDatabase<any>,
  merchantId: string,
  year: number,
  month: number,
  day: number
): Promise<AccessLogStats> {
  const result = await db
    .select({
      totalRequests: sql<number>`COALESCE(SUM(${niscPaymentGatewayAccessLog.totalRequests}), 0)`,
      successfulRequests: sql<number>`COALESCE(SUM(${niscPaymentGatewayAccessLog.successfulRequests}), 0)`,
      failedRequests: sql<number>`COALESCE(SUM(${niscPaymentGatewayAccessLog.failedRequests}), 0)`,
      billableRequests: sql<number>`COALESCE(SUM(${niscPaymentGatewayAccessLog.billableRequests}), 0)`,
      rateLimitHits: sql<number>`COALESCE(SUM(${niscPaymentGatewayAccessLog.rateLimitHits}), 0)`,
      paymentCreateRequests: sql<number>`COALESCE(SUM(${niscPaymentGatewayAccessLog.paymentCreateRequests}), 0)`,
      paymentReadRequests: sql<number>`COALESCE(SUM(${niscPaymentGatewayAccessLog.paymentReadRequests}), 0)`,
      paymentListRequests: sql<number>`COALESCE(SUM(${niscPaymentGatewayAccessLog.paymentListRequests}), 0)`,
      refundRequests: sql<number>`COALESCE(SUM(${niscPaymentGatewayAccessLog.refundRequests}), 0)`,
      status2xxCount: sql<number>`COALESCE(SUM(${niscPaymentGatewayAccessLog.status2xxCount}), 0)`,
      status4xxCount: sql<number>`COALESCE(SUM(${niscPaymentGatewayAccessLog.status4xxCount}), 0)`,
      status5xxCount: sql<number>`COALESCE(SUM(${niscPaymentGatewayAccessLog.status5xxCount}), 0)`,
    })
    .from(niscPaymentGatewayAccessLog)
    .where(
      and(
        eq(niscPaymentGatewayAccessLog.merchantId, merchantId),
        eq(niscPaymentGatewayAccessLog.year, year),
        eq(niscPaymentGatewayAccessLog.month, month),
        eq(niscPaymentGatewayAccessLog.day, day)
      )
    );

  return result[0] || {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    billableRequests: 0,
    rateLimitHits: 0,
    paymentCreateRequests: 0,
    paymentReadRequests: 0,
    paymentListRequests: 0,
    refundRequests: 0,
    status2xxCount: 0,
    status4xxCount: 0,
    status5xxCount: 0,
  };
}

// =============================================================================
// BILLING HELPERS (FOR FUTURE USE)
// =============================================================================

/**
 * Calculate monthly bill (placeholder for future billing system)
 * 
 * @param stats - Monthly stats
 * @param pricePerRequest - Price per billable request (in cents)
 * @returns Bill amount in cents
 */
export function calculateMonthlyBill(
  stats: AccessLogStats,
  pricePerRequest: number
): number {
  return stats.billableRequests * pricePerRequest;
}

/**
 * Get billing summary for merchant
 * 
 * @param db - Database instance
 * @param merchantId - Merchant ID
 * @param year - Year
 * @param month - Month (1-12)
 * @param pricePerRequest - Price per billable request (in cents)
 * @returns Billing summary
 */
export async function getBillingSummary(
  db: PostgresJsDatabase<any>,
  merchantId: string,
  year: number,
  month: number,
  pricePerRequest: number = 10 // Default: 10 cents per billable request
) {
  const stats = await getMonthlyStats(db, merchantId, year, month);
  const totalBill = calculateMonthlyBill(stats, pricePerRequest);

  return {
    merchantId,
    year,
    month,
    stats,
    billing: {
      billableRequests: stats.billableRequests,
      pricePerRequest,
      totalBill,
      currency: "USD",
    },
  };
}
