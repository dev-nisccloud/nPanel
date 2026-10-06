"use client";

import * as React from "react";
import { Archive } from "lucide-react";

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

export interface ArchiveDialogItem {
  name: string;
}

interface ArchiveFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ArchiveDialogItem[];
  currentPath: string;
  isArchiving: boolean;
  onConfirm: (archiveName: string) => Promise<void>;
}

function defaultArchiveName(items: ArchiveDialogItem[]): string {
  if (items.length === 1) {
    const stem = items[0]?.name.replace(/\.zip$/i, "").trim();
    return `${stem || "archive"}.zip`;
  }
  return "archive.zip";
}

export function ArchiveFileDialog({
  open,
  onOpenChange,
  items,
  currentPath,
  isArchiving,
  onConfirm,
}: ArchiveFileDialogProps) {
  const [archiveName, setArchiveName] = React.useState("archive.zip");

  React.useEffect(() => {
    if (!open) return;
    setArchiveName(defaultArchiveName(items));
  }, [open, items]);

  const trimmed = archiveName.trim();
  const safeName = trimmed.replace(/[/\\]/g, "");
  const canSave = safeName.length > 0 && !safeName.includes("..");

  const handleConfirm = async () => {
    if (!canSave) return;
    try {
      await onConfirm(safeName);
      onOpenChange(false);
    } catch {
      // The file manager already showed the error.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archive
          </DialogTitle>
          <DialogDescription>
            {items.length === 1
              ? `Save ${items[0]?.name ?? "this item"} as a zip in this folder.`
              : `Save ${items.length} items as a zip in this folder.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="archive-name">Archive name</Label>
          <Input
            id="archive-name"
            value={archiveName}
            onChange={(event) => setArchiveName(event.target.value)}
            disabled={isArchiving}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !isArchiving) void handleConfirm();
            }}
          />
          <p className="text-sm text-muted-foreground">
            The zip is created in {currentPath || "/"}.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isArchiving}>
            Cancel
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={isArchiving || !canSave}>
            {isArchiving ? (
              <>
                <Spinner variant="ellipsis" className="mr-2 h-4 w-4" size="sm" />
                Archiving...
              </>
            ) : (
              "Archive"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
