"use client";

import * as React from "react";
import {
    Search,
    User,
    Building2,
    MapPin,
    Phone,
    Mail,
    FileText,
    History,
    MoreVertical,
    ExternalLink,
    RefreshCw,
    SearchCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ETimsInitializationGuard } from "@/components/etims/etims-initialization-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ETimsCustomersPage() {
    const [tinSearch, setTinSearch] = React.useState("");
    const [lookupTin, setLookupTin] = React.useState<string | null>(null);

    const { data: customerData, isFetching, error } = trpc.etims.data.lookupCustomer.useQuery(
        { custmTin: lookupTin ?? "" },
        { enabled: !!lookupTin, retry: false }
    );

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!tinSearch.trim()) return;
        setLookupTin(tinSearch.trim().toUpperCase());
    };

    const customer: any = React.useMemo(() => {
        const root: any = customerData;
        const payload = root?.data?.responseBody?.data ?? root?.data ?? root?.responseBody?.data ?? root;
        return payload?.data ?? payload;
    }, [customerData]);

    return (
        <ETimsInitializationGuard>
            <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl font-semibold tracking-tight">KRA Customer Directory</h1>
                        <p className="text-muted-foreground text-sm">
                            Look up and verify customer tax identities directly from KRA eTIMS registry.
                        </p>
                    </div>

                    <div className="mt-8 flex flex-col lg:flex-row gap-8">
                        {/* Search Sidebar */}
                        <div className="w-full lg:w-96 space-y-4">
                            <Card className="border-border/40 shadow-sm overflow-hidden">
                                <CardHeader className="bg-muted/30">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <SearchCode className="h-4 w-4 text-primary" />
                                        TIN Lookup
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Verify a customer by entering their KRA PIN/TIN.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <form onSubmit={handleSearch} className="space-y-4">
                                        <div className="space-y-2">
                                            <Input
                                                placeholder="e.g. A012345678Z"
                                                value={tinSearch}
                                                onChange={(e) => setTinSearch(e.target.value)}
                                                className="uppercase font-mono"
                                            />
                                        </div>
                                        <Button type="submit" className="w-full" disabled={isFetching}>
                                            {isFetching ? (
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Search className="h-4 w-4 mr-2" />
                                                    Verify Identity
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                                        <Building2 className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-primary">Verified Sources</p>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            Data is retrieved in real-time from the KRA eTIMS central database to ensure 100% compliance.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Results Area */}
                        <div className="flex-1 min-w-0">
                            {isFetching ? (
                                <div className="flex flex-col items-center justify-center py-24 space-y-4">
                                    <Spinner size={32} className="text-primary" />
                                    <p className="text-sm text-muted-foreground animate-pulse font-medium">
                                        Interrogating KRA registry...
                                    </p>
                                </div>
                            ) : customer?.custmNm ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Identity Card */}
                                        <Card className="border-border/40 shadow-xl shadow-foreground/5 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4">
                                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
                                                    VERIFIED
                                                </Badge>
                                            </div>
                                            <CardHeader>
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                        <User className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg font-bold">{customer.custmNm}</CardTitle>
                                                        <p className="text-xs font-mono text-muted-foreground tracking-widest">{customer.custmTin}</p>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="flex items-start gap-3 text-sm">
                                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                    <div>
                                                        <p className="font-medium">Registered Address</p>
                                                        <p className="text-muted-foreground text-xs">{customer.adrs || "N/A"}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Contact Card */}
                                        <Card className="border-border/40 shadow-md">
                                            <CardHeader>
                                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-primary" />
                                                    Contact Details
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/20">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span>Email</span>
                                                    </div>
                                                    <span className="text-xs font-medium">{customer.email || "—"}</span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/20">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span>Telephone</span>
                                                    </div>
                                                    <span className="text-xs font-medium">{customer.telNo || "—"}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Actions & Insights */}
                                    <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                                        <Button variant="outline" size="sm" className="gap-2 h-9 text-xs">
                                            <FileText className="h-3.5 w-3.5" />
                                            Statement
                                        </Button>
                                        <Button variant="outline" size="sm" className="gap-2 h-9 text-xs">
                                            <History className="h-3.5 w-3.5" />
                                            Invoices
                                        </Button>
                                        <Button variant="secondary" size="sm" className="gap-2 h-9 text-xs ml-auto">
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            KRA Portal
                                        </Button>
                                    </div>
                                </div>
                            ) : lookupTin ? (
                                <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
                                    <div className="h-16 w-16 rounded-full bg-rose-100 dark:bg-rose-900/20 text-rose-600 flex items-center justify-center border-4 border-white dark:border-black shadow-lg">
                                        <User className="h-8 w-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-lg">Customer Not Found</p>
                                        <p className="text-sm text-muted-foreground max-w-sm">
                                            The identity <span className="font-mono font-bold text-foreground underline decoration-rose-500/30">{lookupTin}</span> was not found in the KRA registry. Please verify the TIN and try again.
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setLookupTin(null)}>
                                        Clear Search
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-40 text-center opacity-40">
                                    <div className="h-20 w-20 rounded-[2rem] bg-muted flex items-center justify-center mb-6">
                                        <Building2 className="h-10 w-10" />
                                    </div>
                                    <h3 className="text-xl font-semibold">No Customer Selected</h3>
                                    <p className="text-sm max-w-[280px] mt-2">
                                        Enter a KRA PIN in the search box to verify a customer identity.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ETimsInitializationGuard>
    );
}
