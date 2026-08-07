import type { NiscOrderForInvoice } from "../schemas/nisc-order-invoice";
import { type NiscInvoiceSkipReasonCode } from "./nisc-order-invoice-billing";
export type NiscOrderInvoiceDeliveryResult = {
    ok: true;
    invoiceId: string;
    invoiceNumber: string;
    emailed: boolean;
    kraSynced: boolean;
    source: "team_billing" | "user_profile" | "team_owners";
    kraError?: string;
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
 * Creates invoice for a paid Nisc order, syncs to KRA eTIMS, then emails PDF when synced.
 * Provisioning must continue even when KRA or email fails  never throws.
 */
export declare function createAndEmailNiscOrderInvoice(input: CreateAndEmailNiscOrderInvoiceInput): Promise<NiscOrderInvoiceDeliveryResult>;
/** Agency manual create-from-payment: no invoice / customer billing emails. */
export declare function niscOrderSkipsInvoice(metadata: unknown): boolean;
/**
 * Loads order data and runs pre-provisioning invoice + email. Safe to call from QStash workers.
 */
export declare function runPreProvisioningInvoiceForOrder(niscOrderId: string): Promise<void>;
