"use client";

import * as React from "react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/utils/trpc";
import { jetbackupQueryOptions } from "../query-options";
import { formatJetBackupDate, formatQueueStatus, formatQueueType } from "../formatters";
import { JetBackupErrorState, JetBackupTableSkeleton } from "../primitives";
import { JetBackupMinimalList, JetBackupMinimalRow } from "../minimal-list";
import { jetbackupSuccessBadgeClass } from "../status-badges";
import type { JetBackupQueueGroupRow } from "../types";

function normalizeQueueGroups(data: unknown): {
  groups: JetBackupQueueGroupRow[];
  warning?: string;
} {
  if (!data || typeof data !== "object") return { groups: [] };
  const record = data as Record<string, unknown>;
  const list = record.groups ?? record.items ?? record.queue_groups;
  return {
    groups: Array.isArray(list) ? (list as JetBackupQueueGroupRow[]) : [],
    warning: typeof record.warning === "string" ? record.warning : undefined,
  };
}

export function JetBackupQueueTab() {
  const [queueType, setQueueType] = React.useState<1 | 2 | 3>(1);
  const utils = trpc.useUtils();

  const { data, isLoading, isError, error, refetch, isRefetching } =
    trpc.jetbackup.queues.listGroups.useQuery(
      { limit: 50, type: queueType },
      jetbackupQueryOptions,
    );

  const stopGroup = trpc.jetbackup.queues.stopGroup.useMutation({
    onSuccess: () => {
      toast.success("Queue group stopped");
      utils.jetbackup.queues.listGroups.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const rerunFailed = trpc.jetbackup.queues.rerunFailed.useMutation({
    onSuccess: () => {
      toast.success("Failed queue group re-queued");
      utils.jetbackup.queues.listGroups.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const { groups, warning } = normalizeQueueGroups(data);

  if (isLoading) return <JetBackupTableSkeleton rows={3} />;
  if (isError) {
    return (
      <JetBackupErrorState
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
          onValueChange={(v) => setQueueType(Number(v) as 1 | 2 | 3)}
        >
          <TabsList>
            <TabsTrigger value="1">Backups</TabsTrigger>
            <TabsTrigger value="2">Restores</TabsTrigger>
            <TabsTrigger value="3">Downloads</TabsTrigger>
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

      <JetBackupMinimalList emptyMessage={`No ${formatQueueType(queueType).toLowerCase()} queue items.`}>
        {groups.map((group) => {
          const progress =
            group.progress != null && group.progress > 0 ? `${group.progress}%` : undefined;
          const subtitle = [
            group.username,
            formatJetBackupDate(group.created),
            progress,
          ]
            .filter(Boolean)
            .join(" · ");

          const status = group.status?.toLowerCase();
          const isSuccess = status === "completed" || status === "running";

          return (
            <JetBackupMinimalRow
              key={group._id}
              title={formatQueueType(group.type ?? queueType)}
              subtitle={subtitle || "—"}
              badge={formatQueueStatus(group.status)}
              badgeVariant={status === "failed" ? "destructive" : "default"}
              badgeClassName={jetbackupSuccessBadgeClass(isSuccess)}
              actions={
                <>
                  {group.status === "running" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={stopGroup.isPending}
                      onClick={() => stopGroup.mutate({ _id: group._id })}
                    >
                      Stop
                    </Button>
                  ) : null}
                  {group.status === "failed" ? (
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
      </JetBackupMinimalList>
    </div>
  );
}
