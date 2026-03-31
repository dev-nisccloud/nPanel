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
  Grid3X3,
  List,
  Folder,
  File,
  Eye,
  Edit,
  Copy,
  Move,
  Archive,
  RefreshCw,
  ArrowLeft,
  XIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import { Icons } from "@/components/icons";
import { type FileManagerData, type FileManagerItem } from "./file-manager-schema";
import { useFtpFileManager } from "./use-ftp-file-manager";
import { hostingDetailSchema } from "./hosting-detail-schema";
import { z } from "zod";
import { toast } from "@/components/ui/sonner";
import { DeleteFileDialog } from "./delete-file-dialog";
import { RenameFileDialog } from "./rename-file-dialog";
import { MoveFileDialog } from "./move-file-dialog";
import { NewFolderDialog } from "./new-folder-dialog";
import { UploadFileSheet } from "./upload-file-sheet";
import { FileViewerSheet, isViewableFile } from "./file-viewer-sheet";
import { MediaViewerDialog, isViewableMediaFile } from "./media-viewer-dialog";
import { ExtractZipDialog } from "./extract-zip-dialog";

interface FileManagerProps {
  hostingData: z.infer<typeof hostingDetailSchema>;
}

// Loading skeleton component
function FileManagerSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:justify-between">
        <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center">
          <Skeleton className="h-10 w-full @sm/main:w-80" />
          <div className="flex items-center space-x-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="overflow-hidden rounded-lg border">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-1.5">
                <div className="flex items-start justify-between mb-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-8 w-8" />
                </div>
                <div className="flex justify-center mb-2">
                  <Skeleton className="h-24 w-24" />
                </div>
                <div className="mb-2">
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Error component
function FileManagerError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-12">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Failed to load files
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

