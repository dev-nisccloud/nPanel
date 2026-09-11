import { db } from "@npanel/db";
import { fetchCreditNoteDetail } from "../routers/invoicing";
import type { CreditNoteDetail } from "../routers/invoicing/schemas";

type DbLike = typeof db;

export async function getCreditNoteDetailForPdf(
	dbClient: DbLike,
	creditNoteId: string,
): Promise<CreditNoteDetail> {
	return fetchCreditNoteDetail(dbClient, creditNoteId);
}
