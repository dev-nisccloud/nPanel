"use client";

import { useLocation, useParams } from "react-router";
import { CreditNoteDetailView } from "./agency.invoices/_components/credit-note-detail-view";

export default function CustomerCreditNoteDetailPage() {
	const params = useParams();
	const { pathname } = useLocation();
	const teamSlug = pathname.split("/")[1];
	const creditNoteId = params.id as string;

	return (
		<CreditNoteDetailView
			creditNoteId={creditNoteId}
			backHref={`/${teamSlug}/invoices?tab=credit-notes`}
			backLabel="Back to credit notes"
		/>
	);
}
