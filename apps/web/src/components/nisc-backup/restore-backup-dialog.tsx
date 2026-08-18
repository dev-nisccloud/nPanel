"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { NISC_BACKUP_CONTAINS, NISC_BACKUP_CONTAINS_ORDER } from "./backup-contains";
import { formatBackupContains, formatBytes, formatSnapshotSize } from "./formatters";
import { useNiscBackupBackupItems } from "./hooks/use-nisc-backup-backup-items";
import { useNiscBackupRestoreConditions } from "./hooks/use-nisc-backup-restore-conditions";
import type { NiscBackupBackupItemRow } from "./types";

export type RestoreRole = "admin" | "user";

export type RestoreTarget = {
  snapshotId: string;
  backupDate: string;
  size?: number;
  backupStructure?: number;
};

type RestoreOptions = {
  merge: boolean;
  terminate: boolean;
  suspend: boolean;
};

function itemLabel(item: NiscBackupBackupItemRow): string {
  return item.name || item.path || formatBackupContains(item.backup_contains);
}

function groupItems(items: NiscBackupBackupItemRow[]) {
  const grouped = new Map<number, NiscBackupBackupItemRow[]>();
  for (const item of items) {
    const contains = item.backup_contains ?? NISC_BACKUP_CONTAINS.PanelConfig;
    const list = grouped.get(contains) ?? [];
    list.push(item);
    grouped.set(contains, list);
  }
  const orderedContains = new Set<number>(NISC_BACKUP_CONTAINS_ORDER);
  const ordered = NISC_BACKUP_CONTAINS_ORDER
    .filter((contains) => grouped.has(contains))
    .map((contains) => ({ contains, items: grouped.get(contains)! }));
  const leftovers = [...grouped.entries()]
    .filter(([contains]) => !orderedContains.has(contains))
    .map(([contains, group]) => ({ contains, items: group }));
  return [...ordered, ...leftovers];
}

