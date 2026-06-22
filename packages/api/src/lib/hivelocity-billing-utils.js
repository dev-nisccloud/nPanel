/**
 * Hivelocity billing helpers: collapsed invoice lines (service + hostname only)
 * and subscription add-on purchase detail (not shown on customer invoices).
 */
import { hivelocityInvoiceLineSchema, } from "../routers/nisc-service-orders-schemas";
import { resolveHostingServiceLabel, addBillingCycleToDate, } from "./nisc-order-invoice-line-items";
import { formatNiscDate } from "./nisc-datetime-format";
const HIVELOCITY_SERVICE_TYPES = new Set([
    "vps_hosting",
    "vds_hosting",
    "dedicated_server_hosting",
]);
export function parseHivelocityInvoiceLinesFromMetadata(metadata) {
    if (!metadata || typeof metadata !== "object")
        return null;
    const raw = metadata.invoiceLines;
    if (!Array.isArray(raw) || raw.length === 0)
        return null;
    const lines = raw
        .map((line) => hivelocityInvoiceLineSchema.safeParse(line))
        .filter((r) => r.success)
        .map((r) => r.data);
    return lines.length > 0 ? lines : null;
}
export function isHivelocityOrderItem(item) {
    const st = (item.product?.serviceType ?? "").trim().toLowerCase();
    if (HIVELOCITY_SERVICE_TYPES.has(st))
        return true;
    return parseHivelocityInvoiceLinesFromMetadata(item.metadata) != null;
}
function billingCycleLabel(billingCycle) {
    switch (billingCycle) {
        case "MONTHLY":
            return "1 month";
        case "YEARLY":
            return "1 year";
        case "BIENNIALLY":
            return "2 years";
        default:
            return "1 year";
    }
}
function formatSubscriptionPeriod(subscriptionStart, billingCycle) {
    const startStr = formatNiscDate(subscriptionStart);
    const expiry = addBillingCycleToDate(subscriptionStart, billingCycle);
    const cycle = billingCycleLabel(billingCycle);
    if (expiry) {
        return `Subscription: ${startStr} – ${formatNiscDate(expiry)} (${cycle})`;
    }
    return `Subscription: ${startStr} – (${cycle})`;
}
function readHostname(metadata) {
    if (!metadata || typeof metadata !== "object")
        return "";
    const hostname = metadata.hivelocityHostname;
    return typeof hostname === "string" ? hostname.trim() : "";
}
/**
 * One invoice line per Hivelocity order item: "{Service} - {hostname}" + billing period.
 * Add-ons and OS are not mentioned on the invoice line; total is itemSubtotal.
 */
export function buildHivelocityCollapsedInvoiceLineCopy(input) {
    const serviceLabel = resolveHostingServiceLabel(input.product.serviceType, input.product.name);
    const hostname = readHostname(input.metadata);
    const name = hostname ? `${serviceLabel} - ${hostname}` : serviceLabel;
    return {
        name,
        description: formatSubscriptionPeriod(input.subscriptionStart, input.billingCycle),
    };
}
export function buildHivelocitySubscriptionDisplayName(input) {
    const { name } = buildHivelocityCollapsedInvoiceLineCopy({
        ...input,
        billingCycle: null,
        subscriptionStart: new Date(),
    });
    return name;
}
/** OS and add-on components purchased with the server (stored on subscription, not on invoice). */
export function buildHivelocityPurchasedAddons(meta, lines) {
    const extras = lines.filter((line) => line.kind === "os" || line.kind === "addon");
    const addonLines = extras.filter((line) => line.kind === "addon");
    const addonResellerTotal = addonLines.reduce((sum, line) => sum + line.amountExVat, 0);
    return extras.map((line) => {
        let providerPriceUsd = null;
        if (line.kind === "os" && meta.osPriceUsd != null) {
            providerPriceUsd = meta.osPriceUsd;
        }
        else if (line.kind === "addon" && meta.addonsPriceUsd != null) {
            if (addonLines.length === 1) {
                providerPriceUsd = meta.addonsPriceUsd;
            }
            else if (addonResellerTotal > 0) {
                const share = line.amountExVat / addonResellerTotal;
                providerPriceUsd = Math.round(meta.addonsPriceUsd * share * 100) / 100;
            }
        }
        return {
            kind: line.kind,
            name: line.name,
            ...(line.optionId != null ? { optionId: line.optionId } : {}),
            providerPriceUsd,
            resellerPriceKes: line.amountExVat,
        };
    });
}
export function computeHivelocityTotalProviderCostUsd(meta) {
    const total = (meta.basePriceUsd ?? 0) + (meta.osPriceUsd ?? 0) + (meta.addonsPriceUsd ?? 0);
    return total > 0 ? total : null;
}
