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
    Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ETimsStockPage() {
    const [selectedTeamId, setSelectedTeamId] = React.useState<string | null>(null);

    // Placeholder for stock health metrics
    const isLoading = false;
    const stockItems: any[] = [];

    return (
        <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
            <div className="w-full max-w-7xl mx-auto">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight">Inventory Control</h1>
                    <p className="text-muted-foreground">
                        Monitor and adjust stock levels transmitted to KRA eTIMS for compliance.
                    </p>
                </div>

                {/* Stock Summary Metrics */}
                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                                {stockItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <Package className="h-12 w-12 text-muted-foreground/20 mb-4" />
                                                <h3 className="text-lg font-medium">No stock records</h3>
                                                <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                                                    Stock tracking is only required for physical products. Service-type items are excluded from inventory control.
                                                </p>
                                                <Button variant="outline" className="mt-6" size="sm">
                                                    Configure Stock Rules
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    // Map items here
                                    null
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CheckCircle2(props: any) {
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
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
