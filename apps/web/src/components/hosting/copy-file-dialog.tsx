"use client";

import * as React from "react";
import { Copy, Folder } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import {
  FileManagerFolderTree,
  type FolderTreeNode,
} from "@/components/hosting/file-manager-folder-tree";

export interface CopyDialogItem {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
}

interface CopyFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CopyDialogItem[];
  currentPath: string;
  onLoadFolder: (path: string) => Promise<FolderTreeNode[]>;
  onConfirm: (destinationPath: string) => Promise<void>;
  isCopying: boolean;
}

function normalizePath(path: string): string {
  const parts = path.trim().split("/").filter((part) => part && part !== ".");
  return `/${parts.join("/")}`;
}

function folderContainsDestination(folderPath: string, destinationPath: string): boolean {
  const folder = normalizePath(folderPath);
  const destination = normalizePath(destinationPath);
  if (folder === "/") return destination === "/";
  return destination === folder || destination.startsWith(`${folder}/`);
}

export function CopyFileDialog({
  open,
  onOpenChange,
  items,
  currentPath,
  onLoadFolder,
  onConfirm,
  isCopying,
}: CopyFileDialogProps) {
  const [selectedDirectory, setSelectedDirectory] = React.useState(currentPath || "/");

  React.useEffect(() => {
    if (!open) return;
    setSelectedDirectory(currentPath || "/");
  }, [open, currentPath]);

  const destinationPath = selectedDirectory || "/";

  const handleConfirm = async () => {
    if (items.length === 0 || !destinationPath) return;

    const blocked = items.find(
      (item) => item.type === "folder" && folderContainsDestination(item.path, destinationPath),
    );
    if (blocked) {
      toast.error(`"${blocked.name}" cannot be copied into itself.`);
      return;
    }

    await onConfirm(normalizePath(destinationPath));
    onOpenChange(false);
  };

  const label =
    items.length === 1
      ? items[0]?.name
      : `${items.length} items`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(85vh,40rem)] min-w-0 flex-col overflow-hidden sm:max-w-xl">
        <DialogHeader className="min-w-0 shrink-0 pr-8">
          <DialogTitle className="flex min-w-0 items-center gap-2 break-words">
            <Copy className="h-5 w-5 shrink-0 text-primary" />
            Copy {items.length === 1 ? (items[0]?.type === "folder" ? "folder" : "file") : "items"}
          </DialogTitle>
          <DialogDescription className="break-words">
            The original stays in place. A copy is created in the folder you choose. If that name already exists, the copy is named with “copy”.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto py-1">
          <div className="flex min-w-0 items-center gap-3 rounded-lg bg-muted p-3">
            <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" title={label}>
                {label}
              </p>
              {items.length === 1 ? (
                <p className="break-all text-xs text-muted-foreground" title={items[0]?.path}>
                  {items[0]?.path}
                </p>
              ) : (
                <p className="break-words text-xs text-muted-foreground">
                  {items.map((item) => item.name).join(", ")}
                </p>
              )}
            </div>
          </div>

          <div className="min-w-0 space-y-2">
            <p className="text-sm font-medium">Destination folder</p>
            <div className={isCopying ? "pointer-events-none opacity-60" : undefined}>
              {open ? (
                <FileManagerFolderTree
                  className="h-64 rounded-lg bg-background"
                  showHeader={false}
                  currentPath={destinationPath}
                  expandPath={currentPath || "/"}
                  onPathSelect={setSelectedDirectory}
                  onLoadFolder={onLoadFolder}
                />
              ) : null}
            </div>
            <p className="break-all text-xs text-muted-foreground">
              Selected: {destinationPath}
            </p>
          </div>
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCopying}>
            Cancel
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={isCopying || !destinationPath || items.length === 0}>
            {isCopying ? (
              <>
                <Spinner className="mr-2 h-4 w-4" size="sm" />
                Copying...
              </>
            ) : (
              "Copy"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
