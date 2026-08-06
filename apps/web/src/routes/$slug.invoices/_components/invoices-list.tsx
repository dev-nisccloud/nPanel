"use client";

import * as React from "react";
import { useNavigate, useLocation } from "react-router";
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
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { captureEvent } from "@/lib/posthog";
import type { InvoiceSummary } from "@/routes/agency.invoicing/api/schemas";
import type { InvoiceDetail } from "@/routes/agency.invoices/create/api/schemas";
import { buildInvoicePdfDetails } from "@npanel/api/agency-invoice-pdf/build-invoice-pdf-details";

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
		return "- ";
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
		return "- ";
	}
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "- ";
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

export function convertInvoiceToPdfData(invoice: InvoiceDetail) {
	return buildInvoicePdfDetails(invoice);
}

interface InvoiceCardProps {
	invoice: InvoiceSummary;
	onRefetch?: () => void;
}

function InvoiceCard({ invoice, onRefetch }: InvoiceCardProps) {
	const [isActionMenuOpen, setIsActionMenuOpen] = React.useState(false);
	const [isDownloading, setIsDownloading] = React.useState(false);
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const teamSlug = pathname.split("/")[1];
	const basePath = teamSlug ? `/${teamSlug}/invoices` : "/agency/invoices";

	const StatusIcon = statusIcon[invoice.status];

	const getInvoiceDetail = trpc.invoicing.getById.useQuery(
		{ id: invoice.id },
		{ enabled: false }
	);

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

			const [{ pdf }, { buildAgencyInvoicePdfDocument }] = await Promise.all([
				import("@react-pdf/renderer"),
				import("@/lib/build-agency-invoice-pdf-document"),
			]);

			const doc = await buildAgencyInvoicePdfDocument(invoiceDetail.data);
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
					window.location.href = `${basePath}/${invoice.id}`;
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
								disabled={isDownloading}
								onClick={(e) => e.stopPropagation()}
							>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<DropdownMenuItem
								onClick={(e) => {
									e.stopPropagation();
									navigate(`${basePath}/${invoice.id}`);
								}}
								disabled={isDownloading}
							>
								<Eye className="mr-2 h-4 w-4" />
								View Invoice
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={handleDownloadInvoice}
								disabled={isDownloading}
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


