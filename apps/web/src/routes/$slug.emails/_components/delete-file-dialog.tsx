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

import { type FileManagerItem } from "./file-manager-schema";

interface DeleteFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FileManagerItem | null;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteFileDialog({
  open,
  onOpenChange,
  item,
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

  if (!item) return null;

  const isDirectory = item.type === "folder";
  const itemType = isDirectory ? "directory" : "file";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete {isDirectory ? "Directory" : "File"}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this {itemType}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="flex-shrink-0">
              {isDirectory ? (
                <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                    ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â
                  </span>
                </div>
              ) : (
                <div className="h-8 w-8 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                  <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã¢â‚¬Å¾
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate" title={item.name}>
                {item.name}
              </p>
              <p className="text-xs text-muted-foreground truncate" title={item.path}>
                {item.path}
              </p>
            </div>
          </div>

          {isDirectory && (
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
