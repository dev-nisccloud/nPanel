import { type TeamBillingSettings } from "../schemas/team-billing";
export type NiscInvoiceBillingSource = "team_billing" | "user_profile" | "team_owners";
export type ResolvedNiscOrderBilling = {
    billing: TeamBillingSettings;
    source: NiscInvoiceBillingSource;
    /** When set, invoice PDF is emailed to all listed addresses (first is primary TO). */
    recipientEmails?: string[];
};
export declare const NISC_INVOICE_SKIP_REASON_CODES: {
    readonly NO_BILLING_DETAILS: "no_billing_details";
    readonly TEAM_BILLING_INCOMPLETE: "team_billing_incomplete";
    readonly USER_PROFILE_INCOMPLETE: "user_profile_incomplete";
    readonly BILLING_EMAIL_EMPTY: "billing_email_empty";
    readonly INVOICE_CREATION_FAILED: "invoice_creation_failed";
    readonly INVOICE_MISSING_AFTER_CREATE: "invoice_missing_after_create";
    readonly EMAIL_SEND_FAILED: "email_send_failed";
    readonly KRA_SYNC_FAILED: "kra_sync_failed";
    readonly KRA_SYNC_SKIPPED: "kra_sync_skipped";
};
export type NiscInvoiceSkipReasonCode = (typeof NISC_INVOICE_SKIP_REASON_CODES)[keyof typeof NISC_INVOICE_SKIP_REASON_CODES];
export declare const NISC_INVOICE_SKIP_REASON_MESSAGES: Record<NiscInvoiceSkipReasonCode, string>;
/**
 * Team orders: company billing first, then user profile.
 * User-only orders (no teamId): user profile only.
 */
export declare function resolveNiscOrderInvoiceBilling(params: {
    teamId: string | null;
    userId: string | null;
}): Promise<{
    ok: true;
    resolved: ResolvedNiscOrderBilling;
} | {
    ok: false;
    reasonCode: NiscInvoiceSkipReasonCode;
    reasonMessage: string;
}>;
