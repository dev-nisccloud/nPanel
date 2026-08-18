"use client";

import { captureEvent } from "@/lib/posthog";

import * as React from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetClose,
} from "@/components/npanel-ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
import { XIcon, Plus, MoreHorizontal, Pencil, PowerOff, Package, Layers, Settings2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { getPricingModelDisplayName, getBillingCycleDisplayName } from "./nisc-services-utils";
import { AddEditPlanSheet } from "./add-edit-plan-sheet";
import { AddEditPlanUsageSheet } from "./add-edit-plan-usage-sheet";

interface ManagePlansSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    productId: string | null;
    productName?: string;
    onSuccess?: () => void;
}

type PlanItem = {
    id: string;
    name: string;
    description: string | null;
    pricingModel: string;
    billingCycle: string | null;
    price: string | null;
    currency: string | null;
    commissionRate: unknown;
    commissionBase: string | null;
    isActive: boolean;
    isDefault: boolean;
    sortOrder: number;
};

export function ManagePlansSheet({
    open,
    onOpenChange,
    productId,
    productName: productNameProp,
    onSuccess,
}: ManagePlansSheetProps) {
    const [addEditPlanOpen, setAddEditPlanOpen] = React.useState(false);
    const [editingPlanId, setEditingPlanId] = React.useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [planToDelete, setPlanToDelete] = React.useState<{ id: string; name: string } | null>(null);
    const [usageSheetOpen, setUsageSheetOpen] = React.useState(false);
    const [usagePlanId, setUsagePlanId] = React.useState<string | null>(null);
    const [existingUsageId, setExistingUsageId] = React.useState<string | null>(null);

    const { data: product, isLoading, refetch } = trpc.products.getById.useQuery(
        { id: productId!, includePlans: true },
        { enabled: open && !!productId },
    );

    const { data: planUsages } = trpc.products.listPlanUsages.useQuery(
        { productId: productId ?? undefined },
        { enabled: open && !!productId },
    );

    const usageByPlanId = React.useMemo(() => {
        const list = planUsages ?? [];
        const m: Record<string, (typeof list)[number]> = {};
        for (const u of list) {
            if (!m[u.productPlanId]) m[u.productPlanId] = u;
        }
        return m;
    }, [planUsages]);

    const utils = trpc.useUtils();
    const deletePlan = trpc.products.deletePlan.useMutation({
        onSuccess: () => {
            toast.success("Plan deactivated");
            setDeleteDialogOpen(false);
            setPlanToDelete(null);
            utils.products.getById.invalidate({ id: productId!, includePlans: true });
            refetch();
            onSuccess?.();
        },
        onError: (e) => toast.error(e.message || "Failed to deactivate plan"),
    });

    const productName = productNameProp ?? product?.name ?? "Product";
    const plans: PlanItem[] = Array.isArray((product as { plans?: PlanItem[] })?.plans)
        ? (product as { plans: PlanItem[] }).plans
        : [];
    const productFeatures = Array.isArray(product?.features)
        ? (product.features as Array<{ key: string; label: string; description?: string }>)
        : [];
    const productCategory = (product as { category?: string })?.category ?? "CUSTOM";

    const handleAddPlan = () => {
        setEditingPlanId(null);
        setAddEditPlanOpen(true);
    };

    const handleEditPlan = (planId: string) => {
        setEditingPlanId(planId);
        setAddEditPlanOpen(true);
    };

    const handleDeletePlan = (plan: PlanItem) => {
        setPlanToDelete({ id: plan.id, name: plan.name });
        setDeleteDialogOpen(true);
    };

    const handlePlanSheetSuccess = () => {
        refetch();
        utils.products.listPlanUsages.invalidate();
        onSuccess?.();
    };

    const handleCreateUsage = (planId: string) => {
        setUsagePlanId(planId);
        setExistingUsageId(null);
        setUsageSheetOpen(true);
    };

    const handleEditUsage = (planId: string, usageId: string) => {
        setUsagePlanId(planId);
        setExistingUsageId(usageId);
        setUsageSheetOpen(true);
    };

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="overflow-y-auto">
                    <SheetHeader className="mb-6 flex justify-between items-center flex-row">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <Layers className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <SheetTitle>Manage plans</SheetTitle>
                                <SheetDescription>
                                    Add and edit pricing plans for {productName}
                                </SheetDescription>
                            </div>
                        </div>
                        <SheetClose asChild>
                            <Button size="icon" variant="ghost" className="p-0 m-0 size-auto hover:bg-transparent">
                                <XIcon className="size-5" />
                            </Button>
                        </SheetClose>
                    </SheetHeader>

                    {!productId ? (
                        <p className="text-sm text-muted-foreground">No product selected.</p>
                    ) : isLoading || !product ? (
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <Button onClick={handleAddPlan}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add plan
                                </Button>
                            </div>

                            {plans.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                        <Package className="h-10 w-10 text-muted-foreground mb-3" />
                                        <p className="text-sm font-medium">No plans yet</p>
                                        <p className="text-xs text-muted-foreground mt-1 mb-4">
                                            Add pricing plans so clients can subscribe to this product.
                                        </p>
                                        <Button onClick={handleAddPlan} variant="outline">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add first plan
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-3">
                                    {plans
                                        .sort((a, b) => a.sortOrder - b.sortOrder)
                                        .map((plan) => (
                                            <Card key={plan.id}>
                                                <CardHeader className="pb-2">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                                                                {plan.name}
                                                                {plan.isDefault && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        Default
                                                                    </Badge>
                                                                )}
                                                                {!plan.isActive && (
                                                                    <Badge variant="outline" className="text-muted-foreground">
                                                                        Inactive
                                                                    </Badge>
                                                                )}
                                                            </CardTitle>
                                                            {plan.description && (
                                                                <CardDescription className="mt-0.5">{plan.description}</CardDescription>
                                                            )}
                                                        </div>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                    <span className="sr-only">Actions</span>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onSelect={() => handleEditPlan(plan.id)}>
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                {usageByPlanId[plan.id] ? (
                                                                    <DropdownMenuItem
                                                                        onSelect={() =>
                                                                            handleEditUsage(plan.id, usageByPlanId[plan.id].id)
                                                                        }
                                                                    >
                                                                        <Settings2 className="mr-2 h-4 w-4" />
                                                                        Edit usage
                                                                    </DropdownMenuItem>
                                                                ) : (
                                                                    <DropdownMenuItem onSelect={() => handleCreateUsage(plan.id)}>
                                                                        <Settings2 className="mr-2 h-4 w-4" />
                                                                        Create usage
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {plan.isActive && (
                                                                    <DropdownMenuItem
                                                                        onSelect={() => handleDeletePlan(plan)}
                                                                        className="text-destructive focus:text-destructive"
                                                                    >
                                                                        <PowerOff className="mr-2 h-4 w-4" />
                                                                        Deactivate
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="pt-0">
                                                    <div className="flex flex-wrap gap-2 text-sm">
                                                        <Badge variant="outline">
                                                            {getPricingModelDisplayName(plan.pricingModel)}
                                                        </Badge>
                                                        {plan.pricingModel === "FIXED" && (
                                                            <>
                                                                <span className="text-muted-foreground">
                                                                    {getBillingCycleDisplayName(plan.billingCycle)}
                                                                </span>
                                                                {plan.price != null && plan.price !== "" && (
                                                                    <span>
                                                                        {plan.currency ?? "KES"} {plan.price}
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}
                                                        {plan.pricingModel === "COMMISSION" && plan.commissionRate != null && (
                                                            <span>
                                                                {Number(plan.commissionRate)}%
                                                                {plan.commissionBase ? ` of ${plan.commissionBase}` : ""}
                                                            </span>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                </div>
                            )}
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            <AddEditPlanSheet
                open={addEditPlanOpen}
                onOpenChange={setAddEditPlanOpen}
                productId={productId ?? ""}
                productName={productName}
                productCategory={productCategory}
                productFeatures={productFeatures}
                planId={editingPlanId}
                onSuccess={handlePlanSheetSuccess}
            />

            <AddEditPlanUsageSheet
                open={usageSheetOpen}
                onOpenChange={setUsageSheetOpen}
                productId={productId ?? ""}
                productPlanId={usagePlanId ?? ""}
                planName={plans.find((p) => p.id === usagePlanId)?.name ?? "Plan"}
                existingUsageId={existingUsageId}
                onSuccess={handlePlanSheetSuccess}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate plan?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will deactivate <strong>{planToDelete?.name}</strong>. The plan will no longer be
                            available for new subscriptions. Existing subscriptions are unaffected.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletePlan.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => planToDelete && deletePlan.mutate({ id: planToDelete.id })}
                            disabled={deletePlan.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deletePlan.isPending ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Deactivating...
                                </>
                            ) : (
                                "Deactivate"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
