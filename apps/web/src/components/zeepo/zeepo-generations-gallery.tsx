"use client";

import * as React from "react";
import {
  AlertCircle,
  FileText,
  Headphones,
  ImageIcon,
  Presentation,
  Sparkles,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
import type { PresentationData } from "@/components/zeepo/presentation-pdf";

type ImagePresentationData = {
  title: string;
  slides: { prompt: string; imageUrl?: string; caption?: string; notes?: string }[];
};

type GenerationRow = {
  id: string;
  status: string;
  modelCategory: string;
  outputs: unknown;
  errorMessage: string | null;
};

type ActivePanel =
  | { type: "media"; url: string; kind: "image" | "video" | "audio"; generationId: string }
  | { type: "document"; title: string; content: string }
  | { type: "presentation"; data: PresentationData }
  | { type: "image-presentation"; data: ImagePresentationData }
  | null;

export type ZeepoGenerationsGalleryProps = {
  variant?: "peek" | "expanded";
  generations: GenerationRow[];
  genLoading: boolean;
  genError: boolean;
  genErrorMessage: string;
  onRetry: () => void;
  slideImageUrls: Set<string>;
  firstMediaUrl: (outputs: unknown) => string | null;
  extractOutputPreview: (outputs: unknown) => string | null;
  extractDocument: (outputs: unknown) => { title: string; content: string } | null;
  extractPresentation: (outputs: unknown) => PresentationData | null;
  extractImagePresentation: (outputs: unknown) => ImagePresentationData | null;
  guessMediaKind: (url: string, modelCategory: string) => "image" | "video" | "audio";
  onOpenPanel: (panel: NonNullable<ActivePanel>) => void;
  onPresentationOpen: (pres: PresentationData) => void;
  onImagePresentationOpen: (pres: ImagePresentationData) => void;
};

const CARD = {
  peek: "h-[4.5rem] w-[4.5rem] rounded-xl",
  expanded: "h-[7.5rem] w-[7.5rem] rounded-2xl",
} as const;

const focusRing =
  "ring-offset-background transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ZeepoGenerationsGallery({
  variant = "expanded",
  generations,
  genLoading,
  genError,
  genErrorMessage,
  onRetry,
  slideImageUrls,
  firstMediaUrl,
  extractOutputPreview,
  extractDocument,
  extractPresentation,
  extractImagePresentation,
  guessMediaKind,
  onOpenPanel,
  onPresentationOpen,
  onImagePresentationOpen,
}: ZeepoGenerationsGalleryProps) {
  if (generations.length === 0 && !genLoading && !genError) return null;

  const cardSize = CARD[variant];

  return (
    <div className={cn(variant === "peek" ? "px-1 pb-0.5" : "px-0.5 pb-1")}>
      {genError ? (
        <Alert variant="destructive" className="mb-2 py-2">
          <AlertCircle className="size-4" />
          <AlertTitle className="text-sm">Could not refresh outputs</AlertTitle>
          <AlertDescription className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
            <span className="min-w-0 max-w-full break-words">{genErrorMessage}</span>
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={onRetry}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="overflow-x-auto overflow-y-hidden">
        <div
          className={cn(
            "flex w-max max-w-none gap-2.5",
            variant === "peek" ? "min-h-[4.75rem] pb-0.5" : "min-h-[8rem] pb-1",
          )}
        >
          {genLoading && generations.length === 0 && !genError
            ? [0, 1, 2].map((i) => (
                <Skeleton
                  key={`gen-skel-${i}`}
                  className={cn(cardSize, "shrink-0")}
                  aria-busy="true"
                  aria-label="Loading outputs"
                />
              ))
            : null}
          {generations.map((g) => {
            const pending = g.status === "QUEUED" || g.status === "PROCESSING";
            const failed = g.status === "FAILED";
            const completed = g.status === "COMPLETED";

            if (pending) {
              return (
                <div
                  key={g.id}
                  className={cn(
                    "relative shrink-0 overflow-hidden border border-border bg-muted/50",
                    cardSize,
                  )}
                  aria-busy="true"
                  aria-label="Output in progress"
                >
                  <Skeleton className="absolute inset-0 rounded-[inherit]" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                    <Spinner variant="ellipsis" className="size-5 text-muted-foreground" />
                    {variant === "expanded" ? (
                      <span className="text-[9px] font-medium text-muted-foreground">Creating…</span>
                    ) : null}
                  </div>
                </div>
              );
            }

            if (failed) {
              return (
                <div
                  key={g.id}
                  className={cn(
                    "flex min-w-0 shrink-0 flex-col overflow-hidden border border-destructive/40 bg-destructive/5 p-2",
                    cardSize,
                  )}
                  title={g.errorMessage ?? "Failed"}
                >
                  <AlertCircle className="mb-1 size-4 shrink-0 self-center text-destructive" aria-hidden />
                  <p className="line-clamp-4 flex-1 text-center text-[10px] leading-snug text-destructive">
                    {variant === "peek" ? "Failed" : g.errorMessage || "Failed"}
                  </p>
                </div>
              );
            }

            if (completed) {
              if (g.modelCategory === "document") {
                const doc = extractDocument(g.outputs);
                return (
                  <button
                    key={g.id}
                    type="button"
                    className={cn(
                      "relative flex shrink-0 flex-col overflow-hidden border border-border bg-primary/5 p-2 text-left",
                      cardSize,
                      focusRing,
                    )}
                    onClick={() =>
                      doc && onOpenPanel({ type: "document", title: doc.title, content: doc.content })
                    }
                  >
                    <FileText className="mb-1 size-4 shrink-0 text-primary" aria-hidden />
                    <p className="line-clamp-4 flex-1 overflow-hidden text-[10px] font-medium leading-snug text-foreground">
                      {doc?.title ?? "Document"}
                    </p>
                  </button>
                );
              }

              if (g.modelCategory === "presentation") {
                const pres = extractPresentation(g.outputs);
                return (
                  <button
                    key={g.id}
                    type="button"
                    className={cn(
                      "relative flex shrink-0 flex-col overflow-hidden border border-border bg-accent/50 p-2 text-left",
                      cardSize,
                      focusRing,
                    )}
                    onClick={() => pres && onPresentationOpen(pres)}
                  >
                    <Presentation className="mb-1 size-4 shrink-0 text-primary" aria-hidden />
                    <p className="line-clamp-3 flex-1 overflow-hidden text-[10px] font-medium leading-snug text-foreground">
                      {pres?.title ?? "Presentation"}
                    </p>
                    {pres && variant === "expanded" ? (
                      <p className="mt-auto text-[9px] text-muted-foreground">
                        {pres.slides.length} slides
                      </p>
                    ) : null}
                  </button>
                );
              }

              if (g.modelCategory === "image-presentation") {
                const pres = extractImagePresentation(g.outputs);
                const ready = pres?.slides.filter((s) => s.imageUrl).length ?? 0;
                const totalSlides = pres?.slides.length ?? 0;
                const coverUrl = pres?.slides.find((s) => s.imageUrl)?.imageUrl;
                return (
                  <button
                    key={g.id}
                    type="button"
                    className={cn(
                      "relative shrink-0 overflow-hidden border border-border text-left",
                      cardSize,
                      !coverUrl && "bg-primary/10",
                      focusRing,
                    )}
                    onClick={() => pres && onImagePresentationOpen(pres)}
                  >
                    {coverUrl ? (
                      <img src={coverUrl} alt="" className="absolute inset-0 size-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="size-6 text-primary/60" aria-hidden />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                    <div className="relative flex h-full flex-col justify-end p-2">
                      <ImageIcon className="mb-0.5 size-3.5 shrink-0 text-foreground" aria-hidden />
                      <p className="line-clamp-2 text-[10px] font-medium leading-snug text-foreground">
                        {pres?.title ?? "Image deck"}
                      </p>
                      {variant === "expanded" ? (
                        <p className="text-[9px] text-muted-foreground">
                          {ready}/{totalSlides} ready
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              }

              const mediaUrl = firstMediaUrl(g.outputs);
              const textPreview = extractOutputPreview(g.outputs);

              if (mediaUrl) {
                const kind = guessMediaKind(mediaUrl, g.modelCategory);
                if (kind === "image" && slideImageUrls.has(mediaUrl)) return null;
                return (
                  <button
                    key={g.id}
                    type="button"
                    className={cn(
                      "relative shrink-0 overflow-hidden border border-border bg-muted",
                      cardSize,
                      focusRing,
                    )}
                    onClick={() =>
                      onOpenPanel({ type: "media", url: mediaUrl, kind, generationId: g.id })
                    }
                  >
                    {kind === "image" ? (
                      <img src={mediaUrl} alt="" className="size-full object-cover" loading="lazy" />
                    ) : kind === "video" ? (
                      <video
                        src={mediaUrl}
                        className="size-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <div className="flex size-full flex-col items-center justify-center gap-1 bg-muted">
                        <Headphones className="size-8 text-muted-foreground" aria-hidden />
                      </div>
                    )}
                  </button>
                );
              }

              return (
                <div
                  key={g.id}
                  className={cn(
                    "flex shrink-0 flex-col border border-border bg-muted/60 p-2",
                    cardSize,
                  )}
                  title={textPreview ?? ""}
                >
                  <ImageIcon className="mb-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <p className="line-clamp-5 flex-1 overflow-hidden text-[10px] leading-snug text-muted-foreground whitespace-pre-wrap">
                    {textPreview || "—"}
                  </p>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
}
