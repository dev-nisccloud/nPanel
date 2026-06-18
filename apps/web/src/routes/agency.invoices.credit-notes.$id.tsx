"use client";

import { useParams } from "react-router";
import { CreditNoteDetailView } from "./agency.invoices/_components/credit-note-detail-view";

export default function AgencyCreditNoteDetailPage() {
	const params = useParams();
	const creditNoteId = params.id as string;

	return (
		<CreditNoteDetailView
			creditNoteId={creditNoteId}
			backHref="/agency/invoices?tab=credit-notes"
			backLabel="Back to credit notes"
			showKraRetry
		/>
	);
}
