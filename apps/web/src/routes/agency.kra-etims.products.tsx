"use client";

import * as React from "react";
import {
    Plus,
    Search,
    RefreshCw,
    Tag,
    ShieldCheck,
    MoreVertical,
    Layers,
    Cloud,
    Box
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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert
import { ETimsInitializationGuard } from "@/components/etims/etims-initialization-guard";
import { ETimsBranchSwitcher } from "@/components/etims/etims-branch-switcher";
import { RegisterETimsItemSheet } from "./agency.kra-etims/products/_components/register-etims-item-sheet";

export default function ETimsProductsPage() {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedBhfId, setSelectedBhfId] = React.useState<string | null>(null);
    const [isRegisterOpen, setIsRegisterOpen] = React.useState(false);

    const utils = trpc.useUtils();

    const { data: etimsConfig } = trpc.etims.auth.getConfiguration.useQuery();
    const { data: branchesData } = trpc.etims.data.getBranchList.useQuery({ lastReqDt: "20230101000000" });

    const branches = React.useMemo(() => {
        const root: any = branchesData;
        const payload = root?.data?.responseBody?.data ?? root?.data ?? root?.responseBody?.data ?? root;
        const data: any = payload?.data ?? payload;
        const bhfList = data?.bhfList ?? [];
        return bhfList.map((b: any) => ({ bhfId: b.bhfId, bhfNm: b.bhfNm }));
    }, [branchesData]);

    React.useEffect(() => {
        if (selectedBhfId) return;
        const defaultBhfId = (etimsConfig as any)?.config?.branchId;
        if (defaultBhfId) setSelectedBhfId(defaultBhfId);
        else if (branches.length) setSelectedBhfId(branches[0].bhfId);
    }, [selectedBhfId, etimsConfig, branches]);

    const { data: items, isLoading, refetch } = trpc.etims.items.getItemInfo.useQuery({
        lastReqDt: "20230101000000", // This ideally should be managed to fetch incremental updates? Or just fetch all?
        bhfId: selectedBhfId ?? undefined,
    });

    const itemList = React.useMemo(() => {
        // API shape is: { success: true, data: <kraResponse> }
        // And KRA may wrap response: { responseBody: { data: { itemList: [...] } } }
        const root: any = items;
        const payload = root?.data?.responseBody?.data ?? root?.data ?? root?.responseBody?.data ?? root;
        const data: any = payload?.data ?? payload;
        return data?.itemList ?? [];
    }, [items]);

    const filteredItems = React.useMemo(() => {
        if (!itemList) return [];
        if (!searchQuery.trim()) return itemList;
        const query = searchQuery.toLowerCase().trim();
        return itemList.filter((item: any) =>
            item.itemNm.toLowerCase().includes(query) ||
            item.itemCd.toLowerCase().includes(query) ||
            item.itemClsCd.toLowerCase().includes(query)
        );
    }, [itemList, searchQuery]);

    return (
        <ETimsInitializationGuard>
            <RegisterETimsItemSheet
                open={isRegisterOpen}
                onOpenChange={setIsRegisterOpen}
                onSuccess={() => refetch()}
            />
            <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                            <div className="flex flex-col gap-2">
                                <h1 className="text-2xl font-semibold tracking-tight">Products & Services</h1>
                                <p className="text-muted-foreground">
                                    Manage the classification and registration of your local items with KRA eTIMS.
                                </p>
                            </div>
                        </div>

                        {/* Search and Actions */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-sm w-full">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, code or HS category..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                {selectedBhfId && branches.length ? (
                                    <ETimsBranchSwitcher
                                        branches={branches}
                                        value={selectedBhfId}
                                        onChange={(bhfId) => {
                                            const deviceBhfId = (etimsConfig as any)?.config?.branchId;
                                            if (deviceBhfId && bhfId !== deviceBhfId) {
                                                toast.error(`This device is only valid for branch ${deviceBhfId}. Re-initialize eTIMS for branch ${bhfId} to use it.`);
                                                return;
                                            }
                                            setSelectedBhfId(bhfId);
                                            setTimeout(() => refetch(), 0);
                                        }}
                                    />
                                ) : null}
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => refetch()}
                                    disabled={isLoading}
                                >
                                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                                </Button>
                                <Button className="flex-1 md:flex-none" onClick={() => setIsRegisterOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Register Service
                                </Button>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="mt-6">
                            <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                        <tr>
                                            <th className="px-4 py-3">Item Descriptor</th>
                                            <th className="px-4 py-3">KRA Code</th>
                                            <th className="px-4 py-3">Classification</th>
                                            <th className="px-4 py-3">Tax Type</th>
                                            <th className="px-4 py-3">Price</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {isLoading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <tr key={i}>
                                                    <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                                                    <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                                                    <td className="px-4 py-4"><Skeleton className="h-4 w-40" /></td>
                                                    <td className="px-4 py-4"><Skeleton className="h-6 w-12 rounded-full" /></td>
                                                    <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
                                                    <td className="px-4 py-4"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></td>
                                                </tr>
                                            ))
                                        ) : filteredItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-12 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <Tag className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                                        <h3 className="text-lg font-medium">No services registered</h3>
                                                        <p className="text-sm text-muted-foreground mt-1 mb-6">
                                                            Map your first hosting or startup service to get started.
                                                        </p>
                                                        <Button variant="outline" size="sm" onClick={() => setIsRegisterOpen(true)}>
                                                            <Plus className="mr-2 h-3 w-3" />
                                                            Register First Item
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredItems.map((item: any) => (
                                                <tr key={item.itemCd} className="hover:bg-muted/30 transition-colors group">
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${item.isService ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                                                                {item.isService ? <Cloud className="h-4 w-4" /> : <Box className="h-4 w-4" />}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-foreground">{item.itemNm}</div>
                                                                <div className="text-xs text-muted-foreground">{item.pkgUnitCd}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 font-mono text-xs">{item.itemCd}</td>
                                                    <td className="px-4 py-4">
                                                        <div className="text-xs max-w-[200px] truncate" title={item.itemClsCd}>
                                                            {item.itemClsCd}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <Badge variant="outline" className={`
                                                                    ${item.taxTyCd === "A" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" : ""}
                                                                    ${item.taxTyCd === "B" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" : ""}
                                                                    ${item.taxTyCd === "C" ? "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800" : ""}
                                                                `}>
                                                            Type {item.taxTyCd}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-4 font-medium">
                                                        {item.dftPrc ? `KES ${item.dftPrc}` : "Dynamic"}
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Item Options</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem>Update Mapping</DropdownMenuItem>
                                                                <DropdownMenuItem>View KRA History</DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="text-destructive">Unregister</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table >
                            </div >
                        </div >
                    </div >
                </div >
            </div >
        </ETimsInitializationGuard>
    );
}