export function FileManager({ hostingData }: FileManagerProps) {
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
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
  const [availableDirectories, setAvailableDirectories] = useState<FileManagerItem[]>([]);

  // Extract FTP credentials from hosting data
  const getFtpCredentials = () => {
    const ftpLogin = hostingData.hosting?.vrt_hst?.property?.find(
      prop => prop.name === "ftp_login"
    )?.value;
    const ftpPassword = hostingData.hosting?.vrt_hst?.property?.find(
      prop => prop.name === "ftp_password"
    )?.value;

    if (!ftpLogin || !ftpPassword) {
      throw new Error("FTP credentials not found in hosting data");
    }

    return {
      host: process.env.VITE_PUBLIC_FTP_HOST || "orion.nisccloud.com", // From environment
      port: parseInt(process.env.VITE_PUBLIC_FTP_PORT || "21"),
      user: String(ftpLogin),
      password: String(ftpPassword),
      secure: true, // Use FTPS
      timeout: 30000,
    };
  };

  // Use FTP file manager hook
  const {
    data,
    isLoading,
    isError,
    error,
    currentPath,
    navigateToPath,
    navigateUp,
    navigateToBreadcrumb,
    refreshCurrentPath,
    deleteItem,
    renameItem,
    moveItem,
    createFolder,
    uploadFile,
    downloadItem,
    isDeleting,
    isRenaming,
    isMoving,
    isCreating,
    isUploading,
    isDownloading,
  } = useFtpFileManager(getFtpCredentials(), "/"); // Start at root directory

  const filteredItems = (data?.items || []).filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
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
    // Capture available directories at the time of opening the dialog
    const directories = (data?.items || []).filter(item => item.type === "folder");
    setAvailableDirectories(directories);
    setMoveDialogOpen(true);
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

  // Check if selected items include a zip file
  const hasSelectedZipFile = (): boolean => {
    if (selectedItems.length === 0) return false;
    return filteredItems.some(item =>
      selectedItems.includes(item.id) && isZipFile(item)
    );
  };

  // Get the first selected zip file
  const getSelectedZipFile = (): FileManagerItem | null => {
    if (selectedItems.length === 0) return null;
    return filteredItems.find(item =>
      selectedItems.includes(item.id) && isZipFile(item)
    ) || null;
  };

  // Handle extract from selected items
  const handleExtractSelected = () => {
    const zipFile = getSelectedZipFile();
    if (zipFile) {
      handleExtractClick(zipFile);
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
    if (selectedItem) {
      await moveItem(selectedItem.path, destinationPath);
    }
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

  const CardView = () => (
    <div className="overflow-hidden rounded-lg border">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
        {filteredItems.map((item) => (
          <Card
            key={item.id}
            className={`cursor-pointer transition-all hover:shadow-md ${selectedItems.includes(item.id) ? "ring-2 ring-primary" : ""
              }`}
            onClick={() => {
              if (item.type === "folder") {
                navigateToPath(item.path);
              } else if (isViewableFile(item)) {
                // Open file viewer for viewable files
                setViewingFile(item);
                setFileViewerOpen(true);
              } else {
                // For non-viewable files, just select them
                handleSelectItem(item.id, !selectedItems.includes(item.id));
              }
            }}
          >
            <CardContent className="p-1.5">
              {/* Header with checkbox and actions */}
              <div className="flex items-start justify-between mb-2">
                <Checkbox
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={(checked) => {
                    handleSelectItem(item.id, !!checked);
                  }}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isViewableFile(item) && (
                      <DropdownMenuItem onClick={() => {
                        setViewingFile(item);
                        setFileViewerOpen(true);
                      }}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleDownloadClick(item)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                    {isZipFile(item) && (
                      <DropdownMenuItem onClick={() => handleExtractClick(item)}>
                        <Archive className="mr-2 h-4 w-4" />
                        Extract
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleRenameClick(item)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleMoveClick(item)}>
                      <Move className="mr-2 h-4 w-4" />
                      Move
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
              </div>

              {/* Icon - Centered and bigger */}
              <div className="flex justify-center mb-2">
                {item.type === "folder" ? (
                  <Icons.Folder className="h-24 w-24 text-muted-foreground" />
                ) : (
                  <Icons.Document className="h-24 w-24 text-muted-foreground" />
                )}
              </div>

              {/* File/Folder name - Left aligned */}
              <div className="mb-2">
                <h3 className="font-medium text-sm truncate" title={item.name}>
                  {item.name}
                </h3>

                {/* File info - only for files */}
                {item.type === "file" && (
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(item.size)}
                  </div>
                )}
              </div>

              {/* Date at bottom - subtle */}
              <div className="text-xs text-muted-foreground/70">
                {format(new Date(item.modified), "MMM dd, yyyy")}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const TableView = () => (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
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
            <TableHead className="pl-6">Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Modified</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredItems.map((item) => (
            <TableRow
              key={item.id}
              className={`cursor-pointer ${selectedItems.includes(item.id) ? "bg-muted/50" : ""
                }`}
              onClick={() => {
                if (item.type === "folder") {
                  navigateToPath(item.path);
                } else if (isViewableMediaFile(item)) {
                  setViewingMediaFile(item);
                  setMediaViewerOpen(true);
                } else if (isViewableFile(item)) {
                  setViewingFile(item);
                  setFileViewerOpen(true);
                } else {
                  handleSelectItem(item.id, !selectedItems.includes(item.id));
                }
              }}
            >
              <TableCell>
                <Checkbox
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={(checked) => {
                    handleSelectItem(item.id, !!checked);
                  }}
                />
              </TableCell>
              <TableCell className="pl-6">
                <div className="flex items-center space-x-2">
                  {item.type === "folder" ? (
                    <Icons.Folder className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Icons.Document className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium">{item.name}</span>
                  {item.type === "file" && item.extension && (
                    <Badge variant="outline" className="text-xs">
                      {item.extension.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={item.type === "folder" ? "default" : "secondary"}>
                  {item.type === "folder" ? "Folder" : "File"}
                </Badge>
              </TableCell>
              <TableCell>{formatFileSize(item.size)}</TableCell>
              <TableCell>{format(new Date(item.modified), "MMM dd, yyyy HH:mm")}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
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
                    {isViewableFile(item) && !isViewableMediaFile(item) && (
                      <DropdownMenuItem onClick={() => {
                        setViewingFile(item);
                        setFileViewerOpen(true);
                      }}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleDownloadClick(item)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRenameClick(item)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleMoveClick(item)}>
                      <Move className="mr-2 h-4 w-4" />
                      Move
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
  );

  return (
    <div className="space-y-4">
      {/* Current path (full-width, wraps) */}
      <div className="w-full rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-1 gap-y-1 break-words">
          <Button
            variant="ghost"
            size="sm"
            onClick={navigateUp}
            disabled={currentPath === "/"}
            className="h-6 px-2"
          >
            <ArrowLeft className="h-3 w-3" />
          </Button>
          {(data?.breadcrumbs || []).map((crumb, index) => (
            <React.Fragment key={crumb.path}>
              <span
                className="cursor-pointer hover:text-foreground"
                onClick={() => navigateToBreadcrumb(crumb.path)}
              >
                {crumb.name}
              </span>
              {index < (data?.breadcrumbs || []).length - 1 && <span>/</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Header with controls */}
      <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:justify-between">
        <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center">
          <div className="relative">
            <Input
              placeholder="Search files and folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full @sm/main:w-80"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshCurrentPath}
            disabled={isLoading}
            className="flex-shrink-0"
          >
            <RefreshCw className={`h-4 w-4 @sm/main:mr-2 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden @sm/main:inline">Refresh</span>
          </Button>

          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "card" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("card")}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          {selectedItems.length > 0 && (
            <>
              {hasSelectedZipFile() && (
                <Button
                  variant="default"
                  size="sm"
                  className="flex-shrink-0"
                  onClick={handleExtractSelected}
                >
                  <Archive className="h-4 w-4 @sm/main:mr-2" />
                  <span className="hidden @sm/main:inline">Extract</span>
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                className="flex-shrink-0"
                onClick={handleBulkDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Spinner variant="ellipsis" className="h-4 w-4 @sm/main:mr-2 text-destructive-foreground" size="sm" />
                    <span className="hidden @sm/main:inline">Deleting...</span>
                    <span className="@sm/main:hidden">Deleting</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 @sm/main:mr-2" />
                    <span className="hidden @sm/main:inline">Delete ({selectedItems.length})</span>
                    <span className="@sm/main:hidden">Delete</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0"
                onClick={() => setSelectedItems([])}
              >
                <XIcon className="h-4 w-4 @sm/main:mr-2" />
                <span className="hidden @sm/main:inline">Clear Selection</span>
                <span className="@sm/main:hidden">Clear</span>
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0"
            onClick={() => setUploadSheetOpen(true)}
          >
            <Upload className="h-4 w-4 @sm/main:mr-2" />
            <span className="hidden @sm/main:inline">Upload</span>
            <span className="@sm/main:hidden">Upload</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0"
            onClick={() => setNewFolderDialogOpen(true)}
          >
            <FolderPlus className="h-4 w-4 @sm/main:mr-2" />
            <span className="hidden @sm/main:inline">New Folder</span>
            <span className="@sm/main:hidden">Folder</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <FileManagerSkeleton />
      ) : isError ? (
        <FileManagerError error={error as unknown as Error} onRetry={refreshCurrentPath} />
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-center max-w-md">
            <div className="mb-6 p-4 bg-muted/50 rounded-full w-fit mx-auto">
              <Folder className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3">
              {searchTerm ? "No files match your search" : "This directory is empty"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm
                ? `No files or folders match "${searchTerm}". Try adjusting your search terms.`
                : "Upload files or create folders to get started with your hosting account."
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="default"
                size="sm"
                onClick={() => setUploadSheetOpen(true)}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Files
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <FolderPlus className="h-4 w-4" />
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
        viewMode === "card" ? <CardView /> : <TableView />
      )}

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
        item={
          bulkDeleteItems && bulkDeleteItems.length > 0
            ? bulkDeleteItems[0]
            : selectedItem
        }
        additionalItems={
          bulkDeleteItems && bulkDeleteItems.length > 1
            ? bulkDeleteItems.slice(1)
            : undefined
        }
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
        onOpenChange={(open) => {
          setMoveDialogOpen(open);
          if (!open) {
            setAvailableDirectories([]); // Clear when dialog closes
          }
        }}
        item={selectedItem}
        availableDirectories={availableDirectories}
        onConfirm={handleMoveConfirm}
        isMoving={isMoving}
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
        <FileViewerSheet
          open={fileViewerOpen}
          onOpenChange={setFileViewerOpen}
          file={viewingFile}
          hostingData={hostingData}
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
            setExtractZipDialogOpen(false);
            setExtractingFile(null);
          }}
        />
      )}
    </div>
  );
}
