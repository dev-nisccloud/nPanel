"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

import { HostingPlansCardsList } from "./hosting-plans-cards";
import { useHostingPlans } from "./use-service-plans";
import { AddEditHostingPlanSheet } from "./add-edit-hosting-plan-sheet";

// Skeleton component for loading state
function HostingPlansTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      
      {/* Cards skeleton */}
      <div className="rounded-lg border bg-card">
        <ScrollArea className="h-[600px]">
          <div className="p-4">
            <div className="grid gap-4 grid-cols-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-lg border p-6">
                  {/* Card header skeleton */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                  
                  {/* Card content skeleton */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-24" />
                      <div className="flex gap-1">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-18" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// Error component
function HostingPlansTableError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Failed to load service plans</h3>
          <p className="text-sm text-muted-foreground">
            {error.message || "An error occurred while loading service plans"}
          </p>
        </div>
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

  // Delete mutation
  const deletePlan = trpc.hostingPlans.delete.useMutation({
    onSuccess: () => {
      toast.success("Service plan deleted successfully", {
        description: `${planToDelete?.name} has been deleted.`,
      });
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
      // Invalidate queries to refresh the list
      utils.hostingPlans.getAll.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to delete service plan", {
        description: error.message || "Please try again.",
      });
    },
  });

  // Filter data based on search query
  const filteredData = React.useMemo(() => {
    if (!data) return [];
    let filtered = data;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((plan) =>
        plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
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
    if (planToDelete) {
      deletePlan.mutate({ id: planToDelete.id });
    }
  };

  const handleSheetClose = () => {
    setIsAddSheetOpen(false);
    setEditingPlanId(null);
  };

  const handleSuccess = () => {
    refetch();
    handleSheetClose();
  };

  // Show loading state
  if (isLoading) {
    return <HostingPlansTableSkeleton />;
  }

  // Show error state
  if (isError) {
    return <HostingPlansTableError error={error as Error} onRetry={() => refetch()} />;
  }

  // Show empty state
  if (!data || data.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
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
            Add Plan
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No service plans found</h3>
              <p className="text-sm text-muted-foreground">
                Get started by creating your first NISC service plan
              </p>
            </div>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search service plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <Badge variant="outline" className="text-muted-foreground">
              {filteredData.length} of {data.length}
            </Badge>
          )}
        </div>
        <Button onClick={() => setIsAddSheetOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service Plan
        </Button>
      </div>
      
      {/* Cards implementation */}
      <div className="rounded-lg border bg-card">
        <ScrollArea className="h-[600px]">
          <div className="p-4">
            <HostingPlansCardsList
              data={filteredData}
              onViewDetails={(id) => {
                // Navigate to details page (if needed in the future)
                console.log("View plan:", id);
              }}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </ScrollArea>
      </div>

      <AddEditHostingPlanSheet
        open={isAddSheetOpen}
        onOpenChange={handleSheetClose}
        planId={editingPlanId}
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the service plan <strong>{planToDelete?.name}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePlan.isPending}>
              Cancel
            </AlertDialogCancel>
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
                  "Delete Service Plan"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

