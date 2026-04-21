"use client";

import * as React from "react";
import {
    Search,
    RefreshCw,
    ShieldCheck,
    MoreVertical,
    FileSearch,
    CheckCircle2,
    Calendar,
    ExternalLink,
    Clock,
    User,
    QrCode,
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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { VerifyDigitaxInvoiceSheet } from "./agency.digitax/verifications/_components/verify-digitax-invoice-sheet";

export default function DigitaxVerificationsPage() {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [isVerifyOpen, setIsVerifyOpen] = React.useState(false);

    const { data: verificationsData, isLoading, refetch } = trpc.digitax.verifications.getAll.useQuery({
        page_size: 20,
    });

    const verifications = verificationsData?.data ?? [];

    const filteredVerifications = React.useMemo(() => {
        if (!searchQuery.trim()) return verifications;
        const query = searchQuery.toLowerCase().trim();
        return verifications.filter((v: any) =>
            v.invoice_number?.toLowerCase().includes(query) ||
            v.vendor_tin?.toLowerCase().includes(query) ||
            v.id.toLowerCase().includes(query)
        );
    }, [verifications, searchQuery]);

    return (
        <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
            <VerifyDigitaxInvoiceSheet 
                open={isVerifyOpen}
                onOpenChange={setIsVerifyOpen}
                onSuccess={() => refetch()}
            />

            <div className="w-full max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-extrabold tracking-tight text-foreground/90 flex items-center gap-3">
                            Verification Hub
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium">
                            Cross-check external invoices and maintain audit logs of eTIMS verifications.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => refetch()}
                            className="rounded-full bg-white h-10 w-10 shrink-0"
                            disabled={isLoading}
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                        <Button
                            onClick={() => setIsVerifyOpen(true)}
                            className="bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-none transition-all gap-2 h-10 px-6 rounded-xl font-bold"
                        >
                            <ShieldCheck className="h-4 w-4" />
                            Verify New Invoice
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-muted/30 p-1.5 rounded-xl border border-border/40 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter verification history..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-transparent border-none focus-visible:ring-0 h-10"
                        />
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-[2.5rem] border border-border/50 bg-card/40 backdrop-blur-sm shadow-xl shadow-foreground/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/30 text-muted-foreground/60 font-black text-[9px] tracking-[0.2em] uppercase border-b border-border/40">
                                    <th className="px-8 py-5">Source Invoice</th>
                                    <th className="px-8 py-5">Vendor PIN</th>
                                    <th className="px-8 py-5">Verified At</th>
                                    <th className="px-8 py-5">System Match</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                                {isLoading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-8 py-6"><Skeleton className="h-5 w-40 rounded-lg" /></td>
                                            <td className="px-8 py-6"><Skeleton className="h-5 w-32 rounded-lg" /></td>
                                            <td className="px-8 py-6"><Skeleton className="h-5 w-36 rounded-lg" /></td>
                                            <td className="px-8 py-6"><Skeleton className="h-7 w-20 rounded-full" /></td>
                                            <td className="px-8 py-6"><Skeleton className="h-9 w-9 ml-auto rounded-full" /></td>
                                        </tr>
                                    ))
                                ) : filteredVerifications.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-24 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-4 opacity-40">
                                                <div className="h-20 w-20 rounded-[2.5rem] bg-muted/60 flex items-center justify-center">
                                                    <FileSearch className="h-10 w-10" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-xl font-bold tracking-tight">Empty verification log</h3>
                                                    <p className="text-sm font-medium">Verified external invoices will appear here for audit history.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredVerifications.map((v: any) => (
                                        <tr key={v.id} className="hover:bg-primary/[0.02] transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-[1.25rem] bg-primary/5 text-primary border border-primary/10">
                                                        <FileSearch className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-foreground/90 text-sm">{v.invoice_number || "INV-MATCH"}</span>
                                                        <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase flex items-center gap-1.5 pt-0.5">
                                                            <QrCode className="h-3 w-3 opacity-60" /> {v.id.slice(0, 8)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 font-mono text-xs font-bold text-foreground/60 uppercase">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-3.5 w-3.5 opacity-40 shrink-0" />
                                                    {v.vendor_tin || "A00---"}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col space-y-1">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-foreground/70">
                                                        <Calendar className="h-3.5 w-3.5 opacity-40" />
                                                        {v.created_at || "Today"}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                                                        <Clock className="h-3 w-3 opacity-40" />
                                                        {v.time || "12:00 PM"}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <Badge
                                                    className={`
                                                        px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border
                                                        ${v.is_valid ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'}
                                                    `}
                                                >
                                                    {v.is_valid ? 'VALIDATED' : 'MISMATCH'}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-muted/60" title="View Report">
                                                        <ExternalLink className="h-4.5 w-4.5" />
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-muted/60">
                                                                <MoreVertical className="h-5 w-5" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="rounded-2xl p-1.5 w-44">
                                                            <DropdownMenuItem className="gap-2.5 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider">
                                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Export PDF
                                                            </DropdownMenuItem>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 rounded-[3rem] bg-indigo-500/5 border border-indigo-500/10 space-y-4">
                        <div className="h-12 w-12 rounded-[1.25rem] bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-lg font-bold text-indigo-900/80 tracking-tight uppercase">Audit Integrity</h4>
                            <p className="text-sm text-indigo-900/60 leading-relaxed font-medium">
                                Every verification request is logged and archived. This ensures you have a permanent record of due diligence when processing third-party invoices.
                            </p>
                        </div>
                    </div>
                    <div className="p-8 rounded-[3rem] bg-primary/5 border border-primary/10 space-y-4">
                        <div className="h-12 w-12 rounded-[1.25rem] bg-primary/10 text-primary flex items-center justify-center">
                            <QrCode className="h-6 w-6" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-lg font-bold text-primary/80 tracking-tight uppercase">eTIMS Verification</h4>
                            <p className="text-sm text-primary/60 leading-relaxed font-medium">
                                Verifications are queried directly against eTIMS repositories using DigiTax. Any discrepancies in PIN or invoice amounts will be highlighted in the validation status.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
