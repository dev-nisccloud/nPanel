"use client";

import * as React from "react";
import { Loader2, XCircle, CheckCircle2, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { isWpTaskTerminal, useWpBackgroundTask } from "@/components/wordpress/use-wp-background-task";
import { normalizeWpToolkitTaskUrl } from "@/lib/wp-task-url";

interface WpTaskProgressProps {
  taskUrl: string | null;
  onComplete?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function WpTaskProgress({ taskUrl, onComplete, onDismiss, className }: WpTaskProgressProps) {
  const { task, isLoading, isRunning, cancel, isCancelling, cancelResult } = useWpBackgroundTask(taskUrl);
  const completedRef = React.useRef(false);

  React.useEffect(() => {
    if (!task?.status || completedRef.current) return;
    if (isWpTaskTerminal(task.status)) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [task?.status, onComplete]);

  if (!taskUrl) return null;

  const progress = typeof task?.progress === "number" && task.progress >= 0 ? task.progress : undefined;
  const status = task?.status?.toLowerCase();
  const failed = status === "failed" || status === "error" || (task?.errors?.length ?? 0) > 0;
  const done = status === "done" || status === "finished" || status === "completed";

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
          {isLoading && !task ? (
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
              {task?.title ?? "Running operation"}
            </p>
            {task?.code ? (
              <p className="text-xs text-muted-foreground truncate">{task.code}</p>
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

      {progress != null ? (
        <div className="space-y-1.5">
          <Progress value={Math.min(100, Math.max(0, progress))} className="h-1.5" />
          <p className="text-xs text-muted-foreground text-right">{progress}%</p>
        </div>
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

/** Store task URL from a mutation that returns { url, task } or Plesk { data: { url } } */
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

  for (const raw of candidates) {
    if (!raw.includes("background-tasks")) continue;
    const normalized = normalizeWpToolkitTaskUrl(raw);
    if (normalized) return normalized;
  }

  return null;
}
