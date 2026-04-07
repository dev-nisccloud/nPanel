export type NiscLogPayload = Record<string, unknown> & {
    niscOrderId?: string;
    orderItemId?: string;
};
/**
 * Log a processing step. Logs to console and, when niscOrderId is present, persists to DB.
 * DB write failures are caught so the main flow is never broken.
 */
export declare function niscLog(step: string, payload: NiscLogPayload): Promise<void>;
