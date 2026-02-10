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

export default function ETimsDashboardPage() {
    const [selectedTeamId, setSelectedTeamId] = React.useState<string | null>(null);

    // In a real scenario, we would get the teamId from context or active team selector
    // For now, we'll assume we have a way to get it.

    const { data: settings, isLoading: isLoadingSettings } = trpc.invoicing.getETimsSettings.useQuery(
        { teamId: selectedTeamId || "" },
        { enabled: !!selectedTeamId }
    );

    return (
        <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
            <div className="w-full max-w-7xl mx-auto">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight">KRA eTIMS Dashboard</h1>
                    <p className="text-muted-foreground">
                        Monitor your KRA eTIMS compliance, connection status, and transaction telemetry.
                    </p>
                </div>

                {/* Telemetry Section */}
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
                    </div>
                </div>
            </div>
        </div>
    );
}
