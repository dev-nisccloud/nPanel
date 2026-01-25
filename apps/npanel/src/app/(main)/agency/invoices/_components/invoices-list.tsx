"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
	CalendarDays,
	User2,
	Mail,
	Wallet,
	Clock,
	CheckCircle2,
	AlertCircle,
	XCircle,
	MoreHorizontal,
	Download,
	Send,
	Trash2,
	Loader2,
	Eye,
} from "lucide-react";

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
import { toast } from "sonner";
import type { InvoiceSummary } from "@/app/(main)/agency/invoicing/api/schemas";
import type { InvoiceDetail } from "@/app/(main)/agency/invoices/create/api/schemas";
import { Document, Page } from "@react-pdf/renderer";
import { pdf } from "@react-pdf/renderer";
import { PdfDetails } from "@/app/(main)/agency/invoices/create/_components/form/pdfDetails";
import { pdfContainers } from "@/lib/pdfStyles";
import QRCodeUtil from "qrcode";
import type {
	YourDetails,
	CompanyDetails,
	InvoiceItemDetails,
	PaymentDetails,
	InvoiceTerms,
} from "@/app/(main)/agency/invoices/create/types";

const statusBadgeVariant: Record<InvoiceSummary["status"], "default" | "secondary" | "destructive" | "outline"> = {
	DRAFT: "outline",
	SENT: "secondary",
	PARTIALLY_PAID: "secondary",
	PAID: "default",
	OVERDUE: "destructive",
	CANCELLED: "outline",
	WRITTEN_OFF: "outline",
};

const statusIcon: Record<InvoiceSummary["status"], React.ComponentType<{ className?: string }>> = {
	DRAFT: Clock,
	SENT: AlertCircle,
	PARTIALLY_PAID: AlertCircle,
	PAID: CheckCircle2,
	OVERDUE: XCircle,
	CANCELLED: XCircle,
	WRITTEN_OFF: AlertCircle,
};

const formatCurrency = (amount: string | null | undefined, currency: string) => {
	if (!amount) {
		return "—";
	}

	const numeric = Number(amount);
	if (!Number.isFinite(numeric)) {
		return amount;
	}

	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
	}).format(numeric);
};

const formatDate = (value: string | Date | null | undefined) => {
	if (!value) {
		return "—";
	}
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "—";
	}
	return date.toLocaleDateString();
};

// Font registration state (same as in downloadInvoiceButton)
let fontsRegistered = false;
let fontsRegistering = false;

export const registerFonts = async (): Promise<boolean> => {
	if (fontsRegistered) return true;
	if (fontsRegistering) {
		return new Promise((resolve) => {
			const checkInterval = setInterval(() => {
				if (fontsRegistered) {
					clearInterval(checkInterval);
					resolve(true);
				}
			}, 100);
		});
	}

	fontsRegistering = true;
	
	try {
		const { Font } = await import("@react-pdf/renderer");
		const fontWeights = [
			{ name: "Geist-Thin.ttf", weight: "thin" },
			{ name: "Geist-UltraLight.ttf", weight: "ultralight" },
			{ name: "Geist-Light.ttf", weight: "light" },
			{ name: "Geist-Regular.ttf", weight: "normal" },
			{ name: "Geist-Medium.ttf", weight: "medium" },
			{ name: "Geist-SemiBold.ttf", weight: "semibold" },
			{ name: "Geist-Bold.ttf", weight: "bold" },
			{ name: "Geist-UltraBlack.ttf", weight: "ultrabold" },
		];

		const fonts = await Promise.all(
			fontWeights.map(async ({ name, weight }) => {
				try {
					const response = await fetch(`/font/${name}`);
					if (!response.ok) {
						console.warn(`Font ${name} not found, skipping...`);
						return null;
					}
					const fontData = await response.arrayBuffer();
					const base64 = btoa(
						new Uint8Array(fontData).reduce(
							(data, byte) => data + String.fromCharCode(byte),
							""
						)
					);
					return {
						src: `data:font/truetype;base64,${base64}`,
						fontWeight: weight as "thin" | "ultralight" | "light" | "normal" | "medium" | "semibold" | "bold" | "ultrabold",
					};
				} catch (error) {
					console.warn(`Failed to load font ${name}:`, error);
					return null;
				}
			})
		);

		const validFonts = fonts.filter((font) => font !== null);
		
		if (validFonts.length > 0) {
			Font.register({
				family: "Geist",
				fonts: validFonts,
			});
			fontsRegistered = true;
			return true;
		}
		return false;
	} catch (error) {
		console.error("Failed to register fonts:", error);
		return false;
	} finally {
		fontsRegistering = false;
	}
};

