"use client";

import * as React from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Ban, Download, DollarSign, Send } from "lucide-react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { FormProvider, useForm } from "react-hook-form";
import { YourDetailsForm } from "@/routes/agency.invoices/create/_components/form/yourDetails/yourDetailsForm";
import { CompanyDetailsForm } from "@/routes/agency.invoices/create/_components/form/companyDetails/companyDetailsForm";
import { InvoiceDetailsForm } from "@/routes/agency.invoices/create/_components/form/invoiceDetails/invoiceDetailsForm";
import { PaymentDetailsForm } from "@/routes/agency.invoices/create/_components/form/paymentDetails/paymentDetailsForm";
import { InvoiceTermsForm } from "@/routes/agency.invoices/create/_components/form/invoiceTerms/invoiceTermsForm";
import type {
	YourDetails,
	CompanyDetails,
	InvoiceItemDetails,
	PaymentDetails,
	InvoiceTerms,
} from "@/routes/agency.invoices/create/types";
import type {
	YourDetails as PdfYourDetails,
	CompanyDetails as PdfCompanyDetails,
	InvoiceItemDetails as PdfInvoiceItemDetails,
	PaymentDetails as PdfPaymentDetails,
	InvoiceTerms as PdfInvoiceTerms,
} from "@/routes/agency.invoicing/types";

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
const COMPANY_LOGO_URL = "https://1ris7itpac.ufs.sh/f/Djp547U8wump3qA5tI0B0YR5y2nLQfpSevIHluzKDEZ9mr1s";

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

type InvoiceEditStep = "1" | "2" | "3" | "4" | "5";

type InvoiceEditorFormValues = {
	step: string;
	teamId?: string;

	yourEmail: string;
	yourName: string;
	yourAddress: string;
	yourCity: string;
	yourState: string;
	yourCountry: string;
	yourLogo: string;
	yourTaxId: string;
	yourZip: string;

	email: string;
	companyName: string;
	companyAddress: string;
	companyCity: string;
	companyState: string;
	companyCountry: string;
	companyTaxId: string;
	companyZip: string;

	note: string;
	discount: string;
	taxPercentage: number;
	items: Array<{ itemDescription: string; amount?: number; qty?: number }>;
	currency: string;

	paymentMethod: "bank" | "mpesa" | "cheque";
	bankName: string;
	accountNumber: string;
	accountName: string;
	branchName: string;
	branchCode: string;
	swiftCode: string;
	mpesaPaybillNumber: string;
	mpesaAccountNumber: string;
	mpesaInstructions: string;
	chequeDeliveryAddress: string;
	chequeInstructions: string;
	qrCodeValue: string;

	invoiceNo: string;
	issueDate: string;
	dueDate: string;
};

function toDateInputValue(value: string | Date | null | undefined) {
	if (!value) return "";
	const d = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(d.getTime())) return "";
	return d.toISOString().slice(0, 10);
}

