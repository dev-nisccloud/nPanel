"use client";

import * as React from "react";
import { Plus, Trash2, Search, RefreshCw } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SubdomainCardsList } from "./subdomains-cards";
import { subdomainSchema } from "./subdomains-schema";
import { useSubdomainsByDomain } from "./use-subdomains-by-domain";
import { AddSubdomainSheet } from "./add-subdomain-sheet";
import { ViewSubdomainSheet } from "./view-subdomain-sheet";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
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

interface SubdomainsTableProps {
  domainName: string;
}

// Loading skeleton component
function SubdomainsTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:justify-between">
        <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:flex-1">
          <Skeleton className="h-10 flex-1 @sm/main:max-w-sm" />
          <Skeleton className="h-10 w-full @sm/main:w-[200px]" />
        </div>
        <div className="flex flex-wrap items-center gap-2 @sm/main:flex-nowrap">
          <Skeleton className="h-10 w-32" />
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
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Skeleton className="h-4 w-4 flex-shrink-0" />
                      <Skeleton className="h-5 w-64" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                  
                  {/* Card content skeleton */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-3 w-3" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-3 w-3" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-3 w-3" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional info skeleton */}
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-20" />
                        <div className="flex gap-1">
                          <Skeleton className="h-4 w-12" />
                          <Skeleton className="h-4 w-16" />
                        </div>
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
function SubdomainsTableError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-destructive/10 p-3 mb-4">
        <RefreshCw className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Failed to load subdomains</h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        {error.message || "An unexpected error occurred while fetching subdomains."}
      </p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}

export function SubdomainsTable({ domainName }: SubdomainsTableProps) {
  const { data: subdomainsData, isLoading, isError, error, refetch } = useSubdomainsByDomain(domainName);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [isAddSubdomainOpen, setIsAddSubdomainOpen] = React.useState(false);
  const [isViewSubdomainOpen, setIsViewSubdomainOpen] = React.useState(false);
  const [subdomainToView, setSubdomainToView] = React.useState<z.infer<typeof subdomainSchema> | null>(null);
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [subdomainToDelete, setSubdomainToDelete] = React.useState<{
    id?: number;
    name?: string;
  } | null>(null);

  // tRPC mutation for deleting subdomain
  const deleteSubdomain = trpc.plesk.subdomainsDelete.delete.useMutation({
    onSuccess: () => {
      toast.success("Subdomain deleted successfully!");
      setDeleteDialogOpen(false);
      setSubdomainToDelete(null);
      refetch();
    },
    onError: (error: any) => {
      console.error("Error deleting subdomain:", error);
      
      let errorMessage = "Please try again.";
      
      if (error?.data?.code === "BAD_REQUEST") {
        errorMessage = error.message || "Invalid subdomain data.";
      } else if (error?.data?.code === "UNAUTHORIZED") {
        errorMessage = "Authentication failed. Please check your Plesk credentials.";
      } else if (error?.data?.code === "SERVICE_UNAVAILABLE") {
        errorMessage = "Plesk server is currently unavailable. Please try again later.";
      } else if (error?.data?.code === "INTERNAL_SERVER_ERROR") {
        errorMessage = "Server error occurred while deleting subdomain.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error("Failed to delete subdomain", {
        description: errorMessage,
      });
    },
  });

  const filteredData = React.useMemo(() => {
    if (!subdomainsData) return [];
    
    let filtered = subdomainsData;

    if (searchTerm.trim()) {
      filtered = filtered.filter((item) =>
        (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.parent && item.parent.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter((item) => item.status === "ok");
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter((item) => item.status !== "ok");
      } else if (statusFilter === "ssl_enabled") {
        filtered = filtered.filter((item) => item.properties?.ssl);
      } else if (statusFilter === "php_enabled") {
        filtered = filtered.filter((item) => item.properties?.php);
      }
    }

    return filtered;
  }, [subdomainsData, searchTerm, statusFilter]);

  const handleView = (data: z.infer<typeof subdomainSchema>) => {
    setSubdomainToView(data);
    setIsViewSubdomainOpen(true);
  };

  const handleDelete = (id: number | undefined) => {
    // Find the subdomain data to get the name
    const subdomain = subdomainsData?.find((item) => item.id === id);
    if (subdomain) {
      setSubdomainToDelete({
        id: subdomain.id,
        name: subdomain.name,
      });
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!subdomainToDelete) return;
    
    try {
      await deleteSubdomain.mutateAsync({
        id: subdomainToDelete.id,
        name: subdomainToDelete.name,
      });
    } catch (error: any) {
      // Error handling is done in the mutation's onError callback
      console.error("Error in confirmDelete:", error);
    }
  };

  if (isLoading) {
    return <SubdomainsTableSkeleton />;
  }

  if (isError) {
    return <SubdomainsTableError error={error as Error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:justify-between">
        <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:flex-1">
          <div className="relative flex-1 @sm/main:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search subdomains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full @sm/main:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="ssl_enabled">SSL Enabled</SelectItem>
              <SelectItem value="php_enabled">PHP Enabled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 @sm/main:flex-nowrap">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsAddSubdomainOpen(true)}
            className="flex-shrink-0 min-w-0"
          >
            <Plus className="h-4 w-4 @sm/main:mr-2" />
            <span className="hidden @sm/main:inline">Add Subdomain</span>
            <span className="@sm/main:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Cards grid implementation */}
      <div className="p-4">
        <SubdomainCardsList
          data={filteredData}
          onView={handleView}
          onDelete={handleDelete}
          cols={3}
        />
      </div>

      {/* Add Subdomain Sheet */}
      <AddSubdomainSheet 
        open={isAddSubdomainOpen}
        onOpenChange={setIsAddSubdomainOpen}
        domainName={domainName}
        onSuccess={refetch}
      />

      {/* View Subdomain Sheet */}
      <ViewSubdomainSheet
        open={isViewSubdomainOpen}
        onOpenChange={(newOpen) => {
          setIsViewSubdomainOpen(newOpen);
          if (!newOpen) {
            // Clear the subdomain data when sheet closes
            setSubdomainToView(null);
          }
        }}
        data={subdomainToView}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subdomain</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the subdomain{" "}
              <span className="font-semibold text-foreground">
                {subdomainToDelete?.name}
              </span>
              ? This action cannot be undone and will permanently remove the subdomain
              and all its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={deleteSubdomain.isPending}
              onClick={() => {
                setDeleteDialogOpen(false);
                setSubdomainToDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteSubdomain.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSubdomain.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Deleting...
                </>
              ) : (
                "Delete Subdomain"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}