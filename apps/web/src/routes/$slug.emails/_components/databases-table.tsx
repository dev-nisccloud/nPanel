"use client";

import * as React from "react";
import { Plus, Search, RefreshCw, EllipsisVertical, Database as DatabaseIcon, ExternalLink, Key, Trash2, Settings, Download, Upload, Wrench, Info, Link2, Globe } from "lucide-react";
import { z } from "zod";
import { toast } from "@/components/ui/sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { databaseSchema } from "./databases-schema";
import { useDatabasesBySiteId } from "./use-databases-by-site-id";
import { ChangeDatabasePasswordSheet } from "./change-database-password-sheet";
import { ChangeDatabasePermissionsSheet } from "./change-database-permissions-sheet";
import { DatabaseConnectionInfoDialog } from "./database-connection-info-dialog";
import { CreateDatabaseSheet } from "./create-database-sheet";
import { AssignDatabaseSheet } from "./assign-database-sheet";
import { captureEvent } from "@/lib/posthog";

interface DatabasesTableProps {
  siteId: number;
  domainName?: string;
}

// Loading skeleton component
function DatabasesTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:justify-between">
        <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:flex-1">
          <Skeleton className="h-10 flex-1 @sm/main:max-w-sm" />
        </div>
        <div className="flex flex-wrap items-center gap-2 @sm/main:flex-nowrap">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Database Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="pl-6">
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Error component
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

