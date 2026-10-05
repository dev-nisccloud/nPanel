"use client";

import { Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/npanel-ui/sheet";
import { formatKraDateTime, formatMoney, formatSalesDate, paymentTypeLabel } from "../../sales/_components/etims-sale-utils";

export function ViewETimsPurchaseSheet({
	open,
	onOpenChange,
	purchase,
	onConfirm,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	purchase: Record<string, unknown> | null;
	onConfirm?: (purchase: Record<string, unknown>) => void;
}) {
	if (!purchase) return null;
	const itemList = Array.isArray(purchase.itemList) ? (purchase.itemList as Record<string, unknown>[]) : [];
	const date = String(purchase.salesDt ?? purchase.pchsDt ?? "");
	const supplier = String(purchase.spplrNm ?? purchase.sNm ?? purchase.taxprNm ?? "Supplier");
	const pin = String(purchase.spplrTin ?? purchase.sPin ?? purchase.tin ?? "");
	const invc = String(purchase.spplrInvcNo ?? purchase.invcNo ?? "-");

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:max-w-xl overflow-y-auto">
				<SheetHeader>
					<SheetTitle>Supplier invoice {invc}</SheetTitle>
					<SheetDescription>Inbound purchase mirrored from KRA against your PIN.</SheetDescription>
				</SheetHeader>
				<div className="mt-6 space-y-6">
					<div className="flex items-start gap-3">
						<div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
							<User className="h-4 w-4" />
						</div>
						<div>
							<p className="font-medium">{supplier}</p>
							<p className="text-xs font-mono text-muted-foreground">{pin}</p>
						</div>
					</div>
					<dl className="grid grid-cols-2 gap-3 text-sm">
						<div>
							<dt className="text-xs text-muted-foreground">Date</dt>
							<dd className="mt-0.5 flex items-center gap-1">
								<Calendar className="h-3.5 w-3.5 text-muted-foreground" />
								{formatSalesDate(date) || date || "-"}
							</dd>
						</div>
						<div>
							<dt className="text-xs text-muted-foreground">Payment</dt>
							<dd className="mt-0.5">{paymentTypeLabel(String(purchase.pmtTyCd ?? "")) || "-"}</dd>
						</div>
						<div>
							<dt className="text-xs text-muted-foreground">Taxable</dt>
							<dd className="mt-0.5">{formatMoney(Number(purchase.totTaxblAmt ?? 0))}</dd>
						</div>
						<div>
							<dt className="text-xs text-muted-foreground">VAT</dt>
							<dd className="mt-0.5">{formatMoney(Number(purchase.totTaxAmt ?? 0))}</dd>
						</div>
						<div>
							<dt className="text-xs text-muted-foreground">Total</dt>
							<dd className="mt-0.5 font-semibold">{formatMoney(Number(purchase.totAmt ?? 0))}</dd>
						</div>
						<div>
							<dt className="text-xs text-muted-foreground">Confirmed</dt>
							<dd className="mt-0.5">{formatKraDateTime(String(purchase.cfmDt ?? "")) || "-"}</dd>
						</div>
					</dl>
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Lines</p>
						<div className="rounded-lg border divide-y">
							{itemList.length === 0 ? (
								<p className="p-3 text-sm text-muted-foreground">No line items on this mirrored invoice.</p>
							) : (
								itemList.map((line, i) => (
									<div key={i} className="p-3 text-sm flex items-start justify-between gap-3">
										<div className="min-w-0">
											<p className="font-medium truncate">{String(line.itemNm ?? "Item")}</p>
											<p className="text-xs font-mono text-muted-foreground">{String(line.itemCd ?? "")}</p>
										</div>
										<div className="text-right shrink-0">
											<p>{formatMoney(Number(line.totAmt ?? line.prc ?? 0))}</p>
											<Badge variant="secondary" className="mt-1">
												{String(line.taxTyCd ?? "B")}
											</Badge>
										</div>
									</div>
								))
							)}
						</div>
					</div>
				</div>
				<SheetFooter className="mt-6">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Close
					</Button>
					{onConfirm ? (
						<Button
							onClick={() => {
								onOpenChange(false);
								onConfirm(purchase);
							}}
						>
							Confirm purchase
						</Button>
					) : null}
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
