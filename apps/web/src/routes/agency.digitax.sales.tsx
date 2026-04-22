"use client";

import * as React from "react";
import {
    FileText,
    Search,
    RefreshCw,
    QrCode,
    CheckCircle2,
    MoreVertical,
    Download,
    Eye,
    ExternalLink,
    Plus,
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
import { Textarea } from "@/components/ui/textarea";
import { RecordDigitaxSaleSheet } from "./agency.digitax/sales/_components/record-digitax-sale-sheet";

export default function DigitaxSalesPage() {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [isAddOpen, setIsAddOpen] = React.useState(false);

    const utils = trpc.useUtils();

    const { data: salesData, isLoading, refetch } = trpc.digitax.sales.getAll.useQuery({
        page_size: 20,
    });

    // Robust data extraction
    const sales = React.useMemo(() => {
        if (!salesData) return [];
        // Handle potential nested data structure from API
        if (Array.isArray(salesData)) return salesData;
        if (salesData.data && Array.isArray(salesData.data)) return salesData.data;
        if ((salesData as any).result?.data?.data && Array.isArray((salesData as any).result.data.data)) {
            return (salesData as any).result.data.data;
        }
        if ((salesData as any).result?.data && Array.isArray((salesData as any).result.data)) {
            return (salesData as any).result.data;
        }
        return [];
    }, [salesData]);

    const filteredSales = React.useMemo(() => {
        if (!searchQuery.trim()) return sales;
        const query = searchQuery.toLowerCase().trim();
        return sales.filter((s: any) =>
            (s.trader_invoice_number?.toLowerCase().includes(query) ?? false) ||
            (s.customer_name?.toLowerCase().includes(query) ?? false) ||
            (s.id?.toLowerCase().includes(query) ?? false)
        );
    }, [sales, searchQuery]);

    return (
        <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
            <RecordDigitaxSaleSheet 
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
                onSuccess={() => refetch()}
            />

            <div className="w-full max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-base font-semibold tracking-tight">
                            Sales records
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Manage and track eTIMS compliant sales transactions.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => refetch()}
                            className="rounded-full hover:rotate-180 transition-transform duration-500"
                            disabled={isLoading}
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                        <Button
                            onClick={() => setIsAddOpen(true)}
                            className="bg-primary text-primary-foreground shadow-sm hover:shadow-md transition-all gap-2 h-9 text-xs font-medium"
                        >
                            <Plus className="h-4 w-4" />
                            Record Sale
                        </Button>
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-6">

                <div className="flex items-center gap-3 bg-muted/30 p-1.5 rounded-2xl border border-border/40 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <Input
                            placeholder="Filter by invoice or customer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-transparent border-none focus-visible:ring-0 h-9"
                        />
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-[2.5rem] border border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl shadow-foreground/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/40 text-muted-foreground/80 font-semibold text-xs tracking-wider uppercase border-b border-border/40">
                                    <th className="px-6 py-4">Transaction</th>
                                    <th className="px-6 py-4">Invoice #</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-5 cursor-wait"><Skeleton className="h-4 w-32 rounded" /></td>
                                            <td className="px-6 py-5"><Skeleton className="h-4 w-24 rounded" /></td>
                                            <td className="px-6 py-5"><Skeleton className="h-4 w-32 rounded" /></td>
                                            <td className="px-6 py-5"><Skeleton className="h-4 w-20 rounded" /></td>
                                            <td className="px-6 py-5"><Skeleton className="h-6 w-16 rounded-full" /></td>
                                            <td className="px-6 py-5"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></td>
                                        </tr>
                                    ))
                                ) : filteredSales.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                <div className="p-3 bg-muted rounded-full">
                                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-semibold">No sales found</h3>
                                                    <p className="text-xs text-muted-foreground">Entries will appear here once recorded via DigiTax.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSales.map((sale: any) => (
                                        <tr key={sale.id} className="hover:bg-muted/40 transition-all group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/5 text-primary">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-foreground/90">{sale.id.slice(0, 8)}...</span>
                                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                                                            {sale.date} • {sale.time}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="font-mono text-xs font-semibold bg-muted/60 px-2 py-1 rounded w-fit text-muted-foreground border border-border/20">
                                                    {sale.trader_invoice_number}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-foreground/80 font-medium">{sale.customer_name || "Guest Customer"}</span>
                                                    <span className="text-[11px] text-muted-foreground/70">{sale.customer_tin || "No TIN"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="font-bold text-foreground/90">
                                                    {sale.sales_tax_summary?.taxable_amount_b?.toLocaleString() ?? "0"}
                                                    <span className="text-[10px] text-muted-foreground ml-1 font-normal">KES</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <Badge
                                                    variant="secondary"
                                                    className={`
                                                        px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border
                                                        ${sale.status === 'COMPLETED' ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/10' :
                                                            sale.status === 'FAILED' ? 'bg-rose-500/5 text-rose-600 border-rose-500/10' :
                                                                'bg-amber-500/5 text-amber-600 border-amber-500/10'}
                                                    `}
                                                >
                                                    {sale.status || 'PENDING'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors" title="View Offline URL">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-60 group-hover:opacity-100 transition-opacity">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-52 rounded-xl">
                                                            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold px-3 pt-2">Manage Sale</DropdownMenuLabel>
                                                            <DropdownMenuSeparator className="opacity-40" />
                                                            <DropdownMenuItem className="gap-2 py-2 cursor-pointer focus:bg-primary/5 focus:text-primary">
                                                                <Eye className="h-4 w-4" /> Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="gap-2 py-2 cursor-pointer focus:bg-primary/5 focus:text-primary">
                                                                <Download className="h-4 w-4" /> Download PDF
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="gap-2 py-2 cursor-pointer focus:bg-primary/5 focus:text-primary">
                                                                <QrCode className="h-4 w-4" /> QR Code
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="opacity-40" />
                                                            <DropdownMenuItem className="gap-2 py-2 cursor-pointer text-rose-500 focus:bg-rose-500/5 focus:text-rose-600">
                                                                <AlertCircle className="h-4 w-4" /> Credit Note
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </tr>
                                    )))
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
);
}

function AlertCircle(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
    )
}
