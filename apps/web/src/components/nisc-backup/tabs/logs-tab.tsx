"use client";

import { trpc } from "@/utils/trpc";
import { niscBackupQueryOptions } from "../query-options";
import {
  formatDuration,
  formatNiscBackupDate,
  formatLogStatus,
  formatLogType,
  isSuccessStatus,
} from "../formatters";
import { niscBackupSuccessBadgeClass } from "../status-badges";
import { NiscBackupErrorState, NiscBackupTableSkeleton } from "../primitives";
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
  info?: { Type?: string; Destination?: string };
}

function normalizeLogs(data: unknown): NiscBackupLogEntry[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const list = record.logs ?? record.items;
  return Array.isArray(list) ? (list as NiscBackupLogEntry[]) : [];
}

export function NiscBackupLogsTab({ username }: { username?: string }) {
  const { data, isLoading, isError, error, refetch } = trpc.niscBackup.logs.list.useQuery(
    { limit: 50, username },
    niscBackupQueryOptions,
  );

  const logs = normalizeLogs(data);

  if (isLoading) return <NiscBackupTableSkeleton rows={4} />;
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
    <NiscBackupMinimalList emptyMessage="No activity logs found.">
      {logs.map((log) => {
        const activity = formatLogType(log.type, log.info);
        const when = formatNiscBackupDate(log.start_time ?? log.created);
        const destination = log.info?.Destination;
        const subtitle = [when, formatDuration(log.execution_time)].filter(Boolean).join(" · ");

        return (
          <NiscBackupMinimalRow
            key={log._id}
            title={activity}
            subtitle={subtitle}
            meta={destination ? `Destination: ${destination}` : log.username ? `Account: ${log.username}` : undefined}
            badge={formatLogStatus(log.status)}
            badgeVariant={log.status === 2 ? "destructive" : "default"}
            badgeClassName={
              log.status === 2
                ? undefined
                : niscBackupSuccessBadgeClass(isSuccessStatus(log.status))
            }
          />
        );
      })}
    </NiscBackupMinimalList>
  );
}
