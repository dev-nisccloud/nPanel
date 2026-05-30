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
    <section
      className="border-b border-border bg-muted/40"
      aria-label="Session outputs"
    >
      <div className="px-3 py-3.5 sm:px-4">
        <button
          type="button"
          onClick={onToggleExpanded}
          className={cn(
            "w-full text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg",
            hasGallery && "hover:bg-muted/60",
          )}
          aria-expanded={expanded}
          disabled={!hasGallery}
        >
          <div className="flex items-start gap-3 py-0.5">
            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              {thumbnailUrl ? (
                <img src={thumbnailUrl} alt="" className="size-full object-cover" />
              ) : (
                <Layers className="size-5 text-primary" aria-hidden />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {active ? (
                  <span className="relative flex size-2 shrink-0">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/40 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                  </span>
                ) : null}
                <span className="text-sm font-semibold text-foreground">Outputs</span>
                {total > 0 ? (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium tabular-nums">
                    {total}
                  </Badge>
                ) : null}
                <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
                  {pending > 0 ? (
                    <Badge variant="outline" className="h-5 border-primary/30 bg-primary/5 px-1.5 text-[10px] text-primary">
                      {pending} in progress
                    </Badge>
                  ) : null}
                  {ready > 0 ? (
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                      {ready} ready
                    </Badge>
                  ) : null}
                  {failed > 0 ? (
                    <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                      {failed} failed
                    </Badge>
                  ) : null}
                  {hasGallery ? (
                    expanded ? (
                      <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
                    ) : (
                      <ChevronUp className="size-4 text-muted-foreground" aria-hidden />
                    )
                  ) : null}
                </div>
              </div>

              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {active ? (
                  <>
                    <span className="font-medium text-foreground">{taskLabel}</span>
                    <span className="text-muted-foreground"> - {statusLine}</span>
                  </>
                ) : (
                  statusLine
                )}
              </p>

              {progressTotal > 0 && (active || pending > 0) ? (
                <div
                  className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={progressPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </button>

        {!expanded && hasGallery ? (
          <div className="relative mt-3 -mx-1">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-muted/40 to-transparent"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-muted/40 to-transparent"
              aria-hidden
            />
            <ZeepoGenerationsGallery
              variant="peek"
              generations={generations}
              genLoading={genLoading}
              genError={genError}
              {...galleryRest}
            />
          </div>
        ) : null}
      </div>

      {expanded && hasGallery ? (
        <div className="border-t border-border bg-card/80 px-3 pb-3 pt-2">
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
