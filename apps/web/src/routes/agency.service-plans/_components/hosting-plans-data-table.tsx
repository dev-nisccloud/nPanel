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
import { Search, Plus, EllipsisVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

import { useHostingPlans } from "./use-service-plans";
import { AddEditHostingPlanSheet } from "./add-edit-hosting-plan-sheet";
import { getPlanTypeDisplayName, getBillingCycleDisplayName } from "./service-plans-utils";

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Plan Name</TableHead>
            <TableHead>Plan Type</TableHead>
            <TableHead>Billing</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12 pr-6"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell className="pl-6">
                <Skeleton className="h-4 w-36" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell className="pr-6">
                <Skeleton className="h-8 w-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TableError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          {error.message || "An error occurred while loading service plans"}
        </p>
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      </div>
    </div>
  );
}

export function HostingPlansDataTable() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isAddSheetOpen, setIsAddSheetOpen] = React.useState(false);
  const [editingPlanId, setEditingPlanId] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [planToDelete, setPlanToDelete] = React.useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, isError, error, refetch } = useHostingPlans();
  const utils = trpc.useUtils();

  const deletePlan = trpc.hostingPlans.delete.useMutation({
    onSuccess: () => {
      toast.success("Service plan deleted successfully");
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
      utils.hostingPlans.getAll.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete service plan");
    },
  });

  const filteredData = React.useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase().trim();
    return data.filter(
      (plan) =>
        plan.name.toLowerCase().includes(q) ||
        (plan.description?.toLowerCase() || "").includes(q)
    );
  }, [data, searchQuery]);

  const handleEdit = (id: string) => {
    setEditingPlanId(id);
    setIsAddSheetOpen(true);
  };

  const handleDelete = (id: string) => {
    const plan = data?.find((p) => p.id === id);
    if (plan) {
      setPlanToDelete({ id: plan.id, name: plan.name });
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = () => {
    if (planToDelete) deletePlan.mutate({ id: planToDelete.id });
  };

  const handleSheetClose = () => {
    setIsAddSheetOpen(false);
    setEditingPlanId(null);
  };

  const handleSuccess = () => {
    refetch();
    handleSheetClose();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search service plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsAddSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Service Plan
          </Button>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (isError) {
    const errMsg = error?.message || (error as unknown as Error)?.message || "An error occurred";
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search service plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsAddSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Service Plan
          </Button>
        </div>
        <TableError error={new Error(errMsg)} onRetry={() => refetch()} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search service plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsAddSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Service Plan
          </Button>
        </div>
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <h3 className="text-lg font-semibold mb-1">No service plans found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by creating your first NISC service plan
            </p>
            <Button onClick={() => setIsAddSheetOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Service Plan
            </Button>
          </div>
        </div>
        <AddEditHostingPlanSheet
          open={isAddSheetOpen}
          onOpenChange={handleSheetClose}
          planId={editingPlanId}
          onSuccess={handleSuccess}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search service plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => { setEditingPlanId(null); setIsAddSheetOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service Plan
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Plan Name</TableHead>
              <TableHead>Plan Type</TableHead>
              <TableHead>Billing</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12 pr-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No service plans match your search
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((plan) => (
                <TableRow
                  key={plan.id}
                  className="cursor-pointer"
                  onClick={() => handleEdit(plan.id)}
                >
                  <TableCell className="pl-6 font-medium">
                    {plan.name}
                  </TableCell>
                  <TableCell>
                    {getPlanTypeDisplayName(plan.planType)}
                  </TableCell>
                  <TableCell>
                    {getBillingCycleDisplayName(plan.billingCycle)}
                  </TableCell>
                  <TableCell>
                    {plan.niscPrice != null
                      ? `${plan.niscCurrency} ${plan.niscPrice}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        plan.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800"
                          : ""
                      }
                    >
                      {plan.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} className="pr-6">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <EllipsisVertical className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onSelect={() => handleEdit(plan.id)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => handleDelete(plan.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TooltipTrigger>
                        <TooltipContent>Actions</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddEditHostingPlanSheet
        open={isAddSheetOpen}
        onOpenChange={handleSheetClose}
        planId={editingPlanId}
        onSuccess={handleSuccess}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete service plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{planToDelete?.name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePlan.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deletePlan.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePlan.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Deleting...
                </>
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
