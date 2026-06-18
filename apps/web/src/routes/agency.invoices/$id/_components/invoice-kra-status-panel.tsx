"use client";

import * as React from "react";
import { RefreshCw, ShieldCheck, ShieldAlert, ShieldX, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	invoiceRequiresKraSyncBeforeEmail,
	isInvoiceKraSynced,
	kraStatusLabel,
} from "@npanel/api/lib/invoice-kra-status";
import type { InvoiceDetail } from "@/routes/agency.invoices/create/api/schemas";
import type { EtimsFiscalFields } from "@npanel/api/lib/etims-fiscal-fields";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";

function kraBadgeVariant(
	status: string | null | undefined,
): "default" | "secondary" | "destructive" | "outline" {
	if (isInvoiceKraSynced(status)) return "default";
	if (status === "FAILED") return "destructive";
	if (status === "SUBMITTING") return "secondary";
	return "outline";
}

function KraStatusIcon({ status }: { status: string | null | undefined }) {
	if (status === "SUBMITTING") return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
	if (isInvoiceKraSynced(status)) return <ShieldCheck className="h-3.5 w-3.5" />;
	if (status === "FAILED") return <ShieldX className="h-3.5 w-3.5" />;
	return <ShieldAlert className="h-3.5 w-3.5" />;
}

type InvoiceKraStatusPanelProps = {
	invoice: Pick<
		InvoiceDetail,
		| "id"
		| "kraStatus"
		| "kraError"
		| "kraReceiptNumber"
		| "kraVerificationUrl"
		| "kraVerifiedDate"
	>;
	etimsFiscal?: EtimsFiscalFields | null;
	onInvoiceUpdated?: () => void;
};

export function InvoiceKraStatusPanel({
	invoice,
	etimsFiscal,
	onInvoiceUpdated,
}: InvoiceKraStatusPanelProps) {
	const utils = trpc.useUtils();
	const retryMutation = trpc.invoicing.retryKraSync.useMutation({
		onSuccess: (data) => {
			if (data.success) {
				toast.success("KRA eTIMS sync complete", { description: data.message });
			} else {
				toast.error("KRA eTIMS sync failed", { description: data.message });
			}
			utils.invoicing.getById.invalidate({ id: invoice.id });
			onInvoiceUpdated?.();
		},
		onError: (error) => {
			toast.error("KRA sync failed", { description: error.message });
		},
	});

	const needsSync = invoiceRequiresKraSyncBeforeEmail(invoice.kraStatus);
	const canRetry =
		needsSync &&
		invoice.kraStatus !== "SUBMITTING" &&
		invoice.kraStatus !== "NOT_APPLICABLE";

	return (
		<div className="w-full max-w-3xl mx-auto rounded-lg border bg-muted/30 p-4 space-y-3">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium">KRA eTIMS</span>
					<Badge variant={kraBadgeVariant(invoice.kraStatus)} className="gap-1">
						<KraStatusIcon status={invoice.kraStatus} />
						{kraStatusLabel(invoice.kraStatus)}
					</Badge>
				</div>
				{canRetry ? (
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={retryMutation.isPending}
						onClick={() => retryMutation.mutate({ invoiceId: invoice.id })}
					>
						{retryMutation.isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<RefreshCw className="mr-2 h-4 w-4" />
						)}
						{isInvoiceKraSynced(invoice.kraStatus) ? "Re-sync" : "Sync to KRA"}
					</Button>
				) : null}
			</div>

			{invoice.kraError ? (
				<p className="text-xs text-destructive">{invoice.kraError}</p>
			) : null}

			{needsSync ? (
				<p className="text-xs text-muted-foreground">
					Customer email requires a successful KRA eTIMS sync so the fiscal receipt appears on the PDF.
				</p>
			) : null}

			{etimsFiscal ? (
				<div className="rounded-md border bg-background p-3 text-xs space-y-1 font-mono">
					<p className="text-[10px] uppercase tracking-wide text-muted-foreground font-sans font-semibold mb-2">
						Fiscal receipt (PDF footer)
					</p>
					{etimsFiscal.intrlData ? (
						<p>
							<span className="text-muted-foreground">Internal Data: </span>
							{etimsFiscal.intrlData}
						</p>
					) : null}
					<p>
						<span className="text-muted-foreground">Receipt Signature: </span>
						{etimsFiscal.rcptSign}
					</p>
					{etimsFiscal.curRcptNo ? (
						<p>
							<span className="text-muted-foreground">Receipt No.: </span>
							{etimsFiscal.curRcptNo}
						</p>
					) : null}
					{etimsFiscal.totRcptNo ? (
						<p>
							<span className="text-muted-foreground">Total Receipts: </span>
							{etimsFiscal.totRcptNo}
						</p>
					) : null}
					{etimsFiscal.sdcDateTimeDisplay ? (
						<p>
							<span className="text-muted-foreground">SDC Date-Time: </span>
							{etimsFiscal.sdcDateTimeDisplay}
						</p>
					) : null}
					{invoice.kraVerificationUrl ? (
						<p className="break-all pt-1 font-sans">
							<span className="text-muted-foreground">Verify: </span>
							<a
								href={invoice.kraVerificationUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="text-primary underline"
							>
								{invoice.kraVerificationUrl}
							</a>
						</p>
					) : null}
				</div>
			) : null}
		</div>
	);
}

export function canSendInvoiceEmail(invoice: Pick<InvoiceDetail, "kraStatus">): boolean {
	if (invoice.kraStatus === "SUBMITTING") return false;
	if (invoice.kraStatus === "SKIPPED") return false;
	return true;
}
