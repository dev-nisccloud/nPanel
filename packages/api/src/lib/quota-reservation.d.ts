export interface QuotaStatus {
    windowStart: Date;
    windowEnd: Date;
    maxSendRate: number;
    max24HourSend: number;
    sentLast24HoursAtStart: number;
    reservedEmails: number;
    remainingEmails: number;
}
interface ResultOk<T> {
    ok: true;
    value: T;
}
interface ResultErr<E> {
    ok: false;
    error: E;
}
type Result<T, E> = ResultOk<T> | ResultErr<E>;
export type ReserveQuotaError = {
    kind: "NOT_ENOUGH_QUOTA";
    remainingEmails: number;
} | {
    kind: "SES_QUOTA_UNAVAILABLE";
    message: string;
};
export declare function getQuotaStatus(now?: Date): Promise<QuotaStatus>;
export declare function reserveQuotaForSendJob(params: {
    teamId: string | null;
    userId: string | null;
    campaignId: string | null;
    sendJobId: string | null;
    requestedEmails: number;
    now?: Date;
}): Promise<Result<{
    windowId: string;
    remainingAfter: number;
}, ReserveQuotaError>>;
export {};
