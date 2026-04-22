"use client";

import * as React from "react";
import {
    ShoppingCart,
    Search,
    RefreshCw,
    Download,
    ArrowDownLeft,
    ChevronRight,
    User,
    Calendar,
    Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/npanel-ui/sheet";

export default function DigitaxPurchasesPage() {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
    const [selectedPurchase, setSelectedPurchase] = React.useState<any>(null);

    const { data: purchasesData, isLoading, refetch } = trpc.digitax.purchases.getAll.useQuery({
        page_size: 20,
    });

    const { data: fullPurchase, isLoading: isFetchingDetails } = trpc.digitax.purchases.getById.useQuery(
        { purchaseId: selectedPurchase?.id ?? "" },
        { enabled: !!selectedPurchase?.id }
    );

    // Use full purchase data if available, otherwise fallback to list item
    const displayPurchase = fullPurchase || selectedPurchase;

    // Robust data extraction
    const purchases = React.useMemo(() => {
        if (!purchasesData) return [];
        // Handle potential nested data structure from API
        if (Array.isArray(purchasesData)) return purchasesData;
        if (purchasesData.data && Array.isArray(purchasesData.data)) return purchasesData.data;
        if ((purchasesData as any).result?.data?.data && Array.isArray((purchasesData as any).result.data.data)) {
            return (purchasesData as any).result.data.data;
        }
        if ((purchasesData as any).result?.data && Array.isArray((purchasesData as any).result.data)) {
            return (purchasesData as any).result.data;
        }
        return [];
    }, [purchasesData]);

    const formatDigitaxDate = (dateStr: string) => {
        if (!dateStr || dateStr.length !== 8) return dateStr;
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    const calculateTotal = (itemList: any[]) => {
        return itemList?.reduce((sum, item) => sum + (item.supply_amount || 0), 0) || 0;
    };

    const filteredPurchases = React.useMemo(() => {
        if (!searchQuery.trim()) return purchases;
        const query = searchQuery.toLowerCase().trim();
        return purchases.filter((p: any) =>
            p.supplier_tin?.toLowerCase().includes(query) ||
            p.supplier_name?.toLowerCase().includes(query) ||
            p.trader_invoice_number?.toString().toLowerCase().includes(query)
        );
    }, [purchases, searchQuery]);

    return (
        <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
            <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <SheetContent className="w-full sm:max-w-xl overflow-y-auto font-sans">
                    <SheetHeader>
                        <SheetTitle>Purchase Details</SheetTitle>
                        <SheetDescription>
                            Detailed breakdown of the invoice issued to your Business PIN.
                        </SheetDescription>
                    </SheetHeader>

                    {displayPurchase && (
                        <div className="mt-8 space-y-6 relative">
                            {isFetchingDetails && (
                                <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-[2rem]">
                                    <Spinner size={32} />
                                </div>
                            )}
                            <div className="p-5 rounded-[2rem] bg-muted/40 border border-border/50">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Invoice Overview</h4>
                                <div className="grid grid-cols-2 gap-y-5 gap-x-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground text-[11px] mb-0.5">Supplier Name</p>
                                        <p className="font-semibold text-foreground/90">{displayPurchase.supplier_name || "Merchant " + (displayPurchase.supplier_tin || "#" + displayPurchase.id.slice(-6))}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-[11px] mb-0.5">Supplier TIN</p>
                                        <p className="font-semibold text-foreground/90 font-mono tracking-tight">{displayPurchase.supplier_tin || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-[11px] mb-0.5">Invoice Number</p>
                                        <p className="font-semibold text-foreground/90">#{displayPurchase.supplier_invoice_number || displayPurchase.invoice_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-[11px] mb-0.5">Purchase Date</p>
                                        <p className="font-semibold text-foreground/90">{formatDigitaxDate(displayPurchase.purchase_date)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Line Items</h4>
                                    <Badge variant="secondary" className="rounded-full px-2 text-[10px] font-medium opacity-70">
                                        {displayPurchase.item_list?.length || 0} items
                                    </Badge>
                                </div>
                                <div className="space-y-2.5">
                                    {displayPurchase.item_list?.map((item: any) => (
                                        <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border border-border/30 hover:border-primary/20 transition-all bg-card/40">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-bold text-foreground/80">
                                                    {item.item_name || "Purchase Item"}
                                                </span>
                                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                    <span className="px-1.5 py-0.5 rounded-md bg-muted font-medium">Qty: {item.quantity}</span>
                                                    <span>•</span>
                                                    <span>KES {item.price.toLocaleString()} per unit</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-black text-foreground/90">
                                                    {item.supply_amount.toLocaleString()}
                                                </span>
                                                <p className="text-[9px] uppercase tracking-tighter text-muted-foreground mt-0.5 font-bold">KES</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-5 rounded-[2rem] bg-primary/5 border border-primary/10 flex justify-between items-center">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Total Payable</p>
                                    <p className="text-xs text-muted-foreground">Inclusive of applicable taxes</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-primary tracking-tight">
                                        {calculateTotal(displayPurchase.item_list).toLocaleString()}
                                    </span>
                                    <span className="text-[10px] font-bold text-primary/50 ml-1">KES</span>
                                </div>
                            </div>

                            <SheetFooter className="border-t pt-6 gap-3 sm:gap-0">
                                <Button className="w-full sm:w-auto rounded-full px-8 bg-foreground text-background hover:bg-foreground/90" onClick={() => setIsDetailsOpen(false)}>
                                    Dismiss
                                </Button>
                            </SheetFooter>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            <div className="w-full max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-base font-semibold tracking-tight">
                            Purchase records
                            <Badge variant="outline" className="ml-2 text-[10px] h-4 px-2 bg-muted/50 rounded-full border-none font-bold tracking-widest text-muted-foreground">ETIMS</Badge>
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            View and reconcile input invoices issued to your business by suppliers.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => refetch()}
                            className="rounded-full hover:rotate-180 transition-transform duration-500 h-9 w-9 border-border/50"
                            disabled={isLoading}
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                        <Button
                            onClick={() => refetch()}
                            className="bg-primary text-primary-foreground hover:shadow-md transition-all gap-2 h-9 text-xs font-medium px-4"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Sync Recent
                        </Button>
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-6">

                <div className="flex items-center gap-3 bg-muted/30 p-1.5 rounded-2xl border border-border/40 max-w-md shadow-inner">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <Input
                            placeholder="Search by vendor or invoice..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-transparent border-none focus-visible:ring-0 placeholder:text-muted-foreground/50 h-9"
                        />
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-[2.5rem] border border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl shadow-foreground/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/40 text-muted-foreground/80 font-bold text-[10px] tracking-widest uppercase border-b border-border/40">
                                    <th className="px-8 py-5">Supplier / Vendor Details</th>
                                    <th className="px-6 py-5">Invoice #</th>
                                    <th className="px-6 py-5">Date</th>
                                    <th className="px-6 py-5">Payable Amount</th>
                                    <th className="px-6 py-5">Status</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-8 py-6"><Skeleton className="h-10 w-48 rounded-xl" /></td>
                                            <td className="px-6 py-6"><Skeleton className="h-4 w-24 rounded" /></td>
                                            <td className="px-6 py-6"><Skeleton className="h-4 w-24 rounded" /></td>
                                            <td className="px-6 py-6"><Skeleton className="h-4 w-24 rounded" /></td>
                                            <td className="px-6 py-6"><Skeleton className="h-6 w-16 rounded-full" /></td>
                                            <td className="px-8 py-6"><Skeleton className="h-9 w-9 ml-auto rounded-xl" /></td>
                                        </tr>
                                    ))
                                ) : filteredPurchases.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-32 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center space-y-4">
                                                <div className="h-20 w-20 rounded-[2.5rem] bg-muted/60 flex items-center justify-center">
                                                    <ShoppingCart className="h-10 w-10 opacity-20" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-lg font-bold text-foreground/70">No purchase records found</h3>
                                                    <p className="text-xs max-w-xs mx-auto">Sync your dashboard with eTIMS to retrieve invoices issued to your business.</p>
                                                </div>
                                                <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-full px-6 border-border/60">
                                                    Sync Records
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPurchases.map((purchase: any) => (
                                        <tr key={purchase.id} className="hover:bg-muted/30 transition-all group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/5 text-indigo-600 border border-indigo-500/10 group-hover:bg-indigo-500/10 transition-colors">
                                                        <User className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-bold text-foreground/90 tracking-tight">
                                                            {purchase.supplier_name || "Vendor " + (purchase.supplier_tin || "#" + purchase.id.slice(-6))}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                                            PIN: {purchase.supplier_tin || "N/A"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 font-mono text-xs text-muted-foreground font-semibold">
                                                {purchase.supplier_invoice_number || purchase.invoice_number}
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-2 text-muted-foreground text-[11px] font-bold">
                                                    <Calendar className="h-3.5 w-3.5 opacity-50" />
                                                    {formatDigitaxDate(purchase.purchase_date)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 font-black text-foreground/80">
                                                {calculateTotal(purchase.item_list).toLocaleString()} 
                                                <span className="text-[9px] font-bold text-muted-foreground ml-1">KES</span>
                                            </td>
                                            <td className="px-6 py-6">
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-indigo-500/5 text-indigo-600 border-indigo-500/10 text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md"
                                                >
                                                    {purchase.purchase_status_code || "RECEIVED"}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-9 px-4 gap-2 text-primary hover:bg-primary/5 rounded-xl font-bold text-xs uppercase tracking-widest group/btn"
                                                    onClick={() => {
                                                        setSelectedPurchase(purchase);
                                                        setIsDetailsOpen(true);
                                                    }}
                                                >
                                                    Details
                                                    <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                                                </Button>
                                            </td>
                                        </tr>
                                    )))
                                }
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="border border-indigo-500/10 rounded-[2.5rem] bg-indigo-500/[0.03] p-8 flex gap-6 items-start">
                    <div className="h-12 w-12 flex items-center justify-center rounded-[1.5rem] bg-indigo-500/10 text-indigo-600 shrink-0 shadow-sm">
                        <ArrowDownLeft className="h-6 w-6" />
                    </div>
                    <div className="space-y-2 pt-1">
                        <h4 className="font-black text-indigo-900/80 dark:text-indigo-400 text-xs tracking-widest uppercase">Record Mirroring enabled</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
                            All purchases issued to your PIN by registered KRA vendors are mirrored here automatically. This data originates directly from eTIMS systems for accurate Input VAT reconciliation and business reporting.
                        </p>
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
}
