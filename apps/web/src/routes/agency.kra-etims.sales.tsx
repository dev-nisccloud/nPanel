"use client";

import * as React from "react";
import {
    FileText,
    Search,
    RefreshCw,
    CheckCircle2,
    MoreVertical,
    Eye,
    ExternalLink,
    FileMinus,
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    IssueETimsCreditNoteSheet,
    creditNoteReasonLabel,
    type EtimsSaleForCreditNote,
} from "./agency.kra-etims/sales/_components/issue-etims-credit-note-sheet";
import {
    normalizeSalesListItem,
    type EtimsSaleRecord,
} from "./agency.kra-etims/sales/_components/etims-sale-utils";
import { ViewETimsSaleSheet } from "./agency.kra-etims/sales/_components/view-etims-sale-sheet";
import { buildEtimsReceiptVerifyUrl, extractRcptSign } from "@/lib/etims-receipt-url";

export default function ETimsSalesPage() {
    const [activeTab, setActiveTab] = React.useState<"sales" | "credit-notes">("sales");
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedBhfId, setSelectedBhfId] = React.useState<string | null>(null);
    const [isSendOpen, setIsSendOpen] = React.useState(false);
    const [isCreditNoteOpen, setIsCreditNoteOpen] = React.useState(false);
    const [isCreditNoteConfirmOpen, setIsCreditNoteConfirmOpen] = React.useState(false);
    const [creditNoteConfirmTarget, setCreditNoteConfirmTarget] = React.useState<EtimsSaleForCreditNote | null | undefined>(undefined);
    const [isViewOpen, setIsViewOpen] = React.useState(false);
    const [viewingRecord, setViewingRecord] = React.useState<EtimsSaleRecord | null>(null);
    const [creditNoteSale, setCreditNoteSale] = React.useState<EtimsSaleForCreditNote | null>(null);
    const [salePayload, setSalePayload] = React.useState<string>("");
    const [ensureStock, setEnsureStock] = React.useState(false);
    const [custTinSearch, setCustTinSearch] = React.useState("");
    const [lookupTin, setLookupTin] = React.useState<string | null>(null);

    const utils = trpc.useUtils();

    const { data: etimsConfig } = trpc.etims.auth.getConfiguration.useQuery();
    const { data: branchesData } = trpc.etims.branch.getBranchList.useQuery({ lastReqDt: "20230101000000" });
    const { data: itemsData } = trpc.etims.items.getItemList.useQuery({
        lastReqDt: "20230101000000",
    });

    const { data: customerLookupData, isFetching: isSearchingCustomer } = trpc.etims.data.lookupCustomer.useQuery(
        { custmTin: lookupTin ?? "" },
        { enabled: !!lookupTin, retry: false }
    );

    const verifiedCustomer: any = React.useMemo(() => {
        const root: any = customerLookupData;
        if (root?.data?.custmNm) return root.data;
        const payload = root?.data?.responseBody?.data ?? root?.data ?? root?.responseBody?.data ?? root;
        const raw = payload?.data ?? payload;
        if (raw?.custmNm || raw?.custNm || raw?.taxprNm) {
            return {
                custmTin: raw.custmTin ?? raw.custTin ?? raw.tin,
                custmNm: raw.custmNm ?? raw.custNm ?? raw.taxprNm,
            };
        }
        return raw;
    }, [customerLookupData]);

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

        const invcNo = Math.floor(Math.random() * 900000) + 100000;
        return {
            trdInvcNo: `TINV${invcNo}`,
            invcNo,
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
        // KRA OSCU returns `salesList` from /selectTrnsSalesList; purchase search uses `saleList`
        const list = data?.salesList ?? data?.saleList ?? data?.itemList ?? [];
        return Array.isArray(list) ? list.map((item: Record<string, unknown>) => normalizeSalesListItem(item)) : [];
    }, [salesData]);

    const filterBySearch = React.useCallback((list: any[]) => {
        if (!searchQuery.trim()) return list;
        const query = searchQuery.toLowerCase().trim();
        return list.filter((inv: any) =>
            inv.invcNo.toString().toLowerCase().includes(query) ||
            inv.orgInvcNo?.toString().toLowerCase().includes(query) ||
            inv.custNm?.toLowerCase().includes(query) ||
            inv.displayKraRef?.toLowerCase().includes(query) ||
            inv.displayRcptNo?.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    const salesRecords = React.useMemo(
        () => filterBySearch(invoices.filter((inv: any) => inv.rcptTyCd !== "R")),
        [invoices, filterBySearch],
    );

    const creditNotes = React.useMemo(
        () => filterBySearch(invoices.filter((inv: any) => inv.rcptTyCd === "R")),
        [invoices, filterBySearch],
    );

    const creditableSales = React.useMemo((): EtimsSaleForCreditNote[] => {
        return invoices
            .filter((inv: any) => inv.rcptTyCd !== "R")
            .map((inv: any) => ({
                invcNo: inv.invcNo,
                custTin: inv.custTin,
                custNm: inv.custNm,
                pmtTyCd: inv.pmtTyCd,
                itemList: inv.itemList,
                displayAmount: inv.displayAmount,
            }));
    }, [invoices]);

    const toCreditNoteSale = React.useCallback((invoice: {
        invcNo: number;
        custTin?: string | null;
        custNm?: string | null;
        pmtTyCd?: string | null;
        itemList?: Array<Record<string, unknown>>;
        displayAmount?: number;
    }): EtimsSaleForCreditNote => ({
        invcNo: invoice.invcNo,
        custTin: invoice.custTin,
        custNm: invoice.custNm,
        pmtTyCd: invoice.pmtTyCd,
        itemList: invoice.itemList,
        displayAmount: invoice.displayAmount,
    }), []);

    const requestCreditNote = React.useCallback((invoice?: EtimsSaleForCreditNote | null) => {
        setCreditNoteConfirmTarget(invoice ?? null);
        setIsCreditNoteConfirmOpen(true);
    }, []);

    const confirmOpenCreditNote = React.useCallback(() => {
        setIsCreditNoteConfirmOpen(false);
        if (creditNoteConfirmTarget) {
            setCreditNoteSale(creditNoteConfirmTarget);
        } else {
            setCreditNoteSale(null);
        }
        setIsCreditNoteOpen(true);
        setCreditNoteConfirmTarget(undefined);
    }, [creditNoteConfirmTarget]);

    const openViewSale = React.useCallback((invoice: EtimsSaleRecord) => {
        setViewingRecord(invoice);
        setIsViewOpen(true);
    }, []);

    const openKraVerify = React.useCallback((invoice: Record<string, unknown>) => {
        const cfg = (etimsConfig as { config?: { kraPin?: string; branchId?: string; isSandbox?: boolean } })?.config;
        const rcptSign = extractRcptSign(invoice);
        const url = buildEtimsReceiptVerifyUrl({
            tin: cfg?.kraPin ?? "",
            bhfId: selectedBhfId ?? cfg?.branchId ?? "",
            rcptSign: rcptSign ?? "",
            isSandbox: cfg?.isSandbox,
        });
        if (!url) {
            toast.error("Receipt signature is missing  cannot open KRA verification link.");
            return;
        }
        window.open(url, "_blank", "noopener,noreferrer");
    }, [etimsConfig, selectedBhfId]);

    return (
        <ETimsInitializationGuard>
            <AlertDialog open={isCreditNoteConfirmOpen} onOpenChange={setIsCreditNoteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Issue credit note?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3 text-sm text-muted-foreground">
                                {creditNoteConfirmTarget ? (
                                    <>
                                        <p>
                                            You are about to issue a credit note against signed sale{" "}
                                            <span className="font-mono font-semibold text-foreground">
                                                #{creditNoteConfirmTarget.invcNo}
                                            </span>
                                            {creditNoteConfirmTarget.custNm ? (
                                                <>
                                                    {" "}for{" "}
                                                    <span className="font-semibold text-foreground">
                                                        {creditNoteConfirmTarget.custNm}
                                                    </span>
                                                </>
                                            ) : null}
                                            .
                                        </p>
                                        <p>
                                            Sale amount:{" "}
                                            <span className="font-semibold text-foreground">
                                                {Number(creditNoteConfirmTarget.displayAmount ?? 0).toLocaleString()} KES
                                            </span>
                                        </p>
                                    </>
                                ) : (
                                    <p>
                                        You are about to create a credit note against a signed sale. You will choose
                                        the original invoice, reason, and optional remark in the next step.
                                    </p>
                                )}
                                <p>
                                    Credit notes are submitted to KRA eTIMS as fiscal documents (
                                    <code className="text-xs">rcptTyCd=R</code>). Only proceed if you intend to reverse
                                    or adjust this sale on KRA.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmOpenCreditNote}>
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <IssueETimsCreditNoteSheet
                open={isCreditNoteOpen}
                onOpenChange={(open) => {
                    setIsCreditNoteOpen(open);
                    if (!open) setCreditNoteSale(null);
                }}
                sale={creditNoteSale}
                availableSales={creditableSales}
                onSuccess={() => {
                    refetch();
                    setActiveTab("credit-notes");
                }}
            />
            <ViewETimsSaleSheet
                open={isViewOpen}
                onOpenChange={(open) => {
                    setIsViewOpen(open);
                    if (!open) setViewingRecord(null);
                }}
                sale={viewingRecord}
                onVerifyKra={(record) => openKraVerify(record)}
                onIssueCreditNote={(record) => {
                    setIsViewOpen(false);
                    requestCreditNote(toCreditNoteSale(record));
                }}
            />
            <Sheet open={isSendOpen} onOpenChange={setIsSendOpen}>
                <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Send Sales Transaction</SheetTitle>
                        <SheetDescription>
                            Sends a sales transaction to KRA eTIMS using `/sendSalesTransaction`. Paste JSON matching the KRA sample request.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 space-y-6">
                        <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                                <Search className="h-3.5 w-3.5" />
                                CUSTOMER SEARCH
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter Customer TIN (e.g. A0123...)"
                                    value={custTinSearch}
                                    onChange={(e) => setCustTinSearch(e.target.value)}
                                    className="h-9 text-xs font-mono uppercase"
                                />
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setLookupTin(custTinSearch.toUpperCase())}
                                    disabled={isSearchingCustomer || !custTinSearch}
                                    className="h-9"
                                >
                                    {isSearchingCustomer ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Verify"}
                                </Button>
                            </div>
                            {verifiedCustomer?.custmNm && (
                                <div className="flex items-center justify-between p-2 rounded-lg bg-background border animate-in fade-in zoom-in-95 duration-200">
                                    <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-md bg-green-100 text-green-700 flex items-center justify-center">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold truncate max-w-[200px]">{verifiedCustomer.custmNm}</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">{verifiedCustomer.custmTin}</span>
                                        </div>
                                    </div>
                                    <Button
                                        size="xs"
                                        className="h-7 text-[10px] px-3"
                                        onClick={() => {
                                            try {
                                                const parsed = JSON.parse(salePayload);
                                                parsed.custTin = verifiedCustomer.custmTin;
                                                parsed.custNm = verifiedCustomer.custmNm;
                                                if (parsed.receipt) {
                                                    parsed.receipt.custTin = verifiedCustomer.custmTin;
                                                }
                                                setSalePayload(JSON.stringify(parsed, null, 2));
                                                toast.success("Customer data applied to payload");
                                            } catch {
                                                toast.error("Cannot apply: Invalid JSON in payload editor");
                                            }
                                        }}
                                    >
                                        Apply to Sale
                                    </Button>
                                </div>
                            )}
                        </div>
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
                        <h1 className="text-base font-semibold tracking-tight">KRA Sales Records</h1>
                        <p className="text-xs text-muted-foreground">
                            Manage signed sales and credit notes transmitted to KRA eTIMS.
                        </p>
                    </div>

                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "sales" | "credit-notes")} className="mt-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <TabsList>
                                <TabsTrigger value="sales">
                                    Sales
                                    {salesRecords.length > 0 ? (
                                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                                            {salesRecords.length}
                                        </Badge>
                                    ) : null}
                                </TabsTrigger>
                                <TabsTrigger value="credit-notes">
                                    Credit Notes
                                    {creditNotes.length > 0 ? (
                                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                                            {creditNotes.length}
                                        </Badge>
                                    ) : null}
                                </TabsTrigger>
                            </TabsList>

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
                                {activeTab === "sales" ? (
                                    <Button variant="outline" onClick={() => setIsSendOpen(true)}>
                                        Send Sale
                                    </Button>
                                ) : (
                                    <Button variant="outline" onClick={() => requestCreditNote(null)} disabled={!creditableSales.length}>
                                        <FileMinus className="mr-2 h-4 w-4" />
                                        Issue credit note
                                    </Button>
                                )}
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={activeTab === "sales" ? "Search invoice # or KRA ref..." : "Search credit note or original invoice..."}
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

                        <TabsContent value="sales" className="mt-6">
                            <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
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
                                        ) : salesRecords.length === 0 ? (
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
                                            salesRecords.map((invoice: any) => (
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
                                                        <div className="font-mono text-xs text-muted-foreground">
                                                            {invoice.displayKraRef ?? ""}
                                                        </div>
                                                        {invoice.displayRcptNo ? (
                                                            <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                                                                Receipt #{invoice.displayRcptNo}
                                                            </div>
                                                        ) : null}
                                                    </td>
                                                    <td className="px-4 py-4 text-muted-foreground">
                                                        {invoice.cfmDt
                                                            ? String(invoice.cfmDt).replace("T", " ").slice(0, 19)
                                                            : `${invoice.salesDt ?? ""} ${invoice.salesTime ?? ""}`.trim()}
                                                    </td>
                                                    <td className="px-4 py-4 font-medium">
                                                        {Number(invoice.displayAmount ?? 0).toLocaleString()} KES
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
                                                            SIGNED
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => requestCreditNote(toCreditNoteSale(invoice))}>
                                                                    <FileMinus className="mr-2 h-4 w-4" />
                                                                    Issue credit note
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => openViewSale(invoice)}>
                                                                    <Eye className="mr-2 h-4 w-4" /> View sale
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    disabled={!extractRcptSign(invoice)}
                                                                    onClick={() => openKraVerify(invoice)}
                                                                >
                                                                    <ExternalLink className="mr-2 h-4 w-4" /> Verify on KRA Portal
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>

                        <TabsContent value="credit-notes" className="mt-6">
                            <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                        <tr>
                                            <th className="px-4 py-3">Credit Note</th>
                                            <th className="px-4 py-3">Original Invoice</th>
                                            <th className="px-4 py-3">KRA Ref #</th>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Amount</th>
                                            <th className="px-4 py-3">Reason</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {isLoading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <tr key={i}>
                                                    <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                                                    <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                                                    <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                                                    <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                                                    <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
                                                    <td className="px-4 py-4"><Skeleton className="h-4 w-28" /></td>
                                                    <td className="px-4 py-4"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></td>
                                                </tr>
                                            ))
                                        ) : creditNotes.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-12 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <FileMinus className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                                        <h3 className="text-lg font-medium">No credit notes</h3>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            Issue a credit note against a signed sale, or create one manually.
                                                        </p>
                                                        <Button
                                                            variant="outline"
                                                            className="mt-4"
                                                            onClick={() => requestCreditNote(null)}
                                                            disabled={!creditableSales.length}
                                                        >
                                                            <FileMinus className="mr-2 h-4 w-4" />
                                                            Issue credit note
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            creditNotes.map((invoice: any) => (
                                                <tr key={invoice.invcNo} className="hover:bg-muted/30 transition-colors group">
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                                                                <FileMinus className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-foreground">{invoice.invcNo}</div>
                                                                <div className="text-xs text-muted-foreground">{invoice.custNm || "Cash Sale"}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="font-medium">#{invoice.orgInvcNo ?? ""}</div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="font-mono text-xs text-muted-foreground">
                                                            {invoice.displayKraRef ?? ""}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-muted-foreground">
                                                        {invoice.rfdDt
                                                            ? String(invoice.rfdDt).replace("T", " ").slice(0, 19)
                                                            : invoice.cfmDt
                                                                ? String(invoice.cfmDt).replace("T", " ").slice(0, 19)
                                                                : `${invoice.salesDt ?? ""}`.trim()}
                                                    </td>
                                                    <td className="px-4 py-4 font-medium">
                                                        {Number(invoice.displayAmount ?? 0).toLocaleString()} KES
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800">
                                                            {creditNoteReasonLabel(invoice.rfdRsnCd)}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => openViewSale(invoice)}>
                                                                    <Eye className="mr-2 h-4 w-4" /> View credit note
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    disabled={!extractRcptSign(invoice)}
                                                                    onClick={() => openKraVerify(invoice)}
                                                                >
                                                                    <ExternalLink className="mr-2 h-4 w-4" /> Verify on KRA Portal
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </ETimsInitializationGuard>
    );
}
