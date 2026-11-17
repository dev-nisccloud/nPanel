"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Eye,
  Folder,
  FolderOpen,
  FolderPlus,
  Home,
  LayoutGrid,
  List,
  MoreHorizontal,
  Move,
  PanelLeft,
  PanelLeftClose,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  XIcon,
} from "lucide-react";

import { FileManagerTypeIcon } from "@/components/hosting/file-manager-icon";
import { DeleteFileDialog } from "@/components/hosting/delete-file-dialog";
import { NewFolderDialog } from "@/components/hosting/new-folder-dialog";
import { RenameFileDialog } from "@/components/hosting/rename-file-dialog";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { toast } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import {
  SEED_STORAGE,
  STORAGE_QUOTA_BYTES,
  addFiles,
  breadcrumbs,
  childrenOf,
  copyItems,
  createFolder,
  deleteItems,
  folderExists,
  formatBytes,
  isInside,
  isTextFile,
  moveItems,
  parentPath,
  renameItem,
  sortStorageItems,
  topLevelSelection,
  usedBytes,
  type StorageNode,
  type StorageSort,
} from "./storage";

type ViewMode = "list" | "cards";

function usageTone(percent: number): { ring: string; text: string } {
  if (percent >= 90) {
    return { ring: "stroke-red-600 dark:stroke-red-400", text: "text-red-600 dark:text-red-400" };
  }
  if (percent >= 70) {
    return { ring: "stroke-amber-500 dark:stroke-amber-400", text: "text-amber-600 dark:text-amber-400" };
  }
  return { ring: "stroke-emerald-600 dark:stroke-emerald-400", text: "text-emerald-600 dark:text-emerald-400" };
}

function UsageRing({ percent }: { percent: number }) {
  const size = 36;
  const stroke = 3.5;
  const radius = (size - stroke) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const shown = Math.min(100, Math.max(0, percent));
  const offset = circumference - (shown / 100) * circumference;
  const tone = usageTone(shown);

  return (
    <div className="relative size-9 shrink-0" aria-label={`${Math.round(shown)}% of storage used`}>
      <svg viewBox={`0 0 ${size} ${size}`} className="size-9 -rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          className="fill-none stroke-muted"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          className={cn("fill-none", tone.ring)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className={cn("absolute inset-0 flex items-center justify-center text-[10px] font-medium tabular-nums", tone.text)}>
        {Math.round(shown)}
      </span>
    </div>
  );
}

