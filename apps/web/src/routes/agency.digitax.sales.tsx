"use client";

import * as React from "react";
import { Plus, MoreHorizontal, Download, Eye, QrCode, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RecordDigitaxSaleSheet } from "./agency.digitax/sales/_components/record-digitax-sale-sheet";
import { SaleDetailSheet } from "./agency.digitax/sales/_components/sale-detail-sheet";
import { DigitaxPageShell } from "./agency.digitax/_components/digitax-page-shell";
import { DigitaxListToolbar } from "./agency.digitax/_components/digitax-list-toolbar";
import {
	DigitaxTableSkeleton,
	DigitaxTableEmpty,
	DigitaxTableWrapper,
	DigitaxNoSearchResults,
} from "./agency.digitax/_components/digitax-table-states";
import { extractDigitaxArray, getDigitaxStatusBadgeClass } from "./agency.digitax/_components/digitax-utils";

export default function DigitaxSalesPage() {
	const [searchQuery, setSearchQuery] = React.useState("");
	const [isAddOpen, setIsAddOpen] = React.useState(false);
	const [selectedSaleId, setSelectedSaleId] = React.useState<string | null>(null);
	const [isDetailOpen, setIsDetailOpen] = React.useState(false);

	const { data: salesData, isLoading, refetch, isFetching } = trpc.digitax.sales.getAll.useQuery({
		page_size: 20,
	});

	const sales = React.useMemo(() => extractDigitaxArray<Record<string, unknown>>(salesData), [salesData]);

	const filteredSales = React.useMemo(() => {
		if (!searchQuery.trim()) return sales;
		const query = searchQuery.toLowerCase().trim();
		return sales.filter((s) =>
			String(s.trader_invoice_number ?? "").toLowerCase().includes(query) ||
			String(s.customer_name ?? "").toLowerCase().includes(query) ||
			String(s.serial_number ?? "").toLowerCase().includes(query) ||
			String(s.id ?? "").toLowerCase().includes(query)
		);
	}, [sales, searchQuery]);

	const handleViewSale = (saleId: string) => {
		setSelectedSaleId(saleId);
		setIsDetailOpen(true);
	};

	const columns = ["Serial #", "Invoice #", "Customer", "Date", "Amount", "Status"];

	if (isLoading) {
		return (
			<DigitaxPageShell
				title="Sales records"
				description="Manage and track eTIMS compliant sales transactions."
				action={
					<Button size="sm" disabled>
						<Plus className="mr-2 h-4 w-4" />
						Record sale
					</Button>
				}
			>
				<DigitaxTableSkeleton columns={columns} />
			</DigitaxPageShell>
		);
	}

	return (
		<DigitaxPageShell
			title="Sales records"
			description="Manage and track eTIMS compliant sales transactions."
			action={
				<Button size="sm" onClick={() => setIsAddOpen(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Record sale
				</Button>
			}
		>
			<RecordDigitaxSaleSheet
				open={isAddOpen}
				onOpenChange={setIsAddOpen}
				onSuccess={() => refetch()}
			/>

			<SaleDetailSheet
				saleId={selectedSaleId}
				open={isDetailOpen}
				onOpenChange={(open) => {
					setIsDetailOpen(open);
					if (!open) setSelectedSaleId(null);
				}}
			/>

			{!sales.length ? (
				<DigitaxTableEmpty
					title="No sales found"
					description="Sales will appear here once recorded via eTIMS."
					action={
						<Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
							Record sale
						</Button>
					}
				/>
			) : (
				<>
					<DigitaxListToolbar
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						searchPlaceholder="Search by invoice, customer, or serial..."
						onRefresh={() => refetch()}
						isFetching={isFetching}
					/>
					<div className="mt-6">
						<DigitaxTableWrapper>
							<TableHeader>
								<TableRow>
									<TableHead className="pl-6">Serial #</TableHead>
									<TableHead>Invoice #</TableHead>
									<TableHead>Customer</TableHead>
									<TableHead>Date</TableHead>
									<TableHead>Amount</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="w-12" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredSales.length === 0 ? (
									<DigitaxNoSearchResults colSpan={7} query={searchQuery} />
								) : (
									filteredSales.map((sale) => {
										const status = String(sale.status ?? "PENDING");
										const summary = sale.sales_tax_summary as { taxable_amount_b?: number; tax_amount_b?: number } | undefined;
										const totalAmount = (summary?.taxable_amount_b ?? 0) + (summary?.tax_amount_b ?? 0);
										return (
											<TableRow key={String(sale.id)} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewSale(String(sale.id))}>
												<TableCell className="pl-6 font-medium font-mono text-xs">
													{String(sale.serial_number ?? "-")}
												</TableCell>
												<TableCell className="font-medium">
													{String(sale.trader_invoice_number ?? "-")}
												</TableCell>
												<TableCell>
													<div className="flex flex-col">
														<span>{String(sale.customer_name ?? "Walk-in customer")}</span>
														<span className="text-xs text-muted-foreground">
															{String(sale.customer_tin ?? "No PIN")}
														</span>
													</div>
												</TableCell>
												<TableCell className="text-muted-foreground text-sm">
													{String(sale.date ?? "-")}
												</TableCell>
												<TableCell>
													{totalAmount.toLocaleString()} KES
												</TableCell>
												<TableCell>
													<Badge variant="outline" className={getDigitaxStatusBadgeClass(status)}>
														{status}
													</Badge>
												</TableCell>
												<TableCell onClick={(e) => e.stopPropagation()}>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant="ghost" size="icon" className="h-8 w-8">
																<MoreHorizontal className="h-4 w-4" />
																<span className="sr-only">Open menu</span>
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end" className="w-40">
															<DropdownMenuItem onSelect={() => handleViewSale(String(sale.id))}>
																<Eye className="mr-2 h-4 w-4" />
																View details
															</DropdownMenuItem>
															{sale.offline_url && (
																<DropdownMenuItem onSelect={() => window.open(String(sale.offline_url), "_blank")}>
																	<Download className="mr-2 h-4 w-4" />
																	Receipt
																</DropdownMenuItem>
															)}
															{sale.etims_url && (
																<DropdownMenuItem onSelect={() => window.open(String(sale.etims_url), "_blank")}>
																	<QrCode className="mr-2 h-4 w-4" />
																	Verify on KRA
																</DropdownMenuItem>
															)}
															{status === "COMPLETED" && (
																<>
																	<DropdownMenuSeparator />
																	<DropdownMenuItem className="text-destructive focus:text-destructive">
																		<FileWarning className="mr-2 h-4 w-4" />
																		Credit note
																	</DropdownMenuItem>
																</>
															)}
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										);
									})
								)}
							</TableBody>
						</DigitaxTableWrapper>
					</div>
				</>
			)}
		</DigitaxPageShell>
	);
}
