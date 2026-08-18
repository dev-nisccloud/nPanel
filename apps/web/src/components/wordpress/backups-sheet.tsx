"use client";

import * as React from "react";
import { Database, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RestoreBackupDialog } from "@/components/wordpress/restore-backup-dialog";
import { WpManageSheet } from "@/components/wordpress/wp-manage-sheet";
import { WpTaskProgress, extractTaskUrl } from "@/components/wordpress/wp-task-progress";
import { useConfirm } from "@/hooks/use-confirm";
import { trpc } from "@/utils/trpc";

function formatSize(bytes?: number) {
  if (bytes == null) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function WordPressBackupsSheet({
  open,
  onOpenChange,
  installationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installationId: number;
}) {
  const [taskUrl, setTaskUrl] = React.useState<string | null>(null);
  const [description, setDescription] = React.useState("");
  const [showAll, setShowAll] = React.useState(true);
  const [restoreFile, setRestoreFile] = React.useState<string | null>(null);

  const [DeleteBackupDialog, confirmDeleteBackup] = useConfirm(
    "Delete backup?",
    "This permanently removes the backup archive from the server. You will not be able to restore your site from this backup again.",
  );

  const { data, isLoading, refetch } = trpc.plesk.wpFeatures.getBackupsList.useQuery(
    { installationId, showAllBackups: showAll },
    { enabled: open },
  );

  const list = data?.items ?? [];

  const createBackup = trpc.plesk.wpFeatures.createBackup.useMutation({
    onSuccess: (res) => {
      const url = extractTaskUrl(res);
      if (!url && !res.started) {
        toast.error("Backup could not be started - no task returned from the server");
        return;
      }
      setDescription("");
      if (url) setTaskUrl(url);
      toast.success("Backup started");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteBackup = trpc.plesk.wpFeatures.deleteBackup.useMutation({
    onSuccess: () => {
      toast.success("Backup deleted");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <WpManageSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Backups"
      description="Create, restore, or remove WP Toolkit backup archives"
      icon={Database}
      isLoading={isLoading}
    >
      <DeleteBackupDialog />
      {taskUrl ? (
        <WpTaskProgress
          taskUrl={taskUrl}
          onComplete={() => {
            refetch();
            setTaskUrl(null);
          }}
          onDismiss={() => setTaskUrl(null)}
        />
      ) : null}

      <div className="space-y-3 rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium text-primary">Create backup</p>
          <p className="text-xs text-muted-foreground">Includes files and database</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Before plugin updates"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            className="h-9 shrink-0"
            disabled={createBackup.isPending}
            onClick={() =>
              createBackup.mutate({
                installationId,
                description: description || undefined,
                backupSettings: true,
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-primary">Backup history</p>
        <div className="flex items-center gap-2">
          <Label htmlFor="show-all-backups" className="text-xs font-normal text-muted-foreground">
            Show all
          </Label>
          <Switch id="show-all-backups" checked={showAll} onCheckedChange={setShowAll} />
        </div>
      </div>

      {list.length === 0 ? (
        <p className="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground">
          No backups found.
        </p>
      ) : (
        <div className="space-y-3">
          {list.map((backup) => (
            <div key={backup.fileName} className="space-y-3 rounded-lg border px-4 py-3">
              <div className="min-w-0">
                <p className="break-all text-sm font-medium text-primary">{backup.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(backup.fileSize)}
                  {backup.createdAt ? ` · ${new Date(backup.createdAt).toLocaleString()}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setRestoreFile(backup.fileName)}
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  Restore
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs text-destructive hover:text-destructive"
                  disabled={deleteBackup.isPending}
                  onClick={async () => {
                    const ok = await confirmDeleteBackup();
                    if (!ok) return;
                    deleteBackup.mutate({ installationId, fileName: backup.fileName });
                  }}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {restoreFile ? (
        <RestoreBackupDialog
          open={Boolean(restoreFile)}
          onOpenChange={(next) => !next && setRestoreFile(null)}
          installationId={installationId}
          fileName={restoreFile}
          onRestored={() => {
            setRestoreFile(null);
            refetch();
          }}
        />
      ) : null}
    </WpManageSheet>
  );
}
