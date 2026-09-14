"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { PreviewDetails } from "@/routes/agency.invoices/create/_components/form/previewDetails";
import { buildCreditNotePdfDetails } from "@npanel/api/agency-invoice-pdf/build-credit-note-pdf-details";
import { isInvoiceKraSynced } from "@npanel/api/lib/invoice-kra-status";
import { creditNoteReasonLabel } from "@/routes/agency.kra-etims/sales/_components/issue-etims-credit-note-sheet";

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
			{ name: "Geist-Regular.ttf", weight: "normal" },
			{ name: "Geist-Medium.ttf", weight: "medium" },
			{ name: "Geist-SemiBold.ttf", weight: "semibold" },
			{ name: "Geist-Bold.ttf", weight: "bold" },
		];

		const fonts = await Promise.all(
			fontWeights.map(async ({ name, weight }) => {
				const response = await fetch(`/font/${name}`);
				if (!response.ok) return null;
				const fontData = await response.arrayBuffer();
				const base64 = btoa(
					new Uint8Array(fontData).reduce((data, byte) => data + String.fromCharCode(byte), ""),
				);
				return {
					src: `data:font/truetype;base64,${base64}`,
					fontWeight: weight as "normal" | "medium" | "semibold" | "bold",
				};
			}),
		);

		const validFonts = fonts.filter(Boolean);
		if (validFonts.length > 0) {
			Font.register({ family: "Geist", fonts: validFonts as NonNullable<(typeof fonts)[0]>[] });
			fontsRegistered = true;
			return true;
		}
		return false;
	} catch {
		return false;
	} finally {
		fontsRegistering = false;
	}
};

type CreditNoteDetailViewProps = {
	creditNoteId: string;
	backHref: string;
	backLabel?: string;
	showKraRetry?: boolean;
};

export function CreditNoteDetailView({
	creditNoteId,
	backHref,
	backLabel = "Back",
	showKraRetry = false,
}: CreditNoteDetailViewProps) {
	const navigate = useNavigate();
	const [isDownloading, setIsDownloading] = React.useState(false);
	const utils = trpc.useUtils();

	const { data: creditNote, isLoading, error } = trpc.invoicing.getCreditNoteById.useQuery(
		{ id: creditNoteId },
		{ enabled: !!creditNoteId },
	);

	const retryKraMutation = trpc.invoicing.retryCreditNoteKraSync.useMutation({
		onSuccess: (result) => {
			if (result.success) {
				toast.success("KRA sync succeeded", { description: result.message });
			} else {
				toast.error("KRA sync failed", { description: result.message });
			}
			utils.invoicing.getCreditNoteById.invalidate({ id: creditNoteId });
		},
		onError: (err) => {
			toast.error("KRA sync failed", { description: err.message });
		},
	});

	const handleDownload = async () => {
		if (!creditNote) return;
		try {
			setIsDownloading(true);
			const [{ pdf }, { buildAgencyCreditNotePdfDocument }] = await Promise.all([
				import("@react-pdf/renderer"),
				import("@/lib/build-agency-credit-note-pdf-document"),
			]);
			await registerFonts();
			const doc = await buildAgencyCreditNotePdfDocument(creditNote);
			const blob = await pdf(doc).toBlob();
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `${creditNote.creditNumber || "Credit-Note"}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
			toast.success("Credit note downloaded");
		} catch (err) {
			toast.error("Failed to download credit note", {
				description: err instanceof Error ? err.message : "Unknown error",
			});
		} finally {
			setIsDownloading(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	if (error || !creditNote) {
		return (
			<div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
				<p className="text-muted-foreground">{error?.message || "Credit note not found."}</p>
				<Button variant="outline" onClick={() => navigate(backHref)}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					{backLabel}
				</Button>
			</div>
		);
	}

	const pdfMeta = buildCreditNotePdfDetails(creditNote);
	const kraSynced = isInvoiceKraSynced(creditNote.kraStatus);
	const etimsFiscal = creditNote.etimsFiscal ?? pdfMeta.etimsFiscal;

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 py-6">
			<div className="flex items-center justify-between px-4">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="sm" onClick={() => navigate(backHref)}>
						<ArrowLeft className="mr-2 h-4 w-4" />
						{backLabel}
					</Button>
					<div>
						<h1 className="text-base font-semibold">
							Credit Note {creditNote.creditNumber || ""}
						</h1>
						<p className="text-xs text-muted-foreground">
							Original invoice: {creditNote.originalInvoiceNumber || creditNote.invoiceNumber || ""}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{showKraRetry && !kraSynced && creditNote.kraStatus !== "SUBMITTING" ? (
						<Button
							variant="outline"
							onClick={() => retryKraMutation.mutate({ creditNoteId })}
							disabled={retryKraMutation.isPending}
						>
							{retryKraMutation.isPending ? (
								<Spinner className="mr-2 h-4 w-4" />
							) : (
								<RefreshCw className="mr-2 h-4 w-4" />
							)}
							Retry KRA sync
						</Button>
					) : null}
					<Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
						{isDownloading ? (
							<>
								<Spinner className="mr-2 h-4 w-4" />
								Downloading…
							</>
						) : (
							<>
								<Download className="mr-2 h-4 w-4" />
								Download PDF
							</>
						)}
					</Button>
				</div>
			</div>

			{showKraRetry ? (
				<div className="flex flex-wrap items-center justify-center gap-2 px-4">
					<Badge variant={kraSynced ? "default" : "secondary"}>
						KRA: {kraSynced ? "Synced" : creditNote.kraStatus || "Pending"}
					</Badge>
					{creditNote.kraRefundReasonCode ? (
						<Badge variant="outline">
							Reason: {creditNoteReasonLabel(creditNote.kraRefundReasonCode)}
						</Badge>
					) : null}
					{creditNote.kraError ? (
						<span className="text-xs text-destructive">{creditNote.kraError}</span>
					) : null}
				</div>
			) : null}

			<div className="flex justify-center px-4">
				<PreviewDetails
					yourDetails={pdfMeta.yourDetails}
					companyDetails={pdfMeta.companyDetails}
					invoiceDetails={pdfMeta.invoiceDetails}
					invoiceTerms={pdfMeta.invoiceTerms}
					etimsFiscal={etimsFiscal}
					documentTitle={pdfMeta.documentTitle}
				/>
			</div>
		</div>
	);
}
