"use client";

import * as React from "react";
import { trpc } from "@/utils/trpc";

const TERMINAL_STATUSES = new Set([
  "done",
  "finished",
  "completed",
  "complete",
  "success",
  "successful",
  "succeeded",
  "ok",
  "failed",
  "error",
  "cancelled",
  "canceled",
  "aborted",
  "timeout",
]);

const STEP_DONE_STATUSES = new Set([
  "done",
  "finished",
  "completed",
  "complete",
  "success",
  "successful",
  "succeeded",
  "ok",
]);

export type WpTaskLike = {
  status?: string;
  progress?: number;
  steps?: Array<{ status?: string; progress?: number }>;
};

export function isWpTaskTerminal(status?: string): boolean {
  if (!status) return false;
  return TERMINAL_STATUSES.has(status.toLowerCase());
}

export function isWpTaskSuccess(status?: string): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return (
    s === "done" ||
    s === "finished" ||
    s === "completed" ||
    s === "complete" ||
    s === "success" ||
    s === "successful" ||
    s === "succeeded" ||
    s === "ok"
  );
}

/**
 * Resolve a 0–100 progress value for display. Returns null when progress is unknown
 * (use indeterminate UI). WP Toolkit backup tasks often report progress: 0 until done.
 */
export function resolveWpTaskProgress(task?: WpTaskLike | null): number | null {
  if (!task) return null;

  const status = task.status?.toLowerCase();
  if (status && isWpTaskSuccess(status)) return 100;

  if (typeof task.progress === "number" && task.progress > 0 && task.progress <= 100) {
    return Math.round(task.progress);
  }

  const steps = task.steps;
  if (steps?.length) {
    let sum = 0;
    for (const step of steps) {
      const stepStatus = step.status?.toLowerCase();
      if (stepStatus && STEP_DONE_STATUSES.has(stepStatus)) {
        sum += 100;
      } else if (typeof step.progress === "number" && step.progress > 0) {
        sum += Math.min(100, step.progress);
      }
    }
    const derived = Math.round(sum / steps.length);
    if (derived > 0) return derived;
  }

  if (status && !isWpTaskTerminal(status)) return null;
  return null;
}

function isTaskNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const data = (error as { data?: { code?: string } }).data;
  return data?.code === "NOT_FOUND";
}

export function useWpBackgroundTask(taskUrl: string | null, options?: { enabled?: boolean }) {
  const enabled = Boolean(taskUrl) && (options?.enabled ?? true);

  const query = trpc.plesk.wpBackgroundTasks.getByUrl.useQuery(
    { taskUrl: taskUrl! },
    {
      enabled,
      refetchInterval: (q) => {
        if (isTaskNotFoundError(q.state.error)) return false;
        const status = q.state.data?.task?.status;
        if (!status || isWpTaskTerminal(status)) return false;
        return 2000;
      },
      retry: (failureCount, error) => {
        if (isTaskNotFoundError(error)) return false;
        return failureCount < 3;
      },
    },
  );

  const cancelMutation = trpc.plesk.wpBackgroundTasks.cancelByUrl.useMutation();

  const cancel = React.useCallback(async () => {
    if (!taskUrl) return;
    return cancelMutation.mutateAsync({ taskUrl });
  }, [taskUrl, cancelMutation]);

  const taskGone = isTaskNotFoundError(query.error);
  const task = query.data?.task;
  const terminal = taskGone || Boolean(task?.status && isWpTaskTerminal(task.status));

  return {
    task,
    taskGone,
    isLoading: query.isLoading && !taskGone,
    isRunning: !taskGone && Boolean(task?.status && !isWpTaskTerminal(task.status)),
    isComplete: taskGone || Boolean(task?.status && isWpTaskSuccess(task.status)),
    isFailed:
      !taskGone &&
      Boolean(
        task?.status &&
          isWpTaskTerminal(task.status) &&
          !isWpTaskSuccess(task.status),
      ),
    displayProgress: taskGone ? 100 : resolveWpTaskProgress(task),
    error: taskGone ? null : query.error,
    refetch: query.refetch,
    cancel,
    isCancelling: cancelMutation.isPending,
    cancelResult: cancelMutation.data,
    terminal,
  };
}