export function NiscBackupRestoreDialog({
  target,
  username,
  pending,
  restoreRole = "user",
  onOpenChange,
  onConfirm,
}: {
  target: RestoreTarget | null;
  username: string;
  pending: boolean;
  restoreRole?: RestoreRole;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: {
    snapshot_id: string;
    items?: string[];
    merge?: boolean;
    terminate?: boolean;
    suspend?: boolean;
  }) => void;
}) {
  const parentId = target?.snapshotId;
  const { items, isLoading: itemsLoading, isError: itemsError } = useNiscBackupBackupItems(parentId);
  const { conditions, isLoading: conditionsLoading } = useNiscBackupRestoreConditions(!!parentId);
  const groups = React.useMemo(() => groupItems(items), [items]);

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [acceptedConditionIds, setAcceptedConditionIds] = React.useState<Set<string>>(new Set());
  const [options, setOptions] = React.useState<RestoreOptions>({
    merge: false,
    terminate: false,
    suspend: false,
  });

  const itemIdsKey = items.map((item) => item._id).join(",");

  React.useEffect(() => {
    if (!target) return;
    setAcceptedConditionIds(new Set());
    setOptions({ merge: false, terminate: false, suspend: false });
  }, [target?.snapshotId]);

  React.useEffect(() => {
    if (!target) return;
    setSelectedIds(new Set(itemIdsKey ? itemIdsKey.split(",") : []));
  }, [target?.snapshotId, itemIdsKey]);

  const panelConfigIds = items
    .filter((item) => item.backup_contains === NISC_BACKUP_CONTAINS.PanelConfig)
    .map((item) => item._id);
  const selectedItems = items.filter((item) => selectedIds.has(item._id));
  const selectedHasDatabases = selectedItems.some(
    (item) => item.backup_contains === NISC_BACKUP_CONTAINS.Databases,
  );
  const selectedHasDbUsers = selectedItems.some(
    (item) => item.backup_contains === NISC_BACKUP_CONTAINS.DatabaseUsers,
  );
  const allItemsSelected = items.length > 0 && selectedItems.length === items.length;
  const conditionsAccepted = conditions.every((condition) => acceptedConditionIds.has(condition._id));
  const itemsSize = items.reduce((sum, item) => sum + (item.size ?? 0), 0);
  const snapshotSizeLabel = itemsSize > 0
    ? formatBytes(itemsSize)
    : formatSnapshotSize(target?.size, target?.backupStructure);
  const canSubmit =
    !!target
    && !pending
    && !itemsLoading
    && !conditionsLoading
    && (items.length === 0 || selectedItems.length > 0)
    && conditionsAccepted;

  function toggleItem(item: NiscBackupBackupItemRow, checked: boolean) {
    if (item.backup_contains === NISC_BACKUP_CONTAINS.PanelConfig) return;
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(item._id);
      else next.delete(item._id);
      return next;
    });
  }

  function toggleGroup(groupItemsForContains: NiscBackupBackupItemRow[], checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const item of groupItemsForContains) {
        if (item.backup_contains === NISC_BACKUP_CONTAINS.PanelConfig) continue;
        if (checked) next.add(item._id);
        else next.delete(item._id);
      }
      return next;
    });
  }

  function submit() {
    if (!target || !canSubmit) return;
    onConfirm({
      snapshot_id: target.snapshotId,
      items: items.length === 0 || allItemsSelected
        ? undefined
        : [...new Set([...selectedIds, ...panelConfigIds])],
      merge: options.merge || undefined,
      terminate: restoreRole === "admin" && options.terminate ? true : undefined,
      suspend: restoreRole === "admin" && options.suspend ? true : undefined,
    });
  }

  return (
    <Dialog open={target != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Restore backup?</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Restore the backup from{" "}
                <span className="font-medium text-foreground">{target?.backupDate}</span>
                {" "}to account{" "}
                <span className="font-medium text-foreground">{username}</span>
                {target ? ` · ${snapshotSizeLabel}` : null}.
              </p>
              <p>
                Selected items overwrite matching live data. Anything created after this backup
                date in those items will be lost.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        {itemsLoading || conditionsLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading restore options…
          </div>
        ) : (
          <div className="space-y-5">
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium">Items to restore</h3>
                {items.length > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setSelectedIds(new Set(items.map((item) => item._id)))}
                  >
                    Select all
                  </Button>
                ) : null}
              </div>
              {itemsError ? (
                <p className="text-xs text-muted-foreground">
                  Could not load backup items. Restore will use the full account snapshot.
                </p>
              ) : groups.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Full account restore. JetBackup did not return separate email, database, or file items for this snapshot.
                </p>
              ) : (
                <div className="space-y-2 rounded-lg border p-3">
                  {groups.map((group) => {
                    const required = group.contains === NISC_BACKUP_CONTAINS.PanelConfig;
                    const groupSelectedCount = group.items.filter((item) => selectedIds.has(item._id)).length;
                    const groupChecked =
                      groupSelectedCount === group.items.length
                        ? true
                        : groupSelectedCount > 0
                          ? "indeterminate"
                          : false;
                    const showChildren = group.items.length > 1;

                    return (
                      <div key={group.contains} className="space-y-1.5">
                        <label className="flex items-start gap-2 text-sm">
                          <Checkbox
                            checked={groupChecked}
                            disabled={required || pending}
                            onCheckedChange={(checked) => toggleGroup(group.items, checked === true)}
                            className="mt-0.5"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="font-medium">
                              {formatBackupContains(group.contains)}
                              {required ? " (required)" : ""}
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {formatBytes(
                                group.items.reduce((sum, item) => sum + (item.size ?? 0), 0) || undefined,
                              )}
                            </span>
                          </span>
                        </label>
                        {showChildren ? (
                          <div className="ml-6 space-y-1">
                            {group.items.map((item) => (
                              <label key={item._id} className="flex items-start gap-2 text-xs">
                                <Checkbox
                                  checked={selectedIds.has(item._id)}
                                  disabled={required || pending}
                                  onCheckedChange={(checked) => toggleItem(item, checked === true)}
                                  className="mt-0.5"
                                />
                                <span className="min-w-0 flex-1">
                                  {itemLabel(item)}
                                  <span className="ml-2 text-muted-foreground">
                                    {formatBytes(item.size)}
                                  </span>
                                </span>
                              </label>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
              {selectedHasDatabases && !selectedHasDbUsers ? (
                <p className="text-xs text-muted-foreground">
                  Restoring databases without database users restores only the selected databases.
                </p>
              ) : null}
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-medium">Restore options</h3>
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <Label htmlFor="nisc-backup-merge" className="text-sm font-normal">
                      Merge live account data with backup data
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Live data takes precedence over restored data.
                    </p>
                  </div>
                  <Switch
                    id="nisc-backup-merge"
                    checked={options.merge}
                    disabled={pending}
                    onCheckedChange={(merge) => setOptions((current) => ({ ...current, merge }))}
                  />
                </div>
                {restoreRole === "admin" ? (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <Label htmlFor="nisc-backup-terminate" className="text-sm font-normal">
                          Terminate account before restore
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Admin only. JetBackup allows this for non-reseller accounts.
                        </p>
                      </div>
                      <Switch
                        id="nisc-backup-terminate"
                        checked={options.terminate}
                        disabled={pending}
                        onCheckedChange={(terminate) => setOptions((current) => ({ ...current, terminate }))}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <Label htmlFor="nisc-backup-suspend" className="text-sm font-normal">
                          Suspend account after restore
                        </Label>
                      </div>
                      <Switch
                        id="nisc-backup-suspend"
                        checked={options.suspend}
                        disabled={pending}
                        onCheckedChange={(suspend) => setOptions((current) => ({ ...current, suspend }))}
                      />
                    </div>
                  </>
                ) : null}
              </div>
            </section>

            {conditions.length > 0 ? (
              <section className="space-y-2">
                <h3 className="text-sm font-medium">Restore conditions</h3>
                <div className="space-y-2 rounded-lg border p-3">
                  {conditions.map((condition) => (
                    <label key={condition._id} className="flex items-start gap-2 text-sm">
                      <Checkbox
                        checked={acceptedConditionIds.has(condition._id)}
                        disabled={pending}
                        onCheckedChange={(checked) => {
                          setAcceptedConditionIds((current) => {
                            const next = new Set(current);
                            if (checked === true) next.add(condition._id);
                            else next.delete(condition._id);
                            return next;
                          });
                        }}
                        className="mt-0.5"
                      />
                      <span>{condition.condition}</span>
                    </label>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!canSubmit}
            onClick={submit}
          >
            {pending ? "Queuing restore…" : "Restore backup"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
