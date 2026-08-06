"use client";

import { captureEvent } from "@/lib/posthog";

import * as React from "react";
import {
    ShoppingCart,
    Search,
    RefreshCw,
    Download,
    Filter,
    ArrowDownLeft,
    ChevronRight,
    User,
    Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { ETimsInitializationGuard } from "@/components/etims/etims-initialization-guard";
import { ETimsBranchSwitcher } from "@/components/etims/etims-branch-switcher";
import { toast } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export default function ETimsPurchasesPage() {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedBhfId, setSelectedBhfId] = React.useState<string | null>(null);
    const [isSendOpen, setIsSendOpen] = React.useState(false);
    const [purchasePayload, setPurchasePayload] = React.useState<string>("");

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

    const sendPurchase = trpc.etims.purchases.sendPurchaseTransaction.useMutation({
        onSuccess: (res: any) => {
            if (res?.success === false) {
                toast.error(res?.errorMessage ?? "Failed to send purchase transaction");
                return;
            }
            const body = res?.data?.responseBody ?? res?.data ?? res;
            if (body?.resultCd && body.resultCd !== "000") {
                toast.error(body?.resultMsg ?? "Failed to send purchase transaction");
                return;
            }
            captureEvent("etims_purchase_recorded", { has_vat: true });
            toast.success("Purchase transaction sent to KRA eTIMS");
            setIsSendOpen(false);
            refetch();
        },
        onError: (err) => toast.error(err.message || "Failed to send purchase transaction"),
    });

    const purchases = React.useMemo(() => {
        // API shape is: { success: true, data: <kraResponse> }
        // And KRA may wrap response: { responseBody: { data: { ... } } }
        const root: any = purchasesData;
        const payload = root?.data?.responseBody?.data ?? root?.data ?? root?.responseBody?.data ?? root;
        const data: any = payload?.data ?? payload;
        // KRA tends to return saleList for purchases mirroring (per docs), but keep fallbacks.
        return data?.saleList ?? data?.purchaseList ?? data?.itemList ?? [];
    }, [purchasesData]);

    const buildDefaultPurchasePayload = React.useCallback(() => {
        const now = new Date();
        const yyyy = String(now.getFullYear());
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const HH = String(now.getHours()).padStart(2, "0");
        const MM = String(now.getMinutes()).padStart(2, "0");
        const SS = String(now.getSeconds()).padStart(2, "0");
        const pchsDt = `${yyyy}${mm}${dd}`;
        const dt14 = `${yyyy}${mm}${dd}${HH}${MM}${SS}`;

        const taxblAmtB = 5000;
        const taxRtB = 16;
        const taxAmtB = Number(((taxblAmtB * taxRtB) / 100).toFixed(2));

        return {
            invcNo: Math.floor(Math.random() * 900000) + 100000,
            orgInvcNo: 0,
            spplrTin: "",
            spplrBhfId: "",
            spplrNm: "",
            spplrInvcNo: "",
            regTyCd: "M",
            pchsTyCd: "N",
            rcptTyCd: "P",
            pmtTyCd: "01",
            pchsSttsCd: "02",
            cfmDt: dt14,
            pchsDt,
            wrhsDt: "",
            cnclReqDt: "",
            cnclDt: "",
            rfdDt: "",
            totItemCnt: 1,
            taxblAmtA: 0,
            taxblAmtB,
            taxblAmtC: 0,
            taxblAmtD: 0,
            taxblAmtE: 0,
            taxRtA: 0,
            taxRtB,
            taxRtC: 0,
            taxRtD: 0,
            taxRtE: 0,
            taxAmtA: 0,
            taxAmtB,
            taxAmtC: 0,
            taxAmtD: 0,
            taxAmtE: 0,
            totTaxblAmt: taxblAmtB,
            totTaxAmt: taxAmtB,
            totAmt: taxblAmtB,
            remark: "",
            regrNm: "Admin",
            regrId: "Admin",
            modrNm: "Admin",
            modrId: "Admin",
            itemList: [
                {
                    itemSeq: 1,
                    itemCd: "",
                    itemClsCd: "",
                    itemNm: "",
                    bcd: "",
                    spplrItemClsCd: "",
                    spplrItemCd: "",
                    spplrItemNm: "",
                    pkgUnitCd: "",
                    pkg: 0,
                    qtyUnitCd: "",
                    qty: 1,
                    prc: taxblAmtB,
                    splyAmt: taxblAmtB,
                    dcRt: 0,
                    dcAmt: 0,
                    taxblAmt: taxblAmtB,
                    taxTyCd: "B",
                    taxAmt: taxAmtB,
                    totAmt: taxblAmtB,
                    itemExprDt: "",
                },
            ],
        };
    }, []);

    React.useEffect(() => {
        if (!isSendOpen) return;
        setPurchasePayload((prev) => {
            if (prev?.trim()) return prev;
            return JSON.stringify(buildDefaultPurchasePayload(), null, 2);
        });
    }, [isSendOpen, buildDefaultPurchasePayload]);

    return (
        <ETimsInitializationGuard>
            <Sheet open={isSendOpen} onOpenChange={setIsSendOpen}>
                <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Send Purchase Transaction</SheetTitle>
                        <SheetDescription>
                            Confirms a purchase transaction to KRA eTIMS using `/sendPurchaseTransactionInfo`. Paste JSON matching the KRA sample request.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-3">
                        <Textarea
                            value={purchasePayload}
                            onChange={(e) => setPurchasePayload(e.target.value)}
                            className="min-h-[420px] font-mono text-xs"
                        />
                        <SheetFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => setIsSendOpen(false)} disabled={sendPurchase.isPending}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    const deviceBhfId = (etimsConfig as any)?.config?.branchId;
                                    if (deviceBhfId && selectedBhfId && deviceBhfId !== selectedBhfId) {
                                        toast.error(`This device is only valid for branch ${deviceBhfId}.`);
                                        return;
                                    }
                                    try {
                                        const parsed = JSON.parse(purchasePayload);
                                        sendPurchase.mutate({ purchase: parsed });
                                    } catch {
                                        toast.error("Invalid JSON. Please fix and try again.");
                                    }
                                }}
                                disabled={sendPurchase.isPending}
                            >
                                {sendPurchase.isPending ? (
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
                        <h1 className="text-base font-semibold tracking-tight">Purchase Reconciliation</h1>
                        <p className="text-xs text-muted-foreground">
                            View and reconcile purchase transactions reported by your vendors to KRA eTIMS.
                        </p>
                    </div>

                    {/* Filters and Actions */}
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
                                            // KRA returns resultCd=901 "It is not valid device" if bhfId doesn't match device registration.
                                            toast.error(`This device is only valid for branch ${deviceBhfId}. Re-initialize eTIMS for branch ${bhfId} to use it.`);
                                            return;
                                        }
                                        setSelectedBhfId(bhfId);
                                        setTimeout(() => refetch(), 0);
                                    }}
                                />
                            ) : null}
                            <Button variant="outline">
                                <Filter className="mr-2 h-4 w-4" />
                                Filter
                            </Button>
                            <Button variant="outline" onClick={() => setIsSendOpen(true)}>
                                Confirm Purchase
                            </Button>
                            <Button onClick={() => refetch()} disabled={isLoading}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Sync Purchases
                            </Button>
                        </div>
                    </div>

                    {/* Content Section */}
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
                                    ) : purchases.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center py-8">
                                                    <div className="p-4 rounded-full bg-muted/50 mb-4 text-muted-foreground/50">
                                                        <ShoppingCart className="h-10 w-10" />
                                                    </div>
                                                    <h3 className="text-lg font-medium">No purchase records found</h3>
                                                    <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-6">
                                                        KRA returned no supplier invoices registered against your PIN yet.
                                                        Purchases appear here when a vendor submits an eTIMS sale with your PIN as the buyer  not from sales you issue yourself.
                                                    </p>
                                                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                                                        <RefreshCw className="mr-2 h-3 w-3" />
                                                        Fetch Recent Purchases
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        purchases.map((purchase: any) => (
                                            <tr key={purchase.id} className="hover:bg-muted/30 transition-colors group">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                                                            <User className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-foreground">{purchase.spplrTin ?? purchase.sPin ?? "Unknown Supplier"}</div>
                                                            <div className="text-xs text-muted-foreground">{purchase.spplrNm ?? purchase.sNm ?? ""}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 font-mono font-medium">{purchase.spplrInvcNo ?? purchase.invcNo ?? "-"}</td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Calendar className="h-4 w-4" />
                                                        {purchase.salesDt ?? purchase.pchsDt ?? "-"}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 font-bold text-foreground">
                                                    KES {(purchase.totAmt ?? 0).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge variant="secondary">MIRRORED</Badge>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <Button variant="ghost" size="sm">
                                                        Reconcile
                                                        <ChevronRight className="ml-1 h-3 w-3" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="mt-8 border rounded-lg bg-indigo-50/50 dark:bg-indigo-900/10 p-6 flex gap-4">
                        <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shrink-0 h-fit">
                            <ArrowDownLeft className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold text-indigo-900 dark:text-indigo-400">About Purchase Mirroring</h4>
                            <p className="text-sm text-indigo-800/80 dark:text-indigo-400/80 leading-relaxed">
                                KRA eTIMS allows you to see all invoices issued to your business PIN by other registered vendors. This automated "mirroring" helps you reconcile your input tax and inventory without manual entry.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </ETimsInitializationGuard>
    );
}
