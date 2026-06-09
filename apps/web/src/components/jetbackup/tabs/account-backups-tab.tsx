"use client";

import { Download, RotateCcw } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { formatBytes, formatJetBackupDate } from "../formatters";
import { JetBackupErrorState, JetBackupTableSkeleton } from "../primitives";
import { JetBackupMinimalList, JetBackupMinimalRow } from "../minimal-list";
import { useJetBackupAccountBackups } from "../hooks/use-jetbackup-account-backups";

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
  const { snapshots, isLoading, isError, error, refetch } = useJetBackupAccountBackups(accountId);

  const queueRestore = trpc.jetbackup.queues.addItems.useMutation({
    onSuccess: () => {
      toast.success("Restore queued");
      utils.jetbackup.queues.listGroups.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const queueDownload = trpc.jetbackup.queues.addItems.useMutation({
    onSuccess: () => {
      toast.success("Download queued");
      utils.jetbackup.downloads.list.invalidate();
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
          const queueParentId = snapshot.parent_id ?? snapshot._id;
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
                        queueRestore.mutate({
                          items: [{ parent_id: queueParentId, type: 2, username }],
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
                          items: [{ parent_id: queueParentId, type: 3, username }],
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
  );
}
