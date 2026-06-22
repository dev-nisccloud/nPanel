/**
 * Hivelocity billing helpers: collapsed invoice lines (service + hostname only)
 * and subscription add-on purchase detail (not shown on customer invoices).
 */
import { type HivelocityInvoiceLine, type HivelocityItemMetadata } from "../routers/nisc-service-orders-schemas";
import { type NiscOrderInvoiceLineItemCopy } from "./nisc-order-invoice-line-items";
export type HivelocityPurchasedAddon = {
    kind: "os" | "addon";
    name: string;
    optionId?: number;
    /** Hivelocity wholesale (USD) for the billing period when known. */
    providerPriceUsd: number | null;
    /** Customer price ex-VAT (KES) for this component. */
    resellerPriceKes: number;
};
export declare function parseHivelocityInvoiceLinesFromMetadata(metadata: unknown): HivelocityInvoiceLine[] | null;
export declare function isHivelocityOrderItem(item: {
    metadata?: unknown;
    product?: {
        serviceType?: string | null;
    };
}): boolean;
/**
 * One invoice line per Hivelocity order item: "{Service} - {hostname}" + billing period.
 * Add-ons and OS are not mentioned on the invoice line; total is itemSubtotal.
 */
export declare function buildHivelocityCollapsedInvoiceLineCopy(input: {
    product: {
        name: string;
        serviceType?: string | null;
    };
    metadata?: unknown;
    billingCycle: string | null | undefined;
    subscriptionStart: Date;
}): NiscOrderInvoiceLineItemCopy;
export declare function buildHivelocitySubscriptionDisplayName(input: {
    product: {
        name: string;
        serviceType?: string | null;
    };
    metadata?: unknown;
}): string;
/** OS and add-on components purchased with the server (stored on subscription, not on invoice). */
export declare function buildHivelocityPurchasedAddons(meta: Pick<HivelocityItemMetadata, "osPriceUsd" | "addonsPriceUsd">, lines: HivelocityInvoiceLine[]): HivelocityPurchasedAddon[];
export declare function computeHivelocityTotalProviderCostUsd(meta: Pick<HivelocityItemMetadata, "basePriceUsd" | "osPriceUsd" | "addonsPriceUsd">): number | null;
