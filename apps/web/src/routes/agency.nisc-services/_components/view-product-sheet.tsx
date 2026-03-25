"use client";

import * as React from "react";
import {
    Sheet,
    SheetContent,
    SheetClose,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/npanel-ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { XIcon, Pencil, CheckCircle2, XCircle, Package, Layers } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { getCategoryDisplayName, getCategoryBadgeClass } from "./nisc-services-utils";

interface ViewProductSheetProps {
    productId: string | null;
    onClose: () => void;
    onEdit: (id: string) => void;
    onManagePlans?: (id: string) => void;
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function ViewSkeleton() {
    return (
        <div className="space-y-5 px-1">
            <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-72" />
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-1">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-5 w-28" />
                    </div>
                ))}
            </div>
            <Separator />
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                ))}
            </div>
        </div>
    );
}

// ── Detail row ────────────────────────────────────────────────────────────────

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <div className="text-sm">{children}</div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ViewProductSheet({ productId, onClose, onEdit, onManagePlans }: ViewProductSheetProps) {
    const open = !!productId;

    const { data: product, isLoading } = trpc.products.getById.useQuery(
        { id: productId!, includePlans: false },
        { enabled: !!productId },
    );

    const displayFeatures = Array.isArray(product?.features) ? product.features as Array<{
        key: string;
        label: string;
        description?: string;
    }> : [];

    const displayHighlights = Array.isArray(product?.highlights) ? product.highlights as string[] : [];

    const metaData = product?.metadata as { isPopular?: boolean; isRecommended?: boolean } | null;

    return (
        <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
            <SheetContent className="overflow-y-auto">
                {/* Header */}
                <SheetHeader className="mb-6 flex justify-between items-center flex-row">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <SheetTitle className="text-2xl font-bold">Product Details</SheetTitle>
                            <SheetDescription className="text-base">
                                Full details of this service product
                            </SheetDescription>
                        </div>
                    </div>
                    <SheetClose asChild>
                        <Button size="icon" variant="ghost" className="p-0 m-0 size-auto hover:bg-transparent">
                            <XIcon className="size-5" />
                        </Button>
                    </SheetClose>
                </SheetHeader>

                {isLoading || !product ? (
                    <ViewSkeleton />
                ) : (
                    <div className="space-y-5 px-1">

                        {/* Actions */}
                        <div className="flex justify-end gap-2">
                            {onManagePlans && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onManagePlans(product.id)}
                                >
                                    <Layers className="mr-2 h-3.5 w-3.5" />
                                    Manage plans
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(product.id)}
                            >
                                <Pencil className="mr-2 h-3.5 w-3.5" />
                                Edit Product
                            </Button>
                        </div>

                        {/* Name + Description */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-start justify-between gap-2">
                                    <span>{product.name}</span>
                                    <Badge
                                        variant="outline"
                                        className={
                                            product.isActive
                                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800 shrink-0"
                                                : "bg-muted text-muted-foreground shrink-0"
                                        }
                                    >
                                        {product.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </CardTitle>
                                {product.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                                )}
                            </CardHeader>
                        </Card>

                        {/* Classification */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    Classification
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <DetailRow label="Category">
                                    <Badge variant="outline" className={getCategoryBadgeClass(product.category)}>
                                        {getCategoryDisplayName(product.category)}
                                    </Badge>
                                </DetailRow>
                                <DetailRow label="Service Type">
                                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                                        {product.serviceType}
                                    </span>
                                </DetailRow>
                                <DetailRow label="Sort Order">
                                    <span>{product.sortOrder}</span>
                                </DetailRow>
                                <DetailRow label="Product ID">
                                    <span className="font-mono text-xs text-muted-foreground">{product.id}</span>
                                </DetailRow>
                            </CardContent>
                        </Card>

                        {/* Badges */}
                        {(metaData?.isPopular || metaData?.isRecommended) && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Badges
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-wrap gap-2">
                                    {metaData?.isPopular && (
                                        <Badge variant="secondary">⭐ Popular</Badge>
                                    )}
                                    {metaData?.isRecommended && (
                                        <Badge variant="secondary">✓ Recommended</Badge>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Features */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    Product Features ({displayFeatures.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {displayFeatures.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No features defined yet.</p>
                                ) : (
                                    <div className="divide-y">
                                        {displayFeatures.map((f, i) => (
                                            <div key={i} className="py-2.5 first:pt-0 last:pb-0">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                                    <p className="text-sm font-medium">{f.label}</p>
                                                    <span className="font-mono text-xs text-muted-foreground ml-auto">
                                                        {f.key}
                                                    </span>
                                                </div>
                                                {f.description && (
                                                    <p className="text-xs text-muted-foreground mt-0.5 ml-5">
                                                        {f.description}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Highlights */}
                        {displayHighlights.length > 0 && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Marketing Highlights
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-wrap gap-2">
                                    {displayHighlights.map((h, i) => (
                                        <Badge key={i} variant="outline">{h}</Badge>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Timestamps */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    Record Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <DetailRow label="Created">
                                    {new Intl.DateTimeFormat("en-KE", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    }).format(new Date(product.createdAt))}
                                </DetailRow>
                                <DetailRow label="Last Updated">
                                    {new Intl.DateTimeFormat("en-KE", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    }).format(new Date(product.updatedAt))}
                                </DetailRow>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
