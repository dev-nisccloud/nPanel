/**
 * Builds "order received" email line items and totals (aligned with invoice line copy + VAT).
 */
import type { NiscOrderItemForInvoice } from "../schemas/nisc-order-invoice";
export type NiscOrderReceivedEmailLineItem = {
    name: string;
    description?: string;
    quantity?: number;
    price: string;
};
export type NiscOrderForReceivedEmail = {
    createdAt: Date;
    currency: string;
    subtotal: string;
    orderItems: Array<NiscOrderItemForInvoice & {
        product: {
            name: string;
            serviceType?: string | null;
        };
        productPlan?: {
            name: string;
        } | null;
    }>;
};
export declare function buildNiscOrderReceivedEmailItems(order: NiscOrderForReceivedEmail): {
    orderItems: NiscOrderReceivedEmailLineItem[];
    totalAmount: string;
    totalWithTax: number;
};
