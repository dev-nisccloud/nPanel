"use client";

import * as React from "react";
import { Plus, Trash2, Search, RefreshCw } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { trpc } from "@/utils/trpc";
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
import { Spinner } from "@/components/ui/shadcn-io/spinner";

// Table imports (commented out for performance)
// import { DataTable as DataTableNew } from "../../../../../components/data-table/data-table";
// import { DataTablePagination } from "../../../../../components/data-table/data-table-pagination";
// import { DataTableViewOptions } from "../../../../../components/data-table/data-table-view-options";
// import { withDndColumn } from "../../../../../components/data-table/table-utils";
// import { dnsColumns } from "./dns-columns";

import { ScrollArea } from "@/components/ui/scroll-area";
import { DnsCardsList } from "./dns-cards";
import { dnsRecordSchema } from "./dns-schema";
import { useDnsBySiteId } from "./use-dns-by-site-id";
import { AddDnsRecordSheet } from "./add-dns-record-sheet";

interface DnsTableProps {
  siteId: number;
}

// Loading skeleton component
function DnsTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:justify-between">
        <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center">
          <Skeleton className="h-10 w-full @sm/main:w-80" />
          <Skeleton className="h-10 w-full @sm/main:w-[180px]" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      
      {/* Cards skeleton */}
      <div className="rounded-lg border bg-card">
        <ScrollArea className="h-[850px]">
          <div className="p-4">
            <div className="grid gap-4 grid-cols-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-lg border p-6">
                  {/* Card header skeleton */}
                  <div className="flex items-start justify-between mb-4">
                    <Skeleton className="h-5 w-48" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                  
                  {/* Card content skeleton */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-8" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-full" />
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
function DnsTableError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-red-100 p-3 mb-4">
        <Trash2 className="h-6 w-6 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load DNS records</h3>
      <p className="text-gray-600 mb-4 max-w-md">
        {error.message || "An error occurred while fetching DNS records. Please try again."}
      </p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  );
}

