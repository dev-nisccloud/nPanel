"use client";

import * as React from "react";
import {
    Search,
    RefreshCw,
    Building2,
    QrCode,
    MoreVertical,
    MapPin,
    Mail,
    Phone,
    Copy,
    Check,
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

    const { data: branchesData, isLoading, refetch } = trpc.digitax.branches.getBranches.useQuery();

    const branches = React.useMemo(() => {
        const rawData = branchesData?.data;
        if (Array.isArray(rawData)) return rawData;
        if (Array.isArray(rawData?.data)) return rawData.data;
        if (typeof rawData === 'object' && rawData !== null && 'branch_office_id' in rawData) return [rawData];
        return [];
    }, [branchesData]);

    const filteredBranches = React.useMemo(() => {
        if (!searchQuery.trim()) return branches;
        const query = searchQuery.toLowerCase().trim();
        return branches.filter((b: any) =>
            b.branch_office_name?.toLowerCase().includes(query) ||
            b.branch_office_id?.toString().toLowerCase().includes(query) ||
            b.county_name?.toLowerCase().includes(query) ||
            b.tax_locality_name?.toLowerCase().includes(query)
        );
    }, [branches, searchQuery]);

    return (
        <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6 bg-muted/5 min-h-[calc(100vh-4rem)]">
            <div className="w-full max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-base font-semibold tracking-tight">Entity branches</h1>
                        <p className="text-xs text-muted-foreground">
                            Manage branch locations and eTIMS registration status.
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
                                        <th className="px-8 py-5">Location Details</th>
                                        <th className="px-8 py-5">Managed By</th>
                                        <th className="px-8 py-5">Contact Info</th>
                                        <th className="px-8 py-5">Status</th>
                                        <th className="px-8 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {isLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <Skeleton className="h-11 w-11 rounded-[1.25rem]" />
                                                        <div className="space-y-2">
                                                            <Skeleton className="h-4 w-32 rounded" />
                                                            <Skeleton className="h-3 w-20 rounded" />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="space-y-2">
                                                        <Skeleton className="h-4 w-28 rounded" />
                                                        <Skeleton className="h-3 w-36 rounded" />
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6"><Skeleton className="h-4 w-32 rounded" /></td>
                                                <td className="px-8 py-6"><Skeleton className="h-4 w-40 rounded" /></td>
                                                <td className="px-8 py-6"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                                <td className="px-8 py-6"><Skeleton className="h-9 w-9 ml-auto rounded-xl" /></td>
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
                                            <tr key={branch.branch_office_id} className="hover:bg-primary/[0.02] transition-colors group text-sm">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-[1.25rem] bg-indigo-50 text-indigo-600 border border-indigo-100 font-bold text-sm">
                                                            {branch.branch_office_id}
                                                        </div>
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-bold text-foreground/90 text-base">{branch.branch_office_name || "Main HQ"}</span>
                                                            <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5 uppercase tracking-wider">
                                                                {branch.tax_pin}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 text-foreground/80 font-semibold whitespace-nowrap text-[13px]">
                                                            <MapPin className="h-3.5 w-3.5 shrink-0 opacity-50" />
                                                            {branch.county_name || "Nairobi"}
                                                        </div>
                                                        <span className="text-[11px] text-muted-foreground ml-5 font-medium">
                                                            {branch.sub_county_name}, {branch.tax_locality_name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="font-semibold text-foreground/70">{branch.manager_name || "Head Office"}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2 text-foreground/80 group/clip">
                                                            <Phone className="h-3 w-3 opacity-40" />
                                                            <span className="text-xs font-medium">{branch.manager_contact}</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-5 w-5 opacity-0 group-hover/clip:opacity-100 transition-opacity"
                                                                onClick={() => navigator.clipboard.writeText(branch.manager_contact.toString())}
                                                            >
                                                                <Copy className="h-2.5 w-2.5" />
                                                            </Button>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-muted-foreground group/mail">
                                                            <Mail className="h-3 w-3 opacity-40" />
                                                            <span className="text-xs lowercase">{branch.manager_email}</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-5 w-5 opacity-0 group-hover/mail:opacity-100 transition-opacity"
                                                                onClick={() => navigator.clipboard.writeText(branch.manager_email)}
                                                            >
                                                                <Copy className="h-2.5 w-2.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <Badge
                                                        className={`
                                                        px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border
                                                        ${branch.is_head_office ? 'bg-primary/10 text-primary border-primary/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}
                                                    `}
                                                    >
                                                        {branch.is_head_office ? 'HEAD OFFICE' : 'BRANCH'}
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
                                                            <DropdownMenuItem className="gap-2.5 py-2.5 rounded-xl font-medium text-rose-600 focus:text-rose-600 focus:bg-rose-50 transition-colors">
                                                                Deactivate Branch
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
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
