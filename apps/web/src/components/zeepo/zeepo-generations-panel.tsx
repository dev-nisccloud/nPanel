"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  formatElapsed,
  useElapsedSeconds,
} from "@/components/zeepo/zeepo-chat-ui";
import {
  ZeepoGenerationsGallery,
  type ZeepoGenerationsGalleryProps,
} from "@/components/zeepo/zeepo-generations-gallery";

export type ZeepoGenerationsPanelProps = ZeepoGenerationsGalleryProps & {
  active: boolean;
  taskLabel: string;
  detail?: string;
  progressCurrent?: number;
  progressTotal?: number;
  thumbnailUrl?: string | null;
  expanded: boolean;
  onToggleExpanded: () => void;
};

function countByStatus(generations: ZeepoGenerationsGalleryProps["generations"]) {
  let pending = 0;
  let ready = 0;
  let failed = 0;
  for (const g of generations) {
    if (g.status === "QUEUED" || g.status === "PROCESSING") pending += 1;
    else if (g.status === "FAILED") failed += 1;
    else if (g.status === "COMPLETED") ready += 1;
  }
  return { pending, ready, failed, total: generations.length };
}

export function ZeepoGenerationsPanel({
  active,
  taskLabel,
  detail,
  progressCurrent = 0,
  progressTotal = 0,
  thumbnailUrl,
  expanded,
  onToggleExpanded,
  generations,
  genLoading,
  genError,
  ...galleryRest
}: ZeepoGenerationsPanelProps) {
  const elapsed = useElapsedSeconds(active);
  const { pending, ready, failed, total } = countByStatus(generations);
  const hasGallery = total > 0 || genLoading || genError;
  const showPanel = active || hasGallery;

  if (!showPanel) return null;

  const progressPct =
    progressTotal > 0
      ? Math.min(100, Math.round((progressCurrent / progressTotal) * 100))
      : 0;

  const statusLine = active
    ? `${formatElapsed(elapsed)} · ${detail ?? "Working on your request"}`
    : detail ??
      (total > 0
        ? `${ready} ready${pending > 0 ? ` · ${pending} in progress` : ""}${failed > 0 ? ` · ${failed} need attention` : ""}`
        : "Outputs from this session appear here");

  return (
    <section className="border-b border-border" aria-label="Session outputs">
      {/* ── Compact single-row bar ───────────────────────────────────────── */}
      <button
        type="button"
        onClick={onToggleExpanded}
        disabled={!hasGallery}
        aria-expanded={expanded}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2 sm:px-4",
          "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          hasGallery ? "cursor-pointer hover:bg-muted/40" : "cursor-default",
        )}
      >
        {/* Left: icon / live thumbnail / pulse dot */}
        {active ? (
          <span className="relative flex size-2 shrink-0" aria-hidden>
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/40 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
        ) : thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            className="size-5 shrink-0 rounded object-cover ring-1 ring-border/60"
          />
        ) : (
          <Layers className="size-4 shrink-0 text-muted-foreground/70" aria-hidden />
        )}

        {/* Label */}
        <span className="text-[13px] font-medium text-foreground/80">Outputs</span>

        {/* Count badge */}
        {total > 0 ? (
          <Badge
            variant="secondary"
            className="h-4 px-1.5 text-[10px] font-medium tabular-nums"
          >
            {total}
          </Badge>
        ) : null}

        {/* Active: elapsed · task label */}
        {active ? (
          <span className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground">
            {formatElapsed(elapsed)}&thinsp;·&thinsp;
            <span className="text-foreground/70">{taskLabel}</span>
          </span>
        ) : (
          <span className="flex-1" />
        )}

        {/* Right: hint + status chips + chevron */}
        <div className="flex shrink-0 items-center gap-1.5">
          {!active && hasGallery && !expanded ? (
            <span className="text-[11px] text-muted-foreground/60">
              Tap to view
            </span>
          ) : null}
          {pending > 0 && !active ? (
            <span className="text-[11px] font-medium text-primary">
              {pending} pending
            </span>
          ) : null}
          {failed > 0 ? (
            <span className="text-[11px] font-medium text-destructive">
              {failed} failed
            </span>
          ) : null}
          {hasGallery ? (
            expanded ? (
              <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
            ) : (
              <ChevronUp className="size-3.5 text-muted-foreground" aria-hidden />
            )
          ) : null}
        </div>
      </button>

      {/* Active progress bar - sits flush at the bottom of the bar */}
      {active && progressTotal > 0 ? (
        <div
          className="h-0.5 w-full bg-muted"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      ) : null}

      {/* Expanded gallery */}
      {expanded && hasGallery ? (
        <div className="border-t border-border/60 px-3 pb-3 pt-2">
          <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            All outputs
          </p>
          <ZeepoGenerationsGallery
            variant="expanded"
            generations={generations}
            genLoading={genLoading}
            genError={genError}
            {...galleryRest}
          />
        </div>
      ) : null}
    </section>
  );
}