export function DatabasesTable({ siteId, domainName }: DatabasesTableProps) {
  const { data: databasesData, isLoading, isError, error, refetch } = useDatabasesBySiteId(siteId);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [databaseToDelete, setDatabaseToDelete] = React.useState<{ id?: number; name?: string } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = React.useState(false);
  const [changePermissionsOpen, setChangePermissionsOpen] = React.useState(false);
  const [connectionInfoOpen, setConnectionInfoOpen] = React.useState(false);
  const [createDatabaseOpen, setCreateDatabaseOpen] = React.useState(false);
  const [assignDatabaseOpen, setAssignDatabaseOpen] = React.useState(false);
  const [selectedDatabase, setSelectedDatabase] = React.useState<z.infer<typeof databaseSchema> | null>(null);

  // Delete database mutation
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
        (db.type || "").toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleOpenPhpMyAdmin = (db: z.infer<typeof databaseSchema>) => {
    if (!db.name) {
      toast.error("Database name not available");
      return;
    }
    // Construct phpMyAdmin URL - format: https://orion.nisccloud.com/phpMyAdmin/index.php?db={database_name}
    const pleskHost = process.env.VITE_PUBLIC_PLESK_HOST || 'orion.nisccloud.com';
    const phpMyAdminUrl = `https://${pleskHost}/phpMyAdmin/index.php?db=${encodeURIComponent(db.name)}`;
    window.open(phpMyAdminUrl, '_blank', 'noopener,noreferrer');
  };

  const handleChangePassword = (db: z.infer<typeof databaseSchema>) => {
    // Note: We need database user ID to change password
    // For now, we'll show a message that user information needs to be fetched
    // TODO: Fetch database users and get the user ID
    if (!db.id) {
      toast.error("Database ID not available");
      return;
    }
    // Placeholder: In a real implementation, we'd fetch users first
    // For now, we'll use the database ID as a placeholder (this won't work, but shows the UI)
    toast.info("Database user information needs to be fetched first. This feature will be enhanced soon.");
    // setSelectedDatabase(db);
    // setChangePasswordOpen(true);
  };

  const handleChangePermissions = (db: z.infer<typeof databaseSchema>) => {
    // Note: We need database user ID to change permissions
    if (!db.id) {
      toast.error("Database ID not available");
      return;
    }
    toast.info("Database user information needs to be fetched first. This feature will be enhanced soon.");
    // setSelectedDatabase(db);
    // setChangePermissionsOpen(true);
  };

  const handleConnectionInfo = (db: z.infer<typeof databaseSchema>) => {
    setSelectedDatabase(db);
    setConnectionInfoOpen(true);
  };

  const handleAssignToWebsite = (db: z.infer<typeof databaseSchema>) => {
    setSelectedDatabase(db);
    setAssignDatabaseOpen(true);
  };

  // Check if database is assigned to current website
  const isAssignedToCurrentWebsite = (db: z.infer<typeof databaseSchema>) => {
    return db["webspace-id"] === siteId;
  };

  const handleRepair = (db: z.infer<typeof databaseSchema>) => {
    // Repair is typically done via phpMyAdmin
    toast.info("Database repair is available via phpMyAdmin. Opening phpMyAdmin...");
    handleOpenPhpMyAdmin(db);
  };

  const handleImport = (db: z.infer<typeof databaseSchema>) => {
    // Import is typically done via phpMyAdmin
    toast.info("Database import is available via phpMyAdmin. Opening phpMyAdmin...");
    handleOpenPhpMyAdmin(db);
  };

  const handleExport = (db: z.infer<typeof databaseSchema>) => {
    // Export is typically done via phpMyAdmin
    toast.info("Database export is available via phpMyAdmin. Opening phpMyAdmin...");
    handleOpenPhpMyAdmin(db);
  };

  const getStatusBadge = (status: string | undefined) => {
    if (status === "ok") {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        Inactive
      </Badge>
    );
  };

  const getTypeBadge = (type: string | undefined) => {
    const typeUpper = (type || "mysql").toUpperCase();
    return (
      <Badge variant="outline">
        {typeUpper}
      </Badge>
    );
  };

  const TableView = () => (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Database Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Related Website</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No databases found
              </TableCell>
            </TableRow>
          ) : (
            filteredData.map((db, index) => {
              const isAssigned = isAssignedToCurrentWebsite(db);
              return (
                <TableRow key={db.id || `db-${index}`}>
                  <TableCell className="pl-6 font-medium">
                    <div className="flex items-center gap-2">
                      <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{db.name || "Unknown Database"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(db.type)}</TableCell>
                  <TableCell>
                    {isAssigned ? (
                      <div className="flex items-center gap-2">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{domainName || "Current Website"}</span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Not assigned
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(db.status)}</TableCell>
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
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleOpenPhpMyAdmin(db)}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open phpMyAdmin
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleConnectionInfo(db)}>
                                <Info className="mr-2 h-4 w-4" />
                                Connection Info
                              </DropdownMenuItem>
                              {!isAssignedToCurrentWebsite(db) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleAssignToWebsite(db)}>
                                    <Link2 className="mr-2 h-4 w-4" />
                                    Assign to {domainName || "Website"}
                                  </DropdownMenuItem>
                                </>
                              )}
                              {/* TODO: Implement these features later
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleChangePassword(db)}>
                              <Key className="mr-2 h-4 w-4" />
                              Change Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangePermissions(db)}>
                              <Settings className="mr-2 h-4 w-4" />
                              Change Permissions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleRepair(db)}>
                              <Wrench className="mr-2 h-4 w-4" />
                              Repair (via phpMyAdmin)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleImport(db)}>
                              <Upload className="mr-2 h-4 w-4" />
                              Import Dump (via phpMyAdmin)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport(db)}>
                              <Download className="mr-2 h-4 w-4" />
                              Export Dump (via phpMyAdmin)
                            </DropdownMenuItem>
                            */}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleDelete(db)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
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
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading) {
    return <DatabasesTableSkeleton />;
  }

  if (isError) {
    return <DatabasesTableError error={error as Error} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
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

      {/* Content */}
      <TableView />

      {/* Delete Confirmation Dialog */}
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

      {/* Change Password Sheet */}
      {selectedDatabase && (
        <ChangeDatabasePasswordSheet
          open={changePasswordOpen}
          onOpenChange={setChangePasswordOpen}
          database={selectedDatabase}
          userId={0} // TODO: Get actual user ID from database users
          onSuccess={() => refetch()}
        />
      )}

      {/* Change Permissions Sheet */}
      {selectedDatabase && (
        <ChangeDatabasePermissionsSheet
          open={changePermissionsOpen}
          onOpenChange={setChangePermissionsOpen}
          database={selectedDatabase}
          userId={0} // TODO: Get actual user ID from database users
          onSuccess={() => refetch()}
        />
      )}

      {/* Connection Info Dialog */}
      {selectedDatabase && (
        <DatabaseConnectionInfoDialog
          open={connectionInfoOpen}
          onOpenChange={setConnectionInfoOpen}
          database={selectedDatabase}
        />
      )}

      {/* Create Database Sheet */}
      <CreateDatabaseSheet
        open={createDatabaseOpen}
        onOpenChange={setCreateDatabaseOpen}
        siteId={siteId}
        onSuccess={() => refetch()}
      />

      {/* Assign Database Sheet */}
      {selectedDatabase && (
        <AssignDatabaseSheet
          open={assignDatabaseOpen}
          onOpenChange={setAssignDatabaseOpen}
          database={selectedDatabase}
          targetWebspaceId={siteId}
          targetDomainName={domainName || "Website"}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
