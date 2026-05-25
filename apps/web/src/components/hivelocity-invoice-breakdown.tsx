"use client";

import * as React from "react";
import { HelpCircle } from "lucide-react";
import type { HivelocityInvoiceBreakdown as Breakdown } from "@/lib/hivelocity-checkout";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type FormatPriceFn = (amount: number, currency: string) => string;

interface HivelocityInvoiceBreakdownProps {
	breakdown: Breakdown;
	currency: string;
	formatPrice: FormatPriceFn;
	/** Shown above line items (e.g. "Invoice preview") */
	title?: string;
	compact?: boolean;
}

export function HivelocityInvoiceBreakdown({
	breakdown,
	currency,
	formatPrice,
	title = "Invoice preview",
	compact = false,
}: HivelocityInvoiceBreakdownProps) {
	return (
		<div className="rounded-xl border bg-muted/20 p-4 space-y-3">
			<div className="flex items-center justify-between gap-2">
				<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
				<p className="text-[11px] text-muted-foreground">Separate lines · ex VAT then 16% VAT</p>
			</div>

			<div className="space-y-2">
				{breakdown.lines.map((line) => (
					<div
						key={line.id}
						className="flex items-start justify-between gap-3 rounded-lg border bg-background/70 px-3 py-2"
					>
						<div className="min-w-0">
							<p className="text-sm font-medium text-foreground line-clamp-2">{line.name}</p>
							{line.description ? (
								<p className="text-xs text-muted-foreground mt-0.5">{line.description}</p>
							) : null}
						</div>
						<p className="shrink-0 text-sm font-semibold text-foreground">
							{formatPrice(line.amountExVat, currency)}
						</p>
					</div>
				))}
			</div>

			<div className={`space-y-2 ${compact ? "text-sm" : ""}`}>
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">Subtotal (ex VAT)</span>
					<span>{formatPrice(breakdown.subtotalExVat, currency)}</span>
				</div>
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground inline-flex items-center gap-1">
						VAT ({Math.round(breakdown.vatRate * 100)}%)
						<Tooltip>
							<TooltipTrigger asChild>
								<HelpCircle className="h-3.5 w-3.5 cursor-help" />
							</TooltipTrigger>
							<TooltipContent>16% VAT applied per Kenyan regulations</TooltipContent>
						</Tooltip>
					</span>
					<span>{formatPrice(breakdown.vatAmount, currency)}</span>
				</div>
				<div className="border-t pt-2 flex items-center justify-between font-bold">
					<span>Total</span>
					<span>{formatPrice(breakdown.totalIncVat, currency)}</span>
				</div>
			</div>
		</div>
	);
}
