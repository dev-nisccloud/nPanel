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
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
export type AccessLogIncrement = {
    merchantId: string;
    apiKeyId: string;
    endpoint: string;
    method: string;
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
/**
 * Get current hour boundaries
 *
 * @param date - Date to get boundaries for (defaults to now)
 * @returns Object with year, month, day, hour, periodStart, periodEnd
 */
export declare function getCurrentHourBoundaries(date?: Date): {
    year: number;
    month: number;
    day: number;
    hour: number;
    periodStart: Date;
    periodEnd: Date;
};
/**
 * Get month boundaries
 *
 * @param year - Year
 * @param month - Month (1-12)
 * @returns Object with start and end dates
 */
export declare function getMonthBoundaries(year: number, month: number): {
    periodStart: Date;
    periodEnd: Date;
};
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
export declare function isBillableRequest(endpoint: string, method: string, success: boolean): boolean;
/**
 * Classify endpoint type for granular tracking
 *
 * @param endpoint - API endpoint path
 * @param method - HTTP method
 * @returns Endpoint type
 */
export declare function classifyEndpoint(endpoint: string, method: string): string;
/**
 * Classify status code range
 *
 * @param statusCode - HTTP status code
 * @returns Range string (2xx, 4xx, 5xx)
 */
export declare function classifyStatusCode(statusCode: number): string;
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
export declare function incrementAccessLog(db: PostgresJsDatabase<any>, data: AccessLogIncrement): Promise<void>;
/**
 * Get monthly stats for merchant
 *
 * @param db - Database instance
 * @param merchantId - Merchant ID
 * @param year - Year
 * @param month - Month (1-12)
 * @returns Aggregated stats for the month
 */
export declare function getMonthlyStats(db: PostgresJsDatabase<any>, merchantId: string, year: number, month: number): Promise<AccessLogStats>;
/**
 * Get current month stats (for quota enforcement)
 *
 * @param db - Database instance
 * @param merchantId - Merchant ID
 * @returns Stats for current month
 */
export declare function getCurrentMonthStats(db: PostgresJsDatabase<any>, merchantId: string): Promise<AccessLogStats>;
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
export declare function getDailyStats(db: PostgresJsDatabase<any>, merchantId: string, year: number, month: number, day: number): Promise<AccessLogStats>;
/**
 * Calculate monthly bill (placeholder for future billing system)
 *
 * @param stats - Monthly stats
 * @param pricePerRequest - Price per billable request (in cents)
 * @returns Bill amount in cents
 */
export declare function calculateMonthlyBill(stats: AccessLogStats, pricePerRequest: number): number;
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
export declare function getBillingSummary(db: PostgresJsDatabase<any>, merchantId: string, year: number, month: number, pricePerRequest?: number): Promise<{
    merchantId: string;
    year: number;
    month: number;
    stats: AccessLogStats;
    billing: {
        billableRequests: number;
        pricePerRequest: number;
        totalBill: number;
        currency: string;
    };
}>;
