"use client";

import * as React from "react";
import {
	ShoppingCart,
	Search,
	RefreshCw,
	User,
	Calendar,
	MoreVertical,
	Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { ETimsInitializationGuard } from "@/components/etims/etims-initialization-guard";
import { ETimsBranchSwitcher } from "@/components/etims/etims-branch-switcher";
import { toast } from "@/components/ui/sonner";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmETimsPurchaseSheet } from "./agency.kra-etims/purchases/_components/confirm-etims-purchase-sheet";
import { ViewETimsPurchaseSheet } from "./agency.kra-etims/purchases/_components/view-etims-purchase-sheet";
import { formatMoney, formatSalesDate } from "./agency.kra-etims/sales/_components/etims-sale-utils";
import { unwrapKraList } from "./agency.kra-etims/_lib/etims-kra";

function vendorPin(purchase: Record<string, unknown>) {
	return String(purchase.spplrTin ?? purchase.sPin ?? purchase.tin ?? "");
}

function vendorName(purchase: Record<string, unknown>) {
	return String(purchase.spplrNm ?? purchase.sNm ?? purchase.taxprNm ?? "");
}

function vendorInvc(purchase: Record<string, unknown>) {
	return String(purchase.spplrInvcNo ?? purchase.invcNo ?? "-");
}

function purchaseDate(purchase: Record<string, unknown>) {
	return String(purchase.salesDt ?? purchase.pchsDt ?? "");
}

