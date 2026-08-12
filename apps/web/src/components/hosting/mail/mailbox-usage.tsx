"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function formatMailboxBytes(bytes?: number) {
  if (!bytes || bytes <= 0) return "0 MB";
  const mb = bytes / 1024 / 1024;
  if (mb >= 1024) return `${Math.round((mb / 1024) * 100) / 100} GB`;
  return `${Math.round(mb * 100) / 100} MB`;
}

/** Plesk uses -1 (or missing/0) for unlimited mailbox quota. */
export function isFiniteMailboxQuota(quota?: number) {
  return typeof quota === "number" && quota > 0;
}

export function mailboxUsagePercent(usage?: number, quota?: number) {
  if (!isFiniteMailboxQuota(quota)) return null;
  return Math.min(100, Math.round(((usage || 0) / quota!) * 100));
}

export function MailboxUsageDisplay({
  usage,
  quota,
  className,
  barClassName,
  size = "sm",
}: {
  usage?: number;
  quota?: number;
  className?: string;
  barClassName?: string;
  size?: "sm" | "md";
}) {
  const finite = isFiniteMailboxQuota(quota);
  const percent = mailboxUsagePercent(usage, quota);
  const usedLabel = formatMailboxBytes(usage);

  if (!finite || percent === null) {
    return (
      <div className={cn("flex min-w-0 items-center gap-2", className)}>
        <span
          className={cn(
            "truncate tabular-nums text-muted-foreground",
            size === "sm" ? "text-[11px]" : "text-sm",
          )}
        >
          {usedLabel} used
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full border px-1.5 py-0.5 font-medium text-muted-foreground",
            size === "sm" ? "text-[10px]" : "text-xs",
          )}
        >
          Unlimited
        </span>
      </div>
    );
  }

  if (size === "md") {
    return (
      <div className={cn("space-y-1.5", className)}>
        <Progress value={percent} className={cn("h-2 w-full", barClassName)} />
        <p className="text-sm tabular-nums text-muted-foreground">
          {usedLabel} / {formatMailboxBytes(quota)} · {percent}%
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <Progress
        value={percent}
        className={cn("h-1.5 w-24 shrink-0", barClassName)}
      />
      <span className="truncate tabular-nums text-[11px] text-muted-foreground">
        {usedLabel} / {formatMailboxBytes(quota)} · {percent}%
      </span>
    </div>
  );
}
