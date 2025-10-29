"use client";

import * as React from "react";
import { useState } from "react";
import { FolderPlus, Folder } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

interface NewFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (folderName: string) => Promise<void>;
  isCreating: boolean;
  currentPath?: string;
}

export function NewFolderDialog({
  open,
  onOpenChange,
  onConfirm,
  isCreating,
  currentPath = "/",
}: NewFolderDialogProps) {
  const [folderName, setFolderName] = useState("");

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setFolderName("");
    } else {
      setFolderName("");
    }
  }, [open]);

  const handleConfirm = async () => {
    const trimmedName = folderName.trim();
    if (!trimmedName) return;

    try {
      await onConfirm(trimmedName);
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isCreating && folderName.trim()) {
      handleConfirm();
    }
  };

  const isValidName = folderName.trim().length > 0;
  const sanitizedName = folderName.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-primary" />
            Create New Folder
          </DialogTitle>
          <DialogDescription>
            Create a new folder in the current directory.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Current directory display */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                Current Directory
              </p>
              <p className="text-xs text-muted-foreground truncate" title={currentPath}>
                {currentPath}
              </p>
            </div>
          </div>

          {/* Folder name input */}
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter folder name..."
              disabled={isCreating}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Choose a descriptive name for your new folder.
            </p>
          </div>

          {/* Preview */}
          {isValidName && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Ready to create:</strong> {sanitizedName}
              </p>
              <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                <strong>Location:</strong> {currentPath}{sanitizedName}/
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isCreating || !isValidName}
            className="min-w-[120px]"
          >
            {isCreating ? (
              <div className="flex items-center gap-2">
                <Spinner variant="ellipsis" className="text-primary-foreground" size="sm" />
                <span>Creating...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FolderPlus className="h-4 w-4" />
                <span>Create Folder</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

