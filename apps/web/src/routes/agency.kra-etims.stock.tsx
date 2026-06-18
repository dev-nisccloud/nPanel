"use client";

import * as React from "react";
import {
    Package,
    Search,
    RefreshCw,
    Plus,
    ArrowUpRight,
    ArrowDownLeft,
    History,
    AlertTriangle,
    Settings,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { ETimsInitializationGuard } from "@/components/etims/etims-initialization-guard";

export default function ETimsStockPage() {
    const utils = trpc.useUtils();

    const { data: stockData, isLoading, refetch } = trpc.etims.stock.getStockMovements.useQuery({
        lastReqDt: "20230101000000",
    });

    const stockItems = React.useMemo(() => {
        // API shape is: { success: true, data: <kraResponse> }
        // And KRA may wrap response: { responseBody: { data: { itemList: [...] } } }
        const root: any = stockData;
        const payload = root?.data?.responseBody?.data ?? root?.data ?? root?.responseBody?.data ?? root;
        const data: any = payload?.data ?? payload;
        return data?.itemList ?? [];
    }, [stockData]);

    return (
        <ETimsInitializationGuard>
            <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                            <div className="flex flex-col gap-2">
                                <h1 className="text-base font-semibold tracking-tight">Inventory Control</h1>
                                <p className="text-xs text-muted-foreground">
                                    Monitor and adjust stock levels transmitted to KRA eTIMS for compliance.
                                </p>
                            </div>
                        </div>

                        {/* Stock Summary Metrics */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    <Card className="bg-card shadow-sm border-l-4 border-l-blue-500">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Stock-In Movements</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold flex items-center gap-2">
                                                0
                                                <ArrowDownLeft className="h-4 w-4 text-green-500" />
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">Total items added this month</p>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-card shadow-sm border-l-4 border-l-amber-500">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Stock-Out Movements</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold flex items-center gap-2">
                                                0
                                                <ArrowUpRight className="h-4 w-4 text-amber-500" />
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">Total items sold/moved out</p>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-card shadow-sm border-l-4 border-l-red-500">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Sync Alerts</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold flex items-center gap-2">
                                                Healthy
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">No discrepancies found</p>
                                        </CardContent>
                                    </Card>
                                </div>

                        {/* Actions bar */}
                        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="relative flex-1 max-w-sm w-full">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Filter by product name or code..."
                                            className="pl-9"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                        <Button variant="outline">
                                            <History className="mr-2 h-4 w-4" />
                                            Audit Log
                                        </Button>
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Manual Adjustment
                                        </Button>
                                    </div>
                                </div>

                        {/* Content Table */}
                        <div className="mt-6">
                                    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                                <tr>
                                                    <th className="px-4 py-3">Product/Service</th>
                                                    <th className="px-4 py-3">KRA Code</th>
                                                    <th className="px-4 py-3 text-right">Opening</th>
                                                    <th className="px-4 py-3 text-right">In</th>
                                                    <th className="px-4 py-3 text-right">Out</th>
                                                    <th className="px-4 py-3 text-right">Current Stock</th>
                                                    <th className="px-4 py-3 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {isLoading ? (
                                                    Array.from({ length: 5 }).map((_, i) => (
                                                        <tr key={i}>
                                                            <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                                                            <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                                                            <td className="px-4 py-4"><Skeleton className="h-4 w-20 text-right" /></td>
                                                            <td className="px-4 py-4"><Skeleton className="h-4 w-20 text-right" /></td>
                                                            <td className="px-4 py-4"><Skeleton className="h-4 w-20 text-right" /></td>
                                                            <td className="px-4 py-4"><Skeleton className="h-4 w-24 text-right" /></td>
                                                            <td className="px-4 py-4"><Skeleton className="h-6 w-16 mx-auto rounded-full" /></td>
                                                        </tr>
                                                    ))
                                                ) : stockItems.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="px-4 py-12 text-center">
                                                            <div className="flex flex-col items-center justify-center">
                                                                <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                                                <h3 className="text-lg font-medium">No stock movements found</h3>
                                                                <p className="text-sm text-muted-foreground mt-1 mb-6">
                                                                    Stock movements will appear here once synchronized.
                                                                </p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    stockItems.map((item: any, index: number) => (
                                                        <tr key={index} className="hover:bg-muted/30 transition-colors group">
                                                            <td className="px-4 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 rounded-lg bg-muted text-foreground">
                                                                        <Package className="h-4 w-4" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium text-foreground">{item.itemNm}</div>
                                                                        <div className="text-xs text-muted-foreground">{item.pkgUnitCd}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 font-mono text-xs">{item.itemCd}</td>
                                                            <td className="px-4 py-4 text-right tabular-nums text-muted-foreground">0</td>
                                                            <td className="px-4 py-4 text-right tabular-nums text-green-600 font-medium">
                                                                +{item.qty}
                                                            </td>
                                                            <td className="px-4 py-4 text-right tabular-nums text-red-600 font-medium">0</td>
                                                            <td className="px-4 py-4 text-right font-bold tabular-nums">
                                                                {item.qty}
                                                            </td>
                                                            <td className="px-4 py-4 text-center">
                                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                                    Synced
                                                                </Badge>
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
            </div>
        </ETimsInitializationGuard>
    );
}
