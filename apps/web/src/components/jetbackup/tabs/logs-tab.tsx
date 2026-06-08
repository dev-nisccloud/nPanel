"use client";

import { trpc } from "@/utils/trpc";
import { jetbackupQueryOptions } from "../query-options";
import {
  formatDuration,
  formatJetBackupDate,
  formatLogStatus,
  formatLogType,
  isSuccessStatus,
} from "../formatters";
import { jetbackupSuccessBadgeClass } from "../status-badges";
import { JetBackupErrorState, JetBackupTableSkeleton } from "../primitives";
import { JetBackupMinimalList, JetBackupMinimalRow } from "../minimal-list";

interface JetBackupLogEntry {
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

function normalizeLogs(data: unknown): JetBackupLogEntry[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const list = record.logs ?? record.items;
  return Array.isArray(list) ? (list as JetBackupLogEntry[]) : [];
}

export function JetBackupLogsTab({ username }: { username?: string }) {
  const { data, isLoading, isError, error, refetch } = trpc.jetbackup.logs.list.useQuery(
    { limit: 50, username },
    jetbackupQueryOptions,
  );

  const logs = normalizeLogs(data);

  if (isLoading) return <JetBackupTableSkeleton rows={4} />;
  if (isError) {
    return (
      <JetBackupErrorState
        title="Failed to load logs"
        message={error?.message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <JetBackupMinimalList emptyMessage="No activity logs found.">
      {logs.map((log) => {
        const activity = formatLogType(log.type, log.info);
        const when = formatJetBackupDate(log.start_time ?? log.created);
        const destination = log.info?.Destination;
        const subtitle = [when, formatDuration(log.execution_time)].filter(Boolean).join(" · ");

        return (
          <JetBackupMinimalRow
            key={log._id}
            title={activity}
            subtitle={subtitle}
            meta={destination ? `Destination: ${destination}` : log.username ? `Account: ${log.username}` : undefined}
            badge={formatLogStatus(log.status)}
            badgeVariant={log.status === 2 ? "destructive" : "default"}
            badgeClassName={
              log.status === 2
                ? undefined
                : jetbackupSuccessBadgeClass(isSuccessStatus(log.status))
            }
          />
        );
      })}
    </JetBackupMinimalList>
  );
}
