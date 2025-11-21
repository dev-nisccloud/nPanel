"use client";

import * as React from "react";
import { Plus, Trash2, Search, RefreshCw } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { trpc } from "@/utils/trpc";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

// Table imports (commented out for performance)
// import { DataTable as DataTableNew } from "../../../../../components/data-table/data-table";
// import { DataTablePagination } from "../../../../../components/data-table/data-table-pagination";
// import { DataTableViewOptions } from "../../../../../components/data-table/data-table-view-options";
// import { withDndColumn } from "../../../../../components/data-table/table-utils";
// import { createMailColumns } from "./mail-columns";

import { ScrollArea } from "@/components/ui/scroll-area";
import { MailCardsList } from "./mail-cards";
import { emailAccountSchema } from "./emails-schema";
import { useEmailsBySiteId } from "./use-emails-by-site-id";
import { AddMailAddressSheet } from "./add-mail-address-sheet";

interface MailTableProps {
  siteId: number;
  domainName?: string;
}

// Loading skeleton component
function MailTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:justify-between">
        <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:flex-1">
          <Skeleton className="h-10 flex-1 @sm/main:max-w-sm" />
          <Skeleton className="h-10 w-full @sm/main:w-[200px]" />
        </div>
        <div className="flex flex-wrap items-center gap-2 @sm/main:flex-nowrap">
          <Skeleton className="h-10 w-10" />
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
                  <div className="grid grid-cols-5 gap-4">
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-3 w-3" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-3 w-3" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
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
                  </div>
                  
                  {/* Additional info skeleton */}
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <div className="flex gap-1">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-14" />
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
function MailTableError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-12">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Failed to load email accounts
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {error.message || "An unexpected error occurred"}
        </p>
      </div>
      <Button onClick={onRetry} variant="outline" className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}

