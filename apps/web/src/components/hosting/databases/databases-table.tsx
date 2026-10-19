"use client";

import * as React from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Database as DatabaseIcon,
  Trash2,
  Eye,
  ExternalLink,
  Key,
} from "lucide-react";
import { z } from "zod";
import { toast } from "@/components/ui/sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CleanList, CleanListCell, CleanListRow } from "@/components/ui/clean-list";
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
import { isMysqlFamily, formatDatabaseSize } from "./connection-string";
import { captureEvent } from "@/lib/posthog";
import { useCanTeamPermission } from "@/contexts/team-permissions-context";

/** Accept only the Plesk one-time session URL for this database. */
function isSafeOrionPhpMyAdminUrl(url: string, databaseId: number): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (parsed.username || parsed.password || parsed.hash) return false;
    if (parsed.pathname !== "/enterprise/rsession_init.php") return false;
    if (typeof window !== "undefined" && parsed.host === window.location.host) return false;
    const keys = [...parsed.searchParams.keys()];
    if (
      keys.length !== 2 ||
      !keys.includes("PLESKSESSID") ||
      !keys.includes("success_redirect_url")
    ) {
      return false;
    }
    const sessionId = parsed.searchParams.get("PLESKSESSID") ?? "";
    if (!sessionId || sessionId.length > 512 || /[\s"'<>\\]/.test(sessionId)) return false;
    return parsed.searchParams.get("success_redirect_url") === `/smb/database/webadmin/id/${databaseId}`;
  } catch {
    return false;
  }
}

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
  const { data: databasesData, engines, subscriptionDatabaseBytes, isLoading, isError, error, refetch, relatedSitesStatus } = useDatabasesBySiteId(siteId);
  const { can } = useCanTeamPermission();
  const canManage = can("hosting.databases", "write");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [databaseToDelete, setDatabaseToDelete] = React.useState<{ id?: number; name?: string } | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = React.useState(false);
  const [changePermissionsOpen, setChangePermissionsOpen] = React.useState(false);
  const [connectionInfoOpen, setConnectionInfoOpen] = React.useState(false);
  const [createDatabaseOpen, setCreateDatabaseOpen] = React.useState(false);
  const [createUserOpen, setCreateUserOpen] = React.useState(false);
  const [selectedDatabase, setSelectedDatabase] = React.useState<z.infer<typeof databaseSchema> | null>(null);
  const [selectedUserId, setSelectedUserId] = React.useState(0);
  const [openingPhpMyAdminId, setOpeningPhpMyAdminId] = React.useState<number | null>(null);
  const openPhpMyAdmin = trpc.plesk.databases.getPhpMyAdminUrl.useMutation();

  React.useEffect(() => {
    if (!openCreateSheet || !canManage) return;
    setCreateDatabaseOpen(true);
    onCreateSheetOpened?.();
  }, [openCreateSheet, onCreateSheetOpened, canManage]);

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
      setDeleteConfirmName("");
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

  const handleOpenPhpMyAdmin = (databaseId: number) => {
    const tab = window.open("about:blank", "_blank");
    if (!tab) {
      toast.error("Could not open phpMyAdmin", {
        description: "Allow pop-ups for this site and try again.",
      });
      return;
    }
    try {
      tab.opener = null;
    } catch {
      // The new tab can still be sent to Orion if the browser blocks this.
    }
    setOpeningPhpMyAdminId(databaseId);
    openPhpMyAdmin.mutate(
      { siteId, databaseId },
      {
        onSuccess: ({ url }) => {
          if (!isSafeOrionPhpMyAdminUrl(url, databaseId)) {
            tab.close();
            toast.error("Could not open phpMyAdmin", {
              description: "An error occurred. Please try again later or contact support.",
            });
            return;
          }
          tab.location.replace(url);
        },
        onError: () => {
          tab.close();
          toast.error("Could not open phpMyAdmin", {
            description: "An error occurred. Please try again later or contact support.",
          });
        },
        onSettled: () => setOpeningPhpMyAdminId(null),
      },
    );
  };

  const handleConnectionInfo = (db: z.infer<typeof databaseSchema>) => {
    setSelectedDatabase(db);
    setConnectionInfoOpen(true);
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
          {canManage ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateDatabaseOpen(true)}
              className="flex-shrink-0 min-w-0"
              disabled={engines.length === 0}
              title={engines.length === 0 ? "No MariaDB or PostgreSQL server is available for this subscription" : undefined}
            >
              <Plus className="h-4 w-4 @sm/main:mr-2" />
              <span className="hidden @sm/main:inline">Create Database</span>
              <span className="@sm/main:hidden">Create</span>
            </Button>
          ) : null}
        </div>
      </div>

      {subscriptionDatabaseBytes != null ? (
        <p className="text-sm text-muted-foreground">
          Combined database usage on this subscription: {formatDatabaseSize(subscriptionDatabaseBytes)}. Plesk reports this total for the subscription, not a size for each database.
        </p>
      ) : null}

      <CleanList
        emptyMessage="No databases found"
        columns={[
          { key: "name", label: "Name" },
          { key: "engine", label: "Engine", className: "w-32 shrink-0", hideBelow: "@lg" },
          { key: "version", label: "Version", className: "w-36 shrink-0", hideBelow: "@xl" },
          { key: "users", label: "Users", className: "min-w-0 flex-1", hideBelow: "@2xl" },
          { key: "size", label: "Size", className: "w-28 shrink-0", hideBelow: "@3xl" },
          { key: "actions", label: "Actions", align: "end" },
        ]}
      >
        {filteredData.map((db, index) => {
          const users = db.users ?? [];
          const userLabel = users.length > 0 ? users.map((user) => user.login).join(", ") : "None";
          const versionLabel = db.version?.trim() ? db.version : "Not reported";
          const sizeLabel = db.sizeBytes == null ? "Not available" : formatDatabaseSize(db.sizeBytes);
          const resetUserId = db.defaultUserId || users[0]?.id;

          return (
            <CleanListRow
              key={db.id || `db-${index}`}
              leading={<DatabaseIcon className="h-4 w-4 text-muted-foreground" />}
              title={db.name || "Unknown Database"}
              description={relatedSiteLabel(db, relatedSitesStatus)}
              cells={{
                engine: <CleanListCell>{db.engineLabel || (db.type || "mysql").toUpperCase()}</CleanListCell>,
                version: <CleanListCell>{versionLabel}</CleanListCell>,
                users: <CleanListCell>{userLabel}</CleanListCell>,
                size: <CleanListCell>{sizeLabel}</CleanListCell>,
              }}
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
                  {canManage && resetUserId ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-xs"
                      onClick={() => {
                        setSelectedDatabase(db);
                        setSelectedUserId(resetUserId);
                        setChangePasswordOpen(true);
                      }}
                    >
                      <Key className="mr-1 h-3.5 w-3.5" />
                      Reset password
                    </Button>
                  ) : null}
                  {isMysqlFamily(db.type) && db.id ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-xs"
                      disabled={openingPhpMyAdminId === db.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (db.id) handleOpenPhpMyAdmin(db.id);
                      }}
                    >
                      phpMyAdmin
                      <ExternalLink className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-xs"
                      disabled
                      title="phpMyAdmin is only available for MySQL and MariaDB"
                    >
                      phpMyAdmin
                    </Button>
                  )}
                  {canManage ? (
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
                  ) : null}
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
              This permanently deletes &quot;{databaseToDelete?.name}&quot; and all of its data. Type the database name to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteConfirmName}
            onChange={(event) => setDeleteConfirmName(event.target.value)}
            placeholder={databaseToDelete?.name || "Database name"}
            autoComplete="off"
            aria-label="Type the database name to confirm deletion"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                if (deleteConfirmName !== databaseToDelete?.name) return;
                void confirmDelete();
              }}
              disabled={isDeleting || deleteConfirmName !== databaseToDelete?.name}
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
          users={selectedDatabase.users}
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
          relatedSitesStatus={relatedSitesStatus}
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
        engines={engines}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
