"use client";

import * as React from "react";
import {
    BarChart3,
    CheckCircle2,
    AlertCircle,
    Settings2,
    PlusCircle,
    Search,
    RefreshCw,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ETimsInitializationGuard } from "@/components/etims/etims-initialization-guard";


export default function ETimsDashboardPage() {
    const [selectedTeamId, setSelectedTeamId] = React.useState<string | null>(null);

    // In a real scenario, we would get the teamId from context or active team selector
    // For now, we'll assume we have a way to get it.

    // Placeholder for settings until we implement fetch procedure
    const settings = { isInitialized: false, isSandbox: true, deviceSerialNumber: "" };

    // Fetch recent transactions
    const { data: salesData, isLoading: isLoadingSales } = trpc.etims.sales.getSalesTransactions.useQuery({
        teamId: selectedTeamId!,
        lastReqDt: "20230101000000",
    }, {
        enabled: !!selectedTeamId // enable when team is selected
    });

    return (
        <ETimsInitializationGuard>
            <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-base font-semibold tracking-tight">KRA eTIMS Dashboard</h1>
                        <p className="text-xs text-muted-foreground">
                            Monitor your KRA eTIMS compliance, connection status, and transaction telemetry.
                        </p>
                    </div>

                    {/* Telemetry Section */}
                    {/* ... (rest of the content is preserved inside) ... */}
                    <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-card shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">KRA Connection</CardTitle>
                                <div className={`h-2 w-2 rounded-full ${settings?.isInitialized ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-gray-300"}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{settings?.isInitialized ? "Online" : "Not Configured"}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {settings?.isSandbox ? "Sandbox Mode" : "Production Mode"}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-card shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Device Status</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{settings?.isInitialized ? "Initialized" : "Pending"}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Serial: {settings?.deviceSerialNumber || "N/A"}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-card shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Signed Invoices</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Last 30 days
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-card shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Stock Health</CardTitle>
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Healthy</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Last synced: Never
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-6">
                        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <Link href="/agency/kra-etims/settings" className="group">
                                <Card className="h-full bg-card shadow-sm hover:border-primary transition-colors">
                                    <CardContent className="p-6 flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                            <Settings2 className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium group-hover:text-primary transition-colors">Setup eTIMS</h3>
                                            <p className="text-sm text-muted-foreground">Configure API keys and initialize device.</p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                                    </CardContent>
                                </Card>
                            </Link>

                            <Link href="/agency/kra-etims/products" className="group">
                                <Card className="h-full bg-card shadow-sm hover:border-primary transition-colors">
                                    <CardContent className="p-6 flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                            <PlusCircle className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium group-hover:text-primary transition-colors">Register Service</h3>
                                            <p className="text-sm text-muted-foreground">Map services to KRA classification codes.</p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                                    </CardContent>
                                </Card>
                            </Link>

                            <Link href="/agency/kra-etims/sales" className="group">
                                <Card className="h-full bg-card shadow-sm hover:border-primary transition-colors">
                                    <CardContent className="p-6 flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                            <Search className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium group-hover:text-primary transition-colors">Verify Sale</h3>
                                            <p className="text-sm text-muted-foreground">Check the status of a signed invoice.</p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                                    </CardContent>
                                </Card>
                            </Link>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Recent Transactions</h2>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/agency/kra-etims/sales">View All</Link>
                            </Button>
                        </div>
                        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                            {isLoadingSales ? (
                                <div className="p-8 text-center text-muted-foreground">Loading transactions...</div>
                            ) : salesData?.data?.itemList && salesData.data.itemList.length > 0 ? (
                                <div className="relative w-full overflow-auto">
                                    <table className="w-full caption-bottom text-sm">
                                        <thead className="[&_tr]:border-b">
                                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Invoice No</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Customer</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Amount</th>
                                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="[&_tr:last-child]:border-0">
                                            {salesData.data.itemList.map((sale: any, index: number) => (
                                                <tr key={index} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 align-middle">{sale.invcNo}</td>
                                                    <td className="p-4 align-middle">{sale.custNm || "Cash Sale"}</td>
                                                    <td className="p-4 align-middle">{sale.salesDt}</td>
                                                    <td className="p-4 align-middle text-right">{sale.totAmt.toLocaleString()}</td>
                                                    <td className="p-4 align-middle text-right">
                                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Success</Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                        <h3 className="text-lg font-medium">No recent transactions</h3>
                                        <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                                            Invoices signed through eTIMS will appear here once you've completed setup.
                                        </p>
                                        <Button variant="outline" className="mt-6" asChild>
                                            <Link href="/agency/kra-etims/settings">Complete Setup</Link>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ETimsInitializationGuard>
    );
}
