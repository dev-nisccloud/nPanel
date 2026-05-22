"use client";

import * as React from "react";
import { trpc } from "@/utils/trpc";

const TERMINAL_STATUSES = new Set(["done", "finished", "completed", "failed", "error", "cancelled"]);

export function isWpTaskTerminal(status?: string): boolean {
  if (!status) return false;
  return TERMINAL_STATUSES.has(status.toLowerCase());
}

export function useWpBackgroundTask(taskUrl: string | null, options?: { enabled?: boolean }) {
  const enabled = Boolean(taskUrl) && (options?.enabled ?? true);

  const query = trpc.plesk.wpBackgroundTasks.getByUrl.useQuery(
    { taskUrl: taskUrl! },
    {
      enabled,
      refetchInterval: (q) => {
        const status = q.state.data?.task?.status;
        if (!status || isWpTaskTerminal(status)) return false;
        return 2000;
      },
    },
  );

  const cancelMutation = trpc.plesk.wpBackgroundTasks.cancelByUrl.useMutation();

  const cancel = React.useCallback(async () => {
    if (!taskUrl) return;
    return cancelMutation.mutateAsync({ taskUrl });
  }, [taskUrl, cancelMutation]);

  return {
    task: query.data?.task,
    isLoading: query.isLoading,
    isRunning: Boolean(query.data?.task?.status && !isWpTaskTerminal(query.data.task.status)),
    error: query.error,
    refetch: query.refetch,
    cancel,
    isCancelling: cancelMutation.isPending,
    cancelResult: cancelMutation.data,
  };
}
