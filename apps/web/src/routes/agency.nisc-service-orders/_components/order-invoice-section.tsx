"use client";

import { AlertTriangle, ExternalLink, FileText } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { getNiscOrderInvoiceUiState } from "./nisc-order-invoice-ui";

type OrderInvoiceSectionProps = {
	invoiceId: string | null;
	invoiceNumber: string | null;
	metadata: unknown;
	compact?: boolean;
};

export function OrderInvoiceSection({
	invoiceId,
	invoiceNumber,
	metadata,
	compact = false,
}: OrderInvoiceSectionProps) {
	const invoiceState = getNiscOrderInvoiceUiState({
		invoiceId,
		invoiceNumber,
		metadata,
	});

	if (invoiceState.status === "pending") {
		if (compact) {
			return <span className="text-muted-foreground text-xs">-</span>;
		}
		return (
			<div className="w-full rounded-md border border-dashed p-3 text-sm text-muted-foreground">
				Invoice will be generated when the order is processed, or is not available yet.
			</div>
		);
	}

	if (invoiceState.status === "linked") {
		const label = invoiceState.invoiceNumber ?? "View invoice";
		return (
			<div className={compact ? "flex items-center gap-2" : "w-full space-y-2"}>
				{!compact && (
					<p className="text-sm font-medium text-muted-foreground">Invoice</p>
				)}
				<div className="flex flex-wrap items-center gap-2">
					<Button variant="outline" size="sm" asChild>
						<Link to={`/agency/invoices/${invoiceState.invoiceId}`}>
							<FileText className="mr-2 h-4 w-4" />
							{label}
							<ExternalLink className="ml-2 h-3.5 w-3.5 opacity-60" />
						</Link>
					</Button>
					{invoiceState.emailed === false && (
						<Badge variant="secondary" className="text-xs">
							Not emailed
						</Badge>
					)}
					{invoiceState.kraSynced === false && (
						<Badge variant="destructive" className="text-xs">
							KRA not synced
						</Badge>
					)}
					{invoiceState.kraSynced === true && (
						<Badge variant="outline" className="text-xs text-green-700 border-green-600/30">
							KRA synced
						</Badge>
					)}
					{invoiceState.source === "user_profile" && !compact && (
						<Badge variant="outline" className="text-xs">
							From customer profile
						</Badge>
					)}
					{invoiceState.kraError && invoiceState.kraSynced === false && !compact ? (
						<p className="text-xs text-destructive w-full">{invoiceState.kraError}</p>
					) : null}
				</div>
			</div>
		);
	}

	const warning = (
		<div className={compact ? "flex items-center gap-1.5 min-w-0" : "w-full space-y-2"}>
			{!compact && (
				<p className="text-sm font-medium text-muted-foreground">Invoice</p>
			)}
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<div
							className={
								compact
									? "inline-flex items-center gap-1 text-amber-700 dark:text-amber-400"
									: "flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
							}
						>
							<AlertTriangle className={compact ? "h-3.5 w-3.5 shrink-0" : "h-4 w-4 shrink-0 mt-0.5"} />
							{compact ? (
								<span className="text-xs truncate max-w-[140px]">No invoice</span>
							) : (
								<span>{invoiceState.reasonMessage}</span>
							)}
						</div>
					</TooltipTrigger>
					{compact && (
						<TooltipContent side="top" className="max-w-xs">
							<p className="text-xs">{invoiceState.reasonMessage}</p>
						</TooltipContent>
					)}
				</Tooltip>
			</TooltipProvider>
		</div>
	);

	return warning;
}
