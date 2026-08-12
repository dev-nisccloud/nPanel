"use client";

import * as React from "react";
import { Plus, Trash2, Search, RefreshCw, Mail, Pencil, Eye } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CleanList, CleanListRow } from "@/components/ui/clean-list";
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
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

import { emailAccountSchema } from "./emails-schema";
import { MailboxUsageDisplay } from "./mailbox-usage";
import { useEmailsBySiteId } from "./use-emails-by-site-id";
import { AddMailAddressSheet } from "./add-mail-address-sheet";
import { ViewMailAddressSheet } from "./view-mail-address-sheet";
import { captureEvent } from "@/lib/posthog";

interface MailTableProps {
  siteId: number;
  domainName?: string;
  maxMailboxQuotaBytes?: number;
  openCreateSheet?: boolean;
  onCreateSheetOpened?: () => void;
}

function MailTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:justify-between">
        <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:flex-1">
          <Skeleton className="h-10 flex-1 @sm/main:max-w-sm" />
          <Skeleton className="h-10 w-full @sm/main:w-[200px]" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <Skeleton className="mt-0.5 h-4 w-4" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-3 w-40 max-w-full" />
              </div>
            </div>
            <div className="flex gap-1.5">
              <Skeleton className="h-7 w-14" />
              <Skeleton className="h-7 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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

export function MailTable({
  siteId,
  domainName,
  maxMailboxQuotaBytes,
  openCreateSheet,
  onCreateSheetOpened,
}: MailTableProps) {
  const { data: emailsData, isLoading, isError, error, refetch } = useEmailsBySiteId(siteId);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [isAddMailOpen, setIsAddMailOpen] = React.useState(false);
  const [isViewMailOpen, setIsViewMailOpen] = React.useState(false);
  const [selectedMail, setSelectedMail] = React.useState<z.infer<typeof emailAccountSchema> | null>(null);
  const [sheetInitial, setSheetInitial] = React.useState<any | null>(null);
  const [sheetMode, setSheetMode] = React.useState<"create" | "edit">("create");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [mailToDelete, setMailToDelete] = React.useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    if (!openCreateSheet) return;
    setSheetMode("create");
    setSheetInitial(null);
    setIsAddMailOpen(true);
    onCreateSheetOpened?.();
  }, [openCreateSheet, onCreateSheetOpened]);

  const deleteEmailAccount = trpc.plesk.emailsDelete.delete.useMutation({
    onSuccess: () => {
      captureEvent("email_address_deleted", { domain: domainName || "unknown" });

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

  const handleView = (id: number | undefined) => {
    if (!id) return;
    const record = emailsData?.find((r) => r.id === id);
    if (!record) return;
    setSelectedMail(record);
    setIsViewMailOpen(true);
  };

  const handleEdit = (id: number | undefined) => {
    if (!id) return;
    const record = emailsData?.find((r) => r.id === id);
    if (!record) return;
    setSheetMode("edit");
    setIsAddMailOpen(true);
    setSheetInitial({
      name: record.name || "",
      mailboxEnabled: record.mailbox?.enabled ?? true,
      quota: record.mailbox?.quota ?? 53687091200,
      forwardingEnabled: record.forwarding?.enabled ?? false,
      forwardingAddresses: (record.forwarding?.addresses || []).join(", "),
      aliases: (record.aliases || []).join(", "),
      autoresponderEnabled: record.autoresponder?.enabled ?? false,
      autoresponderSubject: record.autoresponder?.subject || "",
      autoresponderText: record.autoresponder?.text || "",
      antivir: (record.antivir as "off" | "inout" | "in" | "out") || "off",
      maxOutgoingMessages: record.outgoingMessagesLimit ?? 100,
      description: record.description || "",
    });
  };

  const handleDelete = (id: number | undefined) => {
    if (!id) return;
    const record = emailsData?.find((r) => r.id === id);
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

  if (isLoading) {
    return <MailTableSkeleton />;
  }

  if (isError) {
    return <MailTableError error={error as Error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-4">
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSheetMode("create");
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

      <CleanList emptyMessage="No email addresses found">
        {filteredData.map((email) => {
          const fullAddress = `${email.name || "Unknown Email"}@${domainName || "example.com"}`;

          return (
            <CleanListRow
              key={email.id}
              leading={<Mail className="h-4 w-4 text-muted-foreground" />}
              title={fullAddress}
              description={
                <>
                  {email.description?.trim() ? (
                    <p className="truncate">{email.description}</p>
                  ) : null}
                  <MailboxUsageDisplay
                    usage={email.mailbox?.usage}
                    quota={maxMailboxQuotaBytes}
                  />
                </>
              }
              trailing={
                <Badge
                  variant={email.mailbox?.enabled ? "default" : "secondary"}
                  className={
                    email.mailbox?.enabled
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800"
                      : ""
                  }
                >
                  {email.mailbox?.enabled ? "Enabled" : "Disabled"}
                </Badge>
              }
              actions={
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => handleView(email.id)}
                  >
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    View
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => handleEdit(email.id)}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs text-destructive hover:text-destructive"
                    onClick={() => handleDelete(email.id)}
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

      <ViewMailAddressSheet
        open={isViewMailOpen}
        onOpenChange={(open) => {
          setIsViewMailOpen(open);
          if (!open) setSelectedMail(null);
        }}
        data={selectedMail}
        domainName={domainName}
        maxMailboxQuotaBytes={maxMailboxQuotaBytes}
      />

      <AddMailAddressSheet
        open={isAddMailOpen}
        onOpenChange={(open) => {
          setIsAddMailOpen(open);
          if (!open) {
            setSheetInitial(null);
            setSheetMode("create");
          }
        }}
        siteId={siteId}
        domainName={domainName}
        maxMailboxQuotaBytes={maxMailboxQuotaBytes}
        initialValues={sheetInitial || undefined}
        mode={sheetMode}
        onSuccess={() => {
          refetch();
          setSheetInitial(null);
          setSheetMode("create");
        }}
      />

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!isDeleting) {
            setDeleteDialogOpen(open);
            if (!open) setMailToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {mailToDelete?.name}@{domainName || "domain"}? This action cannot be undone.
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
                "Delete Account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
