import type { NiscOrderForInvoice } from "../schemas/nisc-order-invoice";
import { type NiscInvoiceSkipReasonCode } from "./nisc-order-invoice-billing";
export type NiscOrderInvoiceDeliveryResult = {
    ok: true;
    invoiceId: string;
    invoiceNumber: string;
    emailed: boolean;
    source: "team_billing" | "user_profile" | "team_owners";
} | {
    ok: false;
    skipped: true;
    reasonCode: NiscInvoiceSkipReasonCode | string;
    reasonMessage: string;
} | {
    ok: false;
    skipped: false;
    reason: string;
};
export type CreateAndEmailNiscOrderInvoiceInput = {
    niscOrderId: string;
    order: NiscOrderForInvoice & {
        total: string;
        currency: string;
        invoiceId?: string | null;
        invoiceNumber?: string | null;
    };
    teamId: string | null;
    userId: string | null;
    createdBy: string;
    teamSlug?: string | null;
};
/**
 * Creates invoice for a paid Nisc order (if not already created) and emails PDF to billing contact.
 * Never throws - callers should always continue provisioning.
 */
export declare function createAndEmailNiscOrderInvoice(input: CreateAndEmailNiscOrderInvoiceInput): Promise<NiscOrderInvoiceDeliveryResult>;
/**
 * Loads order data and runs pre-provisioning invoice + email. Safe to call from QStash workers.
 */
export declare function runPreProvisioningInvoiceForOrder(niscOrderId: string): Promise<void>;
