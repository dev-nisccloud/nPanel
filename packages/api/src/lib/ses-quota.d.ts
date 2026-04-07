export interface SesSendQuota {
    maxSendRate: number;
    max24HourSend: number;
    sentLast24Hours: number;
}
export declare function getSesSendQuotaSnapshot(): Promise<SesSendQuota>;
