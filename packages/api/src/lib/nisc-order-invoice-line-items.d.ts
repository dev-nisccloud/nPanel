/**
 * Invoice line item titles and subscription periods for Nisc order auto-invoices.
 * Format: "(identifier) Service - Action" with subscription dates from billing cycle.
 * Domains use Transfer / Registration / Renewal; subscription services use Subscription (or Renewal).
 */
import type { NiscOrderItemForInvoice } from "../schemas/nisc-order-invoice";
export type InvoiceLineItemAction = "Transfer" | "Registration" | "Renewal" | "Subscription";
export type NiscOrderInvoiceLineItemCopy = {
    name: string;
    description: string;
};
export declare function addBillingCycleToDate(start: Date, billingCycle: string | null | undefined): Date | null;
export declare function resolveInvoiceLineItemAction(description: string | null | undefined, serviceType?: string | null, options?: {
    subscriptionBased?: boolean;
}): InvoiceLineItemAction;
export declare function isDomainOrderItem(item: Pick<NiscOrderItemForInvoice, "description" | "primaryDomain"> & {
    product?: {
        serviceType?: string | null;
    };
}): boolean;
export declare function isEmailMarketingOrderItem(item: {
    product?: {
        serviceType?: string | null;
        name?: string;
    };
}): boolean;
export declare function isHostingOrderItem(item: {
    product?: {
        serviceType?: string | null;
        name?: string;
    };
}): boolean;
export declare function resolveEmailMarketingServiceLabel(serviceType: string | null | undefined, productName: string): string;
export declare function resolveHostingServiceLabel(serviceType: string | null | undefined, productName: string): string;
/**
 * Builds invoice line `name` (main line) and `description` (subscription period) for one order item.
 */
export declare function buildNiscOrderInvoiceLineItemCopy(item: NiscOrderItemForInvoice & {
    product: {
        name: string;
        serviceType?: string | null;
    };
}, subscriptionStart: Date): NiscOrderInvoiceLineItemCopy;
/** PDF / preview line text: title and subscription on separate lines for wrapping. */
export declare function formatInvoiceLineItemForPdf(name: string, description?: string | null): string;
