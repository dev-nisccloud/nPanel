"use client";

import * as React from "react";
import {
    FileText,
    Search,
    RefreshCw,
    QrCode,
    CheckCircle2,
    AlertCircle,
    MoreVertical,
    Download,
    Eye,
    ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ETimsInitializationGuard } from "@/components/etims/etims-initialization-guard";
import { ETimsBranchSwitcher } from "@/components/etims/etims-branch-switcher";
import { Textarea } from "@/components/ui/textarea";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/npanel-ui/sheet";

export default function ETimsSalesPage() {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedBhfId, setSelectedBhfId] = React.useState<string | null>(null);
    const [isSendOpen, setIsSendOpen] = React.useState(false);
    const [salePayload, setSalePayload] = React.useState<string>("");
    const [ensureStock, setEnsureStock] = React.useState(false);

    const utils = trpc.useUtils();

    const { data: etimsConfig } = trpc.etims.auth.getConfiguration.useQuery();
    const { data: branchesData } = trpc.etims.branch.getBranchList.useQuery({ lastReqDt: "20230101000000" });
    const { data: itemsData } = trpc.etims.items.getItemList.useQuery({
        lastReqDt: "20230101000000",
    });

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

    const itemOptions = React.useMemo(() => {
        const root: any = itemsData;
        const payload = root?.data?.responseBody?.data ?? root?.data ?? root?.responseBody?.data ?? root;
        const data: any = payload?.data ?? payload;
        const list = data?.itemList ?? data?.items ?? [];
        return Array.isArray(list) ? list : [];
    }, [itemsData]);

    const itemByCode = React.useMemo(() => {
        const map = new Map<string, any>();
        for (const it of itemOptions) {
            if (it?.itemCd) map.set(String(it.itemCd), it);
        }
        return map;
    }, [itemOptions]);

    const buildDefaultSalePayload = React.useCallback(() => {
        const cfg: any = (etimsConfig as any)?.config;
        const deviceBhfId = cfg?.branchId ?? selectedBhfId ?? "01";
        const branch = branches.find((b: any) => b.bhfId === deviceBhfId);

        const now = new Date();
        const yyyy = String(now.getFullYear());
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const HH = String(now.getHours()).padStart(2, "0");
        const MM = String(now.getMinutes()).padStart(2, "0");
        const SS = String(now.getSeconds()).padStart(2, "0");
        const salesDt = `${yyyy}${mm}${dd}`;
        const dt14 = `${yyyy}${mm}${dd}${HH}${MM}${SS}`;

        const branchItems = itemOptions.filter((x: any) => String(x?.regBhfId ?? "") === String(deviceBhfId));
        const fallbackItems = itemOptions.filter((x: any) => String(x?.regBhfId ?? "") === "00");
        const goodsBranch = branchItems.filter((x: any) => String(x?.itemTyCd ?? "") !== "3");
        const goodsFallback = fallbackItems.filter((x: any) => String(x?.itemTyCd ?? "") !== "3");
        // KRA SBX stock validations apply to goods; prefer a non-service item for sales tests.
        const pool =
            goodsBranch.length ? goodsBranch :
            goodsFallback.length ? goodsFallback :
            branchItems.length ? branchItems :
            fallbackItems.length ? fallbackItems :
            itemOptions;
        const pick = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;

        const itemCd = pick?.itemCd ?? "KE3OUXU0000001";
        const itemClsCd = pick?.itemClsCd ?? "81112100";
        const itemNm = pick?.itemNm ?? "Cloud & Digital Services";
        const pkgUnitCd = pick?.pkgUnitCd ?? "OU";
        const qtyUnitCd = pick?.qtyUnitCd ?? "U";
        const taxTyCd = pick?.taxTyCd ?? "B";
        const prc = Number(pick?.dftPrc ?? 0);
        const qty = 1;
        const splyAmt = prc * qty;
        const dcAmt = 0;
        const taxblAmt = splyAmt - dcAmt;
        const taxRatePct = taxTyCd === "B" ? 16 : 0;
        const taxAmt = Math.round((taxblAmt * taxRatePct) / 100);
        // Docs sample shows header totAmt equals total taxable amount (tax excluded).
        const lineTotAmt = taxblAmt;

        const totTaxblAmt = taxblAmt;
        const totTaxAmt = taxAmt;

        return {
            invcNo: Math.floor(Math.random() * 900000) + 100000,
            orgInvcNo: 0,
            custTin: "A016495079I",
            custNm: "FINEY OTIENO AKWOYO",
            salesTyCd: "N",
            rcptTyCd: "S",
            pmtTyCd: "01",
            salesSttsCd: "02",
            cfmDt: dt14,
            salesDt,
            stockRlsDt: dt14,
            totItemCnt: 1,
            taxblAmtA: 0,
            taxblAmtB: taxTyCd === "B" ? taxblAmt : 0,
            taxblAmtC: 0,
            taxblAmtD: 0,
            taxblAmtE: 0,
            taxRtA: 0,
            taxRtB: 16,
            taxRtC: 0,
            taxRtD: 0,
            taxRtE: 0,
            taxAmtA: 0,
            taxAmtB: taxTyCd === "B" ? taxAmt : 0,
            taxAmtC: 0,
            taxAmtD: 0,
            taxAmtE: 0,
            totTaxblAmt,
            totTaxAmt,
            totAmt: totTaxblAmt,
            prchrAcptcYn: "N",
            remark: "",
            regrId: "Admin",
            regrNm: "Admin",
            modrId: "Admin",
            modrNm: "Admin",
            receipt: {
                custTin: "A016495079I",
                rptNo: 1,
                rcptPbctDt: dt14,
                trdeNm: branch?.bhfNm ?? cfg?.mgrNm ?? "Nisc Cloud Limited",
                adrs: cfg?.prvncNm ?? "Nairobi",
                topMsg: "Shopwithus",
                btmMsg: "Welcome",
                prchrAcptcYn: "N",
            },
            itemList: [
                {
                    itemSeq: 1,
                    itemCd,
                    itemClsCd,
                    itemNm,
                    pkgUnitCd,
                    pkg: 1,
                    qtyUnitCd,
                    qty,
                    prc,
                    splyAmt,
                    dcRt: 0,
                    dcAmt,
                    taxTyCd,
                    taxblAmt,
                    taxAmt,
                    totAmt: lineTotAmt,
                },
            ],
        };
    }, [branches, etimsConfig, itemOptions, selectedBhfId]);

    React.useEffect(() => {
        if (!isSendOpen) return;
        setSalePayload((prev) => {
            if (prev?.trim()) return prev;
            return JSON.stringify(buildDefaultSalePayload(), null, 2);
        });
    }, [isSendOpen, buildDefaultSalePayload]);

    // Fetch eTIMS signed invoices from KRA
    // Fetch eTIMS signed invoices from KRA
    const { data: salesData, isLoading, refetch } = trpc.etims.sales.getSalesTransactions.useQuery({
        lastReqDt: "20230101000000",
    });

    const sendSale = trpc.etims.sales.sendSalesTransaction.useMutation({
        onSuccess: (res: any) => {
            if (res?.success === false) {
                toast.error(res?.errorMessage ?? "Failed to send sale");
                return;
            }
            const body = res?.data?.responseBody ?? res?.data ?? res;
            if (body?.resultCd && body.resultCd !== "000") {
                toast.error(body?.resultMsg ?? "Failed to send sale");
                return;
            }
            toast.success("Sale sent to KRA eTIMS");
            setIsSendOpen(false);
            refetch();
        },
        onError: (err) => {
            toast.error(err.message || "Failed to send sale");
        },
    });
    const saveStockMaster = trpc.etims.stock.saveStockMaster.useMutation();

    const invoices = React.useMemo(() => {
        // API shape is: { success: true, data: <kraResponse> }
        // And KRA may wrap response: { responseBody: { data: { ... } } }
        const root: any = salesData;
        const payload = root?.data?.responseBody?.data ?? root?.data ?? root?.responseBody?.data ?? root;
        const data: any = payload?.data ?? payload;
        // KRA implementations vary on list key naming
        return data?.saleList ?? data?.salesList ?? data?.itemList ?? [];
    }, [salesData]);

    const filteredInvoices = React.useMemo(() => {
        if (!searchQuery.trim()) return invoices;
        const query = searchQuery.toLowerCase().trim();
        return invoices.filter((inv: any) =>
            inv.invcNo.toString().toLowerCase().includes(query) ||
            inv.custNm?.toLowerCase().includes(query) ||
            inv.rcptNo?.toLowerCase().includes(query)
        );
    }, [invoices, searchQuery]);

    return (
        <ETimsInitializationGuard>
            <Sheet open={isSendOpen} onOpenChange={setIsSendOpen}>
                <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Send Sales Transaction</SheetTitle>
                        <SheetDescription>
                            Sends a sales transaction to KRA eTIMS using `/sendSalesTransaction`. Paste JSON matching the KRA sample request.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 space-y-3">
                        <Textarea
                            value={salePayload}
                            onChange={(e) => setSalePayload(e.target.value)}
                            className="min-h-[420px] font-mono text-xs"
                        />
                        <SheetFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => setIsSendOpen(false)} disabled={sendSale.isPending}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEnsureStock((v) => !v)}
                                disabled={sendSale.isPending || saveStockMaster.isPending}
                                title="If enabled, we will attempt to register the item in eTIMS stock master before sending the sale."
                            >
                                {ensureStock ? "Stock: Auto-add ON" : "Stock: Auto-add OFF"}
                            </Button>
                            <Button
                                type="button"
                                onClick={async () => {
                                    const deviceBhfId = (etimsConfig as any)?.config?.branchId;
                                    if (deviceBhfId && selectedBhfId && deviceBhfId !== selectedBhfId) {
                                        toast.error(`This device is only valid for branch ${deviceBhfId}.`);
                                        return;
                                    }
                                    try {
                                        const parsed = JSON.parse(salePayload);
                                        const firstItem = Array.isArray(parsed?.itemList) ? parsed.itemList[0] : null;
                                        const firstItemCd = firstItem?.itemCd ? String(firstItem.itemCd) : "";
                                        const firstMeta: any = firstItemCd ? itemByCode.get(firstItemCd) : null;
                                        const itemTyCd = String(firstMeta?.itemTyCd ?? "");

                                        if (ensureStock) {
                                            const itemCd = firstItem?.itemCd;
                                            const qty = Number(firstItem?.qty ?? 1);
                                            if (itemCd) {
                                                // Services (itemTyCd=3) cannot be stocked; skip auto-add.
                                                if (itemTyCd && itemTyCd !== "3") {
                                                    const res: any = await saveStockMaster.mutateAsync({
                                                        stockMaster: {
                                                            itemCd,
                                                            rsdQty: Number.isFinite(qty) && qty > 0 ? qty : 1,
                                                            regrId: "Admin",
                                                            regrNm: "Admin",
                                                            modrId: "Admin",
                                                            modrNm: "Admin",
                                                        },
                                                    });
                                                    if (res?.success === false) {
                                                        toast.error(res?.errorMessage ?? "Failed to add stock master");
                                                        return;
                                                    }
                                                } else {
                                                    toast.message("Stock auto-add skipped", {
                                                        description: "This item looks like a service (itemTyCd=3). KRA SBX rejects stocking services.",
                                                    });
                                                }
                                            }
                                        }
                                        sendSale.mutate({ transaction: parsed });
                                    } catch {
                                        toast.error("Invalid JSON. Please fix and try again.");
                                    }
                                }}
                                disabled={sendSale.isPending || saveStockMaster.isPending}
                            >
                                {sendSale.isPending || saveStockMaster.isPending ? (
                                    <>
                                        <Spinner size={16} className="mr-2" />
                                        Sending...
                                    </>
                                ) : (
                                    "Send to KRA"
                                )}
                            </Button>
                        </SheetFooter>
                    </div>
                </SheetContent>
            </Sheet>
            <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl font-semibold tracking-tight">KRA Sales Records</h1>
                        <p className="text-muted-foreground">
                            Manage and verify tax-signed invoices transmitted to KRA eTIMS.
                        </p>
                    </div>

                    <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-sm font-medium text-muted-foreground">Signed Invoices</div>
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
                            <Button variant="outline" onClick={() => setIsSendOpen(true)}>
                                Send Sale
                            </Button>
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search invoice # or KRA ref..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => refetch()}
                                disabled={isLoading}
                            >
                                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                            </Button>
                        </div>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-lg border bg-card shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                <tr>
                                    <th className="px-4 py-3">Invoice Details</th>
                                    <th className="px-4 py-3">KRA Ref #</th>
                                    <th className="px-4 py-3">Signed Date</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                                            <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                                            <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                                            <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
                                            <td className="px-4 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                                            <td className="px-4 py-4"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></td>
                                        </tr>
                                    ))
                                ) : filteredInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <CheckCircle2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                                <h3 className="text-lg font-medium">No signed invoices</h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Invoices signed via eTIMS will appear here.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInvoices.map((invoice: any) => (
                                        <tr key={invoice.invcNo} className="hover:bg-muted/30 transition-colors group">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-foreground">{invoice.invcNo}</div>
                                                        <div className="text-xs text-muted-foreground">{invoice.custNm || "Cash Sale"}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-mono text-xs text-muted-foreground">{invoice.rcptNo || "Pending"}</div>
                                            </td>
                                            <td className="px-4 py-4 text-muted-foreground">
                                                {invoice.salesDt} {invoice.salesTime}
                                            </td>
                                            <td className="px-4 py-4 font-medium">
                                                {invoice.totAmt.toLocaleString()} KES
                                            </td>
                                            <td className="px-4 py-4">
                                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
                                                    SIGNED
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" title="View QR Code">
                                                        <QrCode className="h-4 w-4" />
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View Invoice</DropdownMenuItem>
                                                            <DropdownMenuItem><Download className="mr-2 h-4 w-4" /> Download PDF</DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem><ExternalLink className="mr-2 h-4 w-4" /> Verify on KRA Portal</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </ETimsInitializationGuard>
    );
}
