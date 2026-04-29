"use client";

import * as React from "react";
import {
    Building2,
    MapPin,
    User,
    Phone,
    RefreshCw,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Link
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ETimsInitializationGuard } from "@/components/etims/etims-initialization-guard";

export default function ETimsBranchesPage() {
    const utils = trpc.useUtils();

    const { data: branches, isLoading, refetch } = trpc.etims.branch.getBranchList.useQuery({
        lastReqDt: "20230101000000",
    });

    const branchList = React.useMemo(() => {
        // API shape is: { success: true, data: <kraResponse> }
        // And KRA may wrap response: { responseBody: { data: { bhfList: [...] } } }
        const root: any = branches;
        const payload = root?.data?.responseBody?.data ?? root?.data ?? root?.responseBody?.data ?? root;
        const data: any = payload?.data ?? payload;
        return (
            data?.bhfList ??
            data?.branchList ??
            data?.itemList ??
            data?.bhfInfoList ??
            []
        );
    }, [branches]);

    // Sync is now implicit in fetching, but we can simulate a re-fetch
    const syncMutation = {
        mutate: () => {
            toast.success("Refreshing Branch Data...");
            refetch();
        },
        isPending: isLoading
    };

    const onHandleSync = () => {
        syncMutation.mutate(); // No args needed for mutate if wrapper just calls refetch
    };

    return (
        <ETimsInitializationGuard>
            <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                            <div className="flex flex-col gap-2">
                                <h1 className="text-2xl font-semibold tracking-tight">Business Branches</h1>
                                <p className="text-muted-foreground">
                                    Manage your registered physical and virtual business locations under your KRA PIN.
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => refetch()}
                                disabled={isLoading}
                            >
                                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                                Refresh
                            </Button>
                            <Button onClick={onHandleSync} disabled={syncMutation.isPending}>
                                {syncMutation.isPending ? <Spinner size={16} className="mr-2" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Sync from KRA
                            </Button>
                        </div>

                        {/* Content Section */}
                        <div className="mt-6">
                            <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                        <tr>
                                            <th className="px-4 py-3">Branch Identity</th>
                                            <th className="px-4 py-3">ID (bhfId)</th>
                                            <th className="px-4 py-3">Manager</th>
                                            <th className="px-4 py-3">Contact</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {isLoading ? (
                                            Array.from({ length: 3 }).map((_, i) => (
                                                <tr key={i}>
                                                    <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                                                    <td className="px-4 py-4"><Skeleton className="h-4 w-12" /></td>
                                                    <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                                                    <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                                                    <td className="px-4 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                                                    <td className="px-4 py-4"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></td>
                                                </tr>
                                            ))
                                        ) : branchList.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-12 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <Building2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                                        <h3 className="text-lg font-medium">No branches found</h3>
                                                        <p className="text-sm text-muted-foreground mt-1 mb-6">
                                                            Sync with KRA to import your registered branch locations.
                                                        </p>
                                                        <Button onClick={onHandleSync} variant="outline" size="sm">
                                                            <RefreshCw className="mr-2 h-3 w-3" />
                                                            Sync Now
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            branchList.map((branch: any) => (
                                                <tr key={branch.bhfId} className="hover:bg-muted/30 transition-colors group">
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 rounded-lg bg-muted text-foreground">
                                                                <Building2 className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-foreground">{branch.bhfNm}</div>
                                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                    <MapPin className="h-3 w-3" />
                                                                    {branch.adrs || "Default Location"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 font-mono font-medium">{branch.bhfId}</td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            {branch.mgrNm || "Not Set"}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                                            {branch.mgrTelNo || "N/A"}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <Badge variant="outline" className={`
                                        ${branch.bhfSttsCd === "01" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"}
                                        `}>
                                                            {branch.bhfSttsCd === "01" ? "OPEN" : "CLOSED"}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Branch Options</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem>View Device Details</DropdownMenuItem>
                                                                <DropdownMenuItem>Update Local Metadata</DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="text-destructive">Close Branch</DropdownMenuItem>
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

                        {/* Multi-location Note */}
                        <div className="mt-8 border rounded-lg bg-blue-50/50 dark:bg-blue-900/10 p-6 flex gap-4">
                            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0 h-fit">
                                <Link className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-semibold text-blue-900 dark:text-blue-400">Branch & Device Links</h4>
                                <p className="text-sm text-blue-800/80 dark:text-blue-400/80 leading-relaxed">
                                    Every branch must be linked to a physical or virtual device. The <strong>Branch ID (bhfId)</strong> used during signing must match the one mapped to your current device serial in KRA's database.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ETimsInitializationGuard>
    );
}
