"use client";

import * as React from "react";
import {
    Bell,
    Mail,
    Search,
    RefreshCw,
    MoreVertical,
    Eye,
    Calendar,
    AlertTriangle,
    ShieldAlert,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DigitaxNoticesPage() {
    const [searchQuery, setSearchQuery] = React.useState("");

    const { data: noticesData, isLoading, refetch } = trpc.digitax.notices.getAll.useQuery({
        page_size: 20,
    });

    // Robust data extraction
    const notices = React.useMemo(() => {
        if (!noticesData) return [];
        // Handle potential nested data structure from API
        if (Array.isArray(noticesData)) return noticesData;
        if (noticesData.data && Array.isArray(noticesData.data)) return noticesData.data;
        if ((noticesData as any).result?.data?.data && Array.isArray((noticesData as any).result.data.data)) {
            return (noticesData as any).result.data.data;
        }
        if ((noticesData as any).result?.data && Array.isArray((noticesData as any).result.data)) {
            return (noticesData as any).result.data;
        }
        return [];
    }, [noticesData]);

    const filteredNotices = React.useMemo(() => {
        if (!searchQuery.trim()) return notices;
        const query = searchQuery.toLowerCase().trim();
        return notices.filter((n: any) =>
            n.subject.toLowerCase().includes(query) ||
            n.content?.toLowerCase().includes(query)
        );
    }, [notices, searchQuery]);

    return (
        <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6 min-h-[calc(100vh-4rem)]">
            <div className="w-full max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-base font-semibold tracking-tight">Compliance notices</h1>
                        <p className="text-xs text-muted-foreground">
                            Official communications and compliance updates from KRA eTIMS.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => refetch()}
                            className="rounded-full h-9 w-9 border-border/50"
                            disabled={isLoading}
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-6">

                    <div className="flex items-center gap-3 bg-muted/40 p-1.5 rounded-2xl border border-border/40 max-w-md">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search notices..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-transparent border-none focus-visible:ring-0 h-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="p-6 rounded-[2rem] border border-border/50 bg-card/40 animate-pulse flex gap-6">
                                    <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
                                    <div className="space-y-3 flex-1 pt-1">
                                        <Skeleton className="h-5 w-1/3 rounded" />
                                        <Skeleton className="h-4 w-full rounded" />
                                        <Skeleton className="h-4 w-4/5 rounded" />
                                    </div>
                                </div>
                            ))
                        ) : filteredNotices.length === 0 ? (
                            <div className="py-32 bg-card/20 rounded-[3rem] border border-dashed border-border/60 flex flex-col items-center justify-center space-y-6">
                                <div className="h-24 w-24 rounded-[2.5rem] bg-muted/50 flex items-center justify-center text-muted-foreground/20">
                                    <Bell className="h-12 w-12" />
                                </div>
                                <div className="text-center space-y-1">
                                    <h3 className="text-xl font-bold tracking-tight">No active notices</h3>
                                    <p className="text-sm text-muted-foreground font-medium">You are all caught up with KRA compliance alerts.</p>
                                </div>
                            </div>
                        ) : (
                            filteredNotices.map((notice: any) => (
                                <div key={notice.id} className="group p-6 rounded-[2rem] border border-border/50 bg-card hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all flex flex-col md:flex-row gap-6 relative overflow-hidden">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-rose-500/5 text-rose-600 border border-rose-500/10 shrink-0 self-start">
                                        <ShieldAlert className="h-7 w-7" />
                                    </div>

                                    <div className="flex-1 space-y-3 pt-1">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 opacity-80">Urgent Update</span>
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/60">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {notice.date || "2024-04-21"}
                                                </div>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-muted/30">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-muted/30">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-2xl p-1.5">
                                                        <DropdownMenuItem className="gap-2.5 py-2.5 rounded-xl font-medium">
                                                            <Mail className="h-4 w-4 opacity-60" /> Forward to Compliance
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="gap-2.5 py-2.5 rounded-xl font-medium">
                                                            <Eye className="h-4 w-4 opacity-60" /> Mark as Read
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="text-xl font-bold text-foreground/90 tracking-tight leading-tight">{notice.subject}</h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed font-medium line-clamp-2">
                                                {notice.content || "An important compliance update regarding eTIMS transmission requirements has been issued for your business entity."}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="md:w-32 flex md:flex-col items-center justify-center gap-2 md:border-l border-border/20 md:pl-6">
                                        <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                                        <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Unread</span>
                                    </div>
                                </div>
                            )))
                        }
                    </div>

                    <div className="p-8 rounded-[3rem] bg-amber-500/5 border border-amber-500/10 flex flex-col md:flex-row gap-8 items-center text-center md:text-left">
                        <div className="h-16 w-16 rounded-[1.75rem] bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                            <AlertTriangle className="h-8 w-8" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-lg font-bold text-amber-900/80 tracking-tight uppercase">Compliance Monitoring</h4>
                            <p className="text-sm text-amber-900/60 leading-relaxed font-medium max-w-2xl">
                                DigiTax monitors official KRA eTIMS endpoints for any notices issued to your business. Promptly reviewing these notices ensures your system remains compliant with the latest regulatory changes.
                            </p>
                        </div>
                        <Button variant="outline" className="rounded-full border-amber-500/20 hover:bg-amber-500/5 text-amber-700 font-bold px-8 h-12 ml-auto">
                            Learn More
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