function downloadNode(item: StorageNode, blob?: File) {
  if (item.type !== "file") return;
  const sampleOnly = !blob && !item.note && (item.size ?? 0) > 1024 * 1024;
  if (sampleOnly) {
    toast(`No downloadable copy of ${item.name}.`);
    return;
  }
  const payload =
    blob ?? new Blob([item.note ?? `${item.name}\n`], { type: item.mimeType || "text/plain" });
  const url = URL.createObjectURL(payload);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = item.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function ItemMenu({
  item,
  onOpen,
  onView,
  onDownload,
  onCopy,
  onRename,
  onMove,
  onDelete,
}: {
  item: StorageNode;
  onOpen: () => void;
  onView: () => void;
  onDownload: () => void;
  onCopy: () => void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="size-11" aria-label={`Actions for ${item.name}`}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {item.type === "folder" ? (
          <DropdownMenuItem className="min-h-11" onClick={onOpen}>
            <Folder className="size-4" />
            Open
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem className="min-h-11" onClick={onView}>
            <Eye className="size-4" />
            View
          </DropdownMenuItem>
        )}
        {item.type === "file" ? (
          <DropdownMenuItem className="min-h-11" onClick={onDownload}>
            <Download className="size-4" />
            Download
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem className="min-h-11" onClick={onCopy}>
          <Copy className="size-4" />
          Copy
        </DropdownMenuItem>
        <DropdownMenuItem className="min-h-11" onClick={onRename}>
          <Pencil className="size-4" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem className="min-h-11" onClick={onMove}>
          <Move className="size-4" />
          Move
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="min-h-11" variant="destructive" onClick={onDelete}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StorageFolderTree({
  items,
  currentPath,
  onPathSelect,
  blockedPaths = [],
}: {
  items: StorageNode[];
  currentPath: string;
  onPathSelect: (path: string) => void;
  blockedPaths?: string[];
}) {
  const folderPaths = items
    .filter((item) => item.type === "folder")
    .map((item) => item.path)
    .sort();
  const folderKey = folderPaths.join("\n");
  const [expanded, setExpanded] = React.useState<Set<string>>(
    () => new Set(["/", ...folderPaths]),
  );
  const seen = React.useRef<Set<string> | null>(null);

  React.useEffect(() => {
    const paths = folderKey ? folderKey.split("\n") : [];
    setExpanded((current) => {
      const next = new Set(current);
      next.add("/");
      if (!seen.current) {
        for (const path of paths) next.add(path);
      } else {
        for (const path of paths) {
          if (!seen.current.has(path)) {
            next.add(path);
            next.add(parentPath(path));
          }
        }
      }
      return next;
    });
    seen.current = new Set(paths);
  }, [folderKey]);

  const toggle = (path: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const renderNode = (path: string, name: string, level: number) => {
    const childFolders = childrenOf(items, path)
      .filter((item) => item.type === "folder")
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    const isOpen = expanded.has(path);
    const blocked = blockedPaths.some((folder) => isInside(path, folder));
    const selected = currentPath === path;

    return (
      <div key={path}>
        <div
          className={cn(
            "flex min-h-11 items-center rounded-md pr-1",
            selected && "bg-primary/10 text-primary",
            blocked && "opacity-50",
          )}
          style={{ paddingLeft: `${level * 12 + 4}px` }}
        >
          <button
            type="button"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-muted disabled:hover:bg-transparent"
            aria-label={isOpen ? `Collapse ${name}` : `Expand ${name}`}
            disabled={childFolders.length === 0}
            onClick={() => toggle(path)}
          >
            {childFolders.length === 0 ? (
              <span className="size-3" />
            ) : isOpen ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </button>
          <button
            type="button"
            className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-md pr-2 text-left text-sm hover:bg-muted/60"
            aria-disabled={blocked}
            onClick={() => {
              if (blocked) {
                toast.error("A folder cannot be stored inside itself.");
                return;
              }
              onPathSelect(path);
              setExpanded((current) => new Set(current).add(path));
            }}
          >
            {isOpen && childFolders.length > 0 ? (
              <FolderOpen className="size-4 shrink-0 text-primary" />
            ) : (
              <Folder className={cn("size-4 shrink-0", selected ? "text-primary" : "text-muted-foreground")} />
            )}
            <span className="truncate">{name}</span>
          </button>
        </div>
        {isOpen
          ? childFolders.map((folder) => renderNode(folder.path, folder.name, level + 1))
          : null}
      </div>
    );
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border bg-muted/30">
      <div className="shrink-0 border-b bg-background/50 p-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Folder className="size-4" />
          Folders
        </h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">{renderNode("/", "All files", 0)}</div>
    </div>
  );
}

function DestinationDialog({
  open,
  onOpenChange,
  mode,
  targets,
  items,
  currentPath,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "move" | "copy";
  targets: StorageNode[];
  items: StorageNode[];
  currentPath: string;
  onConfirm: (destination: string) => boolean;
}) {
  const [destination, setDestination] = React.useState(currentPath);
  React.useEffect(() => {
    if (open) setDestination(currentPath);
  }, [open, currentPath]);

  const blocked = targets.filter((item) => item.type === "folder").map((item) => item.path);
  const destinationBlocked = blocked.some((folder) => isInside(destination, folder));
  const alreadyThere =
    mode === "move" &&
    targets.length > 0 &&
    targets.every((item) => parentPath(item.path) === destination);
  const label = destination === "/" ? "All files" : (destination.split("/").pop() ?? destination);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(85vh,40rem)] flex-col overflow-hidden sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "move" ? "Move" : "Copy"}{" "}
            {targets.length > 1 ? `${targets.length} items` : (targets[0]?.name ?? "item")}
          </DialogTitle>
          <DialogDescription>The folder these items will be stored in.</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="h-72">
            <StorageFolderTree
              items={items}
              currentPath={destination}
              blockedPaths={blocked}
              onPathSelect={setDestination}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="min-h-11"
            disabled={destinationBlocked || alreadyThere || targets.length === 0}
            onClick={() => {
              if (onConfirm(destination)) onOpenChange(false);
            }}
          >
            {mode === "move" ? "Move" : "Copy"} to {label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewSheet({
  item,
  blob,
  open,
  onOpenChange,
  onDownload,
}: {
  item: StorageNode | null;
  blob?: File;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: () => void;
}) {
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!blob || !blob.type.startsWith("image/")) {
      setImageUrl(null);
      return;
    }
    const url = URL.createObjectURL(blob);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  if (!item) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="editor" className="p-0" side="right">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b px-6 pb-4 pt-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileManagerTypeIcon item={item} className="size-5" size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="truncate">{item.name}</SheetTitle>
                  <SheetDescription className="mt-1 flex flex-wrap items-center gap-2">
                    {item.extension ? (
                      <Badge variant="outline" className="text-xs uppercase">
                        {item.extension}
                      </Badge>
                    ) : null}
                    <span className="text-xs text-muted-foreground">{formatBytes(item.size)}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(item.modified), "MMM dd, yyyy HH:mm")}
                    </span>
                  </SheetDescription>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={onDownload}>
                  <Download className="size-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" title="Close">
                    <XIcon className="size-4" />
                  </Button>
                </SheetClose>
              </div>
            </div>
          </SheetHeader>
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            {imageUrl ? (
              <div className="flex min-h-0 flex-1 items-center justify-center p-4">
                <img src={imageUrl} alt={item.name} className="max-h-full max-w-full object-contain" />
              </div>
            ) : isTextFile(item) ? (
              <pre className="min-h-0 flex-1 overflow-auto p-6 text-sm whitespace-pre-wrap">
                {item.note ?? "No text in this file."}
              </pre>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <FileManagerTypeIcon item={item} className="mx-auto mb-4 size-12" size={48} />
                  <p className="text-sm text-muted-foreground">No preview for this file.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function CloudStorageBrowser() {
  const [items, setItems] = React.useState<StorageNode[]>(SEED_STORAGE);
  const itemsRef = React.useRef(items);
  itemsRef.current = items;
  const blobs = React.useRef(new Map<string, File>());

  const [currentPath, setCurrentPath] = React.useState("/");
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState<StorageSort>("name");
  const [view, setView] = React.useState<ViewMode>("list");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [treeOpen, setTreeOpen] = React.useState(true);
  const [dragOver, setDragOver] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const [folderOpen, setFolderOpen] = React.useState(false);
  const [renameTarget, setRenameTarget] = React.useState<StorageNode | null>(null);
  const [deleteTargets, setDeleteTargets] = React.useState<StorageNode[]>([]);
  const [destinationMode, setDestinationMode] = React.useState<"move" | "copy" | null>(null);
  const [destinationTargets, setDestinationTargets] = React.useState<StorageNode[]>([]);
  const [preview, setPreview] = React.useState<StorageNode | null>(null);
  const uploadRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) setTreeOpen(false);
  }, []);

  React.useEffect(() => {
    if (currentPath !== "/" && !folderExists(items, currentPath)) {
      setCurrentPath(parentPath(currentPath));
    }
  }, [items, currentPath]);

  React.useEffect(() => {
    setSelectedIds([]);
    setSearch("");
  }, [currentPath]);

  const commit = (next: StorageNode[]) => {
    itemsRef.current = next;
    setItems(next);
  };

  const change = (mutator: (current: StorageNode[]) => StorageNode[]) => {
    try {
      commit(mutator(itemsRef.current));
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update storage.");
      return false;
    }
  };

  const listing = sortStorageItems(
    childrenOf(items, currentPath).filter((item) =>
      item.name.toLowerCase().includes(search.trim().toLowerCase()),
    ),
    sort,
  );
  const selected = listing.filter((item) => selectedIds.includes(item.id));
  const allSelected = listing.length > 0 && selected.length === listing.length;
  const someSelected = selected.length > 0 && !allSelected;
  const crumbs = breadcrumbs(currentPath);
  const used = usedBytes(items);
  const usedPercent = Math.min(100, (used / STORAGE_QUOTA_BYTES) * 100);
  const fileCount = items.filter((item) => item.type === "file").length;
  const folderCount = items.filter((item) => item.type === "folder").length;

  const openItem = (item: StorageNode) => {
    if (item.type === "folder") {
      setCurrentPath(item.path);
      return;
    }
    setPreview(item);
  };

  const uploadFiles = (files: File[]) => {
    if (files.length === 0) return;
    try {
      const result = addFiles(
        itemsRef.current,
        currentPath,
        files.map((file) => ({ name: file.name, size: file.size, mimeType: file.type || undefined })),
      );
      result.created.forEach((node, index) => {
        const file = files[index];
        if (file) blobs.current.set(node.id, file);
      });
      commit(result.items);
      const first = result.created[0];
      toast.success(
        files.length === 1 && first ? `Uploaded ${first.name}` : `Uploaded ${files.length} files`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload those files.");
    }
  };

  const askDelete = (targets: StorageNode[]) => {
    const roots = topLevelSelection(
      itemsRef.current,
      targets.map((item) => item.id),
    );
    if (roots.length === 0) return;
    setDeleteTargets(roots);
  };

  const askDestination = (mode: "move" | "copy", targets: StorageNode[]) => {
    if (targets.length === 0) {
      toast.error("No files or folders selected.");
      return;
    }
    setDestinationTargets(targets);
    setDestinationMode(mode);
  };

  const renderMenu = (item: StorageNode) => (
    <ItemMenu
      item={item}
      onOpen={() => setCurrentPath(item.path)}
      onView={() => setPreview(item)}
      onDownload={() => downloadNode(item, blobs.current.get(item.id))}
      onCopy={() => askDestination("copy", [item])}
      onRename={() => setRenameTarget(item)}
      onMove={() => askDestination("move", [item])}
      onDelete={() => askDelete([item])}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Icons.CLOUD_STORAGE className="!size-5" />
          <h1 className="text-base font-semibold tracking-tight">Cloud Storage</h1>
        </div>
        <p className="max-w-2xl text-xs text-muted-foreground">
          Files and folders stored for the agency, separate from a hosting account.
        </p>
      </div>

      <section className="flex flex-col gap-2 rounded-lg border bg-card px-2.5 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <UsageRing percent={usedPercent} />
          <div className="mr-1 min-w-0">
            <p className="text-sm font-medium tabular-nums">
              {formatBytes(used)}
              <span className="font-normal text-muted-foreground"> of {formatBytes(STORAGE_QUOTA_BYTES)}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {fileCount} files · {folderCount} folders
            </p>
          </div>

          <div className="relative w-full sm:w-52">
            <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              className="h-8 pl-8"
              aria-label="Search this folder"
            />
          </div>
          <div className="inline-flex rounded-md border p-0.5" role="group" aria-label="View">
            <Button
              type="button"
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              className="size-8"
              aria-pressed={view === "list"}
              aria-label="List"
              onClick={() => setView("list")}
            >
              <List className="size-4" />
            </Button>
            <Button
              type="button"
              variant={view === "cards" ? "secondary" : "ghost"}
              size="icon"
              className="size-8"
              aria-pressed={view === "cards"}
              aria-label="Cards"
              onClick={() => setView("cards")}
            >
              <LayoutGrid className="size-4" />
            </Button>
          </div>
          <Select value={sort} onValueChange={(value) => setSort(value as StorageSort)}>
            <SelectTrigger className="!h-8 w-[7.5rem]" aria-label="Sort by">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="modified">Modified</SelectItem>
              <SelectItem value="size">Size</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {selected.length > 0 ? (
              <>
                <span className="inline-flex h-8 items-center rounded-md bg-secondary px-2 text-xs">
                  {selected.length} selected
                </span>
                <Button variant="outline" size="sm" className="h-8" onClick={() => askDestination("copy", selected)}>
                  <Copy className="size-3.5" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" className="h-8" onClick={() => askDestination("move", selected)}>
                  <Move className="size-3.5" />
                  Move
                </Button>
                <Button variant="destructive" size="sm" className="h-8" onClick={() => askDelete(selected)}>
                  <Trash2 className="size-3.5" />
                  Remove
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Clear selection"
                  onClick={() => setSelectedIds([])}
                >
                  <XIcon className="size-3.5" />
                </Button>
                <Separator orientation="vertical" className="mx-0.5 hidden h-4 sm:block" />
              </>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Refresh"
              onClick={() => {
                setRefreshing(true);
                window.setTimeout(() => setRefreshing(false), 400);
              }}
            >
              <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
            </Button>
            <Button size="sm" className="h-8" onClick={() => uploadRef.current?.click()}>
              <Upload className="size-3.5" />
              Upload
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => setFolderOpen(true)}>
              <FolderPlus className="size-3.5" />
              New folder
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={treeOpen ? "Hide folders" : "Show folders"}
              onClick={() => setTreeOpen((open) => !open)}
            >
              {treeOpen ? <PanelLeftClose className="size-3.5" /> : <PanelLeft className="size-3.5" />}
            </Button>
            <input
              ref={uploadRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                uploadFiles(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-0.5 border-t pt-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="All files"
            onClick={() => setCurrentPath("/")}
          >
            <Home className="size-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground">/</span>
          {crumbs.slice(1).map((crumb, index, list) => (
            <React.Fragment key={crumb.path}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 max-w-40 px-2"
                onClick={() => setCurrentPath(crumb.path)}
              >
                <span className="truncate">{crumb.name}</span>
              </Button>
              {index < list.length - 1 ? <span className="text-xs text-muted-foreground">/</span> : null}
            </React.Fragment>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">
            {listing.length} {search.trim() ? "matching" : listing.length === 1 ? "item" : "items"}
          </span>
        </div>
      </section>

      <div className="flex h-[calc(100dvh-12rem)] min-h-[28rem] gap-3">
        {treeOpen ? (
          <div className="hidden h-full w-64 shrink-0 md:block">
            <StorageFolderTree items={items} currentPath={currentPath} onPathSelect={setCurrentPath} />
          </div>
        ) : null}
        <div
          className={cn(
            "flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card",
            dragOver && "ring-2 ring-primary",
          )}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            const droppedFolder = Array.from(event.dataTransfer.items).some((item) => {
              const entry = (
                item as DataTransferItem & {
                  webkitGetAsEntry?: () => { isDirectory: boolean } | null;
                }
              ).webkitGetAsEntry?.();
              return Boolean(entry?.isDirectory);
            });
            const files = Array.from(event.dataTransfer.files);
            if (droppedFolder && files.length === 0) {
              toast.error("Only files can be added.");
              return;
            }
            if (droppedFolder) {
              toast("Only the files were added.");
            }
            uploadFiles(files);
          }}
        >
          {treeOpen ? (
            <div className="h-56 shrink-0 border-b p-2 md:hidden">
              <StorageFolderTree items={items} currentPath={currentPath} onPathSelect={setCurrentPath} />
            </div>
          ) : null}
          {listing.length === 0 ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-6 rounded-full bg-muted/50 p-4">
                <Folder className="size-12 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold">
                {search.trim() ? "No matching files" : "This folder is empty"}
              </h2>
              <p className="mt-3 max-w-md text-sm text-muted-foreground">
                {search.trim() ? "No files with that name in this folder." : "No files in this folder."}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button className="min-h-11" onClick={() => uploadRef.current?.click()}>
                  <Upload className="size-4" />
                  Upload
                </Button>
                <Button variant="outline" className="min-h-11" onClick={() => setFolderOpen(true)}>
                  <FolderPlus className="size-4" />
                  New folder
                </Button>
              </div>
              {search.trim() ? (
                <Button variant="ghost" className="mt-4 min-h-11" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              ) : null}
            </div>
          ) : view === "list" ? (
            <div className="min-h-0 flex-1 overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead className="w-14">
                      <label className="inline-flex size-11 items-center justify-center">
                        <Checkbox
                          aria-label="Select all"
                          checked={allSelected ? true : someSelected ? "indeterminate" : false}
                          onCheckedChange={(checked) =>
                            setSelectedIds(checked === true ? listing.map((item) => item.id) : [])
                          }
                        />
                      </label>
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-36">Modified</TableHead>
                    <TableHead className="w-28">Size</TableHead>
                    <TableHead className="w-14" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listing.map((item) => (
                    <TableRow
                      key={item.id}
                      className={cn(
                        "cursor-pointer",
                        selectedIds.includes(item.id) && "bg-primary/5",
                      )}
                      onClick={() => openItem(item)}
                    >
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <label className="inline-flex size-11 items-center justify-center">
                          <Checkbox
                            aria-label={`Select ${item.name}`}
                            checked={selectedIds.includes(item.id)}
                            onCheckedChange={(checked) =>
                              setSelectedIds((current) =>
                                checked === true
                                  ? [...current, item.id]
                                  : current.filter((id) => id !== item.id),
                              )
                            }
                          />
                        </label>
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-2">
                          <FileManagerTypeIcon item={item} className="size-4 shrink-0" size={16} />
                          <span className="truncate font-medium">{item.name}</span>
                          {item.type === "file" && item.extension ? (
                            <Badge variant="outline" className="text-xs uppercase">
                              {item.extension}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(item.modified), "MMM dd, yyyy")}
                        <br />
                        <span className="text-xs">{format(new Date(item.modified), "HH:mm")}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatBytes(item.size)}
                      </TableCell>
                      <TableCell onClick={(event) => event.stopPropagation()}>{renderMenu(item)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto p-3">
              <div className="mb-3 flex items-center gap-2">
                <label className="inline-flex size-11 items-center justify-center">
                  <Checkbox
                    aria-label="Select all"
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={(checked) =>
                      setSelectedIds(checked === true ? listing.map((item) => item.id) : [])
                    }
                  />
                </label>
                <span className="text-sm text-muted-foreground">Select all</span>
              </div>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {listing.map((item) => {
                  const count = item.type === "folder" ? childrenOf(items, item.path).length : 0;
                  return (
                    <li
                      key={item.id}
                      className={cn(
                        "relative flex flex-col rounded-lg border bg-background",
                        selectedIds.includes(item.id) && "border-primary bg-primary/5",
                      )}
                    >
                      <div
                        className="absolute top-1 left-1 z-10"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <label className="inline-flex size-11 items-center justify-center">
                          <Checkbox
                            aria-label={`Select ${item.name}`}
                            checked={selectedIds.includes(item.id)}
                            onCheckedChange={(checked) =>
                              setSelectedIds((current) =>
                                checked === true
                                  ? [...current, item.id]
                                  : current.filter((id) => id !== item.id),
                              )
                            }
                          />
                        </label>
                      </div>
                      <div className="absolute top-1 right-1 z-10" onClick={(event) => event.stopPropagation()}>
                        {renderMenu(item)}
                      </div>
                      <button
                        type="button"
                        className="flex min-h-44 flex-col items-start gap-3 px-3 pt-12 pb-3 text-left"
                        onClick={() => openItem(item)}
                      >
                        <span className="flex h-16 w-full items-center justify-center rounded-md bg-muted/50">
                          <FileManagerTypeIcon item={item} className="size-8" size={32} />
                        </span>
                        <span className="w-full truncate text-sm font-medium">{item.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.type === "folder"
                            ? count === 1
                              ? "1 item"
                              : `${count} items`
                            : formatBytes(item.size)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      <NewFolderDialog
        open={folderOpen}
        onOpenChange={setFolderOpen}
        currentPath={currentPath}
        isCreating={false}
        onConfirm={async (name) => {
          const ok = change((current) => createFolder(current, currentPath, name));
          if (!ok) throw new Error("Could not create the folder.");
          toast.success(`Created ${name.trim()}`);
        }}
      />
      <RenameFileDialog
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
        item={renameTarget}
        isRenaming={false}
        onConfirm={async (name) => {
          if (!renameTarget) return;
          const id = renameTarget.id;
          const ok = change((current) => renameItem(current, id, name));
          if (!ok) throw new Error("Could not rename.");
          toast.success("Renamed");
        }}
      />
      <DeleteFileDialog
        open={deleteTargets.length > 0}
        onOpenChange={(open) => {
          if (!open) setDeleteTargets([]);
        }}
        item={deleteTargets[0] ?? null}
        additionalItems={deleteTargets.slice(1)}
        isDeleting={false}
        onConfirm={async () => {
          const ids = deleteTargets.map((item) => item.id);
          const ok = change((current) => {
            const next = deleteItems(current, ids);
            const alive = new Set(next.map((item) => item.id));
            for (const id of blobs.current.keys()) {
              if (!alive.has(id)) blobs.current.delete(id);
            }
            return next;
          });
          if (!ok) throw new Error("Could not delete.");
          setSelectedIds([]);
          toast.success(deleteTargets.length === 1 ? "Deleted" : `Deleted ${deleteTargets.length} items`);
        }}
      />
      <DestinationDialog
        open={destinationMode !== null}
        onOpenChange={(open) => {
          if (!open) setDestinationMode(null);
        }}
        mode={destinationMode ?? "move"}
        targets={destinationTargets}
        items={items}
        currentPath={currentPath}
        onConfirm={(destination) => {
          if (destinationMode === "copy") {
            try {
              const result = copyItems(
                itemsRef.current,
                destinationTargets.map((item) => item.id),
                destination,
              );
              for (const [from, to] of result.idMap) {
                const blob = blobs.current.get(from);
                if (blob) blobs.current.set(to, blob);
              }
              commit(result.items);
              setSelectedIds([]);
              toast.success("Copied");
              return true;
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Could not copy.");
              return false;
            }
          }
          const ids = destinationTargets.map((item) => item.id);
          const ok = change((current) => moveItems(current, ids, destination));
          if (ok) {
            setSelectedIds([]);
            toast.success("Moved");
          }
          return ok;
        }}
      />
      <PreviewSheet
        item={preview}
        blob={preview ? blobs.current.get(preview.id) : undefined}
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
        onDownload={() => {
          if (preview) downloadNode(preview, blobs.current.get(preview.id));
        }}
      />
    </div>
  );
}
