"use client";

import * as React from "react";
import {
    Plus,
    Search,
    RefreshCw,
    Tag,
    MoreVertical,
    Cloud,
    Box,
    Eye,
    Pencil,
    Trash2,
    Layers,
    Warehouse,
} from "lucide-react";
import { Link } from "react-router";
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ETimsInitializationGuard } from "@/components/etims/etims-initialization-guard";
import { ETimsBranchSwitcher } from "@/components/etims/etims-branch-switcher";
import { RegisterETimsItemSheet } from "./agency.kra-etims/products/_components/register-etims-item-sheet";
import { ViewETimsItemSheet } from "./agency.kra-etims/products/_components/view-etims-item-sheet";
import { SaveETimsCompositionSheet } from "./agency.kra-etims/products/_components/save-etims-composition-sheet";
import { SaveETimsStockMasterSheet } from "./agency.kra-etims/stock/_components/save-etims-stock-master-sheet";
import {
    compareItemsNewestFirst,
    formatItemTableDateTime,
    isFinishedProduct,
    isServiceItem,
    itemToSavePayload,
    itemTypeLabel,
    type EtimsItemRecord,
} from "./agency.kra-etims/products/_components/etims-item-utils";

export default function ETimsProductsPage() {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [typeFilter, setTypeFilter] = React.useState<"all" | "1" | "2" | "3">("all");
    const [showInactive, setShowInactive] = React.useState(false);
    const [selectedBhfId, setSelectedBhfId] = React.useState<string | null>(null);
    const [isRegisterOpen, setIsRegisterOpen] = React.useState(false);
    const [isViewOpen, setIsViewOpen] = React.useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
    const [isCompositionOpen, setIsCompositionOpen] = React.useState(false);
    const [isStockOpen, setIsStockOpen] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState<EtimsItemRecord | null>(null);
    const [viewingItem, setViewingItem] = React.useState<EtimsItemRecord | null>(null);
    const [itemToDelete, setItemToDelete] = React.useState<EtimsItemRecord | null>(null);
    const [compositionParent, setCompositionParent] = React.useState<EtimsItemRecord | null>(null);
    const [stockItem, setStockItem] = React.useState<EtimsItemRecord | null>(null);

    const { data: etimsConfig } = trpc.etims.auth.getConfiguration.useQuery();
    const { data: branchesData } = trpc.etims.branch.getBranchList.useQuery({ lastReqDt: "20230101000000" });

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

    const { data: items, isLoading, refetch } = trpc.etims.items.getItemList.useQuery({
        lastReqDt: "20230101000000",
    });

    const itemList = React.useMemo(() => {
        const root: any = items;
        const payload = root?.data?.responseBody?.data ?? root?.data ?? root?.responseBody?.data ?? root;
        const data: any = payload?.data ?? payload;
        const list = data?.itemList ?? [];
        const all = Array.isArray(list) ? list : [];
        return all.sort(compareItemsNewestFirst);
    }, [items]);

    const filteredItems = React.useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        return itemList.filter((item: EtimsItemRecord) => {
            if (!showInactive && item.useYn === "N") return false;
            if (typeFilter === "3" && !isServiceItem(item)) return false;
            if (typeFilter === "1" && item.itemTyCd !== "1" && !/^[A-Z]{2}1/.test(item.itemCd)) return false;
            if (typeFilter === "2" && item.itemTyCd !== "2" && !/^[A-Z]{2}2/.test(item.itemCd)) return false;
            if (!query) return true;
            return (
                String(item.itemNm ?? "").toLowerCase().includes(query) ||
                String(item.itemCd ?? "").toLowerCase().includes(query) ||
                String(item.itemClsCd ?? "").toLowerCase().includes(query)
            );
        });
    }, [itemList, searchQuery, typeFilter, showInactive]);

    const openCreate = () => {
        setEditingItem(null);
        setIsRegisterOpen(true);
    };

    const openEdit = (item: EtimsItemRecord) => {
        setEditingItem(item);
        setIsRegisterOpen(true);
    };

    const openView = (item: EtimsItemRecord) => {
        setViewingItem(item);
        setIsViewOpen(true);
    };

    const requestDelete = (item: EtimsItemRecord) => {
        setIsViewOpen(false);
        setItemToDelete(item);
        setIsDeleteOpen(true);
    };

    const deactivateItem = trpc.etims.items.saveItem.useMutation({
        onSuccess: (res: any) => {
            if (res?.success === false) {
                if (res?.requiresReinitialization) {
                    toast.error("KRA session expired  re-initialize your device in Settings, then try again.");
                } else {
                    toast.error(res?.errorMessage ?? "Failed to delete product");
                }
                return;
            }
            const body = res?.data?.responseBody ?? res?.data ?? res;
            if (body?.resultCd && body.resultCd !== "000" && body.resultCd !== "001") {
                toast.error(body?.resultMsg ?? "Failed to delete product");
                return;
            }
            toast.success("Product removed from KRA eTIMS");
            setIsDeleteOpen(false);
            setItemToDelete(null);
            refetch();
        },
        onError: (err) => toast.error(err.message || "Failed to delete product"),
    });

    const confirmDelete = () => {
        if (!itemToDelete) return;
        try {
            deactivateItem.mutate({
                item: itemToSavePayload(itemToDelete, { useYn: "N" }),
            });
        } catch (e) {
            toast.error((e as Error).message || "Invalid item data");
        }
    };

    return (
        <ETimsInitializationGuard>
            <RegisterETimsItemSheet
                open={isRegisterOpen}
                onOpenChange={(open) => {
                    setIsRegisterOpen(open);
                    if (!open) setEditingItem(null);
                }}
                initialItem={editingItem}
                onSuccess={() => refetch()}
            />

            <SaveETimsCompositionSheet
                open={isCompositionOpen}
                onOpenChange={(open) => {
                    setIsCompositionOpen(open);
                    if (!open) setCompositionParent(null);
                }}
                items={itemList}
                initialParent={compositionParent}
            />

            <SaveETimsStockMasterSheet
                open={isStockOpen}
                onOpenChange={(open) => {
                    setIsStockOpen(open);
                    if (!open) setStockItem(null);
                }}
                items={itemList}
                initialItem={stockItem}
                onSuccess={() => void refetch()}
            />

            <ViewETimsItemSheet
                open={isViewOpen}
                onOpenChange={(open) => {
                    setIsViewOpen(open);
                    if (!open) setViewingItem(null);
                }}
                item={viewingItem}
                onEdit={openEdit}
                onDeleteRequest={requestDelete}
            />

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete product?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3 text-sm text-muted-foreground">
                                <p>
                                    You are about to remove{" "}
                                    <span className="font-semibold text-foreground">{itemToDelete?.itemNm}</span>{" "}
                                    (<span className="font-mono">{itemToDelete?.itemCd}</span>) from your active KRA catalog.
                                </p>
                                <p>
                                    KRA eTIMS has no hard-delete endpoint for items. This sends{" "}
                                    <code className="text-xs">/saveItem</code> with{" "}
                                    <code className="text-xs">useYn=N</code> to mark the item inactive on KRA.
                                </p>
                                <p className="font-medium text-foreground">
                                    The item will disappear from active lists. You can re-register it later with a new item code if needed.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deactivateItem.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deactivateItem.isPending}
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDelete();
                            }}
                        >
                            {deactivateItem.isPending ? (
                                <>
                                    <Spinner size={16} className="mr-2" />
                                    Removing...
                                </>
                            ) : (
                                "Delete product"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                            <div className="flex flex-col gap-2">
                                <h1 className="text-base font-semibold tracking-tight">Products & Services</h1>
                                <p className="text-xs text-muted-foreground">
                                    Register raw materials, finished products, and services with KRA eTIMS. Set on-hand quantity on Stock taking, or in the register sheet for goods.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 w-full">
                            <div className="relative flex-1 max-w-sm w-full">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, code or HS category..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <select
                                className="h-9 rounded-md border bg-background px-3 text-sm"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                            >
                                <option value="all">All types</option>
                                <option value="1">Raw material</option>
                                <option value="2">Finished product</option>
                                <option value="3">Service</option>
                            </select>
                            <Button
                                type="button"
                                variant={showInactive ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => setShowInactive((v) => !v)}
                            >
                                {showInactive ? "Hiding inactive" : "Show inactive"}
                            </Button>
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
                                <Button variant="outline" asChild>
                                    <Link to="/agency/kra-etims/stock">
                                        <Warehouse className="mr-2 h-4 w-4" />
                                        Stock taking
                                    </Link>
                                </Button>
                                <Button className="flex-1 md:flex-none" onClick={openCreate}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Register item
                                </Button>
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                        <tr>
                                            <th className="px-4 py-3">Item Descriptor</th>
                                            <th className="px-4 py-3">KRA Code</th>
                                            <th className="px-4 py-3">Classification</th>
                                            <th className="px-4 py-3">Tax Type</th>
                                            <th className="px-4 py-3">Registered</th>
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
                                                    <td className="px-4 py-4"><Skeleton className="h-4 w-40" /></td>
                                                    <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
                                                    <td className="px-4 py-4"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></td>
                                                </tr>
                                            ))
                                        ) : filteredItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-12 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <Tag className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                                        <h3 className="text-lg font-medium">No items registered</h3>
                                                        <p className="text-sm text-muted-foreground mt-1 mb-6">
                                                            Register a raw material, finished product, or service on KRA eTIMS.
                                                        </p>
                                                        <Button variant="outline" size="sm" onClick={openCreate}>
                                                            <Plus className="mr-2 h-3 w-3" />
                                                            Register first item
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredItems.map((item: EtimsItemRecord) => {
                                                const isService = item.itemTyCd === "3";
                                                return (
                                                    <tr key={item.itemCd} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`p-2 rounded-lg ${isService ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                                                                    {isService ? <Cloud className="h-4 w-4" /> : <Box className="h-4 w-4" />}
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-foreground">{item.itemNm}</div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {itemTypeLabel(item.itemTyCd)} · {item.pkgUnitCd ?? ""}
                                                                    </div>
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
                                                                Type {item.taxTyCd ?? ""}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-4 text-xs text-muted-foreground whitespace-normal max-w-[260px]">
                                                            {formatItemTableDateTime(item) || "-"}
                                                        </td>
                                                        <td className="px-4 py-4 font-medium">
                                                            {item.dftPrc ? `KES ${item.dftPrc}` : "Dynamic"}
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => openView(item)}>
                                                                        <Eye className="mr-2 h-4 w-4" />
                                                                        View product
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => openEdit(item)}>
                                                                        <Pencil className="mr-2 h-4 w-4" />
                                                                        Edit item
                                                                    </DropdownMenuItem>
                                                                    {!isService ? (
                                                                        <DropdownMenuItem onClick={() => {
                                                                            setStockItem(item);
                                                                            setIsStockOpen(true);
                                                                        }}>
                                                                            <Warehouse className="mr-2 h-4 w-4" />
                                                                            Set quantity
                                                                        </DropdownMenuItem>
                                                                    ) : null}
                                                                    {isFinishedProduct(item) ? (
                                                                        <DropdownMenuItem onClick={() => {
                                                                            setCompositionParent(item);
                                                                            setIsCompositionOpen(true);
                                                                        }}>
                                                                            <Layers className="mr-2 h-4 w-4" />
                                                                            Made from
                                                                        </DropdownMenuItem>
                                                                    ) : null}
                                                                    <DropdownMenuSeparator />
                                                                    {item.useYn === "N" ? (
                                                                        <DropdownMenuItem
                                                                            onClick={() => {
                                                                                try {
                                                                                    deactivateItem.mutate({
                                                                                        item: itemToSavePayload(item, { useYn: "Y" }),
                                                                                    });
                                                                                } catch (e) {
                                                                                    toast.error((e as Error).message || "Invalid item data");
                                                                                }
                                                                            }}
                                                                        >
                                                                            Reactivate item
                                                                        </DropdownMenuItem>
                                                                    ) : (
                                                                        <DropdownMenuItem
                                                                            className="text-destructive focus:text-destructive"
                                                                            onClick={() => requestDelete(item)}
                                                                        >
                                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                                            Deactivate item
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </td>
                                                    </tr>
                                                );
                                            })
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
