"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { niscBackupQueryOptions } from "../query-options";
import {
  formatDuration,
  formatNiscBackupDate,
  formatLogStatus,
  formatLogType,
  isSuccessStatus,
  sortNewestFirst,
} from "../formatters";
import { niscBackupSuccessBadgeClass } from "../status-badges";
import { NiscBackupErrorState } from "../primitives";
import { NiscBackupMinimalList, NiscBackupMinimalRow } from "../minimal-list";

interface NiscBackupLogEntry {
  _id: string;
  username?: string;
  status?: number | string;
  type?: number;
  created?: number | string;
  start_time?: string;
  end_time?: string;
  execution_time?: number;
  info?: {
    Type?: string;
    Destination?: string;
    Account?: string;
  };
}

function normalizeLogs(data: unknown): NiscBackupLogEntry[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const list = record.logs ?? record.items;
  const rows = Array.isArray(list)
    ? (list as NiscBackupLogEntry[])
    : list && typeof list === "object"
      ? (Object.values(list) as NiscBackupLogEntry[])
      : [];
  return sortNewestFirst(
    rows.filter((log) => log && typeof log === "object" && log._id),
    (log) => log.start_time ?? log.created,
  );
}

function logSubtitle(log: NiscBackupLogEntry, hideAccount?: string): string {
  const account = log.info?.Account ?? log.username;
  const duration =
    log.execution_time != null && log.execution_time > 0
      ? formatDuration(log.execution_time)
      : null;

  return [
    formatNiscBackupDate(log.start_time ?? log.created),
    duration,
    account && account !== hideAccount ? account : null,
    log.info?.Destination,
  ]
    .filter((part) => part && part !== "-")
    .join(" · ");
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="divide-y overflow-hidden rounded-lg border bg-card">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-3 px-3 py-1.5">
            <div className="min-w-0 flex-1 space-y-1">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-48 max-w-full" />
            </div>
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function NiscBackupLogsTab({ username }: { username?: string }) {
  const { data, isLoading, isError, error, refetch, isRefetching } =
    trpc.niscBackup.logs.list.useQuery(
      { limit: 50, username },
      niscBackupQueryOptions,
    );

  const logs = React.useMemo(() => {
    const rows = normalizeLogs(data);
    if (!username) return rows;
    return rows.filter((log) => (log.info?.Account ?? log.username) === username);
  }, [data, username]);

  if (isLoading) return <ActivitySkeleton />;
  if (isError) {
    return (
      <NiscBackupErrorState
        title="Failed to load logs"
        message={error?.message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""} @sm/main:mr-2`} />
          <span className="hidden @sm/main:inline">Refresh</span>
        </Button>
      </div>

      <NiscBackupMinimalList emptyMessage="No activity logs found.">
        {logs.map((log) => {
          const failed = log.status === 2;

          return (
            <NiscBackupMinimalRow
              key={log._id}
              compact
              title={formatLogType(log.type, log.info)}
              subtitle={logSubtitle(log, username) || undefined}
              badge={formatLogStatus(log.status)}
              badgeVariant={failed ? "destructive" : "outline"}
              badgeClassName={
                failed ? undefined : niscBackupSuccessBadgeClass(isSuccessStatus(log.status))
              }
            />
          );
        })}
      </NiscBackupMinimalList>
    </div>
  );
}
