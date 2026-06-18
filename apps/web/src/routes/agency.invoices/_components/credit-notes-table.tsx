"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { Download, Eye, FileText } from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { registerFonts } from "./invoices-list";
import type { CreditNoteSummary } from "@npanel/api/routers/invoicing/schemas";

const formatCurrency = (amount: string | null | undefined, currency: string) => {
	if (!amount) return "-";
	const n = Number(amount);
	return Number.isFinite(n)
		? new Intl.NumberFormat("en-US", {
				style: "currency",
				currency,
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}).format(n)
		: amount;
};

const formatDate = (value: string | Date | null | undefined) => {
	if (!value) return "-";
	const d = value instanceof Date ? value : new Date(value);
	return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
};

const statusVariant = (status: string) => {
	switch (status) {
		case "ISSUED":
			return "default" as const;
		case "APPLIED":
			return "secondary" as const;
		case "VOIDED":
			return "destructive" as const;
		default:
			return "outline" as const;
	}
};

type CreditNotesTableProps = {
	creditNotes: CreditNoteSummary[];
	onRefetch?: () => void;
	detailPathPrefix: string;
};

function CreditNoteRowActions({
	creditNote,
	detailPathPrefix,
}: {
	creditNote: CreditNoteSummary;
	detailPathPrefix: string;
}) {
	const navigate = useNavigate();
	const [isDownloading, setIsDownloading] = React.useState(false);
	const getById = trpc.invoicing.getCreditNoteById.useQuery(
		{ id: creditNote.id },
		{ enabled: false },
	);

	const handleDownload = async () => {
		try {
			setIsDownloading(true);
			const result = await getById.refetch();
			const detail = result.data;
			if (!detail) {
				throw new Error("Credit note not found");
			}

			const [{ pdf }, { buildAgencyCreditNotePdfDocument }] = await Promise.all([
				import("@react-pdf/renderer"),
				import("@/lib/build-agency-credit-note-pdf-document"),
			]);

			await registerFonts();
			const doc = await buildAgencyCreditNotePdfDocument(detail);
			const blob = await pdf(doc).toBlob();

			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `${detail.creditNumber || "Credit-Note"}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			toast.success("Credit note downloaded");
		} catch (error) {
			console.error(error);
			toast.error("Failed to download credit note", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setIsDownloading(false);
		}
	};

	return (
		<div className="flex items-center justify-end gap-1">
			<Button
				variant="ghost"
				size="icon"
				title="View credit note"
				onClick={() => navigate(`${detailPathPrefix}/${creditNote.id}`)}
			>
				<Eye className="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				title="Download PDF"
				onClick={handleDownload}
				disabled={isDownloading}
			>
				{isDownloading ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />}
			</Button>
		</div>
	);
}

export function CreditNotesTable({
	creditNotes,
	detailPathPrefix,
}: CreditNotesTableProps) {
	return (
		<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="pl-6">Credit Note #</TableHead>
						<TableHead>Original Invoice</TableHead>
						<TableHead>Customer</TableHead>
						<TableHead>Amount</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Issued</TableHead>
						<TableHead className="w-24 pr-6 text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{creditNotes.map((cn) => (
						<TableRow key={cn.id}>
							<TableCell className="pl-6 font-medium">
								<div className="flex items-center gap-2">
									<FileText className="h-4 w-4 text-muted-foreground" />
									{cn.creditNumber || "—"}
								</div>
							</TableCell>
							<TableCell>{cn.originalInvoiceNumber || cn.invoiceNumber || "—"}</TableCell>
							<TableCell>
								<div className="flex flex-col">
									<span>{cn.customerName || "—"}</span>
									{cn.customerEmail ? (
										<span className="text-xs text-muted-foreground">{cn.customerEmail}</span>
									) : null}
								</div>
							</TableCell>
							<TableCell>{formatCurrency(cn.amount, cn.currency)}</TableCell>
							<TableCell>
								<Badge variant={statusVariant(cn.status)}>{cn.status}</Badge>
							</TableCell>
							<TableCell>{formatDate(cn.issuedAt)}</TableCell>
							<TableCell className="pr-6">
								<CreditNoteRowActions creditNote={cn} detailPathPrefix={detailPathPrefix} />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
