"use client";

import * as React from "react";
import { Plus, Search, RefreshCw, Pencil, Eye, Trash2 } from "lucide-react";
import { z } from "zod";
import { toast } from "@/components/ui/sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CleanList, CleanListCell, CleanListRow } from "@/components/ui/clean-list";
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
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

import { dnsRecordSchema } from "./dns-schema";
import { useDnsBySiteId } from "./use-dns-by-site-id";
import { AddDnsRecordSheet } from "./add-dns-record-sheet";
import { EditDnsRecordSheet } from "./edit-dns-record-sheet";
import { ViewDnsRecordSheet } from "./view-dns-record-sheet";

interface DnsTableProps {
  siteId: number;
  domainName?: string;
  openCreateSheet?: boolean;
  onCreateSheetOpened?: () => void;
}

// Loading skeleton component
function DnsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:justify-between">
        <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center">
          <Skeleton className="h-10 w-full @sm/main:w-80" />
          <Skeleton className="h-10 w-full @sm/main:w-[180px]" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center gap-3 border-b bg-muted/40 px-4 py-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="hidden h-3 w-16 @lg:block" />
          <Skeleton className="hidden h-3 w-10 @2xl:block" />
          <Skeleton className="ml-auto h-3 w-14" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <Skeleton className="mt-0.5 h-5 w-12 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-64 max-w-full" />
                </div>
              </div>
              <div className="flex gap-1.5">
                <Skeleton className="h-7 w-14" />
                <Skeleton className="h-7 w-14" />
                <Skeleton className="h-7 w-7" />
              </div>
            </div>
          ))}
        </div>
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

export function DnsTable({
  siteId,
  domainName,
  openCreateSheet,
  onCreateSheetOpened,
}: DnsTableProps) {
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

  React.useEffect(() => {
    if (!openCreateSheet) return;
    setIsAddRecordOpen(true);
    onCreateSheetOpened?.();
  }, [openCreateSheet, onCreateSheetOpened]);

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

  const ListView = () => (
    <CleanList
      emptyMessage="No DNS records found"
      columns={[
        { key: "name", label: "Name" },
        { key: "value", label: "Value", className: "w-64", hideBelow: "@xl" },
        { key: "ttl", label: "TTL", className: "w-16", hideBelow: "@3xl" },
        { key: "actions", label: "Actions", align: "end" },
      ]}
    >
      {filteredData.map((record) => {
        const type = record.type || "A";
        const host = record.host === "@" ? "@" : record.host || "Unknown Host";
        const value = record.value || "Unknown Value";
        const ttl = record.ttl != null ? String(record.ttl) : null;

        return (
          <CleanListRow
            key={record.id}
            leading={
              <Badge variant="outline" className={getTypeColor(type)}>
                {type}
              </Badge>
            }
            title={host}
            cells={{
              value: (
                <CleanListCell mono wrap>
                  {value}
                </CleanListCell>
              ),
              ttl: <CleanListCell>{ttl}</CleanListCell>,
            }}
            onClick={() => handleView(record)}
            actions={
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => handleView(record)}
                >
                  <Eye className="mr-1 h-3.5 w-3.5" />
                  View
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => handleEdit(record)}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs text-destructive hover:text-destructive"
                  onClick={() => handleDelete(record.id)}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Delete
                </Button>
              </>
            }
          />
        );
      })}
    </CleanList>
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
      <ListView />

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
