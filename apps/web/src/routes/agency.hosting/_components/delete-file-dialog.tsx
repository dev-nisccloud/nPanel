"use client";

import * as React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

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
import { ScrollArea } from "@/components/ui/scroll-area";

import type { FileManagerItem } from "./file-manager-schema";

interface DeleteFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FileManagerItem | null;
  additionalItems?: FileManagerItem[];
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteFileDialog({
  open,
  onOpenChange,
  item,
  additionalItems,
  onConfirm,
  isDeleting,
}: DeleteFileDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const items: FileManagerItem[] = React.useMemo(() => {
    if (!item) return [];
    return [item, ...(additionalItems || [])];
  }, [item, additionalItems]);

  if (items.length === 0) return null;

  const isBulk = items.length > 1;
  const primary = items[0];
  const isDirectory = !isBulk && primary.type === "folder";
  const itemType = isBulk ? "items" : isDirectory ? "directory" : "file";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {isBulk ? "Delete Items" : `Delete ${isDirectory ? "Directory" : "File"}`}
          </DialogTitle>
          <DialogDescription>
            {isBulk
              ? `Are you sure you want to delete these ${items.length} items? This action cannot be undone.`
              : `Are you sure you want to delete this ${itemType}? This action cannot be undone.`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <ScrollArea className="max-h-56 rounded-md border bg-muted/40 px-2 py-2">
            <div className="space-y-2 pr-1">
              {items.map((itm) => {
                const itmIsDir = itm.type === "folder";
                return (
                  <div key={itm.path} className="flex items-center gap-3 rounded-lg bg-background/60 p-2">
                    <div className="flex-shrink-0">
                      {itmIsDir ? (
                        <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">📂</span>
                        </div>
                      ) : (
                        <div className="h-8 w-8 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                          <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">📄</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate" title={itm.name}>
                        {itm.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate" title={itm.path}>
                        {itm.path}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {!isBulk && isDirectory && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Warning:</strong> This will delete the entire directory and all its contents.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="min-w-[100px]"
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <Spinner variant="ellipsis" className="text-destructive-foreground" size="sm" />
                <span>Deleting...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