export function MailTable({ siteId, domainName }: MailTableProps) {
  const { data: emailsData, isLoading, isError, error, refetch } = useEmailsBySiteId(siteId);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [isAddMailOpen, setIsAddMailOpen] = React.useState(false);
  const [sheetInitial, setSheetInitial] = React.useState<any | null>(null);
  const [sheetMode, setSheetMode] = React.useState<'create' | 'edit'>('create');
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [mailToDelete, setMailToDelete] = React.useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const deleteEmailAccount = trpc.plesk.emailsDelete.delete.useMutation({
    onSuccess: () => {
      toast.success("Email account deleted successfully!");
      setDeleteDialogOpen(false);
      setMailToDelete(null);
      setIsDeleting(false);
      refetch();
    },
    onError: (error) => {
      console.error("[MailTable] Delete email error:", error);
      setIsDeleting(false);
      let errorMessage = "Please try again.";
      if (error?.data?.code === "BAD_REQUEST") errorMessage = error.message || errorMessage;
      else if (error?.data?.code === "UNAUTHORIZED") errorMessage = "Authentication failed. Please check your Plesk credentials.";
      else if (error?.data?.code === "SERVICE_UNAVAILABLE") errorMessage = "Plesk server is currently unavailable. Please try again later.";
      else if (error?.data?.code === "INTERNAL_SERVER_ERROR") errorMessage = "Server error occurred while deleting email account.";
      else if (error?.message) errorMessage = error.message;
      toast.error("Failed to delete email account", { description: errorMessage });
    },
  });

  const filteredData = React.useMemo(() => {
    if (!emailsData) return [];
    
    let filtered = emailsData;

    if (searchTerm.trim()) {
      filtered = filtered.filter((item) =>
        (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== "all") {
      if (statusFilter === "enabled") {
        filtered = filtered.filter((item) => item.mailbox?.enabled);
      } else if (statusFilter === "disabled") {
        filtered = filtered.filter((item) => !item.mailbox?.enabled);
      } else if (statusFilter === "forwarding") {
        filtered = filtered.filter((item) => item.forwarding?.enabled);
      } else if (statusFilter === "autoresponder") {
        filtered = filtered.filter((item) => item.autoresponder?.enabled);
      }
    }

    return filtered;
  }, [emailsData, searchTerm, statusFilter]);

  // Table implementation (commented out for performance)
  // const columns = withDndColumn(createMailColumns(domainName));
  // const table = useDataTableInstance({ 
  //   data: filteredData, 
  //   columns, 
  //   getRowId: (row) => row.id?.toString() || `email-${Math.random()}` 
  // });

  // const selectedRows = table.getFilteredSelectedRowModel().rows;
  // const selectedCount = selectedRows.length;

  // const handleDeleteSelected = () => {
  //   // TODO: Implement actual deletion via API
  //   console.log("Delete selected emails:", selectedRows.map(row => row.original.id));
  //   table.resetRowSelection();
  // };

  const handleEdit = (id: number | undefined) => {
    if (!id) return;
    const record = emailsData?.find(r => r.id === id);
    if (!record) return;
    // Open the sheet in edit mode with prefilled values
    setSheetMode('edit');
    setIsAddMailOpen(true);
    // Set initial values for editing
    setSheetInitial({
      name: record.name || "",
      // password intentionally blank for security; user can set a new one if needed
      mailboxEnabled: record.mailbox?.enabled ?? true,
      quota: record.mailbox?.quota ?? 53687091200,
      forwardingEnabled: record.forwarding?.enabled ?? false,
      forwardingAddresses: (record.forwarding?.addresses || []).join(', '),
      aliases: (record.aliases || []).join(', '),
      autoresponderEnabled: record.autoresponder?.enabled ?? false,
      autoresponderSubject: record.autoresponder?.subject || "",
      autoresponderText: record.autoresponder?.text || "",
      antivir: (record.antivir as any) || 'off',
      maxOutgoingMessages: record.outgoingMessagesLimit ?? 100,
      description: record.description || "",
    });
  };

  const handleDelete = (id: number | undefined) => {
    if (!id) return;
    const record = emailsData?.find(r => r.id === id);
    if (record?.name) {
      setMailToDelete({ id, name: record.name });
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!mailToDelete) return;
    setIsDeleting(true);
    try {
      await deleteEmailAccount.mutateAsync({ siteId, name: mailToDelete.name });
    } catch (e) {
      console.error("[MailTable] Error in confirmDelete:", e);
    }
  };

  const handleCopy = (data: z.infer<typeof emailAccountSchema>) => {
    console.log("Copy email settings:", data);
    // TODO: Implement copy functionality
  };

  if (isLoading) {
    return <MailTableSkeleton />;
  }

  if (isError) {
    return <MailTableError error={error as Error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-4">
      {/* Header with controls - Fully responsive */}
      <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:justify-between">
        <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:flex-1">
          <div className="relative flex-1 @sm/main:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search email addresses..."
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
              <SelectItem value="enabled">Enabled</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
              <SelectItem value="forwarding">With Forwarding</SelectItem>
              <SelectItem value="autoresponder">With Auto Reply</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 @sm/main:flex-nowrap">
          {/* <DataTableViewOptions table={table} /> */}
          {/* {selectedCount > 0 && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDeleteSelected}
              className="flex-shrink-0 min-w-0"
            >
              <Trash2 className="h-4 w-4 @sm/main:mr-2" />
              <span className="hidden @sm/main:inline">Remove ({selectedCount})</span>
              <span className="@sm/main:hidden">Remove</span>
            </Button>
          )} */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setSheetMode('create');
              setIsAddMailOpen(true);
            }}
            className="flex-shrink-0 min-w-0"
          >
            <Plus className="h-4 w-4 @sm/main:mr-2" />
            <span className="hidden @sm/main:inline">Add Email Address</span>
            <span className="@sm/main:hidden">Add Email</span>
          </Button>
        </div>
      </div>

      {/* Cards implementation */}
      <div className="rounded-lg border bg-card">
        <ScrollArea className="h-[600px]">
          <div className="p-4">
            <MailCardsList
              data={filteredData}
              domainName={domainName}
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

      {/* Add Mail Address Sheet */}
      <AddMailAddressSheet 
        open={isAddMailOpen}
        onOpenChange={(open) => { 
          setIsAddMailOpen(open); 
          if (!open) {
            setSheetInitial(null);
            setSheetMode('create');
          }
        }}
        siteId={siteId}
        initialValues={sheetInitial || undefined}
        mode={sheetMode}
        onSuccess={() => {
          // Refetch email data after successful creation/update
          refetch();
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        if (!isDeleting) {
          setDeleteDialogOpen(open);
          if (!open) setMailToDelete(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {mailToDelete?.name}@{domainName || "domain"}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <Spinner variant="ellipsis" className="text-destructive-foreground" size="sm" />
                  <span>Deleting...</span>
                </div>
              ) : (
                "Delete Account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