function buildInvoiceEditorDefaults(invoice: InvoiceDetail): InvoiceEditorFormValues {
	const fromDetails = (invoice.fromDetails as any) ?? {};
	const customerDetails = (invoice.customerDetails as any) ?? {};
	const paymentDetails = (invoice.paymentDetails as any) ?? {};

	const items = (invoice.lineItems ?? []).map((li) => ({
		itemDescription: li.description || li.name || "",
		amount: li.price != null ? Number(li.price) : undefined,
		qty: li.quantity ?? undefined,
	}));

	return {
		step: "1",
		teamId: invoice.teamId ?? undefined,

		yourEmail: String(fromDetails.email ?? ""),
		yourName: String(fromDetails.name ?? ""),
		yourAddress: String(fromDetails.address ?? ""),
		yourCity: String(fromDetails.city ?? ""),
		yourState: String(fromDetails.state ?? ""),
		yourCountry: String(fromDetails.country ?? ""),
		yourLogo: String(fromDetails.logoUrl ?? ""),
		yourTaxId: String(fromDetails.taxId ?? ""),
		yourZip: String(fromDetails.zip ?? ""),

		email: String(customerDetails.email ?? invoice.customerEmail ?? ""),
		companyName: String(customerDetails.name ?? invoice.customerName ?? ""),
		companyAddress: String(customerDetails.address ?? ""),
		companyCity: String(customerDetails.city ?? ""),
		companyState: String(customerDetails.state ?? ""),
		companyCountry: String(customerDetails.country ?? ""),
		companyTaxId: String(customerDetails.taxId ?? ""),
		companyZip: String(customerDetails.zip ?? ""),

		note: String(invoice.note ?? ""),
		discount: String(invoice.discount ?? ""),
		taxPercentage: invoice.taxPercentage ?? 0,
		items: items.length > 0 ? items : [{ itemDescription: "" }],
		currency: invoice.currency ?? "KES",

		paymentMethod: (paymentDetails.paymentMethod as "bank" | "mpesa" | "cheque") ?? "bank",
		bankName: String(paymentDetails.bankName ?? ""),
		accountNumber: String(paymentDetails.accountNumber ?? ""),
		accountName: String(paymentDetails.accountName ?? ""),
		branchName: String(paymentDetails.branchName ?? ""),
		branchCode: String(paymentDetails.branchCode ?? ""),
		swiftCode: String(paymentDetails.swiftCode ?? ""),
		mpesaPaybillNumber: String(paymentDetails.mpesaPaybillNumber ?? ""),
		mpesaAccountNumber: String(paymentDetails.mpesaAccountNumber ?? ""),
		mpesaInstructions: String(paymentDetails.mpesaInstructions ?? ""),
		chequeDeliveryAddress: String(paymentDetails.chequeDeliveryAddress ?? ""),
		chequeInstructions: String(paymentDetails.chequeInstructions ?? ""),
		qrCodeValue: String(paymentDetails.qrCodeValue ?? ""),

		invoiceNo: String(invoice.invoiceNumber ?? ""),
		issueDate: toDateInputValue(invoice.issueDate),
		dueDate: toDateInputValue(invoice.dueDate),
	};
}

