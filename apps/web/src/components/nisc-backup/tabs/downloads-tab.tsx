"use client";

import { captureEvent } from "@/lib/posthog";

import { Download, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CleanList, CleanListCell, CleanListRow } from "@/components/ui/clean-list";
import { trpc } from "@/utils/trpc";
import { niscBackupQueryOptions } from "../query-options";
import { formatBytes, formatNiscBackupDate } from "../formatters";
import { NiscBackupErrorState } from "../primitives";
import {
  buildNiscBackupDownloadFileUrl,
  normalizeDownloads,
} from "../hooks/use-nisc-backup-downloads";
import { niscBackupSuccessBadgeClass } from "../status-badges";

function DownloadsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="divide-y overflow-hidden rounded-xl border bg-card">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <Skeleton className="mt-0.5 h-4 w-4" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-3 w-36 max-w-full" />
              </div>
            </div>
            <Skeleton className="h-7 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

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

  if (isLoading) return <DownloadsSkeleton />;
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
          <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""} @sm/main:mr-2`} />
          <span className="hidden @sm/main:inline">Refresh</span>
        </Button>
      </div>

      <CleanList
        emptyMessage="No downloads yet."
        columns={[
          { key: "name", label: "File" },
          { key: "date", label: "Date", className: "min-w-0 flex-1", hideBelow: "@lg" },
          { key: "size", label: "Size", className: "w-24 shrink-0", hideBelow: "@xl" },
          { key: "status", label: "Status", className: "w-24 shrink-0", hideBelow: "@2xl" },
          { key: "actions", label: "Actions", align: "end" },
        ]}
      >
        {downloads.map((item) => {
          const fileName = item.path?.split(/[\\/]/).pop() || item.path || "Backup archive";
          const dateLabel = formatNiscBackupDate(item.created);
          const sizeLabel = formatBytes(item.size);

          return (
            <CleanListRow
              key={item._id}
              leading={<Download className="h-4 w-4 text-muted-foreground" />}
              title={fileName}
              cells={{
                date: <CleanListCell>{dateLabel}</CleanListCell>,
                size: <CleanListCell>{sizeLabel}</CleanListCell>,
                status: (
                  <Badge variant="outline" className={niscBackupSuccessBadgeClass(true)}>
                    Ready
                  </Badge>
                ),
              }}
              actions={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  asChild
                >
                  <a
                    href={buildNiscBackupDownloadFileUrl(item._id)}
                    onClick={() => captureEvent("backup_downloaded", { backup_id: item._id })}
                    download={item.path}
                  >
                    <Download className="mr-1 h-3.5 w-3.5" />
                    Save file
                  </a>
                </Button>
              }
            />
          );
        })}
      </CleanList>
    </div>
  );
}
