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
import type { BackgroundRemovalView } from "./background-remover-interface";

interface BackgroundRemoverResultsViewProps {
  generations: BackgroundRemovalView[];
  isLoadingHistory: boolean;
}

export function BackgroundRemoverResultsView({
  generations,
  isLoadingHistory,
}: BackgroundRemoverResultsViewProps) {
  const [selectedGenerationId, setSelectedGenerationId] = React.useState<string | null>(null);
  const [selectedImageType, setSelectedImageType] = React.useState<"original" | "processed" | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const selectedGeneration = selectedGenerationId
    ? generations.find((g) => g.id === selectedGenerationId)
    : null;

  const handleDownload = async (imageUrl: string, fileNameBase: string) => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      // Try to derive a safe file extension from blob type, headers, or URL.
      const blobType = blob.type || "";
      const headerType = response.headers.get("content-type") || "";
      const mimeType = (blobType || headerType).toLowerCase();

      const mimeToExt: Record<string, string> = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/svg+xml": "svg",
        "image/avif": "avif",
        "image/bmp": "bmp",
        "image/tiff": "tiff",
        "image/x-icon": "ico",
      };

      let ext = "";

      // 1) Try to parse from URL path (before query string)
      const cleanUrl = imageUrl.split("?")[0];
      const urlMatch = cleanUrl.match(/\.([a-zA-Z0-9]+)$/);
      if (urlMatch && urlMatch[1]) {
        ext = urlMatch[1].toLowerCase();
      }

      // 2) If no extension from URL, try known MIME types
      if (!ext && mimeType && mimeToExt[mimeType]) {
        ext = mimeToExt[mimeType];
      }

      // 3) As a last resort, fall back to the subtype of the MIME string
      if (!ext && mimeType.includes("/")) {
        ext = mimeType.split("/")[1] || "";
      }

      // 4) Absolute fallback so we never end up without an extension
      if (!ext) {
        ext = "png";
      }

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${fileNameBase}-${Date.now()}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  const handleImageClick = (generationId: string, imageType: "original" | "processed") => {
    const gen = generations.find((g) => g.id === generationId);
    if (imageType === "processed" && (!gen?.processedImageUrl || gen.status !== "COMPLETED")) return;
    setSelectedGenerationId(generationId);
    setSelectedImageType(imageType);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedGenerationId(null);
    setSelectedImageType(null);
  };

  const selectedImage =
    selectedImageType && selectedGeneration
      ? selectedImageType === "original"
        ? selectedGeneration.originalImageUrl
        : selectedGeneration.processedImageUrl
      : null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") handleCloseDialog();
    if (!selectedGeneration) return;
    if (e.key === "ArrowLeft" && selectedImageType === "processed") {
      setSelectedImageType("original");
    }
    if (e.key === "ArrowRight" && selectedImageType === "original" && selectedGeneration.processedImageUrl) {
      setSelectedImageType("processed");
    }
  };

  const hasContent = generations.length > 0;

  if (isLoadingHistory) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((index) => (
          <div key={index} className="rounded-lg border border-border bg-card p-3">
            <Skeleton className="mb-2 h-4 w-36 rounded" />
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Skeleton className="aspect-square w-full rounded-md" />
              <Skeleton className="aspect-square w-full rounded-md" />
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
          <p className="text-sm font-medium text-foreground">No removals yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Drop an image below and click Remove to start.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {generations.map((gen) => (
          <div key={gen.id} className="rounded-lg border border-border bg-card p-3">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {format(new Date(gen.createdAt), "MMM d, yyyy Ã‚Â· h:mm a")}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Original</p>
                <div
                  role="button"
                  tabIndex={0}
                  className="relative group aspect-square w-full cursor-pointer overflow-hidden rounded-md border border-border bg-muted/30"
                  onClick={() => handleImageClick(gen.id, "original")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleImageClick(gen.id, "original");
                    }
                  }}
                >
                  <img
                    src={gen.originalImageUrl}
                    alt="Original"
                    className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                  />
                  <div className="absolute top-1 right-1 rounded bg-background/90 p-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(gen.originalImageUrl, "original");
                      }}
                      className="h-6 w-6"
                      aria-label="Download original"
                    >
                      <Download className="h-3 w-3" aria-hidden />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">No background</p>
                {gen.status === "FAILED" ? (
                  <div
                    className="aspect-square w-full rounded-md border border-destructive/50 bg-destructive/5 flex flex-col items-center justify-center gap-1 p-2"
                    title="Failed"
                  >
                    <AlertCircle className="h-6 w-6 text-destructive shrink-0" />
                    <span className="text-[10px] text-destructive line-clamp-2 text-center">
                      Failed
                    </span>
                  </div>
                ) : gen.status === "COMPLETED" && gen.processedImageUrl ? (
                  <div
                    role="button"
                    tabIndex={0}
                    className="relative group aspect-square w-full cursor-pointer overflow-hidden rounded-md border border-border bg-checker"
                    onClick={() => handleImageClick(gen.id, "processed")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleImageClick(gen.id, "processed");
                      }
                    }}
                  >
                    <img
                      src={gen.processedImageUrl}
                      alt="No background"
                      className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                    <div className="absolute top-1 right-1 rounded bg-background/90 p-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(gen.processedImageUrl!, "background-removed");
                        }}
                        className="h-6 w-6"
                        aria-label="Download"
                      >
                        <Download className="h-3 w-3" aria-hidden />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square w-full rounded-md border border-border bg-muted/30 flex items-center justify-center">
                    <Skeleton className="h-full w-full rounded-md" />
                  </div>
                )}
              </div>
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
              {selectedImageType === "processed" && selectedGeneration.processedImageUrl && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={() => setSelectedImageType("original")}
                  className="absolute left-2 top-1/2 z-50 h-8 w-8 -translate-y-1/2 rounded-md"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </Button>
              )}
              {selectedImageType === "original" && selectedGeneration.processedImageUrl && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={() => setSelectedImageType("processed")}
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
                onClick={() => selectedImage && handleDownload(selectedImage, selectedImageType === "original" ? "original" : "background-removed")}
                className="absolute bottom-2 right-2 z-50 h-8 w-8 rounded-md"
                aria-label="Download"
              >
                <Download className="h-5 w-5" aria-hidden />
              </Button>
              <div className="flex h-full w-full items-center justify-center rounded-md bg-muted/30 p-3">
                <img
                  src={selectedImage}
                  alt={selectedImageType === "original" ? "Original" : "No background"}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="absolute bottom-2 left-2 z-50 rounded bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                {selectedImageType === "original" ? "1" : "2"} / 2
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
