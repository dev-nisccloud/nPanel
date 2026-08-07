/**
 * Extract upstream base plan monthly USD from Hivelocity product inventory payloads.
 *
 * GET /inventory/product/{id} may return:
 * - grouped inventory `{ LAX2: [Stock, ...], ... }`
 * - a flat Stock array
 * - a single Stock object
 */
export function extractHivelocityProductMonthlyUsd(raw, opts) {
    const locationKey = opts?.locationName?.trim().toUpperCase() ?? "";
    const readRow = (row, enforceLocation = true) => {
        if (!row || typeof row !== "object")
            return 0;
        const record = row;
        if (opts?.productId != null && Number(record.product_id) !== opts.productId) {
            return 0;
        }
        if (enforceLocation && locationKey) {
            const dataCenter = String(record.data_center ?? "").trim().toUpperCase();
            if (dataCenter && dataCenter !== locationKey)
                return 0;
        }
        const price = Number(record.product_monthly_price ?? record.productMonthlyPrice ?? 0);
        return Number.isFinite(price) && price > 0 ? price : 0;
    };
    if (raw == null)
        return 0;
    const direct = readRow(raw);
    if (direct > 0)
        return direct;
    if (Array.isArray(raw)) {
        for (const item of raw) {
            const price = readRow(item);
            if (price > 0)
                return price;
        }
        return 0;
    }
    if (typeof raw === "object") {
        const grouped = raw;
        if (locationKey) {
            for (const [bucket, value] of Object.entries(grouped)) {
                if (bucket.toUpperCase() !== locationKey || !Array.isArray(value))
                    continue;
                for (const item of value) {
                    const price = readRow(item, false);
                    if (price > 0)
                        return price;
                }
            }
        }
        for (const value of Object.values(grouped)) {
            if (!Array.isArray(value))
                continue;
            for (const item of value) {
                const price = readRow(item);
                if (price > 0)
                    return price;
            }
        }
    }
    return 0;
}
