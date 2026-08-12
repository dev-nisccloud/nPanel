"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Hostinger-style clean list: one bordered card, divider rows,
 * title + description on the left, compact actions on the right.
 */
export function CleanList({
  children,
  className,
  emptyMessage = "Nothing to show.",
}: {
  children?: React.ReactNode;
  className?: string;
  emptyMessage?: string;
}) {
  const items = React.Children.toArray(children).filter(Boolean);

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed bg-card px-4 py-10 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card divide-y divide-border",
        className,
      )}
    >
      {items}
    </div>
  );
}

export function CleanListRow({
  title,
  description,
  leading,
  trailing,
  actions,
  onClick,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Optional icon / badge on the far left */
  leading?: React.ReactNode;
  /** Optional meta next to the title (e.g. external link icon) */
  trailing?: React.ReactNode;
  /** Compact action buttons / menus aligned right */
  actions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const interactive = typeof onClick === "function";

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-3.5",
        interactive && "cursor-pointer transition-colors hover:bg-muted/30",
        className,
      )}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {leading ? <div className="mt-0.5 shrink-0">{leading}</div> : null}
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-foreground">
              {title}
            </p>
            {trailing ? <div className="shrink-0">{trailing}</div> : null}
          </div>
          {description ? (
            <div className="min-w-0 space-y-1 text-xs text-muted-foreground">
              {description}
            </div>
          ) : null}
        </div>
      </div>

      {actions ? (
        <div
          className="flex shrink-0 items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}
