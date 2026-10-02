"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";

import { TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * Shared card-style detail tabs (hosting, WordPress, domains, SEO, VPS, backups).
 * Inactive = primary tint; active = white/background.
 */
const DETAIL_TAB_TRIGGER_BASE =
  "group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-primary/5 hover:bg-primary/10 transition-all data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:shadow-sm";

/** Horizontal scroll row of fixed-min-width cards */
export const DETAIL_TAB_TRIGGER_CLASS =
  `${DETAIL_TAB_TRIGGER_BASE} flex-shrink-0 min-w-[140px] @lg/main:min-w-[160px]`;

/** Fluid / grid layout (e.g. domain detail 4-up) */
export const DETAIL_TAB_TRIGGER_FLUID_CLASS =
  `${DETAIL_TAB_TRIGGER_BASE} flex-1 @sm/main:flex-none`;

export const DETAIL_TABS_LIST_CLASS =
  "inline-flex h-auto w-max min-w-full gap-2 p-1.5 pb-2.5 mb-1.5 bg-muted/50 rounded-lg border border-border/50";

export const DETAIL_TABS_SCROLL_CLASS =
  "w-full -mx-4 px-4 md:mx-0 md:px-0 scrollbar-default pb-2 mb-4";

export const DETAIL_TAB_CONTENT_CLASS = "mt-0";

export const DETAIL_TAB_ICON_CLASS =
  "h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary";

type DetailCardTabsTriggerProps = {
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  className?: string;
  /** `scroll` = fixed min width in a scroll row; `fluid` = flex-1 grid cells */
  layout?: "scroll" | "fluid";
  onClick?: () => void;
};

export function DetailCardTabsTrigger({
  value,
  icon: Icon,
  title,
  subtitle,
  className,
  layout = "scroll",
  onClick,
}: DetailCardTabsTriggerProps) {
  return (
    <TabsTrigger
      value={value}
      onClick={onClick}
      className={cn(
        layout === "fluid" ? DETAIL_TAB_TRIGGER_FLUID_CLASS : DETAIL_TAB_TRIGGER_CLASS,
        className,
      )}
    >
      <div className="flex w-full items-center justify-between">
        <Icon className={DETAIL_TAB_ICON_CLASS} />
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
      <div className="flex w-full flex-col items-start gap-1">
        <span className="text-sm font-semibold tracking-tight">{title}</span>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </div>
    </TabsTrigger>
  );
}
