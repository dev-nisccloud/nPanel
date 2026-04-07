"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { FileText, EllipsisVertical, Download, Send, Trash2, Loader2, Eye } from "lucide-react";
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
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { Document, Page } from "@react-pdf/renderer";
import { pdf } from "@react-pdf/renderer";
import QRCodeUtil from "qrcode";
import { PdfDetails } from "@/routes/agency.invoices/create/_components/form/pdfDetails";
import { pdfContainers } from "@/lib/pdfStyles";
import { registerFonts, convertInvoiceToPdfData } from "./invoices-list";
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
	const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
	const [isDownloading, setIsDownloading] = React.useState(false);
	const [isResending, setIsResending] = React.useState(false);
	const [isDeleting, setIsDeleting] = React.useState(false);

	const utils = trpc.useUtils();
	const getById = trpc.invoicing.getById.useQuery({ id: invoice.id }, { enabled: false });

	const deleteMutation = trpc.invoicing.deleteInvoice.useMutation({
		onSuccess: () => {
			toast.success("Invoice deleted successfully", { description: `Invoice ${invoice.invoiceNumber} has been deleted.` });
			utils.invoicing.list.invalidate();
			onRefetch?.();
			setIsDeleteOpen(false);
		},
		onError: (e) => toast.error("Failed to delete invoice", { description: e.message }),
	});

	const resendMutation = trpc.invoicing.resendEmailReminder.useMutation({
		onSuccess: () => {
			toast.success("Email reminder sent successfully!", {
				description: `Reminder for invoice ${invoice.invoiceNumber} has been sent to ${invoice.customerEmail}`,
			});
			utils.invoicing.list.invalidate();
		},
		onError: (e) => toast.error("Failed to send email reminder", { description: e.message }),
	});

	const handleDownload = async () => {
		try {
			setIsDownloading(true);
			const { data } = await getById.refetch();
			if (!data) throw new Error("Failed to fetch invoice details");
			await registerFonts();
			const pdfData = convertInvoiceToPdfData(data);
			let qrCodeDataUrl: string | undefined;
			if (pdfData.paymentDetails.qrCodeValue) {
				try {
					qrCodeDataUrl = await QRCodeUtil.toDataURL(pdfData.paymentDetails.qrCodeValue, { width: 120, margin: 1 });
				} catch {
					/* ignore */
				}
			}
			const blob = await pdf(
				<Document>
					<Page size="A4" style={pdfContainers.page}>
						<PdfDetails
							companyDetails={pdfData.companyDetails}
							invoiceDetails={pdfData.invoiceDetails}
							invoiceTerms={pdfData.invoiceTerms}
							paymentDetails={{ ...pdfData.paymentDetails, qrCodeDataUrl }}
							yourDetails={pdfData.yourDetails}
						/>
					</Page>
				</Document>
			).toBlob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${invoice.invoiceNumber || "Invoice"}.pdf`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			toast.success("Invoice downloaded successfully", { description: `Invoice ${invoice.invoiceNumber} has been downloaded.` });
		} catch (e) {
			toast.error("Failed to download invoice", { description: e instanceof Error ? e.message : "An error occurred" });
		} finally {
			setIsDownloading(false);
		}
	};

	const handleResend = async () => {
		try {
			setIsResending(true);
			if (!invoice.customerEmail) {
				toast.error("No customer email", { description: "This invoice does not have a customer email address." });
				return;
			}
			const { data } = await getById.refetch();
			if (!data) throw new Error("Failed to fetch invoice details");
			await registerFonts();
			const pdfData = convertInvoiceToPdfData(data);
			let qrCodeDataUrl: string | undefined;
			if (pdfData.paymentDetails.qrCodeValue) {
				try {
					qrCodeDataUrl = await QRCodeUtil.toDataURL(pdfData.paymentDetails.qrCodeValue, { width: 120, margin: 1 });
				} catch {
					/* ignore */
				}
			}
			const blob = await pdf(
				<Document>
					<Page size="A4" style={pdfContainers.page}>
						<PdfDetails
							companyDetails={pdfData.companyDetails}
							invoiceDetails={pdfData.invoiceDetails}
							invoiceTerms={pdfData.invoiceTerms}
							paymentDetails={{ ...pdfData.paymentDetails, qrCodeDataUrl }}
							yourDetails={pdfData.yourDetails}
						/>
					</Page>
				</Document>
			).toBlob();
			const pdfBase64 = await new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onloadend = () => resolve((reader.result as string).split(",")[1] ?? "");
				reader.onerror = reject;
				reader.readAsDataURL(blob);
			});
			await resendMutation.mutateAsync({ invoiceId: invoice.id, pdfBase64 });
		} catch (e) {
			if (!resendMutation.isError) {
				toast.error("Failed to resend email", { description: e instanceof Error ? e.message : "An error occurred" });
			}
		} finally {
			setIsResending(false);
		}
	};

	const handleDelete = async () => {
		try {
			setIsDeleting(true);
			setIsDeleteOpen(false);
			await deleteMutation.mutateAsync({ invoiceId: invoice.id });
		} catch {
			/* handled in mutation */
		} finally {
			setIsDeleting(false);
		}
	};

	const busy = isDownloading || isResending || isDeleting;

	return (
		<>
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
								<DropdownMenuItem onClick={() => navigate(`/agency/invoices/${invoice.id}`)} disabled={busy}>
									<Eye className="mr-2 h-4 w-4" />
									View Invoice
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={handleDownload} disabled={busy}>
									{isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
									{isDownloading ? "Downloading..." : "Download Invoice"}
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleResend} disabled={busy || !invoice.customerEmail}>
									{isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
									{isResending ? "Sending..." : "Resend Email Reminder"}
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => setIsDeleteOpen(true)} disabled={busy} className="text-destructive focus:text-destructive">
									<Trash2 className="mr-2 h-4 w-4" />
									Delete Invoice
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</TooltipTrigger>
					<TooltipContent>Actions</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			<AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Invoice</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete invoice <strong>{invoice.invoiceNumber || "this invoice"}</strong>? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete Invoice"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

export interface InvoicesTableProps {
	invoices: InvoiceSummary[];
	onRefetch?: () => void;
}

export function InvoicesTable({ invoices, onRefetch }: InvoicesTableProps) {
	const navigate = useNavigate();

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
								onClick={() => navigate(`/agency/invoices/${inv.id}`)}
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

