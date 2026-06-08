export type HivelocityMarginRow = {
    marginType: string | null;
    percentageMargin: string | null;
    fixedMargin: string | null;
    roundOff: string | null;
};
export type HivelocityProductTypeKey = "VPS" | "VDS" | "DEDICATED_SERVERS";
/** Flatten Hivelocity `/device/{id}/services` payloads (array, grouped object, or wrapped). */
export declare function normalizeHivelocityDeviceServices(raw: unknown): Array<Record<string, unknown>>;
export declare function readHivelocityServiceBilledUsd(service: Record<string, unknown>): number;
export declare function readHivelocityDeviceBillingUsd(device: Record<string, unknown>): {
    priceUsd: number;
    period: string | null;
};
export declare function applyHivelocityMarginUsd(row: HivelocityMarginRow | null, priceUsd: number): number;
export declare function getDefaultHivelocityMarginSettings(productType?: HivelocityProductTypeKey): Promise<HivelocityMarginRow | null>;
/** USD → KES from Redis cache, with live API fallback when cache is empty. */
export declare function resolveUsdToKesExchangeRate(): Promise<number | null>;
export declare function mapHivelocityPeriodToBillingCycle(period: string | null | undefined): string | null;
export declare function parsePositiveAgreedPrice(agreedPrice: string | number | null | undefined): number | null;
export declare function fetchHivelocityDeviceRecurringLinesUsd(deviceId: number): Promise<{
    linesUsd: number[];
    period: string | null;
}>;
export declare function computeMarginedRecurringTotal(params: {
    linesUsd: number[];
    marginSettings: HivelocityMarginRow | null;
    kesRate: number | null;
    preferredCurrency?: string | null;
}): {
    amount: number;
    currency: string;
};
export declare function resolveMarginedVpsRecurringCharge(params: {
    deviceId: number;
    agreedPrice: string | null;
    agreedCurrency: string | null;
    billingCycle: string | null;
}): Promise<{
    amount: number;
    currency: string;
    billingCycle: string | null;
}>;
