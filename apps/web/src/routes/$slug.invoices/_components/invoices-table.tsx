"use client";

import * as React from "react";
import { useNavigate, useLocation } from "react-router";
import { FileText, EllipsisVertical, Download, Loader2, Eye } from "lucide-react";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { captureEvent } from "@/lib/posthog";
import { registerFonts } from "./invoices-list";
import type { InvoiceSummary } from "@/routes/agency.invoices/create/api/schemas";

const formatCurrency = (amount: string | null | undefined, currency: string) => {
	if (!amount) return "- ";
	const n = Number(amount);
	return Number.isFinite(n) ? new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n) : amount;
};

const formatDate = (value: string | Date | null | undefined) => {
	if (!value) return "- ";
	const d = value instanceof Date ? value : new Date(value);
	return Number.isNaN(d.getTime()) ? "- " : d.toLocaleDateString();
};

interface InvoiceRowActionsProps {
	invoice: InvoiceSummary;
	onRefetch?: () => void;
}

function InvoiceRowActions({ invoice, onRefetch }: InvoiceRowActionsProps) {
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const teamSlug = pathname.split("/")[1];
	const [isDownloading, setIsDownloading] = React.useState(false);

	const getById = trpc.invoicing.getById.useQuery({ id: invoice.id }, { enabled: false });

	const handleDownload = async () => {
		try {
			setIsDownloading(true);
			const { data } = await getById.refetch();
			if (!data) throw new Error("Failed to fetch invoice details");
			await registerFonts();
			const [{ pdf }, { buildAgencyInvoicePdfDocument }] = await Promise.all([
				import("@react-pdf/renderer"),
				import("@/lib/build-agency-invoice-pdf-document"),
			]);
			const doc = await buildAgencyInvoicePdfDocument(data);
			const blob = await pdf(doc).toBlob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${invoice.invoiceNumber || "Invoice"}.pdf`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			captureEvent("invoice_downloaded_pdf");
			toast.success("Invoice downloaded successfully", { description: `Invoice ${invoice.invoiceNumber} has been downloaded.` });
		} catch (e) {
			toast.error("Failed to download invoice", { description: e instanceof Error ? e.message : "An error occurred" });
		} finally {
			setIsDownloading(false);
		}
	};

	const basePath = teamSlug ? `/${teamSlug}/invoices` : "/agency/invoices";

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<EllipsisVertical className="h-4 w-4" />
								<span className="sr-only">Actions</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<DropdownMenuItem onClick={() => navigate(`${basePath}/${invoice.id}`)} disabled={isDownloading}>
								<Eye className="mr-2 h-4 w-4" />
								View Invoice
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={handleDownload} disabled={isDownloading}>
								{isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
								{isDownloading ? "Downloading..." : "Download Invoice"}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</TooltipTrigger>
				<TooltipContent>Actions</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

export interface InvoicesTableProps {
	invoices: InvoiceSummary[];
	onRefetch?: () => void;
}

export function InvoicesTable({ invoices, onRefetch }: InvoicesTableProps) {
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const teamSlug = pathname.split("/")[1];
	const basePath = teamSlug ? `/${teamSlug}/invoices` : "/agency/invoices";

	return (
		<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="pl-6">Invoice #</TableHead>
						<TableHead>Customer</TableHead>
						<TableHead>Amount</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Due</TableHead>
						<TableHead className="w-12 pr-6"></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{invoices.map((inv) => (
						<TableRow key={inv.id}>
							<TableCell
								className="pl-6 cursor-pointer font-medium"
								onClick={() => navigate(`${basePath}/${inv.id}`)}
							>
								<div className="flex items-center gap-2">
									<FileText className="h-4 w-4 text-muted-foreground" />
									{inv.invoiceNumber ?? "- "}
								</div>
							</TableCell>
							<TableCell>
								<div className="flex flex-col">
									<span>{inv.customerName ?? "- "}</span>
									{inv.customerEmail && <span className="text-muted-foreground text-sm">{inv.customerEmail}</span>}
								</div>
							</TableCell>
							<TableCell>{formatCurrency(inv.amount, inv.currency)}</TableCell>
							<TableCell>
								<Badge
									variant="outline"
									className={
										inv.status === "PAID"
											? "bg-green-600 text-white border-green-600 hover:bg-green-600 hover:text-white"
											: inv.status === "OVERDUE"
												? "bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90 hover:text-destructive-foreground"
												: inv.status === "SENT"
													? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground"
													: ""
									}
								>
									{inv.status.replace("_", " ")}
								</Badge>
							</TableCell>
							<TableCell>{formatDate(inv.dueDate)}</TableCell>
							<TableCell onClick={(e) => e.stopPropagation()} className="pr-6">
								<InvoiceRowActions invoice={inv} onRefetch={onRefetch} />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

