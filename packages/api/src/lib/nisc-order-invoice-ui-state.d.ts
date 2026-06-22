/**
 * Browser-safe helpers for Nisc order invoice UI (no DB or Node imports).
 */
export type NiscInvoiceBillingSource = "team_billing" | "user_profile";
export type NiscOrderInvoiceMetadata = {
    status: "created" | "skipped";
    invoiceId?: string;
    invoiceNumber?: string;
    source?: NiscInvoiceBillingSource;
    emailed?: boolean;
    kraSynced?: boolean;
    kraStatus?: string;
    kraError?: string;
    reasonCode?: string;
    reasonMessage?: string;
    updatedAt: string;
};
export type NiscOrderInvoiceUiState = {
    status: "linked";
    invoiceId: string;
    invoiceNumber: string | null;
    source?: NiscInvoiceBillingSource;
    emailed?: boolean;
    kraSynced?: boolean;
    kraError?: string;
} | {
    status: "skipped";
    reasonMessage: string;
    reasonCode?: string;
} | {
    status: "pending";
};
export declare function getNiscOrderInvoiceUiState(order: {
    invoiceId: string | null;
    invoiceNumber: string | null;
    metadata: unknown;
}): NiscOrderInvoiceUiState;
