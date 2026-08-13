"use client";

import * as React from "react";
import { Database, Plus, Trash2, RotateCcw } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CleanListRow } from "@/components/ui/clean-list";
import { WpTaskProgress, extractTaskUrl } from "@/components/wordpress/wp-task-progress";
import { RestoreBackupDialog } from "@/components/wordpress/restore-backup-dialog";
import { useWpInstallationSummary } from "@/components/wordpress/use-wp-installation-summary";
import { useConfirm } from "@/hooks/use-confirm";
import { trpc } from "@/utils/trpc";

export function WordPressBackupsTab({ installationId }: { installationId: string }) {
  const { id } = useWpInstallationSummary(installationId);
  const [taskUrl, setTaskUrl] = React.useState<string | null>(null);
  const [description, setDescription] = React.useState("");
  const [showAll, setShowAll] = React.useState(true);
  const [restoreFile, setRestoreFile] = React.useState<string | null>(null);

  const [DeleteBackupDialog, confirmDeleteBackup] = useConfirm(
    "Delete backup?",
    "This permanently removes the backup archive from the server. You will not be able to restore your site from this backup again.",
  );

  const { data, isLoading, refetch } = trpc.plesk.wpFeatures.getBackupsList.useQuery({
    installationId: id,
    showAllBackups: showAll,
  });

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

  const formatSize = (bytes?: number) => {
    if (bytes == null) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDeleteBackup = async (fileName: string) => {
    const ok = await confirmDeleteBackup();
    if (!ok) return;
    deleteBackup.mutate({ installationId: id, fileName });
  };

  return (
    <div className="space-y-6">
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

      <Card className="overflow-hidden py-0 gap-0">
        <CardHeader className="border-b bg-muted/30 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Database className="h-4 w-4 text-muted-foreground" />
            Create backup
          </CardTitle>
          <CardDescription className="text-xs">
            WP Toolkit backups include files and database
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 py-3">
          <div className="flex flex-col gap-3 @md/main:flex-row @md/main:items-end">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor="backup-desc" className="text-xs text-muted-foreground">
                Description (optional)
              </Label>
              <Input
                id="backup-desc"
                placeholder="Before plugin updates"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button
              type="button"
              size="sm"
              className="h-9 shrink-0"
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
              Create backup
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden py-0 gap-0">
        <CardHeader className="border-b bg-muted/30 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Backup history</CardTitle>
              <CardDescription className="text-xs">
                Restore or remove WP Toolkit backup archives
                {list.length > 0 && data?.dirName
                  ? ` · ${list.length} in ${data.dirName}`
                  : ""}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Label htmlFor="show-all" className="text-xs font-normal text-muted-foreground">
                Show all in directory
              </Label>
              <Switch id="show-all" checked={showAll} onCheckedChange={setShowAll} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading backups…</p>
          ) : list.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No backups found.</p>
          ) : (
            <div className="divide-y divide-border">
              {list.map((b) => (
                <CleanListRow
                  key={b.fileName}
                  title={b.fileName}
                  description={
                    <p>
                      {formatSize(b.fileSize)}
                      {b.createdAt ? ` · ${new Date(b.createdAt).toLocaleString()}` : ""}
                    </p>
                  }
                  actions={
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs"
                        onClick={() => setRestoreFile(b.fileName)}
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
                        onClick={() => handleDeleteBackup(b.fileName)}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
