"use client";

import * as React from "react";
import { RefreshCw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/npanel-ui/sheet";
import { DigitaxPageShell } from "./agency.digitax/_components/digitax-page-shell";
import { DigitaxListToolbar } from "./agency.digitax/_components/digitax-list-toolbar";
import {
	DigitaxTableSkeleton,
	DigitaxTableEmpty,
	DigitaxTableWrapper,
	DigitaxNoSearchResults,
} from "./agency.digitax/_components/digitax-table-states";
import { extractDigitaxArray, formatDigitaxDate, getDigitaxStatusBadgeClass } from "./agency.digitax/_components/digitax-utils";

function calculateTotal(itemList: Array<{ supply_amount?: number }> | undefined): number {
	return itemList?.reduce((sum, item) => sum + (item.supply_amount ?? 0), 0) ?? 0;
}

export default function DigitaxPurchasesPage() {
	const [searchQuery, setSearchQuery] = React.useState("");
	const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
	const [selectedPurchase, setSelectedPurchase] = React.useState<Record<string, unknown> | null>(null);

	const { data: purchasesData, isLoading, refetch, isFetching } = trpc.digitax.purchases.getAll.useQuery({
		page_size: 20,
	});

	const { data: fullPurchase, isLoading: isFetchingDetails } = trpc.digitax.purchases.getById.useQuery(
		{ purchaseId: String(selectedPurchase?.id ?? "") },
		{ enabled: !!selectedPurchase?.id }
	);

	const displayPurchase = (fullPurchase ?? selectedPurchase) as Record<string, unknown> | null;
	const purchases = React.useMemo(() => extractDigitaxArray<Record<string, unknown>>(purchasesData), [purchasesData]);

	const filteredPurchases = React.useMemo(() => {
		if (!searchQuery.trim()) return purchases;
		const query = searchQuery.toLowerCase().trim();
		return purchases.filter((p) =>
			String(p.supplier_tin ?? "").toLowerCase().includes(query) ||
			String(p.supplier_name ?? "").toLowerCase().includes(query) ||
			String(p.trader_invoice_number ?? "").toLowerCase().includes(query)
		);
	}, [purchases, searchQuery]);

	const columns = ["Supplier", "Invoice #", "Date", "Amount", "Status"];

	const openDetails = (purchase: Record<string, unknown>) => {
		setSelectedPurchase(purchase);
		setIsDetailsOpen(true);
	};

	if (isLoading) {
		return (
			<DigitaxPageShell
				title="Purchase records"
				description="View and reconcile input invoices issued to your business by suppliers."
			>
				<DigitaxTableSkeleton columns={columns} />
			</DigitaxPageShell>
		);
	}

	return (
		<DigitaxPageShell
			title="Purchase records"
			description="View and reconcile input invoices issued to your business by suppliers."
			action={
				<Button size="sm" onClick={() => refetch()} disabled={isFetching}>
					<RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
					Sync recent
				</Button>
			}
		>
			<Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
				<SheetContent className="w-full sm:max-w-xl overflow-y-auto">
					<SheetHeader>
						<SheetTitle>Purchase details</SheetTitle>
						<SheetDescription>
							Detailed breakdown of the invoice issued to your business PIN.
						</SheetDescription>
					</SheetHeader>

					{displayPurchase && (
						<div className="mt-6 space-y-6 relative">
							{isFetchingDetails && (
								<div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center rounded-lg">
									<Spinner size={32} />
								</div>
							)}
							<div className="rounded-lg border p-4 space-y-3">
								<h4 className="text-sm font-medium">Invoice overview</h4>
								<dl className="grid grid-cols-2 gap-3 text-sm">
									<div>
										<dt className="text-muted-foreground text-xs">Supplier name</dt>
										<dd className="font-medium">{String(displayPurchase.supplier_name ?? "N/A")}</dd>
									</div>
									<div>
										<dt className="text-muted-foreground text-xs">Supplier TIN</dt>
										<dd className="font-medium">{String(displayPurchase.supplier_tin ?? "N/A")}</dd>
									</div>
									<div>
										<dt className="text-muted-foreground text-xs">Invoice number</dt>
										<dd className="font-medium">
											#{String(displayPurchase.supplier_invoice_number ?? displayPurchase.invoice_number ?? "-")}
										</dd>
									</div>
									<div>
										<dt className="text-muted-foreground text-xs">Purchase date</dt>
										<dd className="font-medium">{formatDigitaxDate(String(displayPurchase.purchase_date ?? ""))}</dd>
									</div>
								</dl>
							</div>

							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<h4 className="text-sm font-medium">Line items</h4>
									<Badge variant="outline">
										{(displayPurchase.item_list as unknown[] | undefined)?.length ?? 0} items
									</Badge>
								</div>
								<div className="space-y-2">
									{((displayPurchase.item_list as Array<Record<string, unknown>>) ?? []).map((item) => (
										<div key={String(item.id)} className="flex items-center justify-between rounded-lg border p-3 text-sm">
											<div>
												<p className="font-medium">{String(item.item_name ?? "Purchase item")}</p>
												<p className="text-xs text-muted-foreground">
													Qty: {String(item.quantity ?? "-")} · KES {Number(item.price ?? 0).toLocaleString()} per unit
												</p>
											</div>
											<span className="font-medium">{Number(item.supply_amount ?? 0).toLocaleString()} KES</span>
										</div>
									))}
								</div>
							</div>

							<div className="rounded-lg border bg-muted/30 p-4 flex justify-between items-center">
								<div>
									<p className="text-sm font-medium">Total payable</p>
									<p className="text-xs text-muted-foreground">Inclusive of applicable taxes</p>
								</div>
								<span className="text-lg font-semibold">
									{calculateTotal(displayPurchase.item_list as Array<{ supply_amount?: number }>).toLocaleString()} KES
								</span>
							</div>

							<SheetFooter className="border-t pt-4">
								<Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
									Close
								</Button>
							</SheetFooter>
						</div>
					)}
				</SheetContent>
			</Sheet>

			{!purchases.length ? (
				<DigitaxTableEmpty
					title="No purchase records found"
					description="Sync your dashboard with eTIMS to retrieve invoices issued to your business."
					action={
						<Button variant="outline" size="sm" onClick={() => refetch()}>
							Sync records
						</Button>
					}
				/>
			) : (
				<>
					<DigitaxListToolbar
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						searchPlaceholder="Search by vendor or invoice..."
						onRefresh={() => refetch()}
						isFetching={isFetching}
					/>
					<div className="mt-6">
						<DigitaxTableWrapper>
							<TableHeader>
								<TableRow>
									<TableHead className="pl-6">Supplier</TableHead>
									<TableHead>Invoice #</TableHead>
									<TableHead>Date</TableHead>
									<TableHead>Amount</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="w-12" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredPurchases.length === 0 ? (
									<DigitaxNoSearchResults colSpan={6} query={searchQuery} />
								) : (
									filteredPurchases.map((purchase) => {
										const status = String(purchase.purchase_status_code ?? "RECEIVED");
										const itemList = purchase.item_list as Array<{ supply_amount?: number }> | undefined;
										return (
											<TableRow key={String(purchase.id)}>
												<TableCell className="pl-6">
													<div className="flex flex-col">
														<span className="font-medium">
															{String(purchase.supplier_name ?? `Vendor #${String(purchase.id).slice(-6)}`)}
														</span>
														<span className="text-xs text-muted-foreground">
															PIN: {String(purchase.supplier_tin ?? "N/A")}
														</span>
													</div>
												</TableCell>
												<TableCell>
													{String(purchase.supplier_invoice_number ?? purchase.invoice_number ?? "-")}
												</TableCell>
												<TableCell>{formatDigitaxDate(String(purchase.purchase_date ?? ""))}</TableCell>
												<TableCell>{calculateTotal(itemList).toLocaleString()} KES</TableCell>
												<TableCell>
													<Badge variant="outline" className={getDigitaxStatusBadgeClass(status)}>
														{status}
													</Badge>
												</TableCell>
												<TableCell>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8"
														onClick={() => openDetails(purchase)}
													>
														<Eye className="h-4 w-4" />
														<span className="sr-only">View details</span>
													</Button>
												</TableCell>
											</TableRow>
										);
									})
								)}
							</TableBody>
						</DigitaxTableWrapper>
					</div>

					<p className="mt-4 text-xs text-muted-foreground">
						Purchases issued to your PIN by registered KRA vendors are mirrored here automatically for Input VAT reconciliation.
					</p>
				</>
			)}
		</DigitaxPageShell>
	);
}
