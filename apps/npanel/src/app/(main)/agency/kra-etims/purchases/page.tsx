"use client";

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

export default function ETimsPurchasesPage() {
    const [selectedTeamId, setSelectedTeamId] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState("");

    // We'll simulate loading or use a query if implemented
    const isLoading = false;
    const purchases: any[] = []; // Placeholder for mirrored purchases

    return (
        <ETimsInitializationGuard>
            <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl font-semibold tracking-tight">Purchase Reconciliation</h1>
                        <p className="text-muted-foreground">
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
                            <Button variant="outline">
                                <Filter className="mr-2 h-4 w-4" />
                                Filter
                            </Button>
                            <Button>
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
                                                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-6">
                                                        Sync with KRA to fetch invoices your vendors have issued specifically to your PIN.
                                                    </p>
                                                    <Button variant="outline" size="sm">
                                                        <RefreshCw className="mr-2 h-3 w-3" />
                                                        Fetch Recent Purchases
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        purchases.map((purchase) => (
                                            <tr key={purchase.id} className="hover:bg-muted/30 transition-colors group">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                                                            <User className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-foreground">{purchase.sPin}</div>
                                                            <div className="text-xs text-muted-foreground">{purchase.sNm}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 font-mono font-medium">{purchase.invcNo}</td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Calendar className="h-4 w-4" />
                                                        {new Date(purchase.salesDt).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 font-bold text-foreground">
                                                    KES {purchase.totAmt.toLocaleString()}
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
