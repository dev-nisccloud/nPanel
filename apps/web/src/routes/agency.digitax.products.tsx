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

    const utils = trpc.useUtils();

    const { data: itemsData, isLoading, refetch } = trpc.digitax.items.getAll.useQuery({
        page_size: 20,
    });

    const items = itemsData?.data ?? [];

    const filteredItems = React.useMemo(() => {
        if (!searchQuery.trim()) return items;
        const query = searchQuery.toLowerCase().trim();
        return items.filter((item: any) =>
            (item.item_name?.toLowerCase().includes(query) ?? false) ||
            (item.etims_item_code?.toLowerCase().includes(query) ?? false) ||
            (item.item_class_code?.toLowerCase().includes(query) ?? false)
        );
    }, [items, searchQuery]);

    return (
        <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
            <RegisterDigitaxItemSheet 
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
                onSuccess={() => refetch()}
            />

            <div className="w-full max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground/90">Products & Inventory</h1>
                        <p className="text-muted-foreground text-sm">
                            Manage items and services registered for eTIMS compliance.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => refetch()}
                            className="rounded-full"
                            disabled={isLoading}
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                        <Button
                            onClick={() => setIsAddOpen(true)}
                            className="bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-none transition-all gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Product
                        </Button>
                    </div>
                </div>

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
                                            <DropdownMenuItem className="gap-2">
                                                <Edit2 className="h-3.5 w-3.5" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="gap-2 text-rose-500">
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
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
