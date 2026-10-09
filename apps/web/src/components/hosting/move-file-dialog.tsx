"use client";

import * as React from "react";
import { useState } from "react";
import { Move, Folder, FileText } from "lucide-react";

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
import {
  FileManagerFolderTree,
  type FolderTreeNode,
} from "@/components/hosting/file-manager-folder-tree";

import { type FileManagerItem } from "@/components/hosting/file-manager-schema";

interface MoveFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FileManagerItem | null;
  items?: FileManagerItem[];
  currentPath: string;
  onLoadFolder: (path: string) => Promise<FolderTreeNode[]>;
  onConfirm: (destinationPath: string) => Promise<void>;
  isMoving: boolean;
}

export function MoveFileDialog({
  open,
  onOpenChange,
  item,
  items,
  currentPath,
  onLoadFolder,
  onConfirm,
  isMoving,
}: MoveFileDialogProps) {
  const targets = items && items.length > 0 ? items : item ? [item] : [];
  const [selectedDirectory, setSelectedDirectory] = useState(currentPath || "/");

  React.useEffect(() => {
    if (!open) return;
    setSelectedDirectory(currentPath || "/");
  }, [open, currentPath]);

  const handleConfirm = async () => {
    if (targets.length === 0 || !selectedDirectory) return;

    try {
      await onConfirm(selectedDirectory);
      onOpenChange(false);
    } catch {
      // Error handling is done in the mutation
    }
  };

  if (targets.length === 0) return null;
  const primary = targets[0];
  if (!primary) return null;

  const isDirectory = primary.type === "folder";
  const itemType = targets.length > 1 ? "items" : isDirectory ? "directory" : "file";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(85vh,40rem)] min-w-0 flex-col overflow-hidden sm:max-w-xl">
        <DialogHeader className="min-w-0 shrink-0 pr-8">
          <DialogTitle className="flex min-w-0 items-center gap-2 break-words">
            <Move className="h-5 w-5 shrink-0 text-primary" />
            Move {targets.length > 1 ? `${targets.length} items` : isDirectory ? "Directory" : "File"}
          </DialogTitle>
          <DialogDescription className="break-words">
            {targets.length > 1
              ? "Choose a destination. Every selected item will be moved there."
              : `Choose a destination for this ${itemType}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto py-1">
          <div className="flex min-w-0 items-center gap-3 rounded-lg bg-muted p-3">
            <div className="shrink-0">
              {isDirectory ? (
                <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-100 dark:bg-blue-900">
                  <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 dark:bg-gray-800">
                  <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground" title={primary.name}>
                {targets.length > 1 ? `${targets.length} selected items` : primary.name}
              </p>
              <p className="break-all text-xs text-muted-foreground" title={primary.path}>
                {targets.length > 1 ? targets.map((entry) => entry.name).join(", ") : primary.path}
              </p>
            </div>
          </div>

          <div className="min-w-0 space-y-2">
            <p className="text-sm font-medium">Destination folder</p>
            <div className={isMoving ? "pointer-events-none opacity-60" : undefined}>
              {open ? (
                <FileManagerFolderTree
                  className="h-64 rounded-lg bg-background"
                  showHeader={false}
                  currentPath={selectedDirectory || "/"}
                  expandPath={currentPath || "/"}
                  onPathSelect={setSelectedDirectory}
                  onLoadFolder={onLoadFolder}
                />
              ) : null}
            </div>
            <p className="break-all text-xs text-muted-foreground">
              Selected: {selectedDirectory || "/"}
            </p>
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isMoving}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleConfirm()}
            disabled={isMoving || !selectedDirectory}
            className="min-w-[100px]"
          >
            {isMoving ? (
              <div className="flex items-center gap-2">
                <Spinner variant="ellipsis" className="text-primary-foreground" size="sm" />
                <span>Moving...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Move className="h-4 w-4" />
                <span>Move</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
