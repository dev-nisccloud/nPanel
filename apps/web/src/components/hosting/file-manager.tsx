"use client";

import * as React from "react";
import { useState } from "react";
import { format } from "date-fns";
import {
  Upload,
  Download,
  Trash2,
  FolderPlus,
  MoreHorizontal,
  Folder,
  File,
  Eye,
  Edit,
  Move,
  Archive,
  RefreshCw,
  ArrowLeft,
  XIcon,
  Copy,
  KeyRound,
  PanelLeftClose,
  PanelLeft,
  Home,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { FileManagerTypeIcon } from "@/components/hosting/file-manager-icon";
import { FileManagerFolderTree, type FolderTreeNode } from "@/components/hosting/file-manager-folder-tree";
import type { FileManagerItem } from "@/components/hosting/file-manager-schema";
import { sortFileManagerItems } from "@/components/hosting/file-manager-schema";
import { useFtpFileManager } from "@/components/hosting/use-ftp-file-manager";
import {
  FileManagerSuspendedOverlay,
  isPleskWebspaceActive,
} from "@/components/hosting/file-manager-suspended-overlay";
import { hostingDetailSchema } from "@/components/hosting/hosting-detail-schema";
import { z } from "zod";
import { toast } from "@/components/ui/sonner";
import { DeleteFileDialog } from "@/components/hosting/delete-file-dialog";
import { RenameFileDialog } from "@/components/hosting/rename-file-dialog";
import { MoveFileDialog } from "@/components/hosting/move-file-dialog";
import { NewFolderDialog } from "@/components/hosting/new-folder-dialog";
import { UploadFileSheet } from "@/components/hosting/upload-file-sheet";
import {
  HostingFileViewerSheet,
  isViewableHostingFile,
} from "@/components/hosting/hosting-file-viewer-sheet";
import { MediaViewerDialog, isViewableMediaFile } from "@/components/hosting/media-viewer-dialog";
import { CopyFileDialog } from "@/components/hosting/copy-file-dialog";
import { PermissionsDialog } from "@/components/hosting/permissions-dialog";
import { ArchiveFileDialog } from "@/components/hosting/archive-file-dialog";
import { ExtractZipSheet as ExtractZipDialog } from "@/components/hosting/extract-zip-sheet";

interface FileManagerProps {
  hostingData: z.infer<typeof hostingDetailSchema>;
  openCreateSheet?: boolean;
  onCreateSheetOpened?: () => void;
  initialPath?: string;
}

// Loading skeleton component
function FileManagerSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4 w-full min-w-0 md:w-auto md:flex-row md:items-center">
          <Skeleton className="h-10 w-full md:w-80" />
          <div className="flex items-center space-x-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Content skeleton matches the loaded table */}
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              <TableHead className="pl-6">Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Modified</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-4" />
                </TableCell>
                <TableCell className="pl-6">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 shrink-0" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-14" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
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
function FileManagerError({ onRetry, description }: { onRetry: () => void; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-12">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Failed to load files
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {description?.trim() || "An error occurred. Please try again later or contact support."}
        </p>
      </div>
      <Button onClick={onRetry} variant="outline" className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}

function FileManagerContent({
  hostingData,
  openCreateSheet,
  onCreateSheetOpened,
  initialPath = "/",
}: FileManagerProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveTargets, setMoveTargets] = useState<FileManagerItem[]>([]);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiveTargets, setArchiveTargets] = useState<FileManagerItem[]>([]);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [viewingMediaFile, setViewingMediaFile] = useState<FileManagerItem | null>(null);
  const [extractZipDialogOpen, setExtractZipDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FileManagerItem | null>(null);
  const [bulkDeleteItems, setBulkDeleteItems] = useState<FileManagerItem[] | null>(null);
  const [viewingFile, setViewingFile] = useState<FileManagerItem | null>(null);
  const [extractingFile, setExtractingFile] = useState<FileManagerItem | null>(null);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copyTargets, setCopyTargets] = useState<FileManagerItem[]>([]);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [permissionTargets, setPermissionTargets] = useState<FileManagerItem[]>([]);

  React.useEffect(() => {
    if (!openCreateSheet) return;
    setUploadSheetOpen(true);
    onCreateSheetOpened?.();
  }, [openCreateSheet, onCreateSheetOpened]);

  React.useEffect(() => {
    setSearchTerm("");
    setSelectedItems([]);
  }, [initialPath]);

  // Extract FTP credentials from hosting data
  const ftpCredentials = React.useMemo(() => {
    const ftpLogin = hostingData.hosting?.vrt_hst?.property?.find(
      (prop) => prop.name === "ftp_login",
    )?.value;
    const ftpPassword = hostingData.hosting?.vrt_hst?.property?.find(
      (prop) => prop.name === "ftp_password",
    )?.value;

    if (!ftpLogin || !ftpPassword) {
      throw new Error("FTP credentials not found in hosting data");
    }

    return {
      host: import.meta.env.VITE_FTP_HOST || "orion.nisccloud.com",
      port: parseInt(import.meta.env.VITE_FTP_PORT || "21", 10),
      user: String(ftpLogin),
      password: String(ftpPassword),
      secure: true,
      timeout: 30000,
    };
  }, [hostingData]);

  // Use FTP file manager hook
  const {
    data,
    isLoading,
    isRefreshing,
    isError,
    errorMessage,
    currentPath,
    navigateToPath,
    navigateUp,
    navigateToBreadcrumb,
    refreshCurrentPath,
    listDirectory,
    deleteItem,
    renameItem,
    moveItems,
    archiveItems,
    copyItems,
    changePermissions,
    createFolder,
    uploadFile,
    downloadItem,
    isDeleting,
    isRenaming,
    isMoving,
    isArchiving,
    isCopying,
    isChangingPermissions,
    isCreating,
    isUploading,
    isDownloading,
  } = useFtpFileManager(ftpCredentials, initialPath);

  const filteredItems = sortFileManagerItems(
    (data?.items || []).filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "-";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const isAllSelected = filteredItems.length > 0 && selectedItems.length === filteredItems.length;
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < filteredItems.length;

  // Dialog handlers
  const handleDeleteClick = (item: FileManagerItem) => {
    setSelectedItem(item);
    setBulkDeleteItems(null);
    setDeleteDialogOpen(true);
  };

  const handleRenameClick = (item: FileManagerItem) => {
    setSelectedItem(item);
    setRenameDialogOpen(true);
  };

  const handleMoveClick = (item: FileManagerItem) => {
    setSelectedItem(item);
    setMoveTargets([item]);
    setMoveDialogOpen(true);
  };

  const selectedFileItems = () =>
    (data?.items || []).filter((item) => selectedItems.includes(item.id));

  const handleSelectionMove = () => {
    const items = selectedFileItems();
    if (items.length === 0) {
      toast.error("Select at least one file or folder to move");
      return;
    }
    setMoveTargets(items);
    setSelectedItem(items[0] ?? null);
    setMoveDialogOpen(true);
  };

  const handleSelectionArchive = () => {
    const items = selectedFileItems();
    if (items.length === 0) {
      toast.error("Select at least one file or folder to archive");
      return;
    }
    setArchiveTargets(items);
    setArchiveDialogOpen(true);
  };

  const handleCopyClick = (items: FileManagerItem[]) => {
    if (items.length === 0) {
      toast.error("Select at least one file or folder to copy");
      return;
    }
    setCopyTargets(items);
    setCopyDialogOpen(true);
  };

  const handlePermissionsClick = (items: FileManagerItem[]) => {
    if (items.length === 0) {
      toast.error("Select at least one file or folder");
      return;
    }
    setPermissionTargets(items);
    setPermissionsDialogOpen(true);
  };

  const handleExtractClick = (item: FileManagerItem) => {
    setExtractingFile(item);
    setExtractZipDialogOpen(true);
  };

  // Check if file is a zip file
  const isZipFile = (item: FileManagerItem): boolean => {
    return item.type === "file" &&
      (item.extension?.toLowerCase() === "zip" ||
        item.name.toLowerCase().endsWith(".zip"));
  };

  const handleItemActivate = (item: FileManagerItem) => {
    if (item.type === "folder") {
      navigateToPath(item.path);
      return;
    }
    if (isViewableMediaFile(item)) {
      setViewingMediaFile(item);
      setMediaViewerOpen(true);
      return;
    }
    if (isViewableHostingFile(item)) {
      setViewingFile(item);
      setFileViewerOpen(true);
      return;
    }
    if (isZipFile(item)) {
      handleExtractClick(item);
    }
  };

  const handleDeleteConfirm = async () => {
    const itemsToDelete =
      bulkDeleteItems && bulkDeleteItems.length > 0
        ? bulkDeleteItems
        : selectedItem
          ? [selectedItem]
          : [];

    if (itemsToDelete.length === 0) return;

    for (const item of itemsToDelete) {
      // eslint-disable-next-line no-await-in-loop
      await deleteItem(item);
    }

    if (bulkDeleteItems && bulkDeleteItems.length > 0) {
      setSelectedItems([]);
      setBulkDeleteItems(null);
    }

    setSelectedItem(null);
  };

  const handleRenameConfirm = async (newName: string) => {
    if (selectedItem) {
      const parentPath = selectedItem.path.split('/').slice(0, -1).join('/') || '/';
      const newPath = `${parentPath}/${newName}`;
      await renameItem(selectedItem.path, newPath);
    }
  };

  const handleMoveConfirm = async (destinationPath: string) => {
    if (moveTargets.length === 0) return;
    await moveItems(
      moveTargets.map((item) => ({ path: item.path, type: item.type })),
      destinationPath,
    );
    setSelectedItems([]);
  };

  const handleArchiveConfirm = async (archiveName: string) => {
    await archiveItems(
      archiveTargets.map((item) => ({ path: item.path, type: item.type })),
      currentPath,
      archiveName,
    );
    setSelectedItems([]);
  };

  const handleDownloadClick = async (item: FileManagerItem) => {
    await downloadItem(item);
  };

  const handleNewFolderConfirm = async (folderName: string) => {
    const newFolderPath = `${currentPath}/${folderName}`.replace(/\/+/g, '/');
    await createFolder(newFolderPath);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    // Find the items to delete
    const itemsToDelete = (data?.items || []).filter(item =>
      selectedItems.includes(item.id)
    );

    if (itemsToDelete.length === 0) {
      toast.error("No items found to delete");
      setSelectedItems([]);
      return;
    }

    setBulkDeleteItems(itemsToDelete);
    setDeleteDialogOpen(true);
  };

  const loadFolderTree = React.useCallback(async (path: string): Promise<FolderTreeNode[]> => {
    const items = await listDirectory(path);
    return items
      .filter((item) => item.type === "folder")
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
      .map((item) => ({
        path: item.path,
        name: item.name,
        childrenLoaded: false,
      }));
  }, [listDirectory]);

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-col gap-3 bg-background border rounded-lg p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

        {/* Right section - Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Bulk actions when items selected */}
          {selectedItems.length > 0 && (
            <>
              <Badge variant="secondary" className="h-9 px-3">
                {selectedItems.length} selected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const items = (data?.items || []).filter((item) => selectedItems.includes(item.id));
                  handleCopyClick(items);
                }}
                disabled={isCopying}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const items = (data?.items || []).filter((item) => selectedItems.includes(item.id));
                  handlePermissionsClick(items);
                }}
                disabled={isChangingPermissions}
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Permissions
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectionMove}
                disabled={isMoving}
              >
                <Move className="h-4 w-4 mr-2" />
                Move
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectionArchive}
                disabled={isArchiving}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Spinner variant="ellipsis" className="h-4 w-4 mr-2" size="sm" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedItems([])}
              >
                <XIcon className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
            </>
          )}

          {/* Regular actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refreshCurrentPath()}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUploadSheetOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNewFolderDialogOpen(true)}
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>
        </div>

        <div className="flex w-full items-center gap-1 flex-wrap border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateToPath("/")}
            className="h-8 px-2"
          >
            <Home className="h-4 w-4" />
          </Button>
          <span className="text-muted-foreground">/</span>
          {(data?.breadcrumbs || []).slice(1).map((crumb, index, arr) => (
            <React.Fragment key={crumb.path}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateToBreadcrumb(crumb.path)}
                className="h-8 px-2 text-sm font-medium hover:text-primary"
              >
                {crumb.name}
              </Button>
              {index < arr.length - 1 && <span className="text-muted-foreground">/</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content Area - Split View */}
      <div className="flex h-[40rem] max-h-[calc(100vh-14rem)] min-h-0 gap-4 overflow-hidden">
        {/* Left Sidebar - Folder Tree */}
        {!sidebarCollapsed && (
          <div className="h-full min-h-0 w-64 shrink-0">
            <FileManagerFolderTree
              currentPath={currentPath}
              onPathSelect={navigateToPath}
              onLoadFolder={loadFolderTree}
              className="rounded-lg overflow-hidden h-full"
            />
          </div>
        )}

        {/* Right Side - File List */}
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {isLoading ? (
            <FileManagerSkeleton />
          ) : isError ? (
            <FileManagerError onRetry={refreshCurrentPath} description={errorMessage} />
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 border rounded-lg bg-muted/20">
              <div className="text-center max-w-md">
                <div className="mb-6 p-4 bg-muted/50 rounded-full w-fit mx-auto">
                  <Folder className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  {searchTerm ? "No files match your search" : "This directory is empty"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm
                    ? `No files or folders match "${searchTerm}". Try adjusting your search.`
                    : "Upload files or create folders to get started."
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setUploadSheetOpen(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewFolderDialogOpen(true)}
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New Folder
                  </Button>
                </div>
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    className="mt-4"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-0 overflow-auto rounded-lg border bg-card">
              <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          ref={(el) => {
                            if (el) {
                              (el as HTMLButtonElement).indeterminate = isIndeterminate;
                            }
                          }}
                          onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="w-32">Modified</TableHead>
                      <TableHead className="w-24">Size</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow
                        key={item.id}
                        className={cn(
                          "cursor-pointer hover:bg-muted/50 transition-colors",
                          selectedItems.includes(item.id) && "bg-primary/5"
                        )}
                        onClick={() => handleItemActivate(item)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={(checked) => {
                              handleSelectItem(item.id, !!checked);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileManagerTypeIcon item={item} className="h-4 w-4 shrink-0" size={16} />
                            <span className="font-medium truncate">{item.name}</span>
                            {item.type === "file" && item.extension && (
                              <Badge variant="outline" className="text-xs uppercase">
                                {item.extension}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(item.modified), "MMM dd, yyyy")}
                          <br />
                          <span className="text-xs">{format(new Date(item.modified), "HH:mm")}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatFileSize(item.size)}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {isViewableMediaFile(item) && (
                                <DropdownMenuItem onClick={() => {
                                  setViewingMediaFile(item);
                                  setMediaViewerOpen(true);
                                }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                              )}
                              {isViewableHostingFile(item) && !isViewableMediaFile(item) && (
                                <DropdownMenuItem onClick={() => {
                                  setViewingFile(item);
                                  setFileViewerOpen(true);
                                }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                              )}
                              {isZipFile(item) && (
                                <DropdownMenuItem onClick={() => handleExtractClick(item)}>
                                  <Archive className="mr-2 h-4 w-4" />
                                  Extract
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleDownloadClick(item)}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopyClick([item])}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRenameClick(item)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMoveClick(item)}>
                                <Move className="mr-2 h-4 w-4" />
                                Move
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePermissionsClick([item])}>
                                <KeyRound className="mr-2 h-4 w-4" />
                                Permissions
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteClick(item)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <DeleteFileDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setBulkDeleteItems(null);
            setSelectedItem(null);
          }
        }}
        item={bulkDeleteItems && bulkDeleteItems.length > 0 ? bulkDeleteItems[0] : selectedItem}
        additionalItems={bulkDeleteItems && bulkDeleteItems.length > 1 ? bulkDeleteItems.slice(1) : undefined}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      <RenameFileDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        item={selectedItem}
        onConfirm={handleRenameConfirm}
        isRenaming={isRenaming}
      />

      <MoveFileDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        item={moveTargets[0] ?? selectedItem}
        items={moveTargets}
        currentPath={currentPath}
        onLoadFolder={loadFolderTree}
        onConfirm={handleMoveConfirm}
        isMoving={isMoving}
      />

      <ArchiveFileDialog
        open={archiveDialogOpen}
        onOpenChange={(open) => {
          setArchiveDialogOpen(open);
          if (!open) setArchiveTargets([]);
        }}
        items={archiveTargets}
        currentPath={currentPath}
        isArchiving={isArchiving}
        onConfirm={handleArchiveConfirm}
      />

      <PermissionsDialog
        open={permissionsDialogOpen}
        onOpenChange={(open) => {
          setPermissionsDialogOpen(open);
          if (!open) setPermissionTargets([]);
        }}
        items={permissionTargets}
        isSaving={isChangingPermissions}
        onConfirm={async (mode, recursive) => {
          await changePermissions(
            permissionTargets.map((item) => ({ path: item.path, type: item.type })),
            mode,
            recursive,
          );
          setSelectedItems([]);
        }}
      />

      <CopyFileDialog
        open={copyDialogOpen}
        onOpenChange={(open) => {
          setCopyDialogOpen(open);
          if (!open) setCopyTargets([]);
        }}
        items={copyTargets}
        currentPath={currentPath}
        onLoadFolder={loadFolderTree}
        isCopying={isCopying}
        onConfirm={async (destinationPath) => {
          await copyItems(
            copyTargets.map((item) => ({ path: item.path, type: item.type })),
            destinationPath,
          );
          setSelectedItems([]);
        }}
      />

      <NewFolderDialog
        open={newFolderDialogOpen}
        onOpenChange={setNewFolderDialogOpen}
        onConfirm={handleNewFolderConfirm}
        isCreating={isCreating}
        currentPath={currentPath}
      />

      {/* Upload File Sheet */}
      <UploadFileSheet
        open={uploadSheetOpen}
        onOpenChange={setUploadSheetOpen}
        hostingData={hostingData}
        uploadFile={uploadFile}
        currentPath={currentPath}
        isUploading={isUploading}
        onSuccess={() => {
          refreshCurrentPath(); // Refresh the file list after successful upload
        }}
      />

      {/* File Viewer Sheet (text/code) */}
      {viewingFile && (
        <HostingFileViewerSheet
          open={fileViewerOpen}
          onOpenChange={setFileViewerOpen}
          file={viewingFile}
          getCredentials={() => ({
            host: import.meta.env.VITE_PUBLIC_FTP_HOST || "orion.nisccloud.com",
            port: Number.parseInt(import.meta.env.VITE_PUBLIC_FTP_PORT || "21", 10),
            user: ftpCredentials.user,
            password: ftpCredentials.password,
            secure: true,
            timeout: 30000,
          })}
        />
      )}

      {/* Media Viewer Dialog (images/videos) */}
      <MediaViewerDialog
        open={mediaViewerOpen}
        onOpenChange={(open) => {
          setMediaViewerOpen(open);
          if (!open) setViewingMediaFile(null);
        }}
        file={viewingMediaFile}
        hostingData={hostingData}
        onDownload={handleDownloadClick}
      />

      {/* Extract Zip Dialog */}
      {extractingFile && (
        <ExtractZipDialog
          open={extractZipDialogOpen}
          onOpenChange={(open) => {
            setExtractZipDialogOpen(open);
            if (!open) {
              setExtractingFile(null);
            }
          }}
          file={extractingFile}
          hostingData={hostingData}
          currentPath={currentPath}
          onSuccess={() => {
            refreshCurrentPath();
          }}
        />
      )}
    </div>
  );
}

export function FileManager(props: FileManagerProps) {
  if (!isPleskWebspaceActive(props.hostingData.gen_info.status)) {
    return (
      <FileManagerSuspendedOverlay
        pleskSubscriptionId={props.hostingData.id}
        domain={props.hostingData.gen_info.name}
      />
    );
  }

  return <FileManagerContent {...props} />;
}