export default function ETimsPurchasesPage() {
	const [searchQuery, setSearchQuery] = React.useState("");
	const [selectedBhfId, setSelectedBhfId] = React.useState<string | null>(null);
	const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
	const [isViewOpen, setIsViewOpen] = React.useState(false);
	const [activePurchase, setActivePurchase] = React.useState<Record<string, unknown> | null>(null);

	const { data: etimsConfig } = trpc.etims.auth.getConfiguration.useQuery();
	const { data: branchesData } = trpc.etims.branch.getBranchList.useQuery({ lastReqDt: "20230101000000" });

	const branches = React.useMemo(() => {
		const root: any = branchesData;
		const payload = root?.data?.responseBody?.data ?? root?.data ?? root?.responseBody?.data ?? root;
		const data: any = payload?.data ?? payload;
		const bhfList = data?.bhfList ?? [];
		return bhfList.map((b: any) => ({ bhfId: b.bhfId, bhfNm: b.bhfNm }));
	}, [branchesData]);

	React.useEffect(() => {
		if (selectedBhfId) return;
		const defaultBhfId = (etimsConfig as any)?.config?.branchId;
		if (defaultBhfId) setSelectedBhfId(defaultBhfId);
		else if (branches.length) setSelectedBhfId(branches[0].bhfId);
	}, [selectedBhfId, etimsConfig, branches]);

	const { data: purchasesData, isLoading, refetch } = trpc.etims.purchases.getPurchaseTransactions.useQuery({
		lastReqDt: "20230101000000",
	});

	const purchases = React.useMemo(() => {
		return unwrapKraList(purchasesData, "saleList", "purchaseList", "itemList");
	}, [purchasesData]);

	const filtered = React.useMemo(() => {
		if (!searchQuery.trim()) return purchases;
		const q = searchQuery.toLowerCase().trim();
		return purchases.filter((purchase) =>
			[vendorPin(purchase), vendorName(purchase), vendorInvc(purchase)]
				.map((v) => v.toLowerCase())
				.some((v) => v.includes(q)),
		);
	}, [purchases, searchQuery]);

	const openConfirm = (purchase?: Record<string, unknown> | null) => {
		setActivePurchase(purchase ?? null);
		setIsViewOpen(false);
		setIsConfirmOpen(true);
	};

	const openView = (purchase: Record<string, unknown>) => {
		setActivePurchase(purchase);
		setIsViewOpen(true);
	};

	return (
		<ETimsInitializationGuard>
			<ConfirmETimsPurchaseSheet
				key={activePurchase ? `${vendorPin(activePurchase)}-${vendorInvc(activePurchase)}` : "manual"}
				open={isConfirmOpen}
				onOpenChange={(open) => {
					setIsConfirmOpen(open);
					if (!open) setActivePurchase(null);
				}}
				onSuccess={() => refetch()}
				mirrored={activePurchase}
			/>
			<ViewETimsPurchaseSheet
				open={isViewOpen}
				onOpenChange={(open) => {
					setIsViewOpen(open);
					if (!open) setActivePurchase(null);
				}}
				purchase={activePurchase}
				onConfirm={(purchase) => openConfirm(purchase)}
			/>
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto">
					<div className="flex flex-col gap-2">
						<h1 className="text-base font-semibold tracking-tight">Purchase Reconciliation</h1>
						<p className="text-xs text-muted-foreground">
							Supplier invoices mirrored against your PIN. Confirm them with KRA using VAT-inclusive amounts — not JSON paste.
						</p>
					</div>

					<div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
						<div className="relative flex-1 max-w-sm w-full">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search by vendor PIN or invoice #..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
						</div>
						<div className="flex items-center gap-2 w-full md:w-auto">
							{selectedBhfId && branches.length ? (
								<ETimsBranchSwitcher
									branches={branches}
									value={selectedBhfId}
									onChange={(bhfId) => {
										const deviceBhfId = (etimsConfig as any)?.config?.branchId;
										if (deviceBhfId && bhfId !== deviceBhfId) {
											toast.error(`This device is only valid for branch ${deviceBhfId}. Re-initialize eTIMS for branch ${bhfId} to use it.`);
											return;
										}
										setSelectedBhfId(bhfId);
										setTimeout(() => refetch(), 0);
									}}
								/>
							) : null}
							<Button variant="outline" onClick={() => openConfirm(null)}>
								Confirm Purchase
							</Button>
							<Button onClick={() => refetch()} disabled={isLoading}>
								<RefreshCw className="mr-2 h-4 w-4" />
								Sync Purchases
							</Button>
						</div>
					</div>

					<div className="mt-6">
						<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
							<table className="w-full text-sm text-left">
								<thead className="bg-muted/50 text-muted-foreground font-medium border-b">
									<tr>
										<th className="px-4 py-3">Vendor Information</th>
										<th className="px-4 py-3">Invoice #</th>
										<th className="px-4 py-3">Date</th>
										<th className="px-4 py-3">Amount (Incl. Tax)</th>
										<th className="px-4 py-3">Type</th>
										<th className="px-4 py-3 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{isLoading ? (
										Array.from({ length: 3 }).map((_, i) => (
											<tr key={i}>
												<td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
												<td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
												<td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
												<td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
												<td className="px-4 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
												<td className="px-4 py-4"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></td>
											</tr>
										))
									) : filtered.length === 0 ? (
										<tr>
											<td colSpan={6} className="px-4 py-12 text-center">
												<div className="flex flex-col items-center justify-center py-8">
													<div className="p-4 rounded-full bg-muted/50 mb-4 text-muted-foreground/50">
														<ShoppingCart className="h-10 w-10" />
													</div>
													<h3 className="text-lg font-medium">No purchase records found</h3>
													<p className="text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-6">
														KRA returned no supplier invoices registered against your PIN yet.
														Purchases appear here when a vendor submits an eTIMS sale with your PIN as the buyer — not from sales you issue yourself.
													</p>
													<div className="flex gap-2">
														<Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
															<RefreshCw className="mr-2 h-3 w-3" />
															Fetch Recent Purchases
														</Button>
														<Button size="sm" onClick={() => openConfirm(null)}>
															Confirm Purchase
														</Button>
													</div>
												</div>
											</td>
										</tr>
									) : (
										filtered.map((purchase, index) => {
											const pin = vendorPin(purchase);
											const name = vendorName(purchase);
											const invc = vendorInvc(purchase);
											const date = purchaseDate(purchase);
											const confirmed = Boolean(purchase.pchsDt || purchase.cfmDt);
											return (
												<tr key={`${pin}-${invc}-${index}`} className="hover:bg-muted/30 transition-colors group">
													<td className="px-4 py-4">
														<div className="flex items-center gap-3">
															<div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
																<User className="h-4 w-4" />
															</div>
															<div>
																<div className="font-medium text-foreground">{name || "Unknown Supplier"}</div>
																<div className="text-xs font-mono text-muted-foreground">{pin || "—"}</div>
															</div>
														</div>
													</td>
													<td className="px-4 py-4 font-mono font-medium">{invc}</td>
													<td className="px-4 py-4">
														<div className="flex items-center gap-2 text-muted-foreground">
															<Calendar className="h-4 w-4" />
															{formatSalesDate(date) || date || "-"}
														</div>
													</td>
													<td className="px-4 py-4 font-bold text-foreground">
														{formatMoney(Number(purchase.totAmt ?? 0))}
													</td>
													<td className="px-4 py-4">
														<Badge variant={confirmed ? "outline" : "secondary"}>
															{confirmed ? "CONFIRMED" : "MIRRORED"}
														</Badge>
													</td>
													<td className="px-4 py-4 text-right">
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<Button variant="ghost" size="icon" className="h-8 w-8">
																	<MoreVertical className="h-4 w-4" />
																</Button>
															</DropdownMenuTrigger>
															<DropdownMenuContent align="end">
																<DropdownMenuItem onClick={() => openView(purchase)}>
																	<Eye className="mr-2 h-4 w-4" />
																	View
																</DropdownMenuItem>
																<DropdownMenuItem onClick={() => openConfirm(purchase)}>
																	Confirm with KRA
																</DropdownMenuItem>
															</DropdownMenuContent>
														</DropdownMenu>
													</td>
												</tr>
											);
										})
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</ETimsInitializationGuard>
	);
}
