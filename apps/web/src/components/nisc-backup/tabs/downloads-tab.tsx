"use client";

import { captureEvent } from "@/lib/posthog";

import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { niscBackupQueryOptions } from "../query-options";
import { formatBytes, formatNiscBackupDate } from "../formatters";
import { NiscBackupErrorState, NiscBackupTableSkeleton } from "../primitives";
import { NiscBackupMinimalList, NiscBackupMinimalRow } from "../minimal-list";
import {
  buildNiscBackupDownloadFileUrl,
  normalizeDownloads,
} from "../hooks/use-nisc-backup-downloads";
import { niscBackupStatusBadgeClass } from "../status-badges";

export function NiscBackupDownloadsTab({ username }: { username?: string }) {
  const { data, isLoading, isError, error, refetch, isRefetching } =
    trpc.niscBackup.downloads.list.useQuery(
      { limit: 100 },
      {
        ...niscBackupQueryOptions,
        refetchInterval: 30_000,
      },
    );

  const downloads = normalizeDownloads(data).filter((item) =>
    username ? item.account === username : true,
  );

  if (isLoading) return <NiscBackupTableSkeleton rows={4} />;
  if (isError) {
    return (
      <NiscBackupErrorState
        title="Failed to load downloads"
        message={error?.message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 @sm/main:flex-row @sm/main:items-center @sm/main:justify-between">
        <p className="text-xs text-muted-foreground">
          Completed archives ready to save to your device.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <NiscBackupMinimalList emptyMessage="No downloads yet.">
        {downloads.map((item) => {
          const subtitle = [
            item.account,
            formatNiscBackupDate(item.created),
            formatBytes(item.size ?? 0),
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <NiscBackupMinimalRow
              key={item._id}
              title={item.path ?? "Backup archive"}
              subtitle={subtitle || "-"}
              badge="Ready"
              badgeVariant="outline"
              badgeClassName={niscBackupStatusBadgeClass("success")}
              actions={
                <Button size="sm" variant="ghost" asChild>
                  <a href={buildNiscBackupDownloadFileUrl(item._id)} onClick={() => captureEvent("backup_downloaded", { backup_id: item._id })} download={item.path}>
                    <Download className="mr-1 h-3 w-3" />
                    Save file
                  </a>
                </Button>
              }
            />
          );
        })}
      </NiscBackupMinimalList>
    </div>
  );
}
