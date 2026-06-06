import { formatNiscDate } from "./nisc-datetime-format";
function formatDateForInvoice(d) {
    return formatNiscDate(d);
}
export function addBillingCycleToDate(start, billingCycle) {
    if (!billingCycle)
        return null;
    const end = new Date(start);
    if (billingCycle === "MONTHLY") {
        end.setMonth(end.getMonth() + 1);
        return end;
    }
    if (billingCycle === "YEARLY") {
        end.setFullYear(end.getFullYear() + 1);
        return end;
    }
    if (billingCycle === "BIENNIALLY") {
        end.setFullYear(end.getFullYear() + 2);
        return end;
    }
    return null;
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
export function resolveInvoiceLineItemAction(description, serviceType, options) {
    const desc = (description ?? "").trim().toLowerCase();
    if (desc === "transfer" || serviceType === "domain_transfer")
        return "Transfer";
    if (desc === "renewal")
        return "Renewal";
    if (options?.subscriptionBased)
        return "Subscription";
    if (desc === "registration")
        return "Registration";
    return "Registration";
}
function normalizeServiceType(serviceType) {
    return (serviceType ?? "").trim().toLowerCase();
}
export function isDomainOrderItem(item) {
    const st = normalizeServiceType(item.product?.serviceType);
    if (st === "domain_transfer" ||
        st === "domain_registration" ||
        st === "domains" ||
        st.includes("domain")) {
        return true;
    }
    const desc = (item.description ?? "").trim().toLowerCase();
    if (item.primaryDomain?.trim() && (desc === "transfer" || desc === "registration" || desc === "renewal")) {
        return true;
    }
    return false;
}
export function isEmailMarketingOrderItem(item) {
    const st = normalizeServiceType(item.product?.serviceType);
    if (st === "email_marketing" || st === "nisc_email_marketing") {
        return true;
    }
    const name = (item.product?.name ?? "").toLowerCase();
    return name.includes("email marketing") || name.includes("nisc email marketing");
}
export function isHostingOrderItem(item) {
    if (isEmailMarketingOrderItem(item)) {
        return false;
    }
    const st = normalizeServiceType(item.product?.serviceType);
    if (st === "web_hosting" ||
        st === "email_hosting" ||
        st === "vps_hosting" ||
        st === "vds_hosting" ||
        st === "dedicated_server_hosting" ||
        st === "reseller_hosting") {
        return true;
    }
    const name = (item.product?.name ?? "").toLowerCase();
    return (name.includes("hosting") ||
        name.includes("vps") ||
        name.includes("dedicated") ||
        name.includes("email hosting"));
}
export function resolveEmailMarketingServiceLabel(serviceType, productName) {
    const st = normalizeServiceType(serviceType);
    if (st === "nisc_email_marketing")
        return "Nisc Email Marketing";
    const name = productName.trim();
    if (/nisc email marketing/i.test(name))
        return "Nisc Email Marketing";
    if (/email marketing/i.test(name))
        return "Email Marketing";
    return "Email Marketing";
}
export function resolveHostingServiceLabel(serviceType, productName) {
    const st = normalizeServiceType(serviceType);
    if (st === "web_hosting")
        return "Website Hosting";
    if (st === "email_hosting")
        return "Email Hosting";
    if (st === "vps_hosting" || st === "vds_hosting")
        return "VPS Hosting";
    if (st === "dedicated_server_hosting")
        return "Dedicated Hosting";
    if (st === "reseller_hosting")
        return "Reseller Hosting";
    const name = productName.trim();
    if (/vps/i.test(name))
        return "VPS Hosting";
    if (/email hosting/i.test(name))
        return "Email Hosting";
    if (/dedicated/i.test(name))
        return "Dedicated Hosting";
    if (/hosting/i.test(name))
        return "Website Hosting";
    return productName.trim() || "Hosting";
}
function resolveIdentifier(item) {
    if (item.primaryDomain?.trim())
        return item.primaryDomain.trim();
    if (item.productPlan?.name?.trim())
        return item.productPlan.name.trim();
    return "";
}
function formatSubscriptionPeriod(subscriptionStart, billingCycle) {
    const startStr = formatDateForInvoice(subscriptionStart);
    const expiry = addBillingCycleToDate(subscriptionStart, billingCycle);
    const cycle = billingCycleLabel(billingCycle);
    if (expiry) {
        return `Subscription: ${startStr} – ${formatDateForInvoice(expiry)} (${cycle})`;
    }
    return `Subscription: ${startStr} – (${cycle})`;
}
/**
 * Builds invoice line `name` (main line) and `description` (subscription period) for one order item.
 */
export function buildNiscOrderInvoiceLineItemCopy(item, subscriptionStart) {
    const identifier = resolveIdentifier(item);
    const bracket = identifier ? `(${identifier})` : "";
    const isDomain = isDomainOrderItem(item);
    const action = resolveInvoiceLineItemAction(item.description, item.product.serviceType, {
        subscriptionBased: !isDomain,
    });
    const subscription = formatSubscriptionPeriod(subscriptionStart, item.billingCycle);
    if (isDomain) {
        const name = bracket ? `${bracket} Domain - ${action}` : `Domain - ${action}`;
        return { name, description: subscription };
    }
    if (isEmailMarketingOrderItem(item)) {
        const emailMarketingLabel = resolveEmailMarketingServiceLabel(item.product.serviceType, item.product.name);
        const name = bracket
            ? `${bracket} ${emailMarketingLabel} - ${action}`
            : `${emailMarketingLabel} - ${action}`;
        return { name, description: subscription };
    }
    if (isHostingOrderItem(item)) {
        const hostingLabel = resolveHostingServiceLabel(item.product.serviceType, item.product.name);
        const name = bracket
            ? `${bracket} ${hostingLabel} - ${action}`
            : `${hostingLabel} - ${action}`;
        return { name, description: subscription };
    }
    const planSuffix = item.productPlan?.name?.trim() ? ` - ${item.productPlan.name.trim()}` : "";
    const name = bracket
        ? `${bracket} ${item.product.name}${planSuffix}`
        : `${item.product.name}${planSuffix}`;
    return { name, description: subscription };
}
/** PDF / preview line text: title and subscription on separate lines for wrapping. */
export function formatInvoiceLineItemForPdf(name, description) {
    const desc = description?.trim();
    if (!desc)
        return name;
    return `${name}\n${desc}`;
}
