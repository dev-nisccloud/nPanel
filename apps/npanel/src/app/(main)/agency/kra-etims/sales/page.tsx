"use client";

import * as React from "react";
import {
    FileText,
    Search,
    RefreshCw,
    QrCode,
    CheckCircle2,
    AlertCircle,
    MoreVertical,
    Download,
    Eye,
    ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ETimsInitializationGuard } from "@/components/etims/etims-initialization-guard";

export default function ETimsSalesPage() {
    const [selectedTeamId, setSelectedTeamId] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState("");

    const utils = trpc.useUtils();

    // Fetch eTIMS signed invoices from KRA
    // Fetch eTIMS signed invoices from KRA
    const { data: salesData, isLoading, refetch } = trpc.etims.sales.getSalesTransactions.useQuery({
        teamId: selectedTeamId!,
        lastReqDt: "20230101000000",
    }, {
        enabled: !!selectedTeamId // Disable until we have settings/team selected
    });

    const invoices = salesData?.data?.itemList || [];

    const filteredInvoices = React.useMemo(() => {
        if (!searchQuery.trim()) return invoices;
        const query = searchQuery.toLowerCase().trim();
        return invoices.filter((inv: any) =>
            inv.invcNo.toString().toLowerCase().includes(query) ||
            inv.custNm?.toLowerCase().includes(query) ||
            inv.rcptNo?.toLowerCase().includes(query)
        );
    }, [invoices, searchQuery]);

    return (
        <ETimsInitializationGuard>
            <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl font-semibold tracking-tight">KRA Sales Records</h1>
                        <p className="text-muted-foreground">
                            Manage and verify tax-signed invoices transmitted to KRA eTIMS.
                        </p>
                    </div>

                    <Tabs defaultValue="signed" className="mt-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <TabsList>
                                <TabsTrigger value="signed">Signed Invoices</TabsTrigger>
                                <TabsTrigger value="pending">Pending Signing</TabsTrigger>
                            </TabsList>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search invoice # or KRA ref..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => refetch()}
                                    disabled={isLoading}
                                >
                                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                                </Button>
                            </div>
                        </div>

                        <TabsContent value="signed" className="mt-6">
                            <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                        <tr>
                                            <th className="px-4 py-3">Invoice Details</th>
                                            <th className="px-4 py-3">KRA Ref #</th>
                                            <th className="px-4 py-3">Signed Date</th>
                                            <th className="px-4 py-3">Amount</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {isLoading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <tr key={i}>
                                                    <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                                                    <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                                                    <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                                                    <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
                                                    <td className="px-4 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                                                    <td className="px-4 py-4"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></td>
                                                </tr>
                                            ))
                                        ) : filteredInvoices.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-12 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <CheckCircle2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                                        <h3 className="text-lg font-medium">No signed invoices</h3>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            Invoices signed via eTIMS will appear here.
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredInvoices.map((invoice: any) => (
                                                <tr key={invoice.invcNo} className="hover:bg-muted/30 transition-colors group">
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 rounded-lg bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                                                <FileText className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-foreground">{invoice.invcNo}</div>
                                                                <div className="text-xs text-muted-foreground">{invoice.custNm || "Cash Sale"}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="font-mono text-xs text-muted-foreground">{invoice.rcptNo || "Pending"}</div>
                                                    </td>
                                                    <td className="px-4 py-4 text-muted-foreground">
                                                        {invoice.salesDt} {invoice.salesTime}
                                                    </td>
                                                    <td className="px-4 py-4 font-medium">
                                                        {invoice.totAmt.toLocaleString()} KES
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
                                                            SIGNED
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button variant="ghost" size="icon" title="View QR Code">
                                                                <QrCode className="h-4 w-4" />
                                                            </Button>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View Invoice</DropdownMenuItem>
                                                                    <DropdownMenuItem><Download className="mr-2 h-4 w-4" /> Download PDF</DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem><ExternalLink className="mr-2 h-4 w-4" /> Verify on KRA Portal</DropdownMenuItem>
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
                        </TabsContent>

                        <TabsContent value="pending" className="mt-6">
                            <div className="overflow-hidden rounded-lg border bg-card shadow-sm border-amber-100 dark:border-amber-900/30">
                                <div className="p-12 text-center bg-amber-50/30 dark:bg-amber-900/5">
                                    <AlertCircle className="h-12 w-12 text-amber-500/50 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium">Syncing with nPanel Invoices</h3>
                                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                                        All newly created nPanel invoices will be automatically queued for eTIMS signing if configured.
                                    </p>
                                    <Button className="mt-6" variant="outline">
                                        Configure Auto-Signing
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </ETimsInitializationGuard>
    );
}