// Hardcoded company logo URL
const COMPANY_LOGO_URL = "https://1ris7itpac.ufs.sh/f/Djp547U8wumpWQzBihElLmSnxiqhFZB2ajbeTk0Y6XofJ4Mp";

// Helper function to convert InvoiceDetail to PDF data format (exported for use in invoices-table)
export function convertInvoiceToPdfData(invoice: InvoiceDetail) {
	const fromDetails = invoice.fromDetails as any;
	const customerDetails = invoice.customerDetails as any;
	const paymentDetails = invoice.paymentDetails as any;

	// Always use the hardcoded company logo URL
	const logoUrl = COMPANY_LOGO_URL;

	const yourDetails: YourDetails = {
		yourName: fromDetails?.name,
		yourEmail: fromDetails?.email,
		yourAddress: fromDetails?.address,
		yourCity: fromDetails?.city,
		yourState: fromDetails?.state,
		yourCountry: fromDetails?.country,
		yourZip: fromDetails?.zip,
		yourTaxId: fromDetails?.taxId,
		yourLogo: logoUrl, // Include the company logo
	};

	const companyDetails: CompanyDetails = {
		companyName: customerDetails?.name,
		email: customerDetails?.email,
		companyAddress: customerDetails?.address,
		companyCity: customerDetails?.city,
		companyState: customerDetails?.state,
		companyCountry: customerDetails?.country,
		companyZip: customerDetails?.zip,
		companyTaxId: customerDetails?.taxId,
	};

	const invoiceDetails: InvoiceItemDetails = {
		note: invoice.note || undefined,
		discount: invoice.discount || undefined,
		taxPercentage: invoice.taxPercentage || undefined,
		currency: invoice.currency,
		items: invoice.lineItems.map((item) => ({
			id: item.id,
			itemDescription: item.name || "Service",
			amount: item.price ? Number(item.price) : undefined,
			qty: item.quantity || undefined,
		})),
	};

	// Convert payment method from database format to PDF format
	// In DB, paymentDetails.paymentMethod can be: "bank", "mpesa", "cheque" (lowercase from form)
	// or "BANK_TRANSFER", "MPESA", "CHEQUE" (from enum)
	const paymentMethodApi = paymentDetails?.paymentMethod;
	let paymentMethod: "bank" | "mpesa" | "cheque" | undefined;
	
	// Handle various formats that might be in the database
	if (paymentMethodApi === "BANK_TRANSFER" || paymentMethodApi === "bank_transfer" || paymentMethodApi === "bank") {
		paymentMethod = "bank";
	} else if (paymentMethodApi === "MPESA" || paymentMethodApi === "mpesa") {
		paymentMethod = "mpesa";
	} else if (paymentMethodApi === "CHEQUE" || paymentMethodApi === "cheque") {
		paymentMethod = "cheque";
	}
	
	// If no payment method is provided, set default MPESA values
	if (!paymentMethod) {
		paymentMethod = "mpesa";
	}
	
	// Build payment details with defaults for MPESA when method is mpesa or defaulted
	const paymentDetailsFormatted: PaymentDetails = {
		paymentMethod,
		currency: invoice.currency || "KES",
		qrCodeValue: paymentDetails?.qrCodeValue || "www.nisccloud.com",
		// Bank transfer fields (only if method is bank)
		bankName: paymentMethod === "bank" ? paymentDetails?.bankName : undefined,
		accountNumber: paymentMethod === "bank" ? paymentDetails?.accountNumber : undefined,
		accountName: paymentMethod === "bank" ? paymentDetails?.accountName : undefined,
		branchName: paymentMethod === "bank" ? paymentDetails?.branchName : undefined,
		branchCode: paymentMethod === "bank" ? paymentDetails?.branchCode : undefined,
		swiftCode: paymentMethod === "bank" ? paymentDetails?.swiftCode : undefined,
		// MPESA fields (only if method is mpesa, with defaults if not provided)
		mpesaPaybillNumber: paymentMethod === "mpesa" 
			? (paymentDetails?.mpesaPaybillNumber || "303030")
			: undefined,
		mpesaAccountNumber: paymentMethod === "mpesa"
			? (paymentDetails?.mpesaAccountNumber || "2052676528")
			: undefined,
		mpesaInstructions: paymentMethod === "mpesa"
			? (paymentDetails?.mpesaInstructions || "Absa Bank Kenya")
			: undefined,
		// Cheque fields (only if method is cheque)
		chequeDeliveryAddress: paymentMethod === "cheque" ? paymentDetails?.chequeDeliveryAddress : undefined,
		chequeInstructions: paymentMethod === "cheque" ? paymentDetails?.chequeInstructions : undefined,
	};

	const invoiceTerms: InvoiceTerms = {
		invoiceNumber: invoice.invoiceNumber || undefined,
		issueDate: invoice.issueDate ? new Date(invoice.issueDate) : undefined,
		dueDate: invoice.dueDate ? new Date(invoice.dueDate) : undefined,
	};

	return {
		yourDetails,
		companyDetails,
		invoiceDetails,
		paymentDetails: paymentDetailsFormatted,
		invoiceTerms,
	};
}

