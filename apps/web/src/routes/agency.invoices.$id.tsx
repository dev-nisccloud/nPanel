"use client";

import * as React from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Ban, Download, DollarSign, FileText, Link2, Send } from "lucide-react";
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
import { transformInvoiceToPreviewData } from "@/lib/transform-invoice-preview-data";
import { captureEvent } from "@/lib/posthog";
import { InvoicePayDialog } from "@/components/invoice-pay-dialog";
import { InvoiceKraStatusPanel } from "./agency.invoices/$id/_components/invoice-kra-status-panel";
import { IssueCreditNoteDialog } from "./agency.invoices/$id/_components/issue-credit-note-dialog";
import { InvoicePaymentSummary } from "./agency.invoices/$id/_components/invoice-payment-summary";
import { InvoiceTransactionsSection } from "./agency.invoices/$id/_components/invoice-transactions-section";
import { InvoiceTransactionViewSheet } from "./agency.invoices/$id/_components/invoice-transaction-view-sheet";
import { LinkInvoiceOrganizationDialog } from "./agency.invoices/_components/link-invoice-organization-dialog";
import { isInvoiceKraSynced } from "@npanel/api/lib/invoice-kra-status";
import { buildInvoicePdfDetails } from "@npanel/api/agency-invoice-pdf/build-invoice-pdf-details";
import { resolveInvoicePaymentTotals } from "@/lib/invoice-payment-totals";
import type { InvoiceDetail, InvoiceTransaction } from "@/routes/agency.invoices/create/api/schemas";
import type { EtimsFiscalFields } from "@npanel/api/lib/etims-fiscal-fields";
import { FormProvider, useForm } from "react-hook-form";
import { YourDetailsForm } from "@/routes/agency.invoices/create/_components/form/yourDetails/yourDetailsForm";
import { CompanyDetailsForm } from "@/routes/agency.invoices/create/_components/form/companyDetails/companyDetailsForm";
import { InvoiceDetailsForm } from "@/routes/agency.invoices/create/_components/form/invoiceDetails/invoiceDetailsForm";
import { PaymentDetailsForm } from "@/routes/agency.invoices/create/_components/form/paymentDetails/paymentDetailsForm";
import { InvoiceTermsForm } from "@/routes/agency.invoices/create/_components/form/invoiceTerms/invoiceTermsForm";
import {
	INVOICE_STATUS_OPTIONS,
	type InvoiceStatusOption,
} from "@/routes/agency.invoices/create/_components/form/invoice-status-select";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { buildKraPersistFieldsFromManual } from "@npanel/api/lib/etims-fiscal-fields";
import { invoiceLineItemMetadata, type Item } from "@/routes/agency.invoices/create/types";
import { resolveLineEtimsTaxBand } from "@npanel/api/agency-invoice-pdf/tis-receipt-totals";

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

type InvoiceEditStep = "1" | "2" | "3" | "4" | "5";

type InvoiceEditorFormValues = {
	step: string;
	billToMode: "organization" | "manual";
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
	items: Item[];
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
	invoiceStatus: InvoiceStatusOption;
	scuSdcId: string;
	scuDate: string;
	scuTime: string;
	scuCurRcptNo: string;
	scuTotRcptNo: string;
	scuIntrlData: string;
	scuRcptSign: string;
};

function toDateInputValue(value: string | Date | null | undefined) {
	if (!value) return "";
	const d = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(d.getTime())) return "";
	return d.toISOString().slice(0, 10);
}

/** Convert printed `dd/mm/yyyy` SCU date back to an ISO date for the editor. */
function toScuDateInput(value: string) {
	const m = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
	if (m) return `${m[3]}-${m[2]}-${m[1]}`;
	return toDateInputValue(value);
}

