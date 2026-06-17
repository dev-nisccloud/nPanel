"use client";

import * as React from "react";
import { Download, RotateCcw } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/utils/trpc";
import { formatBytes, formatJetBackupDate } from "../formatters";
import { JetBackupErrorState, JetBackupTableSkeleton } from "../primitives";
import { JetBackupMinimalList, JetBackupMinimalRow } from "../minimal-list";
import { useJetBackupAccountBackups } from "../hooks/use-jetbackup-account-backups";

type RestoreTarget = {
  snapshotId: string;
  backupDate: string;
};

export function JetBackupAccountBackupsTab({
  accountId,
  username,
  readOnly = false,
}: {
  accountId: string;
  username: string;
  readOnly?: boolean;
}) {
  const utils = trpc.useUtils();
  const [restoreTarget, setRestoreTarget] = React.useState<RestoreTarget | null>(null);
  const { snapshots, isLoading, isError, error, refetch } = useJetBackupAccountBackups(accountId);

  const queueRestore = trpc.jetbackup.queues.queueSnapshot.useMutation({
    onSuccess: () => {
      toast.success("Restore queued");
      setRestoreTarget(null);
      utils.jetbackup.queues.listGroups.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const queueDownload = trpc.jetbackup.downloads.queueSnapshot.useMutation({
    onSuccess: () => {
      toast.success("Download queued — open the Downloads tab when the queue finishes, then click Save file.");
      utils.jetbackup.downloads.list.invalidate();
      utils.jetbackup.queues.listGroups.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const onDemand = trpc.jetbackup.accounts.createOnDemand.useMutation({
    onSuccess: () => {
      toast.success("On-demand backup started");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <JetBackupTableSkeleton rows={4} />;
  if (isError) {
    return (
      <JetBackupErrorState
        title="Failed to load backups"
        message={error?.message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        {!readOnly ? (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              disabled={onDemand.isPending}
              onClick={() => onDemand.mutate({ account_id: accountId })}
            >
              Run on-demand backup
            </Button>
          </div>
        ) : null}

        <JetBackupMinimalList emptyMessage="No backups found for this account.">
          {snapshots.map((snapshot) => {
            const snapshotId = snapshot.parent_id ?? snapshot._id;
            const subtitle = [
              formatBytes(snapshot.size ?? 0),
              snapshot.destination_name,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <JetBackupMinimalRow
                key={snapshot._id}
                compact
                title={formatJetBackupDate(snapshot.date)}
                subtitle={subtitle}
                badge={snapshot.damaged ? "Damaged" : snapshot.locked ? "Locked" : "Available"}
                badgeVariant={snapshot.damaged ? "destructive" : snapshot.locked ? "secondary" : "outline"}
                actions={
                  readOnly || snapshot.damaged ? undefined : (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={queueRestore.isPending}
                        onClick={() =>
                          setRestoreTarget({
                            snapshotId,
                            backupDate: formatJetBackupDate(snapshot.date),
                          })
                        }
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={queueDownload.isPending}
                        onClick={() =>
                          queueDownload.mutate({
                            snapshot_id: snapshotId,
                          })
                        }
                      >
                        <Download className="mr-1 h-3 w-3" />
                        Download
                      </Button>
                    </>
                  )
                }
              />
            );
          })}
        </JetBackupMinimalList>
      </div>

      <AlertDialog
        open={restoreTarget != null}
        onOpenChange={(open) => {
          if (!open && !queueRestore.isPending) setRestoreTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore backup?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  You are about to restore the backup from{" "}
                  <span className="font-medium text-foreground">{restoreTarget?.backupDate}</span>{" "}
                  to account <span className="font-medium text-foreground">{username}</span>.
                </p>
                <p>
                  This will overwrite the account&apos;s current websites, databases, email, and
                  files with the contents of that backup. Any data created or changed after that
                  backup date will be lost.
                </p>
                <p className="font-medium text-foreground">This action cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={queueRestore.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (!restoreTarget) return;
                queueRestore.mutate({ snapshot_id: restoreTarget.snapshotId });
              }}
              disabled={queueRestore.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {queueRestore.isPending ? "Queuing restore…" : "Restore backup"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