function buildInvoicePdfDetails(invoice: InvoiceDetail): {
	yourDetails: PdfYourDetails;
	companyDetails: PdfCompanyDetails;
	invoiceDetails: PdfInvoiceItemDetails;
	paymentDetails: PdfPaymentDetails;
	invoiceTerms: PdfInvoiceTerms;
} {
	const fromDetails = (invoice.fromDetails as any) ?? {};
	const customerDetails = (invoice.customerDetails as any) ?? {};
	const paymentDetails = (invoice.paymentDetails as any) ?? {};

	const yourDetails: PdfYourDetails = {
		yourName: fromDetails?.name,
		yourEmail: fromDetails?.email,
		yourAddress: fromDetails?.address,
		yourCity: fromDetails?.city,
		yourState: fromDetails?.state,
		yourCountry: fromDetails?.country,
		yourZip: fromDetails?.zip,
		yourTaxId: fromDetails?.taxId,
		yourLogo: COMPANY_LOGO_URL,
	};

	const companyDetails: PdfCompanyDetails = {
		companyName: customerDetails?.name ?? invoice.customerName ?? undefined,
		email: customerDetails?.email ?? invoice.customerEmail ?? undefined,
		companyAddress: customerDetails?.address,
		companyCity: customerDetails?.city,
		companyState: customerDetails?.state,
		companyCountry: customerDetails?.country,
		companyZip: customerDetails?.zip,
		companyTaxId: customerDetails?.taxId,
	};

	const invoiceDetails: PdfInvoiceItemDetails = {
		note: invoice.note ?? undefined,
		discount: invoice.discount ?? undefined,
		taxRate: invoice.taxPercentage != null ? String(invoice.taxPercentage) : undefined,
		items: (invoice.lineItems ?? []).map((li) => ({
			id: li.id,
			itemDescription: li.name || li.description || "Service",
			amount: li.price != null ? Number(li.price) : undefined,
			qty: li.quantity ?? undefined,
		})),
		currency: invoice.currency ?? "KES",
		// Match cron jobs PDF: denser, compact line items
		compactLineItems: true,
	};

	const invoiceTerms: PdfInvoiceTerms = {
		invoiceNumber: invoice.invoiceNumber ?? undefined,
		issueDate: invoice.issueDate ?? undefined,
		dueDate: invoice.dueDate ?? undefined,
	};

	// Translate paymentDetails JSON into the shape used by agency.invoicing PdfDetails.
	const paymentMethodApi = paymentDetails?.paymentMethod;
	let paymentMethod: "bank" | "mpesa" | "cheque" | undefined;
	if (paymentMethodApi === "BANK_TRANSFER" || paymentMethodApi === "bank_transfer" || paymentMethodApi === "bank") {
		paymentMethod = "bank";
	} else if (paymentMethodApi === "MPESA" || paymentMethodApi === "mpesa") {
		paymentMethod = "mpesa";
	} else if (paymentMethodApi === "CHEQUE" || paymentMethodApi === "cheque") {
		paymentMethod = "cheque";
	}
	if (!paymentMethod) paymentMethod = "mpesa";

	const paymentDetailsFormatted: PdfPaymentDetails = {
		paymentMethod,
		currency: invoice.currency || "KES",
		qrCodeValue: paymentDetails?.qrCodeValue || "www.nisccloud.com",
		bankName: paymentMethod === "bank" ? paymentDetails?.bankName : undefined,
		accountNumber: paymentMethod === "bank" ? paymentDetails?.accountNumber : undefined,
		accountName: paymentMethod === "bank" ? paymentDetails?.accountName : undefined,
		branchName: paymentMethod === "bank" ? paymentDetails?.branchName : undefined,
		branchCode: paymentMethod === "bank" ? paymentDetails?.branchCode : undefined,
		swiftCode: paymentMethod === "bank" ? paymentDetails?.swiftCode : undefined,
		mpesaPaybillNumber: paymentMethod === "mpesa" ? (paymentDetails?.mpesaPaybillNumber || "303030") : undefined,
		mpesaAccountNumber: paymentMethod === "mpesa" ? (paymentDetails?.mpesaAccountNumber || "2052676528") : undefined,
		mpesaInstructions: paymentMethod === "mpesa" ? (paymentDetails?.mpesaInstructions || "Absa Bank Kenya") : undefined,
		chequeDeliveryAddress: paymentMethod === "cheque" ? paymentDetails?.chequeDeliveryAddress : undefined,
		chequeInstructions: paymentMethod === "cheque" ? paymentDetails?.chequeInstructions : undefined,
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
	const [editDialogOpen, setEditDialogOpen] = React.useState(false);
	const [editStep, setEditStep] = React.useState<InvoiceEditStep>("1");
	const [sendDialogOpen, setSendDialogOpen] = React.useState(false);
	const [sendToEmail, setSendToEmail] = React.useState("");
	const [sendCc, setSendCc] = React.useState("");
	const [sendBcc, setSendBcc] = React.useState("");

	const utils = trpc.useUtils();

	// IMPORTANT: hooks must run on every render (even while loading).
	// We initialize the editor with empty defaults, then `reset()` once the invoice loads.
	const form = useForm<InvoiceEditorFormValues>({
		defaultValues: {
			step: "1",
			teamId: undefined,

			yourEmail: "",
			yourName: "",
			yourAddress: "",
			yourCity: "",
			yourState: "",
			yourCountry: "",
			yourLogo: "",
			yourTaxId: "",
			yourZip: "",

			email: "",
			companyName: "",
			companyAddress: "",
			companyCity: "",
			companyState: "",
			companyCountry: "",
			companyTaxId: "",
			companyZip: "",

			note: "",
			discount: "",
			taxPercentage: 0,
			items: [{ itemDescription: "" }],
			currency: "KES",

			paymentMethod: "bank",
			bankName: "",
			accountNumber: "",
			accountName: "",
			branchName: "",
			branchCode: "",
			swiftCode: "",
			mpesaPaybillNumber: "",
			mpesaAccountNumber: "",
			mpesaInstructions: "",
			chequeDeliveryAddress: "",
			chequeInstructions: "",
			qrCodeValue: "",

			invoiceNo: "",
			issueDate: "",
			dueDate: "",
		},
	});

	const updateInvoiceMutation = trpc.invoicing.update.useMutation({
		onSuccess: () => {
			toast.success("Invoice updated", { description: "Your changes have been saved." });
			utils.invoicing.getById.invalidate({ id: invoiceId });
			utils.invoicing.list.invalidate();
			setEditDialogOpen(false);
		},
		onError: (error) => {
			toast.error("Failed to update invoice", { description: error.message ?? "An error occurred." });
		},
	});

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

	React.useEffect(() => {
		if (!invoice?.customerEmail) return;
		setSendToEmail(invoice.customerEmail);
	}, [invoice?.customerEmail]);

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
				import("@/routes/agency.invoicing/_components/form/pdfDetails"),
				import("@/lib/pdfStyles"),
			]);

			// Ensure fonts are registered
			await registerFonts();

			// Convert invoice data to the SAME PDF config used by cron jobs
			const pdfData = buildInvoicePdfDetails(invoice);

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

	const parseEmails = (raw: string): string[] =>
		raw
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);

	const handleSendEmail = async () => {
		if (!invoice) return;

		try {
			setIsSending(true);

			if (!sendToEmail) {
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
				import("@/routes/agency.invoicing/_components/form/pdfDetails"),
				import("@/lib/pdfStyles"),
			]);

			// Ensure fonts are registered
			await registerFonts();

			// Convert invoice data to the SAME PDF config used by cron jobs
			const pdfData = buildInvoicePdfDetails(invoice);

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
				cc: parseEmails(sendCc),
				bcc: parseEmails(sendBcc),
			});
		} catch (error) {
			console.error("Failed to resend email:", error);
			// Error toast is handled by mutation
		} finally {
			setIsSending(false);
			setSendDialogOpen(false);
		}
	};

	React.useEffect(() => {
		if (!invoice) return;
		form.reset(buildInvoiceEditorDefaults(invoice));
	}, [invoice, form]);

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

	const handleOpenEdit = (step: string) => {
		const s = step as InvoiceEditStep;
		setEditStep(s);
		form.setValue("step", s, { shouldDirty: false });
		setEditDialogOpen(true);
	};

	const handleSaveSection = async () => {
		const values = form.getValues();

		const roundTotalIfExceeds = (amount: number): number => {
			const decimalPlaces = (amount.toString().split(".")[1] || "").length;
			return decimalPlaces > 2 ? Math.round(amount * 100) / 100 : amount;
		};

		const fromDetails = {
			name: values.yourName,
			email: values.yourEmail,
			address: values.yourAddress,
			city: values.yourCity,
			state: values.yourState,
			country: values.yourCountry,
			zip: values.yourZip,
			taxId: values.yourTaxId,
		};

		const customerDetails = {
			name: values.companyName,
			email: values.email,
			address: values.companyAddress,
			city: values.companyCity,
			state: values.companyState,
			country: values.companyCountry,
			zip: values.companyZip,
			taxId: values.companyTaxId,
		};

		const paymentDetailsJson: Record<string, unknown> = {
			paymentMethod: values.paymentMethod,
			currency: values.currency || "KES",
		};
		if (values.paymentMethod === "bank") {
			paymentDetailsJson.bankName = values.bankName;
			paymentDetailsJson.accountNumber = values.accountNumber;
			paymentDetailsJson.accountName = values.accountName;
			paymentDetailsJson.branchName = values.branchName;
			paymentDetailsJson.branchCode = values.branchCode;
			paymentDetailsJson.swiftCode = values.swiftCode;
		} else if (values.paymentMethod === "mpesa") {
			paymentDetailsJson.mpesaPaybillNumber = values.mpesaPaybillNumber;
			paymentDetailsJson.mpesaAccountNumber = values.mpesaAccountNumber;
			paymentDetailsJson.mpesaInstructions = values.mpesaInstructions;
		} else if (values.paymentMethod === "cheque") {
			paymentDetailsJson.chequeDeliveryAddress = values.chequeDeliveryAddress;
			paymentDetailsJson.chequeInstructions = values.chequeInstructions;
		}
		if (values.qrCodeValue) {
			paymentDetailsJson.qrCodeValue = values.qrCodeValue;
		}

		const items = values.items ?? [];
		const subtotal = items.reduce((sum, item) => {
			const amount = item.amount || 0;
			const qty = item.qty || 1;
			return sum + amount * qty;
		}, 0);
		const discountValue = Number.parseFloat(values.discount || "0") || 0;
		const taxPercentage = values.taxPercentage || 0;
		const taxAmount = (subtotal - discountValue) * (taxPercentage / 100);
		const totalAmount = roundTotalIfExceeds(subtotal - discountValue + taxAmount);

		const lineItems = items.map((item, index) => ({
			position: index,
			name: item.itemDescription || "Service",
			description: null,
			quantity: item.qty || 1,
			unit: null,
			price: String(item.amount || 0),
			discount: null,
			total: String((item.amount || 0) * (item.qty || 1)),
			metadata: null,
		}));

		const payloadBase: Record<string, unknown> = { id: invoice.id };

		if (editStep === "1") {
			Object.assign(payloadBase, { fromDetails: fromDetails as any });
		} else if (editStep === "2") {
			Object.assign(payloadBase, {
				teamId: values.teamId ?? null,
				customerName: values.companyName || null,
				customerEmail: values.email || null,
				customerDetails: customerDetails as any,
			});
		} else if (editStep === "3") {
			Object.assign(payloadBase, {
				currency: values.currency || "KES",
				note: values.note || null,
				discount: values.discount || null,
				taxPercentage: values.taxPercentage ?? null,
				subtotal: String(subtotal),
				tax: String(taxAmount),
				amount: String(totalAmount),
				lineItems,
			});
		} else if (editStep === "4") {
			Object.assign(payloadBase, { paymentDetails: paymentDetailsJson as any });
		} else if (editStep === "5") {
			Object.assign(payloadBase, {
				invoiceNumber: values.invoiceNo || null,
				issueDate: values.issueDate ? new Date(values.issueDate).toISOString() : null,
				dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
			});
		}

		await updateInvoiceMutation.mutateAsync(payloadBase as any);
	};

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
						onClick={() => setSendDialogOpen(true)}
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
					onClick={handleOpenEdit}
				/>
			</div>

			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{editStep === "1"
								? "Edit your details"
								: editStep === "2"
									? "Edit billing (Bill To)"
									: editStep === "3"
										? "Edit invoice details"
										: editStep === "4"
											? "Edit payment details"
											: "Edit invoice terms"}
						</DialogTitle>
						<DialogDescription>Changes are saved to this invoice only.</DialogDescription>
					</DialogHeader>

					<FormProvider {...form}>
						<div className="pt-2">
							{editStep === "1" && <YourDetailsForm />}
							{editStep === "2" && <CompanyDetailsForm />}
							{editStep === "3" && <InvoiceDetailsForm />}
							{editStep === "4" && <PaymentDetailsForm />}
							{editStep === "5" && <InvoiceTermsForm />}
						</div>
					</FormProvider>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setEditDialogOpen(false)}
							disabled={updateInvoiceMutation.isPending}
						>
							Cancel
						</Button>
						<Button onClick={handleSaveSection} disabled={updateInvoiceMutation.isPending}>
							{updateInvoiceMutation.isPending ? (
								<>
									<Spinner className="mr-2 h-4 w-4" />
									Saving…
								</>
							) : (
								"Save changes"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Send invoice email</DialogTitle>
						<DialogDescription>
							We&apos;ll attach the invoice PDF. You can optionally add CC/BCC recipients (comma-separated).
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">To</label>
							<Input
								value={sendToEmail}
								onChange={(e) => setSendToEmail(e.target.value)}
								placeholder="customer@example.com"
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium">CC (optional)</label>
							<Input
								value={sendCc}
								onChange={(e) => setSendCc(e.target.value)}
								placeholder="cc1@example.com, cc2@example.com"
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium">BCC (optional)</label>
							<Input
								value={sendBcc}
								onChange={(e) => setSendBcc(e.target.value)}
								placeholder="bcc1@example.com, bcc2@example.com"
							/>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setSendDialogOpen(false)} disabled={isSending}>
							Cancel
						</Button>
						<Button onClick={handleSendEmail} disabled={isSending || !sendToEmail}>
							{isSending ? (
								<>
									<Spinner className="mr-2 h-4 w-4" />
									Sending…
								</>
							) : (
								"Send"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