function buildInvoiceEditorDefaults(
	invoice: InvoiceDetail & {
		etimsFiscal?: EtimsFiscalFields | null;
		kraVerifiedDate?: Date | string | null;
		kraReceiptNumber?: string | null;
		kraSignature?: string | null;
	},
): InvoiceEditorFormValues {
	const fromDetails = (invoice.fromDetails as any) ?? {};
	const customerDetails = (invoice.customerDetails as any) ?? {};
	const paymentDetails = (invoice.paymentDetails as any) ?? {};

	const lineCount = invoice.lineItems?.length ?? 0;
	const items = (invoice.lineItems ?? []).map((li, index) => {
		const meta =
			li.metadata && typeof li.metadata === "object" && !Array.isArray(li.metadata)
				? (li.metadata as Record<string, unknown>)
				: undefined;
		const productId =
			(typeof meta?.productId === "string" && meta.productId) ||
			(typeof meta?.niscProductId === "string" && meta.niscProductId) ||
			(typeof meta?.mainProductId === "string" && meta.mainProductId) ||
			undefined;
		const billingCycle =
			typeof meta?.billingCycle === "string" && meta.billingCycle !== "__unset__"
				? meta.billingCycle
				: undefined;
		const etimsTaxTyCd = resolveLineEtimsTaxBand({
			metadata: meta,
			kraPayloads: [
				(invoice as { kraSyncPayload?: unknown }).kraSyncPayload,
				(invoice as { kraSyncResponse?: unknown }).kraSyncResponse,
			],
			index,
			lineCount,
		});
		return {
			id: li.id,
			itemDescription: li.name?.trim() || li.description?.trim() || "",
			amount: li.price != null ? Number(li.price) : undefined,
			qty: li.quantity ?? undefined,
			...(productId ? { productId } : {}),
			...(billingCycle ? { billingCycle } : {}),
			...(etimsTaxTyCd ? { etimsTaxTyCd } : {}),
			...(meta ? { sourceMetadata: meta } : {}),
		};
	});

	return {
		step: "1",
		billToMode: invoice.teamId ? "organization" : "manual",
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
		invoiceStatus: (invoice.status as InvoiceEditorFormValues["invoiceStatus"]) || "DRAFT",
		scuSdcId: String(invoice.etimsFiscal?.sdcId ?? ""),
		scuDate: invoice.etimsFiscal?.scuDate
			? toScuDateInput(invoice.etimsFiscal.scuDate)
			: toDateInputValue(invoice.kraVerifiedDate),
		scuTime: String(invoice.etimsFiscal?.scuTime ?? ""),
		scuCurRcptNo: String(invoice.etimsFiscal?.curRcptNo ?? invoice.kraReceiptNumber ?? ""),
		scuTotRcptNo: String(invoice.etimsFiscal?.totRcptNo ?? ""),
		scuIntrlData: String(invoice.etimsFiscal?.intrlData ?? ""),
		scuRcptSign: String(invoice.etimsFiscal?.rcptSign ?? invoice.kraSignature ?? ""),
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
	const [issueCreditNoteOpen, setIssueCreditNoteOpen] = React.useState(false);
	const [isSending, setIsSending] = React.useState(false);
	const [updatePaymentOpen, setUpdatePaymentOpen] = React.useState(false);
	const [markUnpaidConfirmOpen, setMarkUnpaidConfirmOpen] = React.useState(false);
	const [editDialogOpen, setEditDialogOpen] = React.useState(false);
	const [editStep, setEditStep] = React.useState<InvoiceEditStep>("1");
	const [sendDialogOpen, setSendDialogOpen] = React.useState(false);
	const [linkOrgOpen, setLinkOrgOpen] = React.useState(false);
	const [sendToEmail, setSendToEmail] = React.useState("");
	const [sendCc, setSendCc] = React.useState("");
	const [sendBcc, setSendBcc] = React.useState("");
	const [viewingTransaction, setViewingTransaction] = React.useState<InvoiceTransaction | null>(null);
	const [transactionSheetOpen, setTransactionSheetOpen] = React.useState(false);

	const utils = trpc.useUtils();

	// IMPORTANT: hooks must run on every render (even while loading).
	// We initialize the editor with empty defaults, then `reset()` once the invoice loads.
	const form = useForm<InvoiceEditorFormValues>({
		defaultValues: {
			step: "1",
			billToMode: "organization",
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
			invoiceStatus: "DRAFT",
			scuSdcId: "",
			scuDate: "",
			scuTime: "",
			scuCurRcptNo: "",
			scuTotRcptNo: "",
			scuIntrlData: "",
			scuRcptSign: "",
		},
	});

	const updateInvoiceMutation = trpc.invoicing.update.useMutation({
		onSuccess: () => {
			captureEvent("invoice_edited");
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
			captureEvent("invoice_sent");
			toast.success("Email reminder sent successfully!", {
				description: `Reminder for invoice ${invoice?.invoiceNumber} has been sent to ${sendToEmail || invoice?.customerEmail}`,
			});
			utils.invoicing.getById.invalidate({ id: invoiceId });
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

	const updateStatusMutation = trpc.invoicing.updateStatus.useMutation({
		onSuccess: (data) => {
			toast.success("Invoice status updated", {
				description: `Status is now ${String(data.status).replaceAll("_", " ").toLowerCase()}.`,
			});
			utils.invoicing.getById.invalidate({ id: invoiceId });
			utils.invoicing.list.invalidate();
		},
		onError: (error) => {
			toast.error("Failed to update status", { description: error.message ?? "An error occurred." });
		},
	});

	const markUnpaidMutation = trpc.invoicing.updateStatus.useMutation({
		onSuccess: () => {
			setMarkUnpaidConfirmOpen(false);
			toast.success("Invoice marked unpaid", { description: "Status set to unpaid." });
			utils.invoicing.getById.invalidate({ id: invoiceId });
			utils.invoicing.list.invalidate();
		},
		onError: (error) => {
			toast.error("Failed to mark unpaid", { description: error.message ?? "An error occurred." });
		},
	});

	const regenerateQrMutation = trpc.invoicing.regenerateKraQr.useMutation({
		onSuccess: () => {
			toast.success("QR code regenerated", {
				description: "The QR now uses the current verification link.",
			});
			utils.invoicing.getById.invalidate({ id: invoiceId });
		},
		onError: (error) => {
			toast.error("Could not regenerate QR code", {
				description: error.message ?? "An error occurred.",
			});
		},
	});

	const handleDownloadInvoice = async () => {
		if (!invoice) return;

		try {
			setIsDownloading(true);

			const [{ pdf }, { buildAgencyInvoicePdfDocument }] = await Promise.all([
				import("@react-pdf/renderer"),
				import("@/lib/build-agency-invoice-pdf-document"),
			]);

			await registerFonts();

			const doc = await buildAgencyInvoicePdfDocument(invoice);
			const blob = await pdf(doc).toBlob();

			// Download the PDF
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `${invoice.invoiceNumber || "Invoice"}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			captureEvent("invoice_downloaded_pdf");
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

		const to = sendToEmail.trim();
		if (!to) {
			toast.error("No recipient email", {
				description: "Enter an email address to send this invoice.",
			});
			return;
		}

		try {
			setIsSending(true);
			await resendEmailMutation.mutateAsync({
				invoiceId: invoice.id,
				to,
				cc: parseEmails(sendCc),
				bcc: parseEmails(sendBcc),
			});
			setSendDialogOpen(false);
		} catch (error) {
			console.error("Failed to send invoice email:", error);
		} finally {
			setIsSending(false);
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

	const invoicesBackPath = invoice.teamId
		? `/agency/invoices/organizations/${invoice.teamId}`
		: "/agency/invoices";

	const previewData = transformInvoiceToPreviewData(invoice);
	const pdfMeta = buildInvoicePdfDetails(invoice);
	const canIssueCreditNote =
		isInvoiceKraSynced(invoice.kraStatus) && !invoice.creditNote;
	const existingCreditNoteId = invoice.creditNote?.id;
	const paymentTotals = resolveInvoicePaymentTotals(invoice);

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
			...(item.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.id)
				? { id: item.id }
				: {}),
			position: index,
			name: item.itemDescription || "Service",
			description: null,
			quantity: item.qty || 1,
			unit: null,
			price: String(item.amount || 0),
			discount: null,
			total: String((item.amount || 0) * (item.qty || 1)),
			metadata: invoiceLineItemMetadata(item),
		}));

		const payloadBase: Record<string, unknown> = { id: invoice.id };

		if (editStep === "1") {
			Object.assign(payloadBase, { fromDetails: fromDetails as any });
		} else if (editStep === "2") {
			Object.assign(payloadBase, {
				teamId: values.billToMode === "manual" ? null : values.teamId || null,
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
			const kraFields = buildKraPersistFieldsFromManual({
				sdcId: values.scuSdcId,
				sdcDate: values.scuDate,
				sdcTime: values.scuTime,
				curRcptNo: values.scuCurRcptNo,
				totRcptNo: values.scuTotRcptNo,
				intrlData: values.scuIntrlData,
				rcptSign: values.scuRcptSign,
				tin: values.yourTaxId,
				bhfId: "00",
			});
			Object.assign(payloadBase, {
				invoiceNumber: values.invoiceNo || null,
				issueDate: values.issueDate ? new Date(values.issueDate).toISOString() : null,
				dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
				...(kraFields ?? {}),
			});
		}

		await updateInvoiceMutation.mutateAsync(payloadBase as any);
	};

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 py-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button
						onClick={() => navigate(invoicesBackPath)}
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
						<div className="flex items-center gap-2">
							<p className="text-xs text-muted-foreground">Status</p>
							<Select
								value={invoice.status}
								onValueChange={(status) =>
									updateStatusMutation.mutate({
										id: invoice.id,
										status: status as InvoiceStatusOption,
									})
								}
								disabled={updateStatusMutation.isPending}
							>
								<SelectTrigger className="h-8 w-[160px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{INVOICE_STATUS_OPTIONS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button
						onClick={() => setUpdatePaymentOpen(true)}
						disabled={
							paymentTotals.remaining <= 0 ||
							isDownloading ||
							isSending ||
							invoice.status === "CANCELLED" ||
							invoice.status === "WRITTEN_OFF"
						}
					>
						<DollarSign className="mr-2 h-4 w-4" />
						Pay now
					</Button>
					{existingCreditNoteId ? (
						<Button
							variant="outline"
							onClick={() =>
								navigate(`/agency/invoices/credit-notes/${existingCreditNoteId}`)
							}
						>
							<FileText className="mr-2 h-4 w-4" />
							View credit note
						</Button>
					) : (
						<Button
							variant="outline"
							onClick={() => setIssueCreditNoteOpen(true)}
							disabled={!canIssueCreditNote || isDownloading || isSending}
							title={
								!isInvoiceKraSynced(invoice.kraStatus)
									? "Invoice must be synced to KRA first"
									: undefined
							}
						>
							<FileText className="mr-2 h-4 w-4" />
							Issue credit note
						</Button>
					)}
					<Button
						onClick={() => setMarkUnpaidConfirmOpen(true)}
						disabled={invoice.status === "UNPAID" || isDownloading || isSending}
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
						onClick={() => setLinkOrgOpen(true)}
						variant="outline"
						disabled={isSending}
					>
						<Link2 className="mr-2 h-4 w-4" />
						{invoice.teamId ? "Reassign to organization" : "Link to organization"}
					</Button>
					<Button
						onClick={() => setSendDialogOpen(true)}
						disabled={isSending}
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

			<InvoicePayDialog
				open={updatePaymentOpen}
				onOpenChange={setUpdatePaymentOpen}
				invoiceId={invoice.id}
				invoiceNumber={invoice.invoiceNumber ?? null}
				invoiceAmount={invoice.amount ?? null}
				remainingAmount={paymentTotals.remaining}
				currency={invoice.currency ?? "KES"}
				teamId={invoice.teamId}
				customerUserId={invoice.customerId}
				invoiceReturnPath={`/agency/invoices/${invoice.id}`}
				showManual
			/>

			<AlertDialog open={markUnpaidConfirmOpen} onOpenChange={setMarkUnpaidConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Mark unpaid</AlertDialogTitle>
						<AlertDialogDescription>
							This will set the invoice status to <strong>Unpaid</strong>. The invoice stays open so you can still record payments later.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={markUnpaidMutation.isPending}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => markUnpaidMutation.mutate({ id: invoice.id, status: "UNPAID" })}
							disabled={markUnpaidMutation.isPending}
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

			<div className="flex flex-col items-center gap-4 px-4">
				<InvoicePaymentSummary
					amount={invoice.amount}
					amountPaid={invoice.amountPaid}
					amountRemaining={invoice.amountRemaining}
					creditBalance={invoice.creditBalance}
					status={invoice.status}
					dueDate={invoice.dueDate}
					currency={invoice.currency}
					transactions={invoice.transactions ?? []}
				/>
			</div>

			<div className="px-4">
				<InvoiceTransactionsSection
					transactions={invoice.transactions ?? []}
					onViewTransaction={(tx) => {
						setViewingTransaction(tx);
						setTransactionSheetOpen(true);
					}}
				/>
			</div>

			<div className="flex flex-col items-center gap-4 px-4">
				<InvoiceKraStatusPanel
					invoice={invoice}
					etimsFiscal={pdfMeta.etimsFiscal}
					onInvoiceUpdated={() => utils.invoicing.getById.invalidate({ id: invoiceId })}
				/>
			</div>

			{/* Center the preview */}
			<div className="flex justify-center items-start">
				<PreviewDetails
					yourDetails={previewData.yourDetails}
					companyDetails={previewData.companyDetails}
					invoiceDetails={previewData.invoiceDetails}
					paymentDetails={previewData.paymentDetails}
					invoiceTerms={pdfMeta.invoiceTerms}
					etimsFiscal={pdfMeta.etimsFiscal}
					onClick={handleOpenEdit}
					onRegenerateQr={() => regenerateQrMutation.mutate({ invoiceId })}
					regeneratingQr={regenerateQrMutation.isPending}
				/>
			</div>

			<InvoiceTransactionViewSheet
				transaction={viewingTransaction}
				invoiceNumber={invoice.invoiceNumber}
				open={transactionSheetOpen}
				onOpenChange={(open) => {
					setTransactionSheetOpen(open);
					if (!open) setViewingTransaction(null);
				}}
			/>

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

			<LinkInvoiceOrganizationDialog
				open={linkOrgOpen}
				onOpenChange={setLinkOrgOpen}
				invoiceId={invoice.id}
				currentTeamId={invoice.teamId}
			/>

			<Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Send invoice email</DialogTitle>
						<DialogDescription>
							Email this invoice with its PDF. You can send it again at any status. Add CC or BCC addresses separated by commas if you need them.
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
						<Button onClick={handleSendEmail} disabled={isSending}>
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

			<IssueCreditNoteDialog
				open={issueCreditNoteOpen}
				onOpenChange={setIssueCreditNoteOpen}
				invoiceId={invoice.id}
				invoiceNumber={invoice.invoiceNumber}
				invoiceAmount={invoice.amount}
				currency={invoice.currency}
				customerName={invoice.customerName}
				onSuccess={(creditNoteId) =>
					navigate(`/agency/invoices/credit-notes/${creditNoteId}`)
				}
			/>
		</div>
	);
}
