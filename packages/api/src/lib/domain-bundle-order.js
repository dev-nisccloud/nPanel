/**
 * Domain bundle order helpers: metadata shape, invoice grouping, provisioning identity.
 * Checkout creates N order items (one per domain) linked by bundleId; invoice collapses to one line.
 */
export const DOMAIN_BUNDLE_METADATA_KEY = "domainBundle";
export function parseDomainBundleMetadata(metadata) {
    if (!metadata || typeof metadata !== "object")
        return null;
    const raw = metadata[DOMAIN_BUNDLE_METADATA_KEY];
    if (!raw || typeof raw !== "object")
        return null;
    const obj = raw;
    const bundleId = typeof obj.bundleId === "string" ? obj.bundleId.trim() : "";
    const bundleLabel = typeof obj.bundleLabel === "string" ? obj.bundleLabel.trim() : "";
    const bundlePrice = typeof obj.bundlePrice === "number" && Number.isFinite(obj.bundlePrice)
        ? obj.bundlePrice
        : typeof obj.bundlePrice === "string"
            ? Number.parseFloat(obj.bundlePrice)
            : NaN;
    const domains = Array.isArray(obj.domains)
        ? obj.domains.filter((d) => typeof d === "string" && d.trim().length > 0)
        : [];
    const isBundleLeadItem = obj.isBundleLeadItem === true;
    if (!bundleId || !Number.isFinite(bundlePrice) || domains.length === 0)
        return null;
    return {
        bundleId,
        bundleLabel: bundleLabel || domains.join(" + "),
        bundlePrice,
        domains,
        isBundleLeadItem,
    };
}
export function isDomainBundleOrderItem(metadata) {
    return parseDomainBundleMetadata(metadata) != null;
}
export function isDomainBundleLeadItem(metadata) {
    const bundle = parseDomainBundleMetadata(metadata);
    return bundle?.isBundleLeadItem === true;
}
/** Groups bundle order items by bundleId for a single invoice line per bundle. */
export function groupDomainBundleItemsForInvoice(items) {
    const bundleGroups = new Map();
    const nonBundleItems = [];
    for (const item of items) {
        const bundle = parseDomainBundleMetadata(item.metadata);
        if (!bundle) {
            nonBundleItems.push(item);
            continue;
        }
        const existing = bundleGroups.get(bundle.bundleId);
        if (!existing) {
            bundleGroups.set(bundle.bundleId, {
                bundleId: bundle.bundleId,
                bundleLabel: bundle.bundleLabel,
                bundlePrice: bundle.bundlePrice,
                domains: bundle.domains,
                leadItem: item,
            });
            continue;
        }
        if (bundle.isBundleLeadItem) {
            existing.leadItem = item;
            existing.bundlePrice = bundle.bundlePrice;
        }
    }
    return { bundleGroups: Array.from(bundleGroups.values()), nonBundleItems };
}
export function buildDomainBundleInvoiceLineName(domains) {
    const list = domains.join(", ");
    return list ? `Domains Bundle (${list}) - Registration` : "Domains Bundle - Registration";
}
/** KRA itemNm: collapsed bundle label with full domain names (incl. TLDs). */
export function buildDomainBundleKraItemName(domains) {
    const list = domains.join(", ");
    return list ? `Domains Bundle (${list})` : "Domains Bundle";
}
export function buildDomainBundleInvoiceLineDescription(domains, subscriptionPeriod) {
    const domainList = domains.join(", ");
    return domainList ? `${domainList}\n${subscriptionPeriod}` : subscriptionPeriod;
}
export function orderItemsIncludeDomainBundle(items) {
    return items.some((i) => isDomainBundleOrderItem(i.metadata));
}
