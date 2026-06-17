"use client";

import * as React from "react";
import { ExternalLink, Copy, Check, Download, FileWarning, QrCode as QrCodeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/npanel-ui/sheet";
import { getDigitaxStatusBadgeClass } from "../../_components/digitax-utils";
import { QRCodeSVG } from "qrcode.react";

interface SaleDetailSheetProps {
	saleId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreditNote?: (saleId: string) => void;
}

export function SaleDetailSheet({ saleId, open, onOpenChange, onCreditNote }: SaleDetailSheetProps) {
	const [copied, setCopied] = React.useState<string | null>(null);

	const { data: sale, isLoading } = trpc.digitax.sales.getById.useQuery(
		{ saleId: saleId ?? "" },
		{ enabled: !!saleId && open }
	);

	const handleCopy = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		setCopied(label);
		toast.success("Copied to clipboard");
		setTimeout(() => setCopied(null), 2000);
	};

	if (isLoading || !sale) {
		return (
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
					<SheetHeader>
						<SheetTitle>Sale details</SheetTitle>
						<SheetDescription>Loading sale information...</SheetDescription>
					</SheetHeader>
					<div className="flex items-center justify-center py-12">
						<Spinner size={32} />
					</div>
				</SheetContent>
			</Sheet>
		);
	}

	const status = String(sale.status ?? "PENDING");

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
				<SheetHeader>
					<SheetTitle>Sale details</SheetTitle>
					<SheetDescription>
						KRA eTIMS compliant sale record #{String(sale.trader_invoice_number)}
					</SheetDescription>
				</SheetHeader>

				<div className="mt-6 space-y-6">
					{/* Status Banner */}
					<div className="rounded-lg border p-4 flex items-center justify-between">
						<div>
							<p className="text-sm font-medium">eTIMS transmission status</p>
							<p className="text-xs text-muted-foreground">
								{status === "COMPLETED"
									? "Successfully transmitted to KRA"
									: status === "FAILED"
									? "Transmission failed - retry required"
									: "Processing..."}
							</p>
						</div>
						<Badge variant="outline" className={getDigitaxStatusBadgeClass(status)}>
							{status}
						</Badge>
					</div>

					{/* QR Code & Quick Actions */}
					{sale.receipt_signature && (
						<div className="rounded-lg border p-6 space-y-4">
							<h4 className="text-sm font-medium">Verification QR code</h4>
							<div className="flex flex-col md:flex-row gap-6 items-center">
								<div className="bg-white p-4 rounded-lg border">
									<QRCodeSVG
										value={sale.etims_url ?? ""}
										size={180}
										level="M"
										includeMargin
									/>
								</div>
								<div className="flex-1 space-y-3 w-full">
									{sale.offline_url && (
										<Button
											variant="outline"
											size="sm"
											className="w-full justify-start"
											onClick={() => window.open(sale.offline_url, "_blank")}
										>
											<ExternalLink className="mr-2 h-4 w-4" />
											Open offline receipt
										</Button>
									)}
									{sale.etims_url && (
										<Button
											variant="outline"
											size="sm"
											className="w-full justify-start"
											onClick={() => window.open(sale.etims_url, "_blank")}
										>
											<ExternalLink className="mr-2 h-4 w-4" />
											Verify on KRA eTIMS
										</Button>
									)}
									<Button
										variant="outline"
										size="sm"
										className="w-full justify-start"
										onClick={() => handleCopy(sale.receipt_signature ?? "", "signature")}
									>
										{copied === "signature" ? (
											<Check className="mr-2 h-4 w-4 text-green-600" />
										) : (
											<Copy className="mr-2 h-4 w-4" />
										)}
										Copy signature
									</Button>
								</div>
							</div>
						</div>
					)}

					{/* Invoice Details */}
					<div className="rounded-lg border p-4 space-y-3">
						<h4 className="text-sm font-medium">Invoice information</h4>
						<dl className="grid grid-cols-2 gap-3 text-sm">
							<div>
								<dt className="text-muted-foreground text-xs">Serial number</dt>
								<dd className="font-medium">{sale.serial_number ?? "-"}</dd>
							</div>
							<div>
								<dt className="text-muted-foreground text-xs">Receipt number</dt>
								<dd className="font-medium">#{sale.receipt_number ?? "-"}</dd>
							</div>
							<div>
								<dt className="text-muted-foreground text-xs">Invoice number</dt>
								<dd className="font-medium">#{sale.invoice_number ?? "-"}</dd>
							</div>
							<div>
								<dt className="text-muted-foreground text-xs">Receipt type</dt>
								<dd className="font-medium">
									{sale.receipt_type_code === "S" ? "Sales" : sale.receipt_type_code === "R" ? "Credit note" : sale.receipt_type_code}
								</dd>
							</div>
							<div className="col-span-2">
								<dt className="text-muted-foreground text-xs">Date & time</dt>
								<dd className="font-medium">
									{sale.date} at {sale.time}
								</dd>
							</div>
						</dl>
					</div>

					{/* Customer Details */}
					<div className="rounded-lg border p-4 space-y-3">
						<h4 className="text-sm font-medium">Customer</h4>
						<dl className="grid grid-cols-2 gap-3 text-sm">
							<div>
								<dt className="text-muted-foreground text-xs">Name</dt>
								<dd className="font-medium">{sale.customer_name || "Walk-in customer"}</dd>
							</div>
							<div>
								<dt className="text-muted-foreground text-xs">KRA PIN</dt>
								<dd className="font-medium">{sale.customer_tin || "N/A"}</dd>
							</div>
							{sale.customer_phone_number && (
								<div>
									<dt className="text-muted-foreground text-xs">Phone</dt>
									<dd className="font-medium">{sale.customer_phone_number}</dd>
								</div>
							)}
							{sale.customer_email && (
								<div>
									<dt className="text-muted-foreground text-xs">Email</dt>
									<dd className="font-medium">{sale.customer_email}</dd>
								</div>
							)}
						</dl>
					</div>

					{/* Tax Summary */}
					<div className="rounded-lg border bg-muted/30 p-4 space-y-3">
						<h4 className="text-sm font-medium">Tax summary</h4>
						<div className="space-y-2 text-sm">
							{sale.sales_tax_summary?.taxable_amount_b ? (
								<div className="flex justify-between">
									<span className="text-muted-foreground">Taxable amount (B - 16%)</span>
									<span className="font-medium">
										{sale.sales_tax_summary.taxable_amount_b.toLocaleString()} KES
									</span>
								</div>
							) : null}
							{sale.sales_tax_summary?.tax_amount_b ? (
								<div className="flex justify-between">
									<span className="text-muted-foreground">VAT (16%)</span>
									<span className="font-medium">
										{sale.sales_tax_summary.tax_amount_b.toLocaleString()} KES
									</span>
								</div>
							) : null}
							<div className="flex justify-between pt-2 border-t font-semibold">
								<span>Total</span>
								<span>
									{((sale.sales_tax_summary?.taxable_amount_b ?? 0) + (sale.sales_tax_summary?.tax_amount_b ?? 0)).toLocaleString()} KES
								</span>
							</div>
						</div>
					</div>

					{/* Line Items */}
					{sale.item_list && sale.item_list.length > 0 && (
						<div className="rounded-lg border p-4 space-y-3">
							<h4 className="text-sm font-medium">Line items ({sale.item_list.length})</h4>
							<div className="space-y-2">
								{sale.item_list.map((item) => (
									<div key={String(item.id)} className="flex justify-between text-sm p-2 rounded bg-muted/30">
										<div>
											<p className="font-medium">{String(item.item_name ?? "Item")}</p>
											<p className="text-xs text-muted-foreground">
												Qty: {item.quantity} × {item.unit_price.toLocaleString()} KES
											</p>
										</div>
										<span className="font-medium">{item.total_amount.toLocaleString()} KES</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				<SheetFooter className="border-t pt-4 mt-6 gap-2">
					{onCreditNote && status === "COMPLETED" && (
						<Button
							variant="outline"
							onClick={() => {
								onCreditNote(String(sale.id));
								onOpenChange(false);
							}}
							className="text-destructive"
						>
							<FileWarning className="mr-2 h-4 w-4" />
							Issue credit note
						</Button>
					)}
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Close
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
