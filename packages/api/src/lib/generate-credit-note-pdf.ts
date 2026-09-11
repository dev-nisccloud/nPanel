import type { CreditNoteDetail } from "../routers/invoicing/schemas";
import { generateAgencyCreditNotePdfBuffer } from "../agency-invoice-pdf/generate-credit-note-pdf-buffer";

export async function generateCreditNotePdfBuffer(creditNote: CreditNoteDetail): Promise<Buffer> {
	return generateAgencyCreditNotePdfBuffer(creditNote);
}