interface InvoiceCardProps {
	invoice: InvoiceSummary;
	onRefetch?: () => void;
}

function InvoiceCard({ invoice, onRefetch }: InvoiceCardProps) {
	const [isActionMenuOpen, setIsActionMenuOpen] = React.useState(false);
	const [isDownloading, setIsDownloading] = React.useState(false);
	const [isResending, setIsResending] = React.useState(false);
	const [isDeleting, setIsDeleting] = React.useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
	const router = useRouter();

	const utils = trpc.useUtils();
	const StatusIcon = statusIcon[invoice.status];

	const getInvoiceDetail = trpc.invoicing.getById.useQuery(
		{ id: invoice.id },
		{ enabled: false }
	);

	const deleteInvoiceMutation = trpc.invoicing.deleteInvoice.useMutation({
		onSuccess: () => {
			toast.success("Invoice deleted successfully", {
				description: `Invoice ${invoice.invoiceNumber} has been deleted.`,
			});
			utils.invoicing.list.invalidate();
			if (onRefetch) {
				onRefetch();
			}
		},
		onError: (error) => {
			toast.error("Failed to delete invoice", {
				description: error.message || "An error occurred while deleting the invoice",
			});
		},
	});

	const resendEmailMutation = trpc.invoicing.resendEmailReminder.useMutation({
		onSuccess: () => {
			toast.success("Email reminder sent successfully!", {
				description: `Reminder for invoice ${invoice.invoiceNumber} has been sent to ${invoice.customerEmail}`,
			});
			utils.invoicing.list.invalidate();
		},
		onError: (error) => {
			toast.error("Failed to send email reminder", {
				description: error.message || "An error occurred while sending the email reminder",
			});
		},
	});

	const handleDownloadInvoice = async () => {
		try {
			setIsDownloading(true);
			setIsActionMenuOpen(false);

			// Fetch full invoice details
			const invoiceDetail = await getInvoiceDetail.refetch();
			if (!invoiceDetail.data) {
				throw new Error("Failed to fetch invoice details");
			}

			// Ensure fonts are registered
			await registerFonts();

			// Convert invoice data to PDF format
			const pdfData = convertInvoiceToPdfData(invoiceDetail.data);

			// Generate QR code if needed
			let qrCodeDataUrl: string | undefined;
			if (pdfData.paymentDetails.qrCodeValue) {
				try {
					qrCodeDataUrl = await QRCodeUtil.toDataURL(pdfData.paymentDetails.qrCodeValue, {
						width: 120,
						margin: 1,
					});
				} catch (error) {
					console.error("Failed to generate QR code:", error);
				}
			}

			// Generate PDF
			const blob = await pdf(
				<Document>
					<Page size="A4" style={pdfContainers.page}>
						<PdfDetails
							companyDetails={pdfData.companyDetails}
							invoiceDetails={pdfData.invoiceDetails}
							invoiceTerms={pdfData.invoiceTerms}
							paymentDetails={{
								...pdfData.paymentDetails,
								qrCodeDataUrl,
							}}
							yourDetails={pdfData.yourDetails}
						/>
					</Page>
				</Document>
			).toBlob();

			// Download the PDF
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `${invoice.invoiceNumber || "Invoice"}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			toast.success("Invoice downloaded successfully", {
				description: `Invoice ${invoice.invoiceNumber} has been downloaded.`,
			});
		} catch (error) {
			console.error("Failed to download invoice:", error);
			toast.error("Failed to download invoice", {
				description: error instanceof Error ? error.message : "An error occurred while downloading the invoice",
			});
		} finally {
			setIsDownloading(false);
		}
	};

	const handleResendEmail = async () => {
		try {
			setIsResending(true);
			setIsActionMenuOpen(false);

			if (!invoice.customerEmail) {
				toast.error("No customer email", {
					description: "This invoice does not have a customer email address.",
				});
				return;
			}

			// Fetch full invoice details
			const invoiceDetail = await getInvoiceDetail.refetch();
			if (!invoiceDetail.data) {
				throw new Error("Failed to fetch invoice details");
			}

			// Ensure fonts are registered
			await registerFonts();

			// Convert invoice data to PDF format
			const pdfData = convertInvoiceToPdfData(invoiceDetail.data);

			// Generate QR code if needed
			let qrCodeDataUrl: string | undefined;
			if (pdfData.paymentDetails.qrCodeValue) {
				try {
					qrCodeDataUrl = await QRCodeUtil.toDataURL(pdfData.paymentDetails.qrCodeValue, {
						width: 120,
						margin: 1,
					});
				} catch (error) {
					console.error("Failed to generate QR code:", error);
				}
			}

			// Generate PDF
			const blob = await pdf(
				<Document>
					<Page size="A4" style={pdfContainers.page}>
						<PdfDetails
							companyDetails={pdfData.companyDetails}
							invoiceDetails={pdfData.invoiceDetails}
							invoiceTerms={pdfData.invoiceTerms}
							paymentDetails={{
								...pdfData.paymentDetails,
								qrCodeDataUrl,
							}}
							yourDetails={pdfData.yourDetails}
						/>
					</Page>
				</Document>
			).toBlob();

			// Convert PDF blob to base64
			const pdfBase64 = await new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onloadend = () => {
					const base64String = (reader.result as string).split(",")[1];
					resolve(base64String);
				};
				reader.onerror = reject;
				reader.readAsDataURL(blob);
			});

			// Send email reminder
			await resendEmailMutation.mutateAsync({
				invoiceId: invoice.id,
				pdfBase64,
			});
		} catch (error) {
			console.error("Failed to resend email:", error);
			// Error toast is handled by mutation
		} finally {
			setIsResending(false);
		}
	};

	const handleDeleteClick = () => {
		setIsActionMenuOpen(false);
		setIsDeleteDialogOpen(true);
	};

	const handleDeleteInvoice = async () => {
		try {
			setIsDeleting(true);
			setIsDeleteDialogOpen(false);

			await deleteInvoiceMutation.mutateAsync({
				invoiceId: invoice.id,
			});
		} catch (error) {
			console.error("Failed to delete invoice:", error);
			// Error toast is handled by mutation
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div
			key={invoice.id}
			className="border rounded-lg p-4 hover:bg-muted/40 transition-colors"
		>
			<div 
				className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between cursor-pointer"
				onClick={(e) => {
					// Don't navigate if clicking on the dropdown menu or its trigger
					if ((e.target as HTMLElement).closest('[role="menu"], [role="menuitem"], button')) {
						return;
					}
					window.location.href = `/agency/invoices/${invoice.id}`;
				}}
			>
				<div className="space-y-2 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="text-lg font-semibold">
							{invoice.invoiceNumber ?? "Unnamed Invoice"}
						</h3>
						<Badge variant={statusBadgeVariant[invoice.status]} className="flex items-center gap-1">
							<StatusIcon className="h-3 w-3" />
							{invoice.status.replace("_", " ")}
						</Badge>
					</div>
					<div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
						<div className="flex items-center gap-2">
							<User2 className="h-4 w-4" />
							<span>{invoice.customerName ?? "No customer name"}</span>
						</div>
						{invoice.customerEmail && (
							<div className="flex items-center gap-2">
								<Mail className="h-4 w-4" />
								<span>{invoice.customerEmail}</span>
							</div>
						)}
					</div>
				</div>
				<div className="flex items-center gap-3">
					<div className="text-right text-sm">
						<p className="text-muted-foreground">Amount</p>
						<p className="text-base font-semibold">
							{formatCurrency(invoice.amount ?? null, invoice.currency)}
						</p>
					</div>
					<DropdownMenu open={isActionMenuOpen} onOpenChange={setIsActionMenuOpen}>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="h-8 w-8 p-0"
								disabled={isDownloading || isResending || isDeleting}
								onClick={(e) => e.stopPropagation()}
							>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<DropdownMenuItem
								onClick={(e) => {
									e.stopPropagation();
									router.push(`/agency/invoices/${invoice.id}`);
								}}
								disabled={isDownloading || isResending || isDeleting}
							>
								<Eye className="mr-2 h-4 w-4" />
								View Invoice
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={handleDownloadInvoice}
								disabled={isDownloading || isResending || isDeleting}
							>
								{isDownloading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Downloading...
									</>
								) : (
									<>
										<Download className="mr-2 h-4 w-4" />
										Download Invoice
									</>
								)}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={handleResendEmail}
								disabled={isDownloading || isResending || isDeleting || !invoice.customerEmail}
							>
								{isResending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Sending...
									</>
								) : (
									<>
										<Send className="mr-2 h-4 w-4" />
										Resend Email Reminder
									</>
								)}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={handleDeleteClick}
								disabled={isDownloading || isResending || isDeleting}
								className="text-destructive focus:text-destructive"
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Delete Invoice
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<div className="mt-4 grid gap-4 sm:grid-cols-3 text-sm">
				<div className="space-y-1">
					<div className="flex items-center gap-2 text-muted-foreground">
						<CalendarDays className="h-4 w-4" />
						<span>Created</span>
					</div>
					<p className="font-medium">{formatDate(invoice.createdAt)}</p>
				</div>

				<div className="space-y-1">
					<div className="flex items-center gap-2 text-muted-foreground">
						<CalendarDays className="h-4 w-4" />
						<span>Due</span>
					</div>
					<p className="font-medium">{formatDate(invoice.dueDate ?? null)}</p>
				</div>

				<div className="space-y-1">
					<div className="flex items-center gap-2 text-muted-foreground">
						<Wallet className="h-4 w-4" />
						<span>Currency</span>
					</div>
					<p className="font-medium">{invoice.currency}</p>
				</div>
			</div>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Invoice</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete invoice <strong>{invoice.invoiceNumber || "this invoice"}</strong>? This action cannot be undone and will permanently remove the invoice and all associated data.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteInvoice}
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Deleting...
								</>
							) : (
								"Delete Invoice"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

interface InvoicesListProps {
	invoices: InvoiceSummary[];
	onRefetch?: () => void;
}

export function InvoicesList({ invoices, onRefetch }: InvoicesListProps) {
	return (
		<div className="space-y-3">
			{invoices.map((invoice) => (
				<InvoiceCard key={invoice.id} invoice={invoice} onRefetch={onRefetch} />
			))}
		</div>
	);
}

