"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/utils/trpc";
import { WpTaskProgress, extractTaskUrl } from "@/components/wordpress/wp-task-progress";

interface RestoreBackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installationId: number;
  fileName: string;
  onRestored?: () => void;
}

export function RestoreBackupDialog({
  open,
  onOpenChange,
  installationId,
  fileName,
  onRestored,
}: RestoreBackupDialogProps) {
  const [clobber, setClobber] = React.useState(false);
  const [dropTables, setDropTables] = React.useState(false);
  const [restoreSettings, setRestoreSettings] = React.useState(false);
  const [taskUrl, setTaskUrl] = React.useState<string | null>(null);

  const restoreMutation = trpc.plesk.wpFeatures.restoreBackup.useMutation({
    onSuccess: (res) => {
      const url = extractTaskUrl(res);
      if (url) {
        setTaskUrl(url);
        toast.success("Restore started");
      } else {
        toast.success("Restore requested");
        onOpenChange(false);
        onRestored?.();
      }
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Restore backup</AlertDialogTitle>
          <AlertDialogDescription className="break-all">
            Restore <span className="font-medium text-foreground">{fileName}</span>? This may
            overwrite site files and database content.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {taskUrl ? (
          <WpTaskProgress
            taskUrl={taskUrl}
            onComplete={() => {
              setTaskUrl(null);
              onOpenChange(false);
              onRestored?.();
            }}
            onDismiss={() => setTaskUrl(null)}
          />
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="clobber" className="text-sm font-normal">
                Overwrite existing files
              </Label>
              <Switch id="clobber" checked={clobber} onCheckedChange={setClobber} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="drop-tables" className="text-sm font-normal">
                Drop all database tables first
              </Label>
              <Switch id="drop-tables" checked={dropTables} onCheckedChange={setDropTables} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="restore-settings" className="text-sm font-normal">
                Restore WP Toolkit settings
              </Label>
              <Switch
                id="restore-settings"
                checked={restoreSettings}
                onCheckedChange={setRestoreSettings}
              />
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={restoreMutation.isPending}>Cancel</AlertDialogCancel>
          {!taskUrl ? (
            <AlertDialogAction
              disabled={restoreMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                restoreMutation.mutate({
                  installationId,
                  fileName,
                  clobber,
                  dropAllDatabaseTables: dropTables,
                  restoreSettings,
                });
              }}
            >
              {restoreMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Restore
            </AlertDialogAction>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
