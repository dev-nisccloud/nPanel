"use client";

import * as React from "react";
import { Download, X, ChevronLeft, ChevronRight, ImagePlus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { GenerationView, VariationView } from "../_types";

interface GeneratedImagesViewProps {
  generations: GenerationView[];
  isLoadingHistory: boolean;
}

function PromptPreview({ text }: { text: string }) {
  const [expanded, setExpanded] = React.useState(false);

  const isLong = text.length > 160;

  if (!isLong) {
    return (
      <p className="mb-2 text-xs text-muted-foreground">
        {text}
      </p>
    );
  }

  return (
    <div className="mb-2">
      <p
        className={cn(
          "text-xs text-muted-foreground",
          !expanded && "line-clamp-2",
        )}
      >
        {text}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="mt-1 text-[11px] font-medium text-primary hover:underline"
      >
        {expanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
}

function VariationSlot({
  variation,
  prompt,
  onPreview,
  onDownload,
}: {
  variation: VariationView | undefined;
  prompt: string;
  onPreview: () => void;
  onDownload: () => void;
}) {
  if (!variation) {
    return (
      <div className="aspect-square w-full rounded-md border border-border bg-muted/30 flex items-center justify-center">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }
  if (variation.status === "FAILED") {
    return (
      <div
        className="aspect-square w-full rounded-md border border-destructive/50 bg-destructive/5 flex flex-col items-center justify-center gap-1 p-2"
        title="Failed"
      >
        <AlertCircle className="h-6 w-6 text-destructive shrink-0" />
        <span className="text-[10px] text-destructive line-clamp-2 text-center">
          Failed
        </span>
      </div>
    );
  }
  if (variation.status === "PROCESSING" || !variation.imageUrl) {
    return (
      <div className="aspect-square w-full rounded-md border border-border bg-muted/30 flex items-center justify-center">
        <Skeleton className="h-full w-full rounded-md" />
      </div>
    );
  }
  return (
    <div
      role="button"
      tabIndex={0}
      className="relative group aspect-square rounded-md border border-border bg-muted/30 overflow-hidden cursor-pointer animate-in fade-in"
      onClick={onPreview}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPreview();
        }
      }}
    >
      <img
        src={variation.imageUrl}
        alt=""
        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
      />
      <div className="absolute top-1 right-1 rounded bg-background/90 p-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          className="h-6 w-6"
          aria-label="Download"
        >
          <Download className="h-3 w-3" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

export function GeneratedImagesView({
  generations,
  isLoadingHistory,
}: GeneratedImagesViewProps) {
  const [selectedGenerationId, setSelectedGenerationId] = React.useState<string | null>(null);
  const [selectedVariationIndex, setSelectedVariationIndex] = React.useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const selectedGeneration = selectedGenerationId
    ? generations.find((g) => g.id === selectedGenerationId)
    : null;

  const viewableVariations = React.useMemo(() => {
    if (!selectedGeneration) return [];
    return selectedGeneration.variations.filter(
      (v) => v.status === "COMPLETED" && v.imageUrl,
    );
  }, [selectedGeneration]);

  const handleImageClick = (generationId: string, variationIndex: number) => {
    const gen = generations.find((g) => g.id === generationId);
    const v = gen?.variations.find((x) => x.variationIndex === variationIndex);
    if (v?.status === "COMPLETED" && v.imageUrl) {
      setSelectedGenerationId(generationId);
      setSelectedVariationIndex(variationIndex);
      setIsDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedGenerationId(null);
    setSelectedVariationIndex(null);
  };

  const currentPreviewIndex =
    selectedVariationIndex != null
      ? viewableVariations.findIndex((v) => v.variationIndex === selectedVariationIndex)
      : -1;
  const selectedImage =
    currentPreviewIndex >= 0 && currentPreviewIndex < viewableVariations.length
      ? viewableVariations[currentPreviewIndex]
      : null;

  const handlePrevious = () => {
    if (currentPreviewIndex > 0) {
      setSelectedVariationIndex(viewableVariations[currentPreviewIndex - 1].variationIndex);
    }
  };

  const handleNext = () => {
    if (currentPreviewIndex >= 0 && currentPreviewIndex < viewableVariations.length - 1) {
      setSelectedVariationIndex(viewableVariations[currentPreviewIndex + 1].variationIndex);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrevious();
    else if (e.key === "ArrowRight") handleNext();
    else if (e.key === "Escape") handleCloseDialog();
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const contentType = response.headers.get("content-type") || "image/png";
      const extFromMime = contentType.split("/")[1] || "png";
      const extFromUrl = url.split(".").pop()?.split("?")[0];
      const ext = (extFromUrl || extFromMime || "png").toLowerCase();

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `generated-image-${Date.now()}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  const hasContent = generations.length > 0;

  if (isLoadingHistory) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((index) => (
          <div key={index} className="rounded-lg border border-border bg-card p-3">
            <Skeleton className="mb-2 h-4 w-48 rounded" />
            <Skeleton className="mb-3 h-3 w-full max-w-sm rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[1, 2].map((imgIndex) => (
                <Skeleton key={imgIndex} className="aspect-square w-full rounded-md" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!hasContent) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-5 py-6 text-center max-w-xs">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <ImagePlus className="h-5 w-5" aria-hidden />
          </div>
          <p className="text-sm font-medium text-foreground">No images yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Describe your image in the bar below and click Generate.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {generations.map((generation) => (
          <div key={generation.id} className="rounded-lg border border-border bg-card p-3">
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {format(new Date(generation.createdAt), "MMM d, yyyy · h:mm a")}
            </p>
            <PromptPreview text={generation.prompt} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Array.from({ length: generation.variationsCount }, (_, i) => i + 1).map((idx) => {
                const variation = generation.variations.find((v) => v.variationIndex === idx);
                return (
                  <VariationSlot
                    key={variation?.id ?? `slot-${idx}`}
                    variation={variation}
                    prompt={generation.prompt}
                    onPreview={() => handleImageClick(generation.id, idx)}
                    onDownload={() => {
                      if (variation?.imageUrl) handleDownload(variation.imageUrl);
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="max-w-4xl w-full gap-0 overflow-hidden rounded-lg border border-border bg-background p-0 shadow-xl"
          onKeyDown={handleKeyDown}
        >
          <DialogTitle className="sr-only">Preview</DialogTitle>
          {selectedImage && selectedGeneration && (
            <div className="relative flex h-[70vh] max-h-[560px] w-full items-center justify-center">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={handleCloseDialog}
                className="absolute top-2 right-2 z-50 h-8 w-8 rounded-md"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
              {currentPreviewIndex > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={handlePrevious}
                  className="absolute left-2 top-1/2 z-50 h-8 w-8 -translate-y-1/2 rounded-md"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </Button>
              )}
              {currentPreviewIndex < viewableVariations.length - 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 z-50 h-8 w-8 -translate-y-1/2 rounded-md"
                  aria-label="Next"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </Button>
              )}
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => selectedImage?.imageUrl && handleDownload(selectedImage.imageUrl)}
                className="absolute bottom-2 right-2 z-50 h-8 w-8 rounded-md"
                aria-label="Download"
              >
                <Download className="h-5 w-5" aria-hidden />
              </Button>
              <div className="flex h-full w-full items-center justify-center rounded-md bg-muted/30 p-3">
                <img
                  src={selectedImage.imageUrl ?? ""}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="absolute bottom-2 left-2 z-50 rounded bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                {currentPreviewIndex + 1} / {viewableVariations.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