export function DnsTable({ siteId }: DnsTableProps) {
  const { data: dnsData, isLoading, isError, error, refetch } = useDnsBySiteId(siteId);
  
  const [searchTerm, setSearchTerm] = React.useState("");
  const [recordTypeFilter, setRecordTypeFilter] = React.useState("all");
  const [isAddRecordOpen, setIsAddRecordOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [recordToDelete, setRecordToDelete] = React.useState<{ id: number; host: string; type: string } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // tRPC mutation for deleting DNS record
  const deleteDnsRecord = trpc.plesk.dnsDelete.delete.useMutation({
    onSuccess: () => {
      toast.success("DNS record deleted successfully!");
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
      setIsDeleting(false);
      // Refetch DNS data after successful deletion
      refetch();
    },
    onError: (error) => {
      console.error("Error deleting DNS record:", error);
      setIsDeleting(false);
      
      // Handle different types of errors
      let errorMessage = "Please try again.";
      
      if (error?.data?.code === "BAD_REQUEST") {
        errorMessage = error.message || "Invalid DNS record ID.";
      } else if (error?.data?.code === "UNAUTHORIZED") {
        errorMessage = "Authentication failed. Please check your Plesk credentials.";
      } else if (error?.data?.code === "SERVICE_UNAVAILABLE") {
        errorMessage = "Plesk server is currently unavailable. Please try again later.";
      } else if (error?.data?.code === "INTERNAL_SERVER_ERROR") {
        errorMessage = "Server error occurred while deleting DNS record.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error("Failed to delete DNS record", {
        description: errorMessage,
      });
    },
  });

  const filteredData = React.useMemo(() => {
    if (!dnsData) return [];
    
    let filtered = dnsData;

    if (searchTerm.trim()) {
      filtered = filtered.filter((item) =>
        (item.host || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.value || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (recordTypeFilter !== "all") {
      filtered = filtered.filter((item) => (item.type || "") === recordTypeFilter);
    }

    return filtered;
  }, [dnsData, searchTerm, recordTypeFilter]);

  // Table implementation (commented out for performance)
  // const columns = withDndColumn(dnsColumns);
  // const table = useDataTableInstance({ 
  //   data: filteredData, 
  //   columns, 
  //   getRowId: (row) => row.id?.toString() || `dns-${Math.random()}` 
  // });

  // const selectedRows = table.getFilteredSelectedRowModel().rows;
  // const selectedCount = selectedRows.length;

  // const handleDeleteSelected = () => {
  //   // TODO: Implement actual deletion via API
  //   console.log("Delete selected records:", selectedRows.map(row => row.original.id));
  //   table.resetRowSelection();
  // };

  const handleEdit = (id: number | undefined) => {
    console.log("Edit DNS record:", id);
    // TODO: Implement edit functionality
  };

  const handleDelete = (id: number | undefined) => {
    if (!id) return;
    
    // Find the record to get its details for the confirmation dialog
    const record = dnsData?.find(r => r.id === id);
    if (record) {
      setRecordToDelete({
        id: record.id!,
        host: record.host || "Unknown",
        type: record.type || "Unknown"
      });
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    
    setIsDeleting(true);
    
    try {
      await deleteDnsRecord.mutateAsync({ recordId: recordToDelete.id });
    } catch (error) {
      // Error handling is done in the mutation's onError callback
      console.error("Error in confirmDelete:", error);
    }
    // Note: isDeleting is reset in the mutation callbacks (onSuccess/onError)
  };

  const handleCopy = (data: z.infer<typeof dnsRecordSchema>) => {
    console.log("Copy DNS record:", data);
    // TODO: Implement copy functionality
  };

  if (isLoading) {
    return <DnsTableSkeleton />;
  }

  if (isError) {
    return <DnsTableError error={error as Error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:justify-between">
        <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search DNS records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full @sm/main:w-80 pl-10"
            />
          </div>
          <Select value={recordTypeFilter} onValueChange={setRecordTypeFilter}>
            <SelectTrigger className="w-full @sm/main:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="A">A</SelectItem>
              <SelectItem value="AAAA">AAAA</SelectItem>
              <SelectItem value="CNAME">CNAME</SelectItem>
              <SelectItem value="MX">MX</SelectItem>
              <SelectItem value="TXT">TXT</SelectItem>
              <SelectItem value="NS">NS</SelectItem>
              <SelectItem value="SRV">SRV</SelectItem>
              <SelectItem value="PTR">PTR</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* <DataTableViewOptions table={table} /> */}
          {/* {selectedCount > 0 && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDeleteSelected}
              className="flex-shrink-0"
            >
              <Trash2 className="h-4 w-4 @sm/main:mr-2" />
              <span className="hidden @sm/main:inline">Remove ({selectedCount})</span>
              <span className="@sm/main:hidden">Remove</span>
            </Button>
          )} */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsAddRecordOpen(true)}
            className="flex-shrink-0"
          >
            <Plus className="h-4 w-4 @sm/main:mr-2" />
            <span className="hidden @sm/main:inline">Add Record</span>
            <span className="@sm/main:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Cards implementation */}
      <div className="rounded-lg border bg-card">
        <ScrollArea className="h-[600px]">
          <div className="p-4">
            <DnsCardsList
              data={filteredData}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCopy={handleCopy}
            />
          </div>
        </ScrollArea>
      </div>

      {/* Table implementation (commented out for performance) */}
      {/* <div className="overflow-hidden rounded-lg border">
        <DataTableNew table={table} columns={columns} />
      </div>
      
      <DataTablePagination table={table} /> */}

      {/* Add Record Sheet */}
      <AddDnsRecordSheet 
        open={isAddRecordOpen}
        onOpenChange={setIsAddRecordOpen}
        siteId={siteId}
        onSuccess={() => {
          // Refetch DNS data after successful creation
          refetch();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        // Only allow closing if not currently deleting
        if (!isDeleting) {
          setDeleteDialogOpen(open);
          if (!open) {
            setRecordToDelete(null);
          }
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete DNS Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the DNS record{" "}
              <span className="font-semibold">
                {recordToDelete?.host} ({recordToDelete?.type})
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <Spinner variant="ellipsis" className="text-destructive-foreground" size="sm" />
                  <span>Deleting...</span>
                </div>
              ) : (
                "Delete Record"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}