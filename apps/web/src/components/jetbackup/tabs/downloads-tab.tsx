"use client";

import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { jetbackupQueryOptions } from "../query-options";
import { formatBytes, formatJetBackupDate } from "../formatters";
import { JetBackupErrorState, JetBackupTableSkeleton } from "../primitives";
import { JetBackupMinimalList, JetBackupMinimalRow } from "../minimal-list";
import {
  buildJetBackupDownloadFileUrl,
  normalizeDownloads,
} from "../hooks/use-jetbackup-downloads";
import { jetbackupStatusBadgeClass } from "../status-badges";

export function JetBackupDownloadsTab({ username }: { username?: string }) {
  const { data, isLoading, isError, error, refetch, isRefetching } =
    trpc.jetbackup.downloads.list.useQuery(
      { limit: 100 },
      {
        ...jetbackupQueryOptions,
        refetchInterval: 30_000,
      },
    );

  const downloads = normalizeDownloads(data).filter((item) =>
    username ? item.account === username : true,
  );

  if (isLoading) return <JetBackupTableSkeleton rows={4} />;
  if (isError) {
    return (
      <JetBackupErrorState
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

      <JetBackupMinimalList emptyMessage="No downloads yet.">
        {downloads.map((item) => {
          const subtitle = [
            item.account,
            formatJetBackupDate(item.created),
            formatBytes(item.size ?? 0),
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <JetBackupMinimalRow
              key={item._id}
              title={item.path ?? "Backup archive"}
              subtitle={subtitle || "-"}
              badge="Ready"
              badgeVariant="outline"
              badgeClassName={jetbackupStatusBadgeClass("success")}
              actions={
                <Button size="sm" variant="ghost" asChild>
                  <a href={buildJetBackupDownloadFileUrl(item._id)} download={item.path}>
                    <Download className="mr-1 h-3 w-3" />
                    Save file
                  </a>
                </Button>
              }
            />
          );
        })}
      </JetBackupMinimalList>
    </div>
  );
}
