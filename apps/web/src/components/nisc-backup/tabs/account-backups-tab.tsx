"use client";

import { captureEvent } from "@/lib/posthog";

import * as React from "react";
import { Download, HardDrive, Plus, RefreshCw, RotateCcw, Search } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CleanList, CleanListCell, CleanListRow } from "@/components/ui/clean-list";
import { trpc } from "@/utils/trpc";
import { formatNiscBackupDate, formatSnapshotSize } from "../formatters";
import { NiscBackupErrorState } from "../primitives";
import { useNiscBackupAccountBackups } from "../hooks/use-nisc-backup-account-backups";
import {
  niscBackupStatusBadgeClass,
  niscBackupSuccessBadgeClass,
} from "../status-badges";
import {
  NiscBackupRestoreDialog,
  type RestoreRole,
  type RestoreTarget,
} from "../restore-backup-dialog";
import type { NiscBackupSnapshotRow } from "../types";

const BACKUP_STRUCTURE_LABELS: Record<number, string> = {
  1: "Incremental",
  2: "Archived",
  4: "Compressed",
};

function snapshotStatus(snapshot: NiscBackupSnapshotRow): {
  label: string;
  className?: string;
} {
  if (snapshot.damaged) {
    return { label: "Damaged", className: niscBackupStatusBadgeClass("error") };
  }
  if (snapshot.locked) {
    return { label: "Locked", className: niscBackupStatusBadgeClass("warning") };
  }
  return { label: "Available", className: niscBackupSuccessBadgeClass(true) };
}

function snapshotDescription(snapshot: NiscBackupSnapshotRow): string {
  return [
    formatSnapshotSize(snapshot.size, snapshot.backup_structure),
    snapshot.destination_name,
    snapshot.backup_structure != null
      ? BACKUP_STRUCTURE_LABELS[snapshot.backup_structure]
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function AccountBackupsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:justify-between">
        <Skeleton className="h-10 flex-1 @sm/main:max-w-sm" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="divide-y overflow-hidden rounded-xl border bg-card">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <Skeleton className="mt-0.5 h-4 w-4" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-36 max-w-full" />
              </div>
            </div>
            <div className="flex gap-1.5">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-7 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NiscBackupAccountBackupsTab({
  accountId,
  username,
  readOnly = false,
  restoreRole = "user",
}: {
  accountId: string;
  username: string;
  readOnly?: boolean;
  restoreRole?: RestoreRole;
}) {
  const utils = trpc.useUtils();
  const [search, setSearch] = React.useState("");
  const [restoreTarget, setRestoreTarget] = React.useState<RestoreTarget | null>(null);
  const { snapshots, isLoading, isError, error, refetch, isRefetching } =
    useNiscBackupAccountBackups(accountId);

  const queueRestore = trpc.niscBackup.queues.queueSnapshot.useMutation({
    onSuccess: () => {
      captureEvent("backup_restored");
      toast.success("Restore queued");
      setRestoreTarget(null);
      utils.niscBackup.queues.listGroups.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const queueDownload = trpc.niscBackup.downloads.queueSnapshot.useMutation({
    onSuccess: () => {
      captureEvent("backup_downloaded");
      toast.success("Download queued. Open Downloads when it finishes, then save the file.");
      utils.niscBackup.downloads.list.invalidate();
      utils.niscBackup.queues.listGroups.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const onDemand = trpc.niscBackup.accounts.createOnDemand.useMutation({
    onSuccess: () => {
      captureEvent("backup_job_created");
      captureEvent("backup_job_started");
      toast.success("On-demand backup started");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return snapshots;
    return snapshots.filter((snapshot) => {
      const haystack = [
        formatNiscBackupDate(snapshot.date),
        snapshot.destination_name,
        formatSnapshotSize(snapshot.size, snapshot.backup_structure),
        snapshot.backup_structure != null
          ? BACKUP_STRUCTURE_LABELS[snapshot.backup_structure]
          : null,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [snapshots, search]);

  if (isLoading) return <AccountBackupsSkeleton />;
  if (isError) {
    return (
      <NiscBackupErrorState
        title="Failed to load backups"
        message={error?.message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:justify-between">
          <div className="relative flex-1 @sm/main:max-w-sm">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search backups..."
              className="w-full pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""} @sm/main:mr-2`} />
              <span className="hidden @sm/main:inline">Refresh</span>
            </Button>
            {!readOnly ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={onDemand.isPending}
                onClick={() => onDemand.mutate({ account_id: accountId })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Backup now
              </Button>
            ) : null}
          </div>
        </div>

        <CleanList
          emptyMessage={search.trim() ? "No backups match your search." : "No backups found for this account."}
          columns={[
            { key: "date", label: "Date" },
            { key: "details", label: "Details", className: "min-w-0 flex-1", hideBelow: "@lg" },
            { key: "status", label: "Status", className: "w-36 shrink-0", hideBelow: "@xl" },
            { key: "actions", label: "Actions", align: "end" },
          ]}
        >
          {filtered.map((snapshot, index) => {
            const snapshotId = snapshot.parent_id ?? snapshot._id;
            const status = snapshotStatus(snapshot);
            const canAct = !readOnly && !snapshot.damaged;

            return (
              <CleanListRow
                key={snapshot._id}
                leading={<HardDrive className="h-4 w-4 text-muted-foreground" />}
                title={formatNiscBackupDate(snapshot.date)}
                cells={{
                  details: <CleanListCell>{snapshotDescription(snapshot)}</CleanListCell>,
                  status: (
                    <div className="flex items-center gap-1.5">
                      {index === 0 && !search.trim() ? (
                        <Badge variant="outline">Latest</Badge>
                      ) : null}
                      <Badge
                        variant={snapshot.damaged ? "destructive" : "outline"}
                        className={status.className}
                      >
                        {status.label}
                      </Badge>
                    </div>
                  ),
                }}
                actions={
                  canAct ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs"
                        disabled={queueRestore.isPending}
                        onClick={() =>
                          setRestoreTarget({
                            snapshotId,
                            backupDate: formatNiscBackupDate(snapshot.date),
                            size: snapshot.size,
                            backupStructure: snapshot.backup_structure,
                          })
                        }
                      >
                        <RotateCcw className="mr-1 h-3.5 w-3.5" />
                        Restore
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs"
                        disabled={queueDownload.isPending}
                        onClick={() =>
                          queueDownload.mutate({
                            snapshot_id: snapshotId,
                          })
                        }
                      >
                        <Download className="mr-1 h-3.5 w-3.5" />
                        Download
                      </Button>
                    </>
                  ) : undefined
                }
              />
            );
          })}
        </CleanList>
      </div>

      <NiscBackupRestoreDialog
        target={restoreTarget}
        username={username}
        pending={queueRestore.isPending}
        restoreRole={restoreRole}
        onOpenChange={(open) => {
          if (!open && !queueRestore.isPending) setRestoreTarget(null);
        }}
        onConfirm={(input) => queueRestore.mutate(input)}
      />
    </>
  );
}
