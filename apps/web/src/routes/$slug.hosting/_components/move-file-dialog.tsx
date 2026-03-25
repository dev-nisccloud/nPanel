"use client";

import * as React from "react";
import { useState } from "react";
import { Move, Folder, FileText, FolderOpen } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";

import { FileManagerItem } from "./file-manager-schema";

interface MoveFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FileManagerItem | null;
  availableDirectories: FileManagerItem[];
  onConfirm: (destinationPath: string) => Promise<void>;
  isMoving: boolean;
}

export function MoveFileDialog({
  open,
  onOpenChange,
  item,
  availableDirectories,
  onConfirm,
  isMoving,
}: MoveFileDialogProps) {
  const [selectedDirectory, setSelectedDirectory] = useState("");
  const [customPath, setCustomPath] = useState("");

  // Reset form when dialog opens/closes or item changes
  React.useEffect(() => {
    if (open && item) {
      setSelectedDirectory("");
      setCustomPath("");
    } else {
      setSelectedDirectory("");
      setCustomPath("");
    }
  }, [open, item]);

  const handleConfirm = async () => {
    if (!item) return;

    const destinationPath = customPath.trim() || selectedDirectory;
    if (!destinationPath) return;

    try {
      await onConfirm(destinationPath);
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isMoving) {
      handleConfirm();
    }
  };

  if (!item) return null;

  const isDirectory = item.type === "folder";
  const itemType = isDirectory ? "directory" : "file";
  const isValidDestination = customPath.trim() || selectedDirectory;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Move className="h-5 w-5 text-primary" />
            Move {isDirectory ? "Directory" : "File"}
          </DialogTitle>
          <DialogDescription>
            Choose a destination for this {itemType}.
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
              <p className="text-sm font-medium text-foreground truncate" title={item.name}>
                {item.name}
              </p>
              <p className="text-xs text-muted-foreground truncate" title={item.path}>
                {item.path}
              </p>
            </div>
          </div>

          {/* Quick directory selection */}
          {(availableDirectories.length > 0 || selectedDirectory) && (
            <div className="space-y-2">
              <Label>Select Destination Directory</Label>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                {/* Add current directory option */}
                <div
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                    selectedDirectory === "/" 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedDirectory("/");
                    setCustomPath("");
                  }}
                >
                  <FolderOpen className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate text-sm">Root Directory</span>
                  <span className="text-xs opacity-70 ml-auto">/</span>
                </div>
                
                {availableDirectories.map((dir) => (
                  <div
                    key={dir.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                      selectedDirectory === dir.path 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted"
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedDirectory(dir.path);
                      setCustomPath(""); // Clear custom path when selecting directory
                    }}
                  >
                    <FolderOpen className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate text-sm" title={dir.name}>{dir.name}</span>
                    <span className="text-xs opacity-70 ml-auto truncate" title={dir.path}>{dir.path}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Click on a directory above to select it as the destination.
              </p>
            </div>
          )}

          {/* Custom path input */}
          <div className="space-y-2">
            <Label htmlFor="destination-path">Or Enter Custom Path (Optional)</Label>
            <Input
              id="destination-path"
              value={customPath}
              onChange={(e) => {
                setCustomPath(e.target.value);
                setSelectedDirectory(""); // Clear directory selection when typing
              }}
              onKeyDown={handleKeyDown}
              placeholder="/path/to/destination"
              disabled={isMoving}
            />
            <p className="text-xs text-muted-foreground">
              Enter a custom path if you want to move to a specific location not listed above.
            </p>
          </div>

          {/* Preview */}
          {isValidDestination && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200 truncate" title={item.name}>
                <strong>Ready to move:</strong> {item.name}
              </p>
              <p className="text-xs text-green-600 dark:text-green-300 mt-1 truncate" title={item.path}>
                <strong>From:</strong> {item.path}
              </p>
              <p className="text-xs text-green-600 dark:text-green-300 truncate" title={customPath.trim() || selectedDirectory}>
                <strong>To:</strong> {customPath.trim() || selectedDirectory}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isMoving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isMoving || !isValidDestination}
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
