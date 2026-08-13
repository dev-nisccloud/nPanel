"use client";

import * as React from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Database as DatabaseIcon,
  ExternalLink,
  Trash2,
  Eye,
} from "lucide-react";
import { z } from "zod";
import { toast } from "@/components/ui/sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CleanList, CleanListRow } from "@/components/ui/clean-list";
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
import { trpc } from "@/utils/trpc";
import { databaseSchema, relatedSiteLabel } from "./databases-schema";
import { useDatabasesBySiteId } from "./use-databases-by-site-id";
import { ChangeDatabasePasswordSheet } from "./change-database-password-sheet";
import { ChangeDatabasePermissionsSheet } from "./change-database-permissions-sheet";
import { DatabaseConnectionInfoDialog } from "./database-connection-info-dialog";
import { CreateDatabaseSheet } from "./create-database-sheet";
import { CreateDatabaseUserSheet } from "./create-database-user-sheet";
import { captureEvent } from "@/lib/posthog";
import { isMysqlFamily } from "./connection-string";

interface DatabasesTableProps {
  siteId: number;
  openCreateSheet?: boolean;
  onCreateSheetOpened?: () => void;
}

function DatabasesTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:justify-between">
        <Skeleton className="h-10 flex-1 @sm/main:max-w-sm" />
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <Skeleton className="mt-0.5 h-4 w-4" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28 max-w-full" />
              </div>
            </div>
            <div className="flex gap-1.5">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-7 w-14" />
              <Skeleton className="h-7 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DatabasesTableError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <h3 className="text-lg font-semibold text-destructive">Error Loading Databases</h3>
      <p className="text-sm text-muted-foreground mt-2">
        {error.message || "An unexpected error occurred while fetching databases."}
      </p>
      <Button onClick={onRetry} className="mt-4">
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}

