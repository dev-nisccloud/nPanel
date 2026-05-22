"use client";

import * as React from "react";
import { Database, Plus, Trash2, RotateCcw } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { WpFeatureCard } from "@/components/wordpress/wp-feature-card";
import { WpTaskProgress, extractTaskUrl } from "@/components/wordpress/wp-task-progress";
import { RestoreBackupDialog } from "@/components/wordpress/restore-backup-dialog";
import { useWpInstallationSummary } from "@/components/wordpress/use-wp-installation-summary";
import { trpc } from "@/utils/trpc";
export function WordPressBackupsTab({
  installationId,
}: {
  installationId: string;
}) {
  const { id } = useWpInstallationSummary(installationId);
  const [taskUrl, setTaskUrl] = React.useState<string | null>(null);
  const [description, setDescription] = React.useState("");
  const [showAll, setShowAll] = React.useState(true);
  const [restoreFile, setRestoreFile] = React.useState<string | null>(null);

  const { data, isLoading, refetch } = trpc.plesk.wpFeatures.getBackupsList.useQuery({
    installationId: id,
    showAllBackups: showAll,
  });

  const list = data?.items ?? [];

  const createBackup = trpc.plesk.wpFeatures.createBackup.useMutation({
    onSuccess: (res) => {
      const url = extractTaskUrl(res);
      if (!url && !res.started) {
        toast.error("Backup could not be started — no task returned from the server");
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

  const formatSize = (bytes?: number) => {
    if (bytes == null) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
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

      <WpFeatureCard
        title="Create backup"
        description="WP Toolkit backups include files and database."
        icon={Database}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backup-desc">Description (optional)</Label>
            <Input
              id="backup-desc"
              placeholder="Before plugin updates"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button
            type="button"
            disabled={createBackup.isPending}
            onClick={() =>
              createBackup.mutate({
                installationId: id,
                description: description || undefined,
                backupSettings: true,
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Create WP Toolkit backup
          </Button>
        </div>
      </WpFeatureCard>

      <WpFeatureCard title="Backup history" description="Restore or remove WP Toolkit backup archives." icon={Database}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <Label htmlFor="show-all" className="text-sm font-normal">
            Show all backups in directory
          </Label>
          <Switch id="show-all" checked={showAll} onCheckedChange={setShowAll} />
        </div>
        {list.length > 0 && data?.dirName ? (
          <p className="text-xs text-muted-foreground mb-3">
            {list.length} backup{list.length === 1 ? "" : "s"}
            {data.dirName ? ` in ${data.dirName}` : ""}.
          </p>
        ) : null}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading backups…</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground">No backups found.</p>
        ) : (
          <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
            {list.map((b) => (
              <li
                key={b.fileName}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{b.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(b.fileSize)}
                    {b.createdAt ? ` · ${new Date(b.createdAt).toLocaleString()}` : ""}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRestoreFile(b.fileName)}
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Restore
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={deleteBackup.isPending}
                    onClick={() => deleteBackup.mutate({ installationId: id, fileName: b.fileName })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </WpFeatureCard>

      {restoreFile ? (
        <RestoreBackupDialog
          open={Boolean(restoreFile)}
          onOpenChange={(o) => !o && setRestoreFile(null)}
          installationId={id}
          fileName={restoreFile}
          onRestored={() => {
            setRestoreFile(null);
            refetch();
          }}
        />
      ) : null}
    </div>
  );
}
