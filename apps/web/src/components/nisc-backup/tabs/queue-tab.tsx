"use client";

import * as React from "react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/utils/trpc";
import { niscBackupQueryOptions } from "../query-options";
import {
  formatNiscBackupDate,
  formatQueueStatus,
  formatQueueType,
  normalizeQueueStatusKey,
  sortNewestFirst,
} from "../formatters";
import { NiscBackupErrorState, NiscBackupTableSkeleton } from "../primitives";
import { NiscBackupMinimalList, NiscBackupMinimalRow } from "../minimal-list";
import { niscBackupQueueStatusBadgeClass } from "../status-badges";
import type { NiscBackupQueueGroupRow } from "../types";

function normalizeQueueGroups(data: unknown): {
  groups: NiscBackupQueueGroupRow[];
  warning?: string;
} {
  if (!data || typeof data !== "object") return { groups: [] };
  const record = data as Record<string, unknown>;
  const list = record.groups ?? record.items ?? record.queue_groups;
  return {
    groups: sortNewestFirst(
      Array.isArray(list) ? (list as NiscBackupQueueGroupRow[]) : [],
      (group) => group.created,
    ),
    warning: typeof record.warning === "string" ? record.warning : undefined,
  };
}

export function NiscBackupQueueTab() {
  const [queueType, setQueueType] = React.useState<1 | 2 | 4>(1);
  const utils = trpc.useUtils();

  const { data, isLoading, isError, error, refetch, isRefetching } =
    trpc.niscBackup.queues.listGroups.useQuery(
      { limit: 50, type: queueType },
      niscBackupQueryOptions,
    );

  const stopGroup = trpc.niscBackup.queues.stopGroup.useMutation({
    onSuccess: () => {
      toast.success("Queue group stopped");
      utils.niscBackup.queues.listGroups.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const rerunFailed = trpc.niscBackup.queues.rerunFailed.useMutation({
    onSuccess: () => {
      toast.success("Failed queue group re-queued");
      utils.niscBackup.queues.listGroups.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const { groups, warning } = normalizeQueueGroups(data);

  if (isLoading) return <NiscBackupTableSkeleton rows={3} />;
  if (isError) {
    return (
      <NiscBackupErrorState
        title="Failed to load queue"
        message={error?.message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 @sm/main:flex-row @sm/main:items-center @sm/main:justify-between">
        <Tabs
          value={String(queueType)}
          onValueChange={(v) => setQueueType(Number(v) as 1 | 2 | 4)}
        >
          <TabsList>
            <TabsTrigger value="1">Backups</TabsTrigger>
            <TabsTrigger value="2">Restores</TabsTrigger>
            <TabsTrigger value="4">Downloads</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          Refresh
        </Button>
      </div>

      {warning ? (
        <p className="text-xs text-muted-foreground rounded-md border bg-muted/30 px-3 py-2">
          {warning}
        </p>
      ) : null}

      <NiscBackupMinimalList emptyMessage={`No ${formatQueueType(queueType).toLowerCase()} queue items.`}>
        {groups.map((group) => {
          const progress =
            group.progress != null && group.progress > 0 ? `${group.progress}%` : undefined;
          const subtitle = [
            group.username,
            formatNiscBackupDate(group.created),
            progress,
          ]
            .filter(Boolean)
            .join(" · ");

          const statusKey = normalizeQueueStatusKey(group.status);

          return (
            <NiscBackupMinimalRow
              key={group._id}
              title={formatQueueType(group.type ?? queueType)}
              subtitle={subtitle || "-"}
              badge={formatQueueStatus(group.status)}
              badgeVariant="outline"
              badgeClassName={niscBackupQueueStatusBadgeClass(statusKey)}
              actions={
                <>
                  {statusKey === "running" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={stopGroup.isPending}
                      onClick={() => stopGroup.mutate({ _id: group._id })}
                    >
                      Stop
                    </Button>
                  ) : null}
                  {statusKey === "failed" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={rerunFailed.isPending}
                      onClick={() => rerunFailed.mutate({ _id: group._id })}
                    >
                      Retry
                    </Button>
                  ) : null}
                </>
              }
            />
          );
        })}
      </NiscBackupMinimalList>
    </div>
  );
}
