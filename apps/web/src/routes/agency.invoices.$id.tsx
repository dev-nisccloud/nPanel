"use client";

import * as React from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Ban, Download, DollarSign, Send } from "lucide-react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Button } from "@/components/ui/button";
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
import { PreviewDetails } from "@/routes/agency.invoices/create/_components/form/previewDetails";
import { transformInvoiceToPreviewData } from "./agency.invoices/$id/_utils/transformInvoiceData";
import { UpdatePaymentDialog } from "./agency.invoices/$id/_components/update-payment-dialog";
import type { InvoiceDetail } from "@/routes/agency.invoices/create/api/schemas";
import type {
	YourDetails,
	CompanyDetails,
	InvoiceItemDetails,
	PaymentDetails,
	InvoiceTerms,
} from "@/routes/agency.invoices/create/types";

// Font registration state
let fontsRegistered = false;
let fontsRegistering = false;

const registerFonts = async (): Promise<boolean> => {
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

// Helper function to convert InvoiceDetail to PDF data format
function convertInvoiceToPdfData(invoice: InvoiceDetail) {
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
		yourLogo: logoUrl,
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
			itemDescription: item.description
				? `${item.name || "Service"}. ${item.description}`
				: (item.name || "Service"),
			amount: item.price ? Number(item.price) : undefined,
			qty: item.quantity || undefined,
		})),
	};

	// Convert payment method from database format to PDF format
	const paymentMethodApi = paymentDetails?.paymentMethod;
	let paymentMethod: "bank" | "mpesa" | "cheque" | undefined;
	
	if (paymentMethodApi === "BANK_TRANSFER" || paymentMethodApi === "bank_transfer" || paymentMethodApi === "bank") {
		paymentMethod = "bank";
	} else if (paymentMethodApi === "MPESA" || paymentMethodApi === "mpesa") {
		paymentMethod = "mpesa";
	} else if (paymentMethodApi === "CHEQUE" || paymentMethodApi === "cheque") {
		paymentMethod = "cheque";
	}
	
	if (!paymentMethod) {
		paymentMethod = "mpesa";
	}
	
	const paymentDetailsFormatted: PaymentDetails = {
		paymentMethod,
		currency: invoice.currency || "KES",
		qrCodeValue: paymentDetails?.qrCodeValue || "www.nisccloud.com",
		bankName: paymentMethod === "bank" ? paymentDetails?.bankName : undefined,
		accountNumber: paymentMethod === "bank" ? paymentDetails?.accountNumber : undefined,
		accountName: paymentMethod === "bank" ? paymentDetails?.accountName : undefined,
		branchName: paymentMethod === "bank" ? paymentDetails?.branchName : undefined,
		branchCode: paymentMethod === "bank" ? paymentDetails?.branchCode : undefined,
		swiftCode: paymentMethod === "bank" ? paymentDetails?.swiftCode : undefined,
		mpesaPaybillNumber: paymentMethod === "mpesa" 
			? (paymentDetails?.mpesaPaybillNumber || "303030")
			: undefined,
		mpesaAccountNumber: paymentMethod === "mpesa"
			? (paymentDetails?.mpesaAccountNumber || "2052676528")
			: undefined,
		mpesaInstructions: paymentMethod === "mpesa"
			? (paymentDetails?.mpesaInstructions || "Absa Bank Kenya")
			: undefined,
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

export default function InvoiceViewPage() {
	const params = useParams();
	const navigate = useNavigate();
	const invoiceId = params.id as string;

	const { data: invoice, isLoading, error } = trpc.invoicing.getById.useQuery(
		{ id: invoiceId },
		{
			enabled: !!invoiceId,
		}
	);

	const [isDownloading, setIsDownloading] = React.useState(false);
	const [isSending, setIsSending] = React.useState(false);
	const [updatePaymentOpen, setUpdatePaymentOpen] = React.useState(false);
	const [markUnpaidConfirmOpen, setMarkUnpaidConfirmOpen] = React.useState(false);

	const utils = trpc.useUtils();

	const resendEmailMutation = trpc.invoicing.resendEmailReminder.useMutation({
		onSuccess: () => {
			toast.success("Email reminder sent successfully!", {
				description: `Reminder for invoice ${invoice?.invoiceNumber} has been sent to ${invoice?.customerEmail}`,
			});
			utils.invoicing.list.invalidate();
		},
		onError: (error) => {
			toast.error("Failed to send email reminder", {
				description: error.message || "An error occurred while sending the email reminder",
			});
		},
	});

	const markUnpaidMutation = trpc.invoicing.updateStatus.useMutation({
		onSuccess: () => {
			setMarkUnpaidConfirmOpen(false);
			toast.success("Invoice marked unpaid", { description: "Status set to overdue." });
			utils.invoicing.getById.invalidate({ id: invoiceId });
			utils.invoicing.list.invalidate();
		},
		onError: (error) => {
			toast.error("Failed to mark unpaid", { description: error.message ?? "An error occurred." });
		},
	});

	const handleDownloadInvoice = async () => {
		if (!invoice) return;

		try {
			setIsDownloading(true);

			// Dynamically import PDF-related modules
			const [
				{ Document, Page },
				{ pdf },
				{ PdfDetails },
				{ pdfContainers },
			] = await Promise.all([
				import("@react-pdf/renderer"),
				import("@react-pdf/renderer"),
				import("@/routes/agency.invoices/create/_components/form/pdfDetails"),
				import("@/lib/pdfStyles"),
			]);

			// Ensure fonts are registered
			await registerFonts();

			// Convert invoice data to PDF format
			const pdfData = convertInvoiceToPdfData(invoice);

			// Generate QR code if needed
			let qrCodeDataUrl: string | undefined;
			if (pdfData.paymentDetails.qrCodeValue) {
				try {
					// eslint-disable-next-line @typescript-eslint/no-require-imports
					const QRCodeUtil = await import("qrcode") as any;
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

	const handleSendEmail = async () => {
		if (!invoice) return;

		try {
			setIsSending(true);

			if (!invoice.customerEmail) {
				toast.error("No customer email", {
					description: "This invoice does not have a customer email address.",
				});
				return;
			}

			// Dynamically import PDF-related modules
			const [
				{ Document, Page },
				{ pdf },
				{ PdfDetails },
				{ pdfContainers },
			] = await Promise.all([
				import("@react-pdf/renderer"),
				import("@react-pdf/renderer"),
				import("@/routes/agency.invoices/create/_components/form/pdfDetails"),
				import("@/lib/pdfStyles"),
			]);

			// Ensure fonts are registered
			await registerFonts();

			// Convert invoice data to PDF format
			const pdfData = convertInvoiceToPdfData(invoice);

			// Generate QR code if needed
			let qrCodeDataUrl: string | undefined;
			if (pdfData.paymentDetails.qrCodeValue) {
				try {
					// eslint-disable-next-line @typescript-eslint/no-require-imports
					const QRCodeUtil = await import("qrcode") as any;
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
			setIsSending(false);
		}
	};

	if (isLoading) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 min-h-screen items-center justify-center">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	if (error || !invoice) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 min-h-screen items-center justify-center">
				<div className="text-center">
					<h1 className="text-base font-semibold mb-2">Invoice Not Found</h1>
					<p className="text-xs text-muted-foreground mb-4">
						{error?.message || "The invoice you're looking for doesn't exist."}
					</p>
					<Button onClick={() => navigate("/agency/invoices")} variant="outline">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Invoices
					</Button>
				</div>
			</div>
		);
	}

	const previewData = transformInvoiceToPreviewData(invoice);

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 py-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button
						onClick={() => navigate("/agency/invoices")}
						variant="ghost"
						size="sm"
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Invoices
					</Button>
					<div className="flex flex-col gap-2">
						<h1 className="text-base font-semibold tracking-tight">
							Invoice {invoice.invoiceNumber || "View"}
						</h1>
						<p className="text-xs text-muted-foreground">
							View invoice details and preview
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button
						onClick={() => setUpdatePaymentOpen(true)}
						disabled={invoice.status === "PAID" || isDownloading || isSending}
						variant="outline"
					>
						<DollarSign className="mr-2 h-4 w-4" />
						Update payment
					</Button>
					<Button
						onClick={() => setMarkUnpaidConfirmOpen(true)}
						disabled={invoice.status === "OVERDUE" || isDownloading || isSending}
						variant="outline"
					>
						<Ban className="mr-2 h-4 w-4" />
						Mark unpaid
					</Button>
					<Button
						onClick={handleDownloadInvoice}
						disabled={isDownloading || isSending}
						variant="outline"
					>
						{isDownloading ? (
							<>
								<Spinner className="mr-2 h-4 w-4" />
								Downloading...
							</>
						) : (
							<>
								<Download className="mr-2 h-4 w-4" />
								Download Invoice
							</>
						)}
					</Button>
					<Button
						onClick={handleSendEmail}
						disabled={isDownloading || isSending || !invoice.customerEmail}
					>
						{isSending ? (
							<>
								<Spinner className="mr-2 h-4 w-4" />
								Sending...
							</>
						) : (
							<>
								<Send className="mr-2 h-4 w-4" />
								Send Email
							</>
						)}
					</Button>
				</div>
			</div>

			<UpdatePaymentDialog
				open={updatePaymentOpen}
				onOpenChange={setUpdatePaymentOpen}
				invoiceId={invoice.id}
				invoiceAmount={invoice.amount ?? null}
				currency={invoice.currency ?? "KES"}
			/>

			<AlertDialog open={markUnpaidConfirmOpen} onOpenChange={setMarkUnpaidConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Mark unpaid</AlertDialogTitle>
						<AlertDialogDescription>
							This will set the invoice status to <strong>Overdue</strong>. Use this when the invoice is past due and has not been paid. You can still record payments later via &quot;Update payment&quot;.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={markUnpaidMutation.isPending}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => markUnpaidMutation.mutate({ id: invoice.id, status: "OVERDUE" })}
							disabled={markUnpaidMutation.isPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{markUnpaidMutation.isPending ? (
								<>
									<Spinner className="mr-2 h-4 w-4" />
									Updating…
								</>
							) : (
								"Mark unpaid"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Center the preview */}
			<div className="flex justify-center items-start">
				<PreviewDetails
					yourDetails={previewData.yourDetails}
					companyDetails={previewData.companyDetails}
					invoiceDetails={previewData.invoiceDetails}
					paymentDetails={previewData.paymentDetails}
					invoiceTerms={previewData.invoiceTerms}
					// No onClick handler - makes sections non-clickable
				/>
			</div>
		</div>
	);
}
