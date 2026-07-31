"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function NiscBackupMinimalList({
  emptyMessage = "Nothing to show.",
  children,
  className,
}: {
  emptyMessage?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const items = React.Children.toArray(children).filter(Boolean);
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }
  return <div className={cn("divide-y rounded-lg border bg-card", className)}>{items}</div>;
}

export function NiscBackupMinimalRow({
  title,
  subtitle,
  meta,
  badge,
  badgeVariant = "secondary",
  badgeClassName,
  actions,
  onClick,
  compact = false,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  badge?: React.ReactNode;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  badgeClassName?: string;
  actions?: React.ReactNode;
  onClick?: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        compact ? "px-3 py-2" : "px-4 py-3",
        onClick && "cursor-pointer hover:bg-muted/40",
      )}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <p className={cn("truncate font-medium", compact ? "text-sm" : "text-sm")}>{title}</p>
          {badge != null ? (
            <Badge
              variant={badgeVariant}
              className={cn("shrink-0 text-[10px] px-1.5 py-0", badgeClassName)}
            >
              {badge}
            </Badge>
          ) : null}
        </div>
        {subtitle ? (
          <p className="truncate text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
        ) : null}
        {meta ? <p className="text-[11px] text-muted-foreground mt-0.5">{meta}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
    </div>
  );
}
