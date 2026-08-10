"use client";

import { FileText, ImageIcon, Presentation } from "lucide-react";
import { cn } from "@/lib/utils";
import { GradientOrb } from "@/components/ui/gradient-orb";
import {
  generationToPanel,
  type ZeepoAiActivePanel,
  type ZeepoAiGeneration,
} from "@/components/zeepo/zeepo-ai-types";

function kindMeta(kind: string) {
  if (kind === "image" || kind === "image-presentation") {
    return { Icon: ImageIcon, label: "Image" };
  }
  if (kind === "presentation") {
    return { Icon: Presentation, label: "Presentation" };
  }
  return { Icon: FileText, label: "Document" };
}

/** Inline ChatGPT/Claude-style generation cards under an assistant reply. */
export function ZeepoAiInlineGenerations({
  generations,
  activeGenerationId,
  onOpen,
}: {
  generations: ZeepoAiGeneration[];
  activeGenerationId?: string | null;
  onOpen: (panel: NonNullable<ZeepoAiActivePanel>) => void;
}) {
  if (!generations.length) return null;

  const images = generations.filter((g) => g.kind === "image");
  const others = generations.filter((g) => g.kind !== "image");

  return (
    <div className="mt-4 flex w-full min-w-0 flex-col gap-3">
      {images.length > 0 ? (
        <div
          className={cn(
            "grid gap-2.5",
            images.length === 1 ? "grid-cols-1 max-w-md" : "grid-cols-2 max-w-xl",
          )}
        >
          {images.map((g) => {
            const pending = g.status === "QUEUED" || g.status === "PROCESSING";
            const failed = g.status === "FAILED";
            const active = activeGenerationId === g.id;
            return (
              <button
                key={g.id}
                type="button"
                disabled={pending || failed}
                onClick={() => {
                  const panel = generationToPanel(g);
                  if (panel) onOpen(panel);
                }}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-2xl border bg-muted/40 text-left",
                  "transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "border-primary ring-2 ring-primary/25" : "border-border/70",
                  pending && "cursor-wait",
                )}
                aria-label={
                  pending
                    ? "Generating image…"
                    : failed
                      ? "Image generation failed"
                      : g.title || "Generated image"
                }
              >
                {g.imageUrl && !pending ? (
                  <img
                    src={g.imageUrl}
                    alt={g.title || ""}
                    className="size-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="relative flex size-full flex-col items-center justify-center">
                    <div className="absolute inset-0" aria-hidden>
                      <GradientOrb config={{ orbScale: 0.45, rotationSpeed: 0.3 }} />
                    </div>
                    <span className="absolute bottom-3 z-10 text-[11px] font-medium text-muted-foreground">
                      {failed ? "Failed" : "Generating…"}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : null}

      {others.length > 0 ? (
        <div className="flex max-w-md flex-col gap-2">
          {others.map((g) => {
            const { Icon, label } = kindMeta(g.kind);
            const pending = g.status === "QUEUED" || g.status === "PROCESSING";
            const active = activeGenerationId === g.id;
            return (
              <button
                key={g.id}
                type="button"
                disabled={pending || g.status === "FAILED"}
                onClick={() => {
                  const panel = generationToPanel(g);
                  if (panel) onOpen(panel);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border bg-card px-3 py-2.5 text-left shadow-sm",
                  "transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "border-primary ring-2 ring-primary/20" : "border-border/70",
                  pending && "cursor-wait opacity-80",
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  {pending ? (
                    <span className="size-2 animate-pulse rounded-full bg-primary" />
                  ) : (
                    <Icon className="size-4 text-primary" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {g.title || label}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {pending ? "Creating…" : label}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
