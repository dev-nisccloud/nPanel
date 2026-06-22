import type { CreditNoteDetail, CreditNote } from "../routers/invoicing/schemas";
import { extractEtimsFiscalFieldsFromCreditNote } from "./etims-fiscal-fields";
export declare function resolveCreditNoteEtimsVerificationUrl(creditNote: Pick<CreditNoteDetail, "kraStatus" | "kraVerificationUrl" | "kraQrCode">): string | undefined;
/** Strip KRA admin fields from credit note payloads embedded on invoices. */
export declare function sanitizeCreditNoteForCustomer(creditNote: CreditNote): CreditNote & {
    etimsFiscal?: ReturnType<typeof extractEtimsFiscalFieldsFromCreditNote>;
};
/** Customer-facing credit note detail — no KRA admin fields. */
export declare function sanitizeCreditNoteDetailForCustomer(creditNote: CreditNoteDetail): CreditNoteDetail;
