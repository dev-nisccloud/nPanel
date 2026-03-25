"use client";

import * as React from "react";
import { useState } from "react";
import { Edit, FileText, Folder } from "lucide-react";

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

import { type FileManagerItem } from "./file-manager-schema";

interface RenameFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FileManagerItem | null;
  onConfirm: (newName: string) => Promise<void>;
  isRenaming: boolean;
}

export function RenameFileDialog({
  open,
  onOpenChange,
  item,
  onConfirm,
  isRenaming,
}: RenameFileDialogProps) {
  const [newName, setNewName] = useState("");

  // Reset form when dialog opens/closes or item changes
  React.useEffect(() => {
    if (open && item) {
      setNewName(item.name);
    } else {
      setNewName("");
    }
  }, [open, item]);

  const handleConfirm = async () => {
    if (!item || !newName.trim() || newName.trim() === item.name) {
      return;
    }

    try {
      await onConfirm(newName.trim());
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isRenaming) {
      handleConfirm();
    }
  };

  if (!item) return null;

  const isDirectory = item.type === "folder";
  const itemType = isDirectory ? "directory" : "file";
  const isValidName = newName.trim() && newName.trim() !== item.name;
  const hasInvalidChars = /[<>:"/\\|?*]/.test(newName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Rename {isDirectory ? "Directory" : "File"}
          </DialogTitle>
          <DialogDescription>
            Enter a new name for this {itemType}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Current item display */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="flex-shrink-0">
              {isDirectory ? (
                <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                  <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              ) : (
                <div className="h-8 w-8 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                  <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {item.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.path}
              </p>
            </div>
          </div>

          {/* Name input */}
          <div className="space-y-2">
            <Label htmlFor="new-name">New name</Label>
            <Input
              id="new-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Enter new ${itemType} name`}
              disabled={isRenaming}
              className={hasInvalidChars ? "border-destructive" : ""}
            />
            {hasInvalidChars && (
              <p className="text-xs text-destructive">
                Name cannot contain: &lt; &gt; : " / \ | ? *
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRenaming}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isRenaming || !isValidName || hasInvalidChars}
            className="min-w-[100px]"
          >
            {isRenaming ? (
              <div className="flex items-center gap-2">
                <Spinner variant="ellipsis" className="text-primary-foreground" size="sm" />
                <span>Renaming...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                <span>Rename</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
