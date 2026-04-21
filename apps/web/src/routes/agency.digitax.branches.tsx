"use client";

import * as React from "react";
import {
    Search,
    RefreshCw,
    Building2,
    QrCode,
    MoreVertical,
    MapPin,
    ShieldCheck,
    Cpu,
    Hash,
    Calendar,
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

export default function DigitaxBranchesPage() {
    const [searchQuery, setSearchQuery] = React.useState("");

    const { data: infoData, isLoading: isInfoLoading } = trpc.digitax.branches.getETimsInfo.useQuery();
    const { data: branchesData, isLoading: isBranchesLoading, refetch } = trpc.digitax.branches.getBranches.useQuery();

    const info = infoData?.data;
    const branches = branchesData?.data ?? [];

    const filteredBranches = React.useMemo(() => {
        if (!searchQuery.trim()) return branches;
        const query = searchQuery.toLowerCase().trim();
        return branches.filter((b: any) =>
            b.name.toLowerCase().includes(query) ||
            b.id.toLowerCase().includes(query) ||
            b.address?.toLowerCase().includes(query)
        );
    }, [branches, searchQuery]);

    const isLoading = isInfoLoading || isBranchesLoading;

    return (
        <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6 bg-muted/5 min-h-[calc(100vh-4rem)]">
            <div className="w-full max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground/90">Business Entities</h1>
                        <p className="text-muted-foreground text-sm font-medium">
                            Manage branch locations and eTIMS registration status.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => refetch()}
                            className="rounded-full bg-white shadow-sm"
                            disabled={isLoading}
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="p-6 rounded-[2rem] bg-white border border-border/50 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-primary mb-5 relative">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div className="space-y-1 relative">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Compliance Status</span>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold text-foreground/90">{info?.tin || "Loading..."}</h3>
                                {info && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/10 uppercase text-[9px] font-bold">Active</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">{info?.name || "eTIMS Registered Entity"}</p>
                        </div>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-white border border-border/50 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/5 text-amber-600 mb-5 relative">
                            <Cpu className="h-6 w-6" />
                        </div>
                        <div className="space-y-1 relative">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">eTIMS Hardware</span>
                            <h3 className="text-xl font-bold text-foreground/90">{info?.serial_number || "---"}</h3>
                            <p className="text-xs text-muted-foreground font-medium">Device S/N Registered</p>
                        </div>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-white border border-border/50 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/5 text-indigo-600 mb-5 relative">
                            <Hash className="h-6 w-6" />
                        </div>
                        <div className="space-y-1 relative">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Technical Ref</span>
                            <h3 className="text-xl font-bold text-foreground/90">{info?.itms_code || "---"}</h3>
                            <p className="text-xs text-muted-foreground font-medium">Internal System Code</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white/50 p-1.5 rounded-xl border border-border/40 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search locations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-transparent border-none focus-visible:ring-0 h-10"
                        />
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-[2.5rem] border border-border/50 bg-white/80 backdrop-blur-md shadow-2xl shadow-foreground/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/30 text-muted-foreground/60 font-bold text-[10px] tracking-[0.1em] uppercase border-b border-border/40">
                                    <th className="px-8 py-5">Branch Identity</th>
                                    <th className="px-8 py-5">Location</th>
                                    <th className="px-8 py-5">Managed By</th>
                                    <th className="px-8 py-5">Last Activity</th>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-8 py-6"><Skeleton className="h-5 w-40 rounded-lg" /></td>
                                            <td className="px-8 py-6"><Skeleton className="h-5 w-32 rounded-lg" /></td>
                                            <td className="px-8 py-6"><Skeleton className="h-5 w-24 rounded-lg" /></td>
                                            <td className="px-8 py-6"><Skeleton className="h-5 w-28 rounded-lg" /></td>
                                            <td className="px-8 py-6"><Skeleton className="h-7 w-20 rounded-full" /></td>
                                            <td className="px-8 py-6"><Skeleton className="h-9 w-9 ml-auto rounded-full" /></td>
                                        </tr>
                                    ))
                                ) : filteredBranches.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-24 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-4 opacity-40">
                                                <Building2 className="h-12 w-12" />
                                                <div className="space-y-1">
                                                    <h3 className="text-lg font-bold">No branches matched</h3>
                                                    <p className="text-xs">Try adjusting your search criteria.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBranches.map((branch: any) => (
                                        <tr key={branch.id} className="hover:bg-primary/[0.02] transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-[1.25rem] bg-indigo-50 text-indigo-600 border border-indigo-100 font-bold text-sm">
                                                        {branch.id}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-foreground/90 text-base">{branch.name}</span>
                                                        <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
                                                            <Hash className="h-3 w-3" /> Branch {branch.id}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-muted-foreground/80 font-medium whitespace-nowrap">
                                                    <MapPin className="h-4 w-4 shrink-0 opacity-50" />
                                                    {branch.address || "Main HQ"}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-semibold text-foreground/70">{branch.manager_name || "Head Office"}</span>
                                            </td>
                                            <td className="px-8 py-6 font-mono text-[11px] text-muted-foreground/80">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {new Date().toISOString().split('T')[0]}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <Badge
                                                    className={`
                                                        px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border
                                                        ${branch.id === '00' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}
                                                    `}
                                                >
                                                    {branch.id === '00' ? 'HEADQUARTERS' : 'ACTIVE'}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl opacity-40 group-hover:opacity-100 transition-opacity">
                                                            <MoreVertical className="h-5 w-5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-2xl w-48 font-sans p-1.5">
                                                        <DropdownMenuItem className="gap-2.5 py-2.5 rounded-xl font-medium">
                                                            <Building2 className="h-4 w-4 opacity-60" /> View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="gap-2.5 py-2.5 rounded-xl font-medium">
                                                            <QrCode className="h-4 w-4 opacity-60" /> Terminal IDs
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
                </div>
            </div>
        </div>
    );
}
