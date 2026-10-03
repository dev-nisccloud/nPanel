"use client";

import * as React from "react";

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
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export interface PermissionDialogItem {
  name: string;
  path: string;
  type: "file" | "folder";
  permissions?: string;
}

type PermissionTriad = {
  read: boolean;
  write: boolean;
  execute: boolean;
};

type PermissionBits = {
  owner: PermissionTriad;
  group: PermissionTriad;
  world: PermissionTriad;
};

const ROWS: Array<{ key: keyof PermissionBits; label: string }> = [
  { key: "owner", label: "Owner" },
  { key: "group", label: "Group" },
  { key: "world", label: "World" },
];

const COLUMNS: Array<{ key: keyof PermissionTriad; label: string }> = [
  { key: "read", label: "Read" },
  { key: "write", label: "Write" },
  { key: "execute", label: "Execute" },
];

function parseMode(permissions: string | undefined): string | null {
  const digits = permissions?.trim().match(/[0-7]{3}$/)?.[0];
  return digits ?? null;
}

function bitsFromMode(mode: string): PermissionBits {
  const triad = (digit: string): PermissionTriad => {
    const value = Number.parseInt(digit, 8);
    const bits = Number.isFinite(value) ? value : 0;
    return {
      read: (bits & 4) !== 0,
      write: (bits & 2) !== 0,
      execute: (bits & 1) !== 0,
    };
  };
  const digits = mode.padStart(3, "0").slice(-3);
  return {
    owner: triad(digits[0] ?? "0"),
    group: triad(digits[1] ?? "0"),
    world: triad(digits[2] ?? "0"),
  };
}

function modeFromBits(bits: PermissionBits): string {
  const digit = (triad: PermissionTriad) =>
    (triad.read ? 4 : 0) + (triad.write ? 2 : 0) + (triad.execute ? 1 : 0);
  return `${digit(bits.owner)}${digit(bits.group)}${digit(bits.world)}`;
}

function startingMode(items: PermissionDialogItem[]): { mode: string; mixed: boolean } {
  const modes = items
    .map((item) => parseMode(item.permissions))
    .filter((mode): mode is string => mode != null);
  if (modes.length === 0) return { mode: "644", mixed: false };
  const first = modes[0] ?? "644";
  return { mode: first, mixed: modes.some((mode) => mode !== first) };
}

interface PermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: PermissionDialogItem[];
  onConfirm: (mode: string, recursive: boolean) => Promise<void>;
  isSaving: boolean;
}

export function PermissionsDialog({
  open,
  onOpenChange,
  items,
  onConfirm,
  isSaving,
}: PermissionsDialogProps) {
  const [bits, setBits] = React.useState<PermissionBits>(() => bitsFromMode("644"));
  const [mixed, setMixed] = React.useState(false);
  const [recursive, setRecursive] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const next = startingMode(items);
    setBits(bitsFromMode(next.mode));
    setMixed(next.mixed);
    setRecursive(false);
  }, [open, items]);

  const mode = modeFromBits(bits);
  const includesFolder = items.some((item) => item.type === "folder");

  const toggle = (row: keyof PermissionBits, column: keyof PermissionTriad, checked: boolean) => {
    setBits((current) => ({
      ...current,
      [row]: { ...current[row], [column]: checked },
    }));
    setMixed(false);
  };

  const handleSave = async () => {
    try {
      await onConfirm(mode, includesFolder && recursive);
      onOpenChange(false);
    } catch {
      // The file manager already showed the error.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Permissions</DialogTitle>
          <DialogDescription>
            {items.length === 1
              ? `Choose access for ${items[0]?.name ?? "this item"}.`
              : items.length > 1
                ? `Choose access for ${items.length} items.`
                : "Choose the permissions to apply."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[6.5rem_1fr_1fr_1fr] items-center gap-y-3">
          <span />
          {COLUMNS.map((column) => (
            <span key={column.key} className="text-center text-sm text-muted-foreground">
              {column.label}
            </span>
          ))}
          {ROWS.map((row) => (
            <React.Fragment key={row.key}>
              <span className="text-sm font-medium">{row.label}</span>
              {COLUMNS.map((column) => (
                <div key={column.key} className="flex justify-center">
                  <Checkbox
                    checked={bits[row.key][column.key]}
                    disabled={isSaving}
                    aria-label={`${row.label} ${column.label.toLowerCase()}`}
                    onCheckedChange={(checked) => toggle(row.key, column.key, checked === true)}
                  />
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          Mode <span className="font-mono text-foreground">{mode}</span>
          {mixed ? ". These items do not share one mode yet. Update applies these boxes to all of them." : "."}
        </p>

        {includesFolder ? (
          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={recursive}
              disabled={isSaving}
              className="mt-0.5"
              onCheckedChange={(checked) => setRecursive(checked === true)}
            />
            <span>
              <span className="font-medium">Change permissions recursively</span>
              <span className="block text-muted-foreground">
                Also update the files and folders inside.
              </span>
            </span>
          </label>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={isSaving || items.length === 0}>
            {isSaving ? (
              <>
                <Spinner variant="ellipsis" className="mr-2 h-4 w-4" size="sm" />
                Updating...
              </>
            ) : (
              "Update"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
