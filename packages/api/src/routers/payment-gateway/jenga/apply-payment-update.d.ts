import type { JengaCallbackQuery, JengaIpnPayload, JengaPaymentMetadata } from "./types";
type ApplyResult = {
    ok: true;
    alreadyTerminal: boolean;
    transactionId: string;
    status: string;
} | {
    ok: false;
    reason: string;
};
/**
 * Apply browser callback (GET redirect) to payment_transaction.
 * Success when status === "paid" (per Jenga docs).
 */
export declare function applyJengaCallbackUpdate(query: JengaCallbackQuery): Promise<ApplyResult>;
/**
 * Apply IPN webhook to payment_transaction (durable source of truth).
 * Matches by billNumber (order reference) or customer.reference when present.
 */
export declare function applyJengaIpnUpdate(payload: JengaIpnPayload): Promise<ApplyResult>;
export declare function parseJengaMetadata(raw: unknown): JengaPaymentMetadata | null;
export declare function getJengaReturnRedirect(params: {
    metadata: JengaPaymentMetadata | null;
    orderReference: string;
    status: string;
}): string;
export {};
