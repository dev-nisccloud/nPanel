"use client";

import * as React from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Download, Loader2, Trash2, Send, Pencil, ChevronDown } from "lucide-react";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QUOTATION_STATUSES } from "./agency.quotations/_components/quotations-table";
import { quotationCustomerGroupPath } from "./agency.quotations/_components/quotation-customer-group";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { captureEvent } from "@/lib/posthog";
import { QuotationPreviewDetails } from "@/routes/agency.quotations/create/_components/form/previewDetails";
import { transformQuotationToPreviewData } from "./agency.quotations/$id/_utils/transformQuotationData";
import { SendQuotationDialog } from "./agency.quotations/_components/SendQuotationDialog";

let fontsRegistered = false;
let fontsRegistering = false;

const registerFonts = async (): Promise<boolean> => {
	if (fontsRegistered) return true;
	if (fontsRegistering) {
		return new Promise((resolve) => {
			const interval = setInterval(() => {
				if (fontsRegistered) {
					clearInterval(interval);
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
					const res = await fetch(`/font/${name}`);
					if (!res.ok) return null;
					const buf = await res.arrayBuffer();
					const base64 = btoa(
						new Uint8Array(buf).reduce((data, byte) => data + String.fromCharCode(byte), ""),
					);
					return {
						src: `data:font/truetype;base64,${base64}`,
						fontWeight: weight as "thin" | "ultralight" | "light" | "normal" | "medium" | "semibold" | "bold" | "ultrabold",
					};
				} catch {
					return null;
				}
			}),
		);
		const valid = fonts.filter((f): f is NonNullable<typeof f> => f != null);
		if (valid.length > 0) {
			Font.register({ family: "Geist", fonts: valid });
			fontsRegistered = true;
			return true;
		}
		return false;
	} catch (err) {
		console.error("Failed to register fonts:", err);
		return false;
	} finally {
		fontsRegistering = false;
	}
};

export default function QuotationViewPage() {
	const params = useParams();
	const navigate = useNavigate();
	const quotationId = params.id as string;

	const { data: quotation, isLoading, error } = trpc.quotations.getById.useQuery(
		{ id: quotationId },
		{ enabled: !!quotationId },
	);

	const [isDownloading, setIsDownloading] = React.useState(false);
	const [isDeleting, setIsDeleting] = React.useState(false);
	const [statusChanging, setStatusChanging] = React.useState(false);
	const [deleteOpen, setDeleteOpen] = React.useState(false);
	const [sendEmailOpen, setSendEmailOpen] = React.useState(false);

	const utils = trpc.useUtils();
	const updateStatusMutation = trpc.quotations.updateStatus.useMutation({
		onSuccess: (_, variables) => {
			if (variables.status === "ACCEPTED") {
				captureEvent("quotation_accepted");
			} else if (variables.status === "DECLINED") {
				captureEvent("quotation_declined");
			}
			toast.success("Status updated", {
				description: `Quotation set to ${QUOTATION_STATUSES.find((s) => s.value === variables.status)?.label ?? variables.status}.`,
			});
			utils.quotations.list.invalidate();
			utils.quotations.getById.invalidate({ id: quotationId });
		},
		onError: (e) => toast.error("Failed to update status", { description: e.message }),
	});
	const deleteMutation = trpc.quotations.deleteQuotation.useMutation({
		onSuccess: () => {
			toast.success("Quotation deleted");
			utils.quotations.list.invalidate();
			utils.quotations.listCustomersSummary.invalidate();
			setDeleteOpen(false);
			navigate(
				quotation
					? quotationCustomerGroupPath(quotation.customerName, quotation.customerEmail)
					: "/agency/quotations",
			);
		},
		onError: (e) => toast.error("Failed to delete quotation", { description: e.message }),
	});

	const handleDownload = async () => {
		if (!quotation) return;
		try {
			setIsDownloading(true);
			await registerFonts();
			const previewData = transformQuotationToPreviewData(quotation);
			const [
				{ Document, Page },
				{ pdf },
				{ QuotationPdfDetails: QuotationPdf },
				{ pdfContainers },
			] = await Promise.all([
				import("@react-pdf/renderer"),
				import("@react-pdf/renderer"),
				import("@/routes/agency.quotations/create/_components/form/quotationPdfDetails"),
				import("@/lib/pdfStyles"),
			]);
			const blob = await pdf(
				<Document>
					<Page size="A4" style={pdfContainers.page}>
						<QuotationPdf
							yourDetails={previewData.yourDetails}
							companyDetails={previewData.companyDetails}
							quotationDetails={previewData.quotationDetails}
							quotationTerms={previewData.quotationTerms}
						/>
					</Page>
				</Document>,
			).toBlob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${quotation.quotationNumber ?? "Quotation"}.pdf`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			captureEvent("quotation_downloaded_pdf");
			toast.success("Quotation downloaded");
		} catch (err) {
			toast.error("Failed to download", {
				description: err instanceof Error ? err.message : "An error occurred",
			});
		} finally {
			setIsDownloading(false);
		}
	};

	const handleDelete = async () => {
		try {
			setIsDeleting(true);
			setDeleteOpen(false);
			await deleteMutation.mutateAsync({ quotationId });
		} catch {
			/* handled in mutation */
		} finally {
			setIsDeleting(false);
		}
	};

	const handleStatusChange = async (status: (typeof QUOTATION_STATUSES)[number]["value"]) => {
		if (status === quotation?.status) return;
		try {
			setStatusChanging(true);
			await updateStatusMutation.mutateAsync({ id: quotationId, status });
		} catch {
			/* handled in mutation */
		} finally {
			setStatusChanging(false);
		}
	};

	if (isLoading) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 min-h-screen items-center justify-center">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	if (error || !quotation) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 min-h-screen items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-semibold mb-2">Quotation Not Found</h1>
					<p className="text-muted-foreground mb-4">
						{error?.message ?? "The quotation you're looking for doesn't exist."}
					</p>
					<Button onClick={() => navigate("/agency/quotations")} variant="outline">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Quotations
					</Button>
				</div>
			</div>
		);
	}

	const quotationsBackPath = quotationCustomerGroupPath(
		quotation.customerName,
		quotation.customerEmail,
	);
	const previewData = transformQuotationToPreviewData(quotation);

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 py-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button onClick={() => navigate(quotationsBackPath)} variant="ghost" size="sm">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Quotations
					</Button>
					<div>
						<h1 className="text-2xl font-semibold tracking-tight">
							Quotation {quotation.quotationNumber ?? "View"}
						</h1>
						<p className="text-muted-foreground">View quotation details</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button
						onClick={handleDownload}
						disabled={isDownloading}
						variant="outline"
					>
						{isDownloading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Downloading...
							</>
						) : (
							<>
								<Download className="mr-2 h-4 w-4" />
								Download Quotation
							</>
						)}
					</Button>
					<Button
						onClick={() => setSendEmailOpen(true)}
						disabled={isDownloading}
						variant="outline"
					>
						<Send className="mr-2 h-4 w-4" />
						Send to email
					</Button>
					<Button
						onClick={() => navigate(`/agency/quotations/${quotationId}/edit`)}
						disabled={isDownloading}
						variant="outline"
					>
						<Pencil className="mr-2 h-4 w-4" />
						Edit
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								disabled={isDownloading || statusChanging}
							>
								Change status
								<ChevronDown className="ml-2 h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{QUOTATION_STATUSES.map(({ value, label }) => (
								<DropdownMenuItem
									key={value}
									onClick={() => handleStatusChange(value)}
									disabled={quotation.status === value}
								>
									{label}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
					<Button
						onClick={() => setDeleteOpen(true)}
						disabled={isDownloading || isDeleting || statusChanging}
						variant="outline"
						className="text-destructive hover:text-destructive"
					>
						<Trash2 className="mr-2 h-4 w-4" />
						Delete
					</Button>
				</div>
			</div>

			<SendQuotationDialog
				open={sendEmailOpen}
				onOpenChange={setSendEmailOpen}
				quotationId={quotationId}
				defaultEmail={quotation.customerEmail}
				onSent={() => utils.quotations.getById.invalidate({ id: quotationId })}
			/>

			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Quotation</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete quotation <strong>{quotation.quotationNumber ?? "this quotation"}</strong>? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<div className="flex justify-center items-start">
				<QuotationPreviewDetails
					yourDetails={previewData.yourDetails}
					companyDetails={previewData.companyDetails}
					quotationDetails={previewData.quotationDetails}
					quotationTerms={previewData.quotationTerms}
				/>
			</div>
		</div>
	);
}
