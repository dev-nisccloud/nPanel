export type KraTaxBand = "A" | "B" | "C" | "D" | "E";
export type KraSalesItemInput = {
    itemSeq: number;
    itemCd: string;
    itemClsCd: string;
    itemNm: string;
    pkgUnitCd: string;
    pkg: number;
    qtyUnitCd: string;
    qty: number;
    prc: number;
    splyAmt: number;
    dcRt: number;
    dcAmt: number;
    taxTyCd: KraTaxBand;
    taxblAmt: number;
    taxAmt: number;
    totAmt: number;
};
export type KraSalesTransactionInput = Record<string, unknown> & {
    itemList: KraSalesItemInput[];
};
export declare function parseInvoiceNumberForKra(invoiceNumber: string | null | undefined): number | null;
export type BuildKraTransactionResult = {
    ok: true;
    transaction: KraSalesTransactionInput;
} | {
    ok: false;
    reason: string;
};
/**
 * Build KRA saveTrnsSalesOsdc payload from invoice lines.
 * Each line maps to the main nisc_product (service + add-ons total on the line amount).
 */
export declare function buildKraSalesTransactionForInvoice(invoiceId: string): Promise<BuildKraTransactionResult>;
export type KraRefundReasonCode = "01" | "02" | "03" | "04" | "05" | "06";
export declare function parseCreditNoteNumberForKra(creditNumber: string | null | undefined): number | null;
/**
 * Build KRA saveTrnsSalesOsdc credit note (rcptTyCd=R) from a synced invoice.
 */
export declare function buildKraCreditNoteTransactionForInvoice(invoiceId: string, creditNoteId: string, rfdRsnCd: KraRefundReasonCode): Promise<BuildKraTransactionResult>;
/** Main nisc product id on the invoice line (service; add-ons roll into line total). */
export declare function buildNiscInvoiceLineMetadata(input: {
    productId: string;
    serviceType?: string | null;
    kraItemNm?: string;
    isDomainBundle?: boolean;
    bundleDomains?: string[];
}): Record<string, unknown> | undefined;
