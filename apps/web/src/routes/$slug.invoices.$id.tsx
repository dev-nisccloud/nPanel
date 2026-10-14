"use client";

import * as React from "react";
import { useParams, useNavigate, useLocation, Outlet } from "react-router";
import { ArrowLeft, Download, DollarSign, FileText } from "lucide-react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { captureEvent } from "@/lib/posthog";
import { PreviewDetails } from "@/routes/agency.invoices/create/_components/form/previewDetails";
import { transformInvoiceToPreviewData } from "@/lib/transform-invoice-preview-data";
import { buildInvoicePdfDetails } from "@npanel/api/agency-invoice-pdf/build-invoice-pdf-details";
import { InvoicePaymentSummary } from "@/routes/agency.invoices/$id/_components/invoice-payment-summary";
import { InvoiceTransactionsSection } from "@/routes/agency.invoices/$id/_components/invoice-transactions-section";
import { InvoiceTransactionViewSheet } from "@/routes/agency.invoices/$id/_components/invoice-transaction-view-sheet";
import { InvoicePayDialog } from "@/components/invoice-pay-dialog";
import { resolveInvoicePaymentTotals } from "@/lib/invoice-payment-totals";
import type { InvoiceTransaction } from "@/routes/agency.invoices/create/api/schemas";

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

export default function InvoiceViewPage() {
	const params = useParams();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const teamSlug = pathname.split("/")[1];
	const invoiceId = params.id as string;

	const { data: invoice, isLoading, error, refetch, isFetching } = trpc.invoicing.getById.useQuery(
		{ id: invoiceId },
		{
			enabled: !!invoiceId,
		}
	);

	const invoicesPath = teamSlug ? `/${teamSlug}/invoices` : "/agency/invoices";
	const [isDownloading, setIsDownloading] = React.useState(false);
	const [updatePaymentOpen, setUpdatePaymentOpen] = React.useState(false);
	const [transactionSheetOpen, setTransactionSheetOpen] = React.useState(false);
	const [viewingTransaction, setViewingTransaction] = React.useState<InvoiceTransaction | null>(null);

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

	if (isLoading) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 min-h-screen items-center justify-center">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 min-h-screen items-center justify-center">
				<div className="text-center max-w-md px-4">
					<h1 className="text-base font-semibold mb-2">Something went wrong</h1>
					<p className="text-xs text-muted-foreground mb-4 break-words">
						{error.message}
					</p>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-2">
						<Button onClick={() => refetch()} disabled={isFetching}>
							{isFetching ? <Spinner className="mr-2 h-4 w-4" /> : null}
							Try again
						</Button>
						<Button onClick={() => navigate(invoicesPath)} variant="outline">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Invoices
						</Button>
					</div>
				</div>
			</div>
		);
	}

	if (!invoice) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 min-h-screen items-center justify-center">
				<div className="text-center">
					<h1 className="text-base font-semibold mb-2">Invoice Not Found</h1>
					<p className="text-xs text-muted-foreground mb-4">
						The invoice you're looking for doesn't exist.
					</p>
					<Button onClick={() => navigate(invoicesPath)} variant="outline">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Invoices
					</Button>
				</div>
			</div>
		);
	}

	const previewData = transformInvoiceToPreviewData(invoice);
	const pdfMeta = buildInvoicePdfDetails(invoice);
	const existingCreditNoteId = invoice.creditNote?.id;
	const paymentTotals = resolveInvoicePaymentTotals(invoice);

	return (
		<>
			<div className="@container/main flex flex-col gap-4 md:gap-6 py-6">
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-4">
						<Button
							onClick={() => navigate(invoicesPath)}
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
							disabled={
								paymentTotals.remaining <= 0 ||
								isDownloading ||
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
									navigate(`/${teamSlug}/invoices/credit-notes/${existingCreditNoteId}`)
								}
							>
								<FileText className="mr-2 h-4 w-4" />
								View credit note
							</Button>
						) : null}
						<Button
							onClick={handleDownloadInvoice}
							disabled={isDownloading}
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
					</div>
				</div>

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
						emptyMessage="No payments have been recorded on this invoice yet."
						onViewTransaction={(tx) => {
							setViewingTransaction(tx);
							setTransactionSheetOpen(true);
						}}
					/>
				</div>

				<div className="flex justify-center items-start">
					<PreviewDetails
						yourDetails={previewData.yourDetails}
						companyDetails={previewData.companyDetails}
						invoiceDetails={previewData.invoiceDetails}
						invoiceTerms={previewData.invoiceTerms}
						etimsFiscal={invoice.etimsFiscal ?? pdfMeta.etimsFiscal}
					/>
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
				invoiceReturnPath={`/${teamSlug}/invoices/${invoice.id}`}
				showManual={false}
			/>
			<InvoiceTransactionViewSheet
				transaction={viewingTransaction}
				invoiceNumber={invoice.invoiceNumber}
				open={transactionSheetOpen}
				onOpenChange={(open) => {
					setTransactionSheetOpen(open);
					if (!open) setViewingTransaction(null);
				}}
			/>
			<Outlet />
		</>
	);
}
