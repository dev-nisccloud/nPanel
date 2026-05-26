"use client";

import * as React from "react";
import { Loader2, XCircle, CheckCircle2, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  isWpTaskSuccess,
  useWpBackgroundTask,
} from "@/components/wordpress/use-wp-background-task";
import { normalizeWpToolkitTaskUrl } from "@/lib/wp-task-url";

interface WpTaskProgressProps {
  taskUrl: string | null;
  onComplete?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function WpTaskProgress({ taskUrl, onComplete, onDismiss, className }: WpTaskProgressProps) {
  const {
    task,
    taskGone,
    isLoading,
    isRunning,
    isComplete,
    isFailed,
    displayProgress,
    cancel,
    isCancelling,
    cancelResult,
    terminal,
  } = useWpBackgroundTask(taskUrl);

  const completedRef = React.useRef(false);

  React.useEffect(() => {
    if (completedRef.current) return;
    if (terminal) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [terminal, onComplete]);

  if (!taskUrl) return null;

  const status = task?.status?.toLowerCase();
  const failed =
    isFailed ||
    status === "failed" ||
    status === "error" ||
    (task?.errors?.length ?? 0) > 0;
  const done = isComplete || taskGone || (status ? isWpTaskSuccess(status) : false);
  const showDeterminateProgress = displayProgress != null && displayProgress > 0;
  const showIndeterminate = isRunning && !showDeterminateProgress;

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {isLoading && !task && !taskGone ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
          ) : failed ? (
            <XCircle className="h-5 w-5 shrink-0 text-destructive" />
          ) : done ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
          ) : (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
          )}
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium leading-snug">
              {taskGone
                ? "Operation completed"
                : (task?.title ?? "Running operation")}
            </p>
            {task?.code ? (
              <p className="text-xs text-muted-foreground truncate">{task.code}</p>
            ) : showIndeterminate ? (
              <p className="text-xs text-muted-foreground">In progress…</p>
            ) : done ? (
              <p className="text-xs text-muted-foreground">Completed</p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {isRunning ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isCancelling}
              onClick={() => void cancel()}
            >
              <Ban className="mr-1.5 h-3.5 w-3.5" />
              {isCancelling ? "Cancelling…" : "Cancel"}
            </Button>
          ) : null}
          {onDismiss && !isRunning ? (
            <Button type="button" variant="ghost" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
          ) : null}
        </div>
      </div>

      {showDeterminateProgress ? (
        <div className="space-y-1.5">
          <Progress value={Math.min(100, Math.max(0, displayProgress))} className="h-1.5" />
          <p className="text-xs text-muted-foreground text-right">{displayProgress}%</p>
        </div>
      ) : showIndeterminate ? (
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
          <div className="absolute inset-y-0 w-1/3 animate-pulse rounded-full bg-primary" />
        </div>
      ) : done && !failed ? (
        <Progress value={100} className="h-1.5" />
      ) : null}

      {task?.steps && task.steps.length > 0 ? (
        <ul className="space-y-1.5 border-t border-border/40 pt-3">
          {task.steps.map((step, i) => (
            <li key={step.code ?? i} className="flex items-center justify-between text-xs gap-2">
              <span className="text-muted-foreground truncate">{step.title ?? step.code}</span>
              <span className="capitalize shrink-0 text-foreground/80">{step.status ?? "—"}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {task?.errors && task.errors.length > 0 ? (
        <ul className="text-xs text-destructive space-y-1">
          {task.errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      ) : null}

      {cancelResult && !cancelResult.cancelled && cancelResult.cancelSupported === false ? (
        <p className="text-xs text-muted-foreground">{cancelResult.message}</p>
      ) : null}
    </div>
  );
}

/** Store task URL from a mutation that returns { url, taskUrl, task } or Plesk { data: { url } } */
export function extractTaskUrl(response: unknown): string | null {
  if (!response || typeof response !== "object") return null;
  const root = response as Record<string, unknown>;

  const candidates: string[] = [];
  if (typeof root.taskUrl === "string") candidates.push(root.taskUrl);
  if (typeof root.url === "string") candidates.push(root.url);
  const data = root.data;
  if (data && typeof data === "object" && typeof (data as { url?: string }).url === "string") {
    candidates.push((data as { url: string }).url);
  }

  const task = root.task;
  if (task && typeof task === "object") {
    const t = task as Record<string, unknown>;
    if (typeof t.url === "string") candidates.push(t.url);
    const code = typeof t.code === "string" ? t.code : undefined;
    const id = typeof t.id === "number" ? t.id : undefined;
    if (code && id != null) {
      candidates.push(`/v1/background-tasks/${code}/${id}`);
    }
  }

  for (const raw of candidates) {
    if (!raw.includes("background-tasks")) continue;
    const normalized = normalizeWpToolkitTaskUrl(raw);
    if (normalized) return normalized;
  }

  return null;
}
