"use client";

import * as React from "react";
import { EllipsisVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Hostinger-style clean list: one bordered card, divider rows,
 * title + description on the left, compact actions on the right.
 * Below ~lg the row is a container query; actions collapse into a more menu.
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

function CleanListRowActionsMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground data-[state=open]:bg-muted"
          aria-label="Open actions"
        >
          <EllipsisVertical className="size-4" />
          <span className="sr-only">Open actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-48 p-1"
        onClick={() => setOpen(false)}
      >
        <div
          className={cn(
            "flex flex-col gap-0.5",
            "[&_button]:h-auto [&_button]:min-h-8 [&_button]:w-full [&_button]:justify-start [&_button]:rounded-sm [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-2 [&_button]:py-1.5 [&_button]:text-sm [&_button]:shadow-none [&_button]:hover:bg-accent [&_button]:hover:text-accent-foreground",
            "[&_a]:h-auto [&_a]:min-h-8 [&_a]:w-full [&_a]:justify-start [&_a]:rounded-sm [&_a]:border-0 [&_a]:bg-transparent [&_a]:px-2 [&_a]:py-1.5 [&_a]:text-sm [&_a]:shadow-none [&_a]:hover:bg-accent [&_a]:hover:text-accent-foreground",
          )}
        >
          {children}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
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
        "@container flex items-center justify-between gap-3 px-4 py-3.5",
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
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <p className="min-w-0 max-w-full truncate text-sm font-semibold text-foreground">
              {title}
            </p>
            {trailing ? <div className="max-w-full shrink-0">{trailing}</div> : null}
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
          className="flex shrink-0 items-center"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className="hidden items-center gap-1.5 @5xl:flex">{actions}</div>
          <div className="@5xl:hidden">
            <CleanListRowActionsMenu>{actions}</CleanListRowActionsMenu>
          </div>
        </div>
      ) : null}
    </div>
  );
}