export function DatabasesTable({
  siteId,
  openCreateSheet,
  onCreateSheetOpened,
}: DatabasesTableProps) {
  const { data: databasesData, isLoading, isError, error, refetch } = useDatabasesBySiteId(siteId);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [databaseToDelete, setDatabaseToDelete] = React.useState<{ id?: number; name?: string } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = React.useState(false);
  const [changePermissionsOpen, setChangePermissionsOpen] = React.useState(false);
  const [connectionInfoOpen, setConnectionInfoOpen] = React.useState(false);
  const [createDatabaseOpen, setCreateDatabaseOpen] = React.useState(false);
  const [createUserOpen, setCreateUserOpen] = React.useState(false);
  const [selectedDatabase, setSelectedDatabase] = React.useState<z.infer<typeof databaseSchema> | null>(null);
  const [selectedUserId, setSelectedUserId] = React.useState(0);

  React.useEffect(() => {
    if (!openCreateSheet) return;
    setCreateDatabaseOpen(true);
    onCreateSheetOpened?.();
  }, [openCreateSheet, onCreateSheetOpened]);

  const openPhpMyAdmin = trpc.plesk.databases.getPhpMyAdminUrl.useMutation({
    onError: (error) => {
      toast.error("Could not open phpMyAdmin", {
        description: error.message || "Please try again.",
      });
    },
  });

  const deleteDatabase = trpc.plesk.databasesDelete.delete.useMutation({
    onSuccess: () => {
      captureEvent("database_deleted");

      toast.success("Database deleted successfully!");
      setDeleteDialogOpen(false);
      setDatabaseToDelete(null);
      setIsDeleting(false);
      refetch();
    },
    onError: (error) => {
      console.error("[DatabasesTable] Delete database error:", error);
      setIsDeleting(false);
      toast.error("Failed to delete database", { description: error.message || "Please try again." });
    },
  });

  const filteredData = React.useMemo(() => {
    if (!databasesData) return [];

    if (searchTerm.trim()) {
      return databasesData.filter((db) =>
        (db.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (db.type || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (db["related-site-name"] || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return databasesData;
  }, [databasesData, searchTerm]);

  const handleDelete = (db: z.infer<typeof databaseSchema>) => {
    if (db.id && db.name) {
      setDatabaseToDelete({ id: db.id, name: db.name });
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!databaseToDelete?.id) return;
    setIsDeleting(true);
    try {
      await deleteDatabase.mutateAsync({ siteId, databaseId: databaseToDelete.id });
    } catch (e) {
      console.error("[DatabasesTable] Error in confirmDelete:", e);
    }
  };

  const handleOpenPhpMyAdmin = async (db: z.infer<typeof databaseSchema>) => {
    if (!db.id) {
      toast.error("Database id not available");
      return;
    }
    if (!isMysqlFamily(db.type)) {
      toast.error("phpMyAdmin is only available for MySQL and MariaDB");
      return;
    }
    const toastId = toast.loading("Opening phpMyAdmin…");
    try {
      const { url } = await openPhpMyAdmin.mutateAsync({
        siteId,
        databaseId: db.id,
      });
      toast.dismiss(toastId);
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) {
        toast.error("Allow pop-ups to open phpMyAdmin");
      }
    } catch {
      toast.dismiss(toastId);
    }
  };

  const handleConnectionInfo = (db: z.infer<typeof databaseSchema>) => {
    setSelectedDatabase(db);
    setConnectionInfoOpen(true);
  };

  const getStatusBadge = (status: string | undefined) => {
    if (status === "ok") {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Active
        </Badge>
      );
    }
    return <Badge variant="destructive">Inactive</Badge>;
  };

  if (isLoading) {
    return <DatabasesTableSkeleton />;
  }

  if (isError) {
    return <DatabasesTableError error={error as Error} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:justify-between">
        <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:flex-1">
          <div className="relative flex-1 @sm/main:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search databases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 @sm/main:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateDatabaseOpen(true)}
            className="flex-shrink-0 min-w-0"
          >
            <Plus className="h-4 w-4 @sm/main:mr-2" />
            <span className="hidden @sm/main:inline">Create Database</span>
            <span className="@sm/main:hidden">Create</span>
          </Button>
        </div>
      </div>

      <CleanList emptyMessage="No databases found">
        {filteredData.map((db, index) => {
          const typeUpper = (db.type || "mysql").toUpperCase();
          const related = relatedSiteLabel(db);

          return (
            <CleanListRow
              key={db.id || `db-${index}`}
              leading={<DatabaseIcon className="h-4 w-4 text-muted-foreground" />}
              title={db.name || "Unknown Database"}
              description={<span className="block truncate">{`${typeUpper} · ${related}`}</span>}
              trailing={getStatusBadge(db.status)}
              onClick={() => handleConnectionInfo(db)}
              actions={
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => handleConnectionInfo(db)}
                  >
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    View
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    disabled={!isMysqlFamily(db.type) || !db.id || openPhpMyAdmin.isPending}
                    title={!isMysqlFamily(db.type) ? "phpMyAdmin is only available for MySQL and MariaDB" : undefined}
                    onClick={() => handleOpenPhpMyAdmin(db)}
                  >
                    <ExternalLink className="mr-1 h-3.5 w-3.5" />
                    phpMyAdmin
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs text-destructive hover:text-destructive"
                    onClick={() => handleDelete(db)}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Database</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the database "{databaseToDelete?.name}"? This action cannot be undone and will permanently delete all data in the database.
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
                <>
                  <Spinner size={16} className="mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedDatabase && (
        <ChangeDatabasePasswordSheet
          open={changePasswordOpen}
          onOpenChange={setChangePasswordOpen}
          siteId={siteId}
          database={selectedDatabase}
          userId={selectedUserId}
          onSuccess={() => refetch()}
        />
      )}

      {selectedDatabase && (
        <ChangeDatabasePermissionsSheet
          open={changePermissionsOpen}
          onOpenChange={setChangePermissionsOpen}
          siteId={siteId}
          database={selectedDatabase}
          userId={selectedUserId}
          onSuccess={() => refetch()}
        />
      )}

      {selectedDatabase && (
        <DatabaseConnectionInfoDialog
          open={connectionInfoOpen}
          onOpenChange={setConnectionInfoOpen}
          siteId={siteId}
          database={selectedDatabase}
          onCreateUser={() => {
            setConnectionInfoOpen(false);
            setCreateUserOpen(true);
          }}
          onChangePassword={(userId) => {
            setSelectedUserId(userId);
            setConnectionInfoOpen(false);
            setChangePasswordOpen(true);
          }}
        />
      )}

      {selectedDatabase && (
        <CreateDatabaseUserSheet
          open={createUserOpen}
          onOpenChange={setCreateUserOpen}
          siteId={siteId}
          database={selectedDatabase}
          onSuccess={() => refetch()}
        />
      )}

      <CreateDatabaseSheet
        open={createDatabaseOpen}
        onOpenChange={setCreateDatabaseOpen}
        siteId={siteId}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
