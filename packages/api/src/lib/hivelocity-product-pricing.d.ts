/**
 * Extract upstream base plan monthly USD from Hivelocity product inventory payloads.
 *
 * GET /inventory/product/{id} may return:
 * - grouped inventory `{ LAX2: [Stock, ...], ... }`
 * - a flat Stock array
 * - a single Stock object
 */
export declare function extractHivelocityProductMonthlyUsd(raw: unknown, opts?: {
    locationName?: string;
    productId?: number;
}): number;
