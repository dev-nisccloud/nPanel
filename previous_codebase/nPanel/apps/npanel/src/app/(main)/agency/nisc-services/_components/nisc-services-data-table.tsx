"use client";

import * as React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Search,
    Plus,
    EllipsisVertical,
    Pencil,
    Eye,
    Power,
    PowerOff,
    Trash2,
    LayoutGrid,
    Layers,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

import { AddEditProductSheet } from "./add-edit-product-sheet";
import { ViewProductSheet } from "./view-product-sheet";
import { ManagePlansSheet } from "./manage-plans-sheet";
import {
    getCategoryDisplayName,
    getCategoryBadgeClass,
} from "./nisc-services-utils";

// ── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
    return (
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="pl-6">Product / Service</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Service Type</TableHead>
                        <TableHead>Plans</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-12 pr-6" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell className="pl-6">
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-3 w-56" />
                                </div>
                            </TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                            <TableCell className="pr-6"><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

// ── Toolbar (search + filter + add button) ───────────────────────────────────

interface ToolbarProps {
    searchQuery: string;
    onSearchChange: (v: string) => void;
    categoryFilter: string;
    onCategoryChange: (v: string) => void;
    onAdd: () => void;
}

function Toolbar({
    searchQuery,
    onSearchChange,
    categoryFilter,
    onCategoryChange,
    onAdd,
}: ToolbarProps) {
    return (
        <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={categoryFilter} onValueChange={onCategoryChange}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All categories</SelectItem>
                        <SelectItem value="CLOUD">Cloud</SelectItem>
                        <SelectItem value="MARKETING">Marketing</SelectItem>
                        <SelectItem value="CONSULTING">Consulting</SelectItem>
                        <SelectItem value="CUSTOM">Custom</SelectItem>
                        <SelectItem value="AI">AI</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button onClick={onAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
            </Button>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export function NiscServicesDataTable() {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [categoryFilter, setCategoryFilter] = React.useState("ALL");

    // Sheet state
    const [addSheetOpen, setAddSheetOpen] = React.useState(false);
    const [editingProductId, setEditingProductId] = React.useState<string | null>(null);
    const [viewingProductId, setViewingProductId] = React.useState<string | null>(null);

    // Deactivate dialog
    const [deactivateDialogOpen, setDeactivateDialogOpen] = React.useState(false);
    const [productToDeactivate, setProductToDeactivate] = React.useState<{
        id: string;
        name: string;
    } | null>(null);

    // Delete dialog (inactive products only)
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [productToDelete, setProductToDelete] = React.useState<{
        id: string;
        name: string;
    } | null>(null);

    // Manage plans sheet (product whose plans we're editing)
    const [managePlansProductId, setManagePlansProductId] = React.useState<string | null>(null);

    const { data, isLoading, isError, error, refetch } = trpc.products.getAll.useQuery(
        categoryFilter !== "ALL" ? { category: categoryFilter as any } : undefined,
    );

    const utils = trpc.useUtils();

    const deactivate = trpc.products.update.useMutation({
        onSuccess: () => {
            toast.success("Product deactivated");
            setDeactivateDialogOpen(false);
            setProductToDeactivate(null);
            utils.products.getAll.invalidate();
        },
        onError: (err) => {
            toast.error(err.message || "Failed to deactivate product");
        },
    });

    const deleteProduct = trpc.products.delete.useMutation({
        onSuccess: () => {
            toast.success("Product deleted");
            setDeleteDialogOpen(false);
            setProductToDelete(null);
            utils.products.getAll.invalidate();
        },
        onError: (err) => {
            toast.error(err.message || "Failed to delete product");
        },
    });

    const reactivate = trpc.products.update.useMutation({
        onSuccess: () => {
            toast.success("Product reactivated");
            utils.products.getAll.invalidate();
        },
        onError: (err) => {
            toast.error(err.message || "Failed to reactivate product");
        },
    });

    const filteredData = React.useMemo(() => {
        if (!data) return [];
        if (!searchQuery.trim()) return data;
        const q = searchQuery.toLowerCase().trim();
        return data.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                (p.description?.toLowerCase() ?? "").includes(q) ||
                p.serviceType.toLowerCase().includes(q),
        );
    }, [data, searchQuery]);

    const handleAdd = () => {
        setEditingProductId(null);
        setAddSheetOpen(true);
    };

    const handleEdit = (id: string) => {
        setEditingProductId(id);
        setAddSheetOpen(true);
    };

    const handleView = (id: string) => {
        setViewingProductId(id);
    };

    const handleDeactivate = (id: string) => {
        const p = data?.find((x) => x.id === id);
        if (p) {
            setProductToDeactivate({ id: p.id, name: p.name });
            setDeactivateDialogOpen(true);
        }
    };

    const handleDelete = (id: string) => {
        const p = data?.find((x) => x.id === id);
        if (p) {
            setProductToDelete({ id: p.id, name: p.name });
            setDeleteDialogOpen(true);
        }
    };

    const handleReactivate = (id: string) => {
        reactivate.mutate({ id, isActive: true });
    };

    const handleManagePlans = (id: string) => {
        setManagePlansProductId(id);
    };

    const handleSheetClose = () => {
        setAddSheetOpen(false);
        setEditingProductId(null);
    };

    const handleSuccess = () => {
        refetch();
        handleSheetClose();
    };

    // ── Loading state ───────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Toolbar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    categoryFilter={categoryFilter}
                    onCategoryChange={setCategoryFilter}
                    onAdd={handleAdd}
                />
                <TableSkeleton />
            </div>
        );
    }

    // ── Error state ─────────────────────────────────────────────────────────────

    if (isError) {
        return (
            <div className="space-y-4">
                <Toolbar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    categoryFilter={categoryFilter}
                    onCategoryChange={setCategoryFilter}
                    onAdd={handleAdd}
                />
                <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <p className="text-sm text-muted-foreground mb-4">
                            {error?.message ?? "An error occurred while loading products"}
                        </p>
                        <Button onClick={() => refetch()} variant="outline">
                            Try Again
                        </Button>
                    </div>
                </div>
                <AddEditProductSheet
                    open={addSheetOpen}
                    onOpenChange={handleSheetClose}
                    productId={editingProductId}
                    onSuccess={handleSuccess}
                />
            </div>
        );
    }

    // ── Empty state ─────────────────────────────────────────────────────────────

    if (!data || data.length === 0) {
        return (
            <div className="space-y-4">
                <Toolbar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    categoryFilter={categoryFilter}
                    onCategoryChange={setCategoryFilter}
                    onAdd={handleAdd}
                />
                <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="mb-4 rounded-full bg-muted p-4">
                            <LayoutGrid className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-base font-semibold mb-1">No products found</h3>
                        <p className="text-sm text-muted-foreground mb-5">
                            Get started by creating your first Nisc product or service.
                        </p>
                        <Button onClick={handleAdd}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Product
                        </Button>
                    </div>
                </div>
                <AddEditProductSheet
                    open={addSheetOpen}
                    onOpenChange={handleSheetClose}
                    productId={editingProductId}
                    onSuccess={handleSuccess}
                />
            </div>
        );
    }

    // ── Loaded state ────────────────────────────────────────────────────────────

    return (
        <div className="space-y-4">
            <Toolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                categoryFilter={categoryFilter}
                onCategoryChange={setCategoryFilter}
                onAdd={handleAdd}
            />

            <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-6">Product / Service</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Service Type</TableHead>
                            <TableHead>Features</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-12 pr-6" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No products match your search
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((product) => {
                                const isProcessing =
                                    (deactivate.isPending && deactivate.variables?.id === product.id) ||
                                    (deleteProduct.isPending && deleteProduct.variables?.id === product.id) ||
                                    (reactivate.isPending && reactivate.variables?.id === product.id);
                                return (
                                    <TableRow
                                        key={product.id}
                                        className="cursor-pointer"
                                        onClick={() => handleView(product.id)}
                                    >
                                        <TableCell className="pl-6">
                                            <div>
                                                <p className="font-medium">{product.name}</p>
                                                {product.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 max-w-xs">
                                                        {product.description}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={getCategoryBadgeClass(product.category)}
                                            >
                                                {getCategoryDisplayName(product.category)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {product.serviceType.replace(/_/g, " ")}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {(product.features as any[]).length > 0
                                                ? `${(product.features as any[]).length} feature${(product.features as any[]).length === 1 ? "" : "s"}`
                                                : " "}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    product.isActive
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800"
                                                        : "bg-muted text-muted-foreground"
                                                }
                                            >
                                                {product.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell
                                            onClick={(e) => e.stopPropagation()}
                                            className="pr-6"
                                        >
                                            {isProcessing ? (
                                                <div className="flex items-center justify-center p-2">
                                                    <Spinner className="h-4 w-4" />
                                                </div>
                                            ) : (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <EllipsisVertical className="h-4 w-4" />
                                                            <span className="sr-only">Actions</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem onSelect={() => handleView(product.id)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => handleEdit(product.id)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => handleManagePlans(product.id)}>
                                                            <Layers className="mr-2 h-4 w-4" />
                                                            Manage plans
                                                        </DropdownMenuItem>
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            {product.isActive ? (
                                                                <DropdownMenuItem
                                                                    onSelect={() => handleDeactivate(product.id)}
                                                                    className="text-destructive focus:text-destructive"
                                                                >
                                                                    <PowerOff className="mr-2 h-4 w-4" />
                                                                    Deactivate
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <>
                                                                    <DropdownMenuItem
                                                                        onSelect={() => handleReactivate(product.id)}
                                                                    >
                                                                        <Power className="mr-2 h-4 w-4" />
                                                                        Reactivate
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onSelect={() => handleDelete(product.id)}
                                                                        className="text-destructive focus:text-destructive"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create / Edit sheet */}
            <AddEditProductSheet
                open={addSheetOpen}
                onOpenChange={handleSheetClose}
                productId={editingProductId}
                onSuccess={handleSuccess}
            />

            {/* View sheet */}
            <ViewProductSheet
                productId={viewingProductId}
                onClose={() => setViewingProductId(null)}
                onEdit={(id) => {
                    setViewingProductId(null);
                    handleEdit(id);
                }}
                onManagePlans={(id) => {
                    setViewingProductId(null);
                    setManagePlansProductId(id);
                }}
            />

            {/* Manage plans sheet */}
            <ManagePlansSheet
                open={!!managePlansProductId}
                onOpenChange={(open) => !open && setManagePlansProductId(null)}
                productId={managePlansProductId}
                onSuccess={() => refetch()}
            />

            {/* Deactivate dialog */}
            <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate product?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will deactivate <strong>{productToDeactivate?.name}</strong> and hide it
                            from new subscriptions. Existing subscriptions are unaffected. You can
                            permanently delete it afterwards.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deactivate.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() =>
                                productToDeactivate &&
                                deactivate.mutate({ id: productToDeactivate.id, isActive: false })
                            }
                            disabled={deactivate.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deactivate.isPending ? (
                                <><Spinner className="mr-2 h-4 w-4" />Deactivating...</>
                            ) : (
                                "Deactivate"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete dialog (inactive products only) */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Permanently delete product?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete <strong>{productToDelete?.name}</strong>.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteProduct.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() =>
                                productToDelete && deleteProduct.mutate({ id: productToDelete.id })
                            }
                            disabled={deleteProduct.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteProduct.isPending ? (
                                <><Spinner className="mr-2 h-4 w-4" />Deleting...</>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
