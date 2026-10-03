"use client";

import * as React from "react";
import { Copy, Folder, FolderOpen } from "lucide-react";

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
import { toast } from "@/components/ui/sonner";

export interface CopyDialogItem {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
}

export interface CopyDialogDestination {
  id: string;
  name: string;
  path: string;
}

interface CopyFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CopyDialogItem[];
  destinations: CopyDialogDestination[];
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
  destinations,
  onConfirm,
  isCopying,
}: CopyFileDialogProps) {
  const [selectedDirectory, setSelectedDirectory] = React.useState("");
  const [customPath, setCustomPath] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setSelectedDirectory(destinations[0]?.path ?? "");
    setCustomPath("");
    // Reset only when the dialog opens, not when the folder list refreshes behind it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const destinationPath = customPath.trim() || selectedDirectory;

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-primary" />
            Copy {items.length === 1 ? (items[0]?.type === "folder" ? "folder" : "file") : "items"}
          </DialogTitle>
          <DialogDescription>
            The original stays in place. A copy is created in the folder you choose. If that name already exists, the copy is named with “copy”.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
            <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium" title={label}>
                {label}
              </p>
              {items.length === 1 ? (
                <p className="truncate text-xs text-muted-foreground" title={items[0]?.path}>
                  {items[0]?.path}
                </p>
              ) : (
                <p className="truncate text-xs text-muted-foreground">
                  {items.map((item) => item.name).join(", ")}
                </p>
              )}
            </div>
          </div>

          {destinations.length > 0 ? (
            <div className="space-y-2">
              <Label>Destination folder</Label>
              <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto rounded-lg border p-2">
                {destinations.map((directory) => (
                  <button
                    key={directory.id}
                    type="button"
                    className={`flex items-center gap-2 rounded p-2 text-left transition-colors ${
                      !customPath && selectedDirectory === directory.path
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => {
                      setSelectedDirectory(directory.path);
                      setCustomPath("");
                    }}
                    disabled={isCopying}
                  >
                    <FolderOpen className="h-4 w-4 shrink-0" />
                    <span className="truncate text-sm">{directory.name}</span>
                    <span className="ml-auto truncate text-xs opacity-70">{directory.path}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="copy-destination-path">Or enter a folder path</Label>
            <Input
              id="copy-destination-path"
              value={customPath}
              onChange={(event) => setCustomPath(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !isCopying) void handleConfirm();
              }}
              placeholder="/httpdocs/backup"
              disabled={isCopying}
            />
          </div>
        </div>

        <DialogFooter>
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
