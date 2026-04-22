"use client";

import * as React from "react";
import {
    Plus,
    Search,
    RefreshCw,
    Tag,
    MoreVertical,
    Layers,
    Cloud,
    Box,
    Edit2,
    Trash2,
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
import { Textarea } from "@/components/ui/textarea";
import { RegisterDigitaxItemSheet } from "./agency.digitax/products/_components/register-digitax-item-sheet";

export default function DigitaxProductsPage() {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [isAddOpen, setIsAddOpen] = React.useState(false);
    const [selectedItem, setSelectedItem] = React.useState<any>(null);

    const utils = trpc.useUtils();

    const { data: itemsData, isLoading, refetch } = trpc.digitax.items.getAll.useQuery({
        page_size: 50,
    });

    const deleteItem = trpc.digitax.items.delete.useMutation({
        onSuccess: () => {
            toast.success("Product removed from eTIMS catalog");
            refetch();
        },
        onError: (err) => {
            toast.error(err.message || "Failed to remove product");
        },
    });

    // Robust data extraction
    const items = React.useMemo(() => {
        if (!itemsData) return [];
        // Handle potential nested data structure from API
        if (Array.isArray(itemsData)) return itemsData;
        if (itemsData.data && Array.isArray(itemsData.data)) return itemsData.data;
        if ((itemsData as any).result?.data?.data && Array.isArray((itemsData as any).result.data.data)) {
            return (itemsData as any).result.data.data;
        }
        if ((itemsData as any).result?.data && Array.isArray((itemsData as any).result.data)) {
            return (itemsData as any).result.data;
        }
        return [];
    }, [itemsData]);

    const filteredItems = React.useMemo(() => {
        if (!searchQuery.trim()) return items;
        const query = searchQuery.toLowerCase().trim();
        return items.filter((item: any) =>
            (item.item_name?.toLowerCase().includes(query) ?? false) ||
            (item.etims_item_code?.toLowerCase().includes(query) ?? false) ||
            (item.item_class_code?.toLowerCase().includes(query) ?? false)
        );
    }, [items, searchQuery]);

    const handleEdit = (item: any) => {
        setSelectedItem(item);
        setIsAddOpen(true);
    };

    const handleDelete = (itemId: string) => {
        if (confirm("Are you sure you want to remove this item? This action cannot be undone.")) {
            deleteItem.mutate({ itemId });
        }
    };

    const handleSheetClose = (open: boolean) => {
        setIsAddOpen(open);
        if (!open) setSelectedItem(null);
    };

    return (
        <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
            <RegisterDigitaxItemSheet 
                open={isAddOpen}
                onOpenChange={handleSheetClose}
                onSuccess={() => refetch()}
                item={selectedItem}
            />

            <div className="w-full max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-base font-semibold tracking-tight">Catalog & inventory</h1>
                        <p className="text-xs text-muted-foreground">
                            Manage items and services registered for eTIMS compliance.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => refetch()}
                            className="rounded-full h-9 w-9 border-border/50"
                            disabled={isLoading}
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                        <Button
                            onClick={() => {
                                setSelectedItem(null);
                                setIsAddOpen(true);
                            }}
                            className="bg-primary text-primary-foreground shadow-sm hover:shadow-md transition-all gap-2 h-9 text-xs font-medium px-4"
                        >
                            <Plus className="h-4 w-4" />
                            Add Product
                        </Button>
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-6">

                <div className="flex items-center gap-3 bg-muted/30 p-1.5 rounded-2xl border border-border/40 max-w-md shadow-inner">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <Input
                            placeholder="Search by name or code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-transparent border-none focus-visible:ring-0 h-9"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="p-5 rounded-2xl border border-border/50 bg-card/50 animate-pulse space-y-4">
                                <div className="flex justify-between items-start">
                                    <Skeleton className="h-10 w-10 rounded-xl" />
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-3/4 rounded" />
                                    <Skeleton className="h-3 w-1/2 rounded" />
                                </div>
                                <div className="pt-4 border-t border-border/20 flex justify-between items-center">
                                    <Skeleton className="h-4 w-20 rounded" />
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                </div>
                            </div>
                        ))
                    ) : filteredItems.length === 0 ? (
                        <div className="col-span-full py-24 bg-card/40 rounded-[2.5rem] border border-dashed border-border/60 flex flex-col items-center justify-center space-y-5">
                            <div className="h-20 w-20 rounded-[2rem] bg-muted/60 flex items-center justify-center text-muted-foreground/30">
                                <Box className="h-10 w-10" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold tracking-tight text-foreground/80">Catalogue is empty</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">Register products or services once to enable compliant invoicing.</p>
                            </div>
                            <Button variant="outline" onClick={() => setIsAddOpen(true)} className="rounded-full px-8 h-12">
                                Register First Item
                            </Button>
                        </div>
                    ) : (
                        filteredItems.map((item: any) => (
                            <div key={item.id} className="group p-6 rounded-[2rem] border border-border/50 bg-card hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all space-y-4 relative overflow-hidden flex flex-col">
                                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl">
                                            <DropdownMenuItem className="gap-2" onClick={() => handleEdit(item)}>
                                                <Edit2 className="h-3.5 w-3.5" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="gap-2 text-rose-500" onClick={() => handleDelete(item.id)}>
                                                <Trash2 className="h-3.5 w-3.5" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="flex justify-between items-start">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
                                        {item.item_type_code === '3' ? <Cloud className="h-5 w-5" /> : <Box className="h-5 w-5" />}
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-muted/50">
                                        Type {item.tax_type_code}
                                    </Badge>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="font-bold text-foreground/90 line-clamp-1">{item.item_name}</h3>
                                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{item.etims_item_code}</p>
                                </div>

                                <div className="pt-4 border-t border-border/20 flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-muted-foreground font-medium">Standard Price</span>
                                        <span className="font-bold text-lg">
                                            {item.default_unit_price?.toLocaleString() ?? "0"}
                                            <span className="text-[10px] font-normal ml-1">KES</span>
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-muted-foreground font-medium">HS Code</span>
                                        <span className="text-[11px] font-semibold text-foreground/70">{item.item_class_code}</span>
                                    </div>
                                </div>
                            </div>
                            )))
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}
