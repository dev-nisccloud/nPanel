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
    Download,
    Loader2,
    Copy,
    Split,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SendETimsSaleSheet, type SaleSheetPrefill } from "./agency.kra-etims/sales/_components/send-etims-sale-sheet";
import { buildCopyReceiptPayload } from "./agency.kra-etims/sales/_components/build-etims-copy-receipt";
import {
    mergeEtimsSaleWithDetails,
    unwrapEtimsInvoiceDetails,
} from "@npanel/api/agency-invoice-pdf/etims-sale-to-invoice-detail";
import { kraResultError, parseExpectedInvcNo } from "./agency.kra-etims/_lib/etims-kra";
import {
    IssueETimsCreditNoteSheet,
    creditNoteReasonLabel,
    type EtimsSaleForCreditNote,
} from "./agency.kra-etims/sales/_components/issue-etims-credit-note-sheet";
import {
    compareKraNewestFirst,
    formatSaleTableDateTime,
    isCopyReceipt,
    isCreditNote,
    normalizeSalesListItem,
    type EtimsSaleRecord,
} from "./agency.kra-etims/sales/_components/etims-sale-utils";
import { nextInvcNo } from "./agency.kra-etims/_lib/etims-kra";
import { ViewETimsSaleSheet } from "./agency.kra-etims/sales/_components/view-etims-sale-sheet";
import { useEtimsReceiptDownload } from "./agency.kra-etims/sales/_components/download-etims-receipt";
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
    const [salePrefill, setSalePrefill] = React.useState<SaleSheetPrefill | null>(null);
    const [copyTarget, setCopyTarget] = React.useState<EtimsSaleRecord | null>(null);
    const [copyingInvcNo, setCopyingInvcNo] = React.useState<number | null>(null);

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

    const { data: salesData, isLoading, refetch } = trpc.etims.sales.getSalesTransactions.useQuery({
        lastReqDt: "20230101000000",
    });

    const invoices = React.useMemo(() => {
        // API shape is: { success: true, data: <kraResponse> }
        // And KRA may wrap response: { responseBody: { data: { ... } } }
        const root: any = salesData;
        const payload = root?.data?.responseBody?.data ?? root?.data ?? root?.responseBody?.data ?? root;
        const data: any = payload?.data ?? payload;
        // KRA OSCU returns `salesList` from /selectTrnsSalesList; purchase search uses `saleList`
        const list = data?.salesList ?? data?.saleList ?? data?.itemList ?? [];
        const items = Array.isArray(list)
            ? list.map((item: Record<string, unknown>) => normalizeSalesListItem(item))
            : [];
        return items.sort(compareKraNewestFirst);
    }, [salesData]);

    const etimsCfg = (etimsConfig as { config?: { kraPin?: string; branchId?: string; isSandbox?: boolean; sdcId?: string | null } } | undefined)?.config;
    const { download: downloadReceipt, downloadingInvcNo } = useEtimsReceiptDownload({
        kraPin: etimsCfg?.kraPin,
        branchId: selectedBhfId ?? etimsCfg?.branchId,
        isSandbox: etimsCfg?.isSandbox,
        sdcId: etimsCfg?.sdcId,
        salesList: invoices,
    });

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

    const { data: openPartials } = trpc.etims.sales.listOpenPartials.useQuery();
    const openPartialSeeds = React.useMemo(() => {
        return new Set((openPartials?.seeds ?? []).map((row) => row.seedInvcNo));
    }, [openPartials]);

    const creditableSales = React.useMemo((): EtimsSaleForCreditNote[] => {
        return invoices
            .filter((inv: any) => inv.rcptTyCd !== "R" && !isCopyReceipt(inv))
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

    const utils = trpc.useUtils();
    const sendCopyReceipt = trpc.etims.sales.sendCopyReceipt.useMutation();

    const resolveSaleLines = React.useCallback(async (source: EtimsSaleRecord): Promise<EtimsSaleRecord> => {
        if (Array.isArray(source.itemList) && source.itemList.length > 0) return source;
        try {
            const detailsRes = await utils.etims.sales.getInvoiceDetails.fetch({ invcNo: source.invcNo });
            return mergeEtimsSaleWithDetails(source, unwrapEtimsInvoiceDetails(detailsRes)) as EtimsSaleRecord;
        } catch {
            return source;
        }
    }, [utils]);

    const issueCopyReceipt = React.useCallback(async (sale: EtimsSaleRecord) => {
        if (isCopyReceipt(sale)) {
            toast.error("This record is already a copy receipt.");
            return;
        }
        setCopyingInvcNo(sale.invcNo);
        try {
            const resolved = await resolveSaleLines(sale);
            if (!Array.isArray(resolved.itemList) || resolved.itemList.length === 0) {
                toast.error("KRA did not return line items for this invoice, so a copy cannot be issued.");
                return;
            }
            let invcNo = nextInvcNo(invoices);
            for (let attempt = 0; attempt < 4; attempt++) {
                const res = await sendCopyReceipt.mutateAsync({
                    transaction: buildCopyReceiptPayload(resolved, invcNo),
                });
                const err = res?.success === false
                    ? (res.errorMessage ?? "Failed to issue copy receipt")
                    : kraResultError(res);
                if (!err) {
                    toast.success("Copy receipt sent to KRA");
                    await refetch();
                    const copyRow = {
                        ...resolved,
                        ...((res as { data?: Record<string, unknown> })?.data ?? {}),
                        invcNo,
                        orgInvcNo: sale.invcNo,
                        salesTyCd: "C",
                        rcptTyCd: isCreditNote(sale) ? "R" : "S",
                        stockRlsDt: null,
                    } as EtimsSaleRecord;
                    await downloadReceipt(copyRow);
                    return;
                }
                const expected = parseExpectedInvcNo(err);
                if (expected && expected !== invcNo) {
                    invcNo = expected;
                    toast.message(`KRA expected invoice ${expected}. Retrying…`);
                    continue;
                }
                toast.error(err);
                return;
            }
            toast.error("Could not allocate the next KRA invoice number");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to issue copy receipt");
        } finally {
            setCopyingInvcNo(null);
            setCopyTarget(null);
        }
    }, [downloadReceipt, invoices, refetch, resolveSaleLines, sendCopyReceipt]);

    const openRemainingInvoice = React.useCallback(async (sale: EtimsSaleRecord) => {
        try {
            const remaining = await utils.etims.sales.getPartialRemaining.fetch({ seedInvcNo: sale.invcNo });
            const leftover = remaining.lines.filter((line) => line.remainingQty > 0);
            if (!leftover.length) {
                toast.error("There is no remaining quantity to invoice for this sale.");
                return;
            }
            setSalePrefill({
                mode: "remaining",
                seedInvcNo: sale.invcNo,
                trdInvcNo: remaining.trdInvcNo ?? `TINV${nextInvcNo(invoices)}`,
                custTin: remaining.custTin ?? sale.custTin ?? "",
                custNm: remaining.custNm ?? sale.custNm ?? "",
                pmtTyCd: remaining.pmtTyCd ?? sale.pmtTyCd ?? "01",
                lines: leftover.map((line) => ({
                    itemCd: line.itemCd,
                    itemNm: line.itemNm,
                    itemClsCd: line.itemClsCd ?? "",
                    pkgUnitCd: line.pkgUnitCd ?? "OU",
                    qtyUnitCd: line.qtyUnitCd ?? "NO",
                    taxTyCd: (["A", "B", "C", "D", "E"].includes(String(line.taxTyCd))
                        ? line.taxTyCd
                        : "B") as SaleSheetPrefill["lines"][number]["taxTyCd"],
                    qty: line.remainingQty,
                    inclusivePrc: line.inclusivePrc,
                    dcRt: line.dcRt,
                    maxQty: line.remainingQty,
                    orderedQty: line.orderedQty,
                })),
            });
            setIsSendOpen(true);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to load remaining quantity");
        }
    }, [invoices, utils]);

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
                        <AlertDialogDescription>
                            {creditNoteConfirmTarget
                                ? `Reverse invoice #${creditNoteConfirmTarget.invcNo}${creditNoteConfirmTarget.custNm ? ` for ${creditNoteConfirmTarget.custNm}` : ""}. You will pick a reason next.`
                                : "You will choose the original invoice and reason next."}
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
                nextInvcNo={nextInvcNo(invoices)}
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
                downloading={viewingRecord != null && downloadingInvcNo === viewingRecord.invcNo}
                onDownload={(record) => downloadReceipt(record)}
                onIssueCopy={(record) => {
                    setIsViewOpen(false);
                    setCopyTarget(record);
                }}
                onIssueCreditNote={(record) => {
                    setIsViewOpen(false);
                    requestCreditNote(toCreditNoteSale(record));
                }}
            />
            <AlertDialog open={!!copyTarget} onOpenChange={(open) => { if (!open) setCopyTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Issue copy receipt?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {copyTarget
                                ? `Issue a copy of invoice #${copyTarget.invcNo}.`
                                : "Issue a copy of this invoice."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={copyingInvcNo != null}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={copyingInvcNo != null || !copyTarget}
                            onClick={(e) => {
                                e.preventDefault();
                                if (!copyTarget) return;
                                void issueCopyReceipt(copyTarget);
                            }}
                        >
                            {copyingInvcNo != null ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Issuing…
                                </>
                            ) : (
                                "Issue copy"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <SendETimsSaleSheet
                open={isSendOpen}
                onOpenChange={(open) => {
                    setIsSendOpen(open);
                    if (!open) setSalePrefill(null);
                }}
                prefill={salePrefill}
                onSuccess={() => {
                    refetch();
                    void utils.etims.sales.listOpenPartials.invalidate();
                }}
            />
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
                                                                <div className="flex items-center gap-2">
                                                                    <div className="font-medium text-foreground">{invoice.invcNo}</div>
                                                                    {isCopyReceipt(invoice) ? (
                                                                        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">COPY</Badge>
                                                                    ) : null}
                                                                    {openPartialSeeds.has(invoice.invcNo) ? (
                                                                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">Partial</Badge>
                                                                    ) : null}
                                                                </div>
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
                                                    <td className="px-4 py-4 text-xs text-muted-foreground whitespace-normal max-w-[260px]">
                                                        {formatSaleTableDateTime(invoice) || "-"}
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
                                                                <DropdownMenuItem
                                                                    disabled={downloadingInvcNo === invoice.invcNo}
                                                                    onClick={() => downloadReceipt(invoice)}
                                                                >
                                                                    {downloadingInvcNo === invoice.invcNo ? (
                                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <Download className="mr-2 h-4 w-4" />
                                                                    )}
                                                                    Download invoice
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    disabled={isCopyReceipt(invoice) || copyingInvcNo === invoice.invcNo}
                                                                    onClick={() => setCopyTarget(invoice)}
                                                                >
                                                                    <Copy className="mr-2 h-4 w-4" />
                                                                    Issue copy receipt
                                                                </DropdownMenuItem>
                                                                {openPartialSeeds.has(invoice.invcNo) ? (
                                                                    <DropdownMenuItem onClick={() => void openRemainingInvoice(invoice)}>
                                                                        <Split className="mr-2 h-4 w-4" />
                                                                        Invoice remaining
                                                                    </DropdownMenuItem>
                                                                ) : null}
                                                                {!isCopyReceipt(invoice) ? (
                                                                    <DropdownMenuItem onClick={() => requestCreditNote(toCreditNoteSale(invoice))}>
                                                                        <FileMinus className="mr-2 h-4 w-4" />
                                                                        Issue credit note
                                                                    </DropdownMenuItem>
                                                                ) : null}
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
                                                                <div className="flex items-center gap-2">
                                                                    <div className="font-medium text-foreground">{invoice.invcNo}</div>
                                                                    {isCopyReceipt(invoice) ? (
                                                                        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">COPY</Badge>
                                                                    ) : null}
                                                                </div>
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
                                                    <td className="px-4 py-4 text-xs text-muted-foreground whitespace-normal max-w-[260px]">
                                                        {formatSaleTableDateTime(invoice) || "-"}
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
                                                                <DropdownMenuItem
                                                                    disabled={downloadingInvcNo === invoice.invcNo}
                                                                    onClick={() => downloadReceipt(invoice)}
                                                                >
                                                                    {downloadingInvcNo === invoice.invcNo ? (
                                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <Download className="mr-2 h-4 w-4" />
                                                                    )}
                                                                    Download credit note
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    disabled={isCopyReceipt(invoice) || copyingInvcNo === invoice.invcNo}
                                                                    onClick={() => setCopyTarget(invoice)}
                                                                >
                                                                    <Copy className="mr-2 h-4 w-4" />
                                                                    Issue copy receipt
                                                                </DropdownMenuItem>
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
