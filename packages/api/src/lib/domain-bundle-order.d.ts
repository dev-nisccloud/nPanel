/**
 * Domain bundle order helpers: metadata shape, invoice grouping, provisioning identity.
 * Checkout creates N order items (one per domain) linked by bundleId; invoice collapses to one line.
 */
export type DomainBundleOrderMetadata = {
    bundleId: string;
    bundleLabel: string;
    bundlePrice: number;
    domains: string[];
    /** True on the single line item that carries the bundle price for order totals / invoice. */
    isBundleLeadItem: boolean;
};
export declare const DOMAIN_BUNDLE_METADATA_KEY: "domainBundle";
export declare function parseDomainBundleMetadata(metadata: unknown): DomainBundleOrderMetadata | null;
export declare function isDomainBundleOrderItem(metadata: unknown): boolean;
export declare function isDomainBundleLeadItem(metadata: unknown): boolean;
export type OrderItemForBundleInvoice = {
    itemPrice: string;
    itemSubtotal: string;
    primaryDomain: string | null | undefined;
    description: string | null | undefined;
    metadata: unknown;
    product: {
        name: string;
        serviceType?: string | null;
    };
    productPlan: {
        name: string;
    } | null;
    billingCycle: string | null | undefined;
};
export type DomainBundleInvoiceGroup = {
    bundleId: string;
    bundleLabel: string;
    bundlePrice: number;
    domains: string[];
    leadItem: OrderItemForBundleInvoice;
};
/** Groups bundle order items by bundleId for a single invoice line per bundle. */
export declare function groupDomainBundleItemsForInvoice<T extends OrderItemForBundleInvoice>(items: T[]): {
    bundleGroups: DomainBundleInvoiceGroup[];
    nonBundleItems: T[];
};
export declare function buildDomainBundleInvoiceLineName(domains: string[]): string;
export declare function buildDomainBundleInvoiceLineDescription(domains: string[], subscriptionPeriod: string): string;
export declare function orderItemsIncludeDomainBundle(items: Array<{
    metadata: unknown;
}>): boolean;
