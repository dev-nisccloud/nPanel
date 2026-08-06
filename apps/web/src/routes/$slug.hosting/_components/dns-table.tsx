"use client";

import * as React from "react";
import { Plus, Trash2, Search, RefreshCw, EllipsisVertical } from "lucide-react";
import { z } from "zod";
import { toast } from "@/components/ui/sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { trpc } from "@/utils/trpc";
import { captureEvent } from "@/lib/posthog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

// Table imports (commented out for performance)
// import { DataTable as DataTableNew } from "../../../components/data-table/data-table";
// import { DataTablePagination } from "../../../components/data-table/data-table-pagination";
// import { DataTableViewOptions } from "../../../components/data-table/data-table-view-options";
// import { withDndColumn } from "../../../components/data-table/table-utils";
// import { dnsColumns } from "./dns-columns";

import { ScrollArea } from "@/components/ui/scroll-area";
import { dnsRecordSchema } from "./dns-schema";
import { useDnsBySiteId } from "./use-dns-by-site-id";
import { AddDnsRecordSheet } from "./add-dns-record-sheet";
import { EditDnsRecordSheet } from "./edit-dns-record-sheet";
import { ViewDnsRecordSheet } from "./view-dns-record-sheet";

interface DnsTableProps {
  siteId: number;
  domainName?: string;
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

export function DnsTable({ siteId, domainName }: DnsTableProps) {
  const { data: dnsData, isLoading, isError, error, refetch } = useDnsBySiteId(siteId);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [recordTypeFilter, setRecordTypeFilter] = React.useState("all");
  const [isAddRecordOpen, setIsAddRecordOpen] = React.useState(false);
  const [isViewRecordOpen, setIsViewRecordOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<z.infer<typeof dnsRecordSchema> | null>(null);
  const [isEditRecordOpen, setIsEditRecordOpen] = React.useState(false);
  const [recordToEdit, setRecordToEdit] = React.useState<z.infer<typeof dnsRecordSchema> | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [recordToDelete, setRecordToDelete] = React.useState<{ id: number; host: string; type: string } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // tRPC mutation for deleting DNS record
  const deleteDnsRecord = trpc.plesk.dnsDelete.delete.useMutation({
    onSuccess: () => {
      if (recordToDelete?.type) {
        captureEvent("dns_record_deleted", { record_type: recordToDelete.type });
      } else {
        captureEvent("dns_record_deleted");
      }
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

  const handleView = (data: z.infer<typeof dnsRecordSchema>) => {
    setSelectedRecord(data);
    setIsViewRecordOpen(true);
  };

  const handleEdit = (record: z.infer<typeof dnsRecordSchema>) => {
    setRecordToEdit(record);
    setIsEditRecordOpen(true);
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case "A":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "AAAA":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "CNAME":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "MX":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "TXT":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "NS":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "SRV":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      case "CAA":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const TableView = () => (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Host</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                No DNS records found
              </TableCell>
            </TableRow>
          ) : (
            filteredData.map((record) => (
              <TableRow
                key={record.id}
                className="cursor-pointer"
                onClick={() => handleView(record)}
              >
                <TableCell className="font-medium pl-6">
                  {record.host === "@" ? "@" : record.host || "Unknown Host"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getTypeColor(record.type || "A")}>
                    {record.type || "A"}
                  </Badge>
                </TableCell>
                <TableCell className="text-primary text-sm max-w-[200px] truncate">
                  {record.value || "Unknown Value"}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" size="icon">
                              <EllipsisVertical className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem onClick={() => handleView(record)}>
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(record)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleDelete(record.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Actions</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );


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

      {/* Content */}
      <TableView />

      {/* Table implementation (commented out for performance) */}
      {/* <div className="overflow-hidden rounded-lg border">
        <DataTableNew table={table} columns={columns} />
      </div>
      
      <DataTablePagination table={table} /> */}

      {/* Add DNS Record Sheet */}
      <AddDnsRecordSheet
        open={isAddRecordOpen}
        onOpenChange={setIsAddRecordOpen}
        siteId={siteId}
        domainName={domainName}
        onSuccess={refetch}
      />

      {/* Edit DNS Record Sheet */}
      <EditDnsRecordSheet
        open={isEditRecordOpen}
        onOpenChange={setIsEditRecordOpen}
        siteId={siteId}
        domainName={domainName}
        record={recordToEdit}
        onSuccess={refetch}
      />

      {/* View Record Sheet */}
      <ViewDnsRecordSheet
        open={isViewRecordOpen}
        onOpenChange={(newOpen) => {
          setIsViewRecordOpen(newOpen);
          if (!newOpen) {
            // Clear the record data when sheet closes
            setSelectedRecord(null);
          }
        }}
        data={selectedRecord}
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
