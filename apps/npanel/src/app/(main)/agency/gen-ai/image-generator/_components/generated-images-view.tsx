"use client";

import * as React from "react";
import { Download, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

interface GeneratedImage {
  dataUrl: string;
  mimeType: string;
  prompt: string;
  timestamp: string;
  variationId?: string;
  variationIndex?: number;
}

interface GenerationFromDB {
  id: string;
  prompt: string;
  createdAt: Date;
  variations: Array<{
    id: string;
    variationIndex: number;
    imageUrl: string;
    imageMimeType: string;
  }>;
}

interface GeneratedImagesViewProps {
  images: GeneratedImage[];
  generations?: GenerationFromDB[];
  isGenerating?: boolean;
  generatingCount?: { current: number; total: number };
  isLoadingHistory?: boolean;
  onClearAll?: () => void;
}

export function GeneratedImagesView({ 
  images, 
  generations = [],
  isGenerating = false,
  generatingCount = { current: 0, total: 0 },
  isLoadingHistory = false,
  onClearAll 
}: GeneratedImagesViewProps) {
  const [selectedImageIndex, setSelectedImageIndex] = React.useState<number | null>(null);
  const [selectedGenerationId, setSelectedGenerationId] = React.useState<string | null>(null);
  const [selectedVariationIndex, setSelectedVariationIndex] = React.useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  // Combine all images for the dialog navigation (current session + DB generations)
  const allImages: Array<{ url: string; prompt: string; generationId?: string; variationIndex?: number }> = [
    ...images.map(img => ({ url: img.dataUrl, prompt: img.prompt })),
    ...generations.flatMap(gen => 
      gen.variations.map(variation => ({
        url: variation.imageUrl,
        prompt: gen.prompt,
        generationId: gen.id,
        variationIndex: variation.variationIndex,
      }))
    ),
  ];

  const handleDownload = (imageUrl: string, prompt: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    const format = imageUrl.split('.').pop() || 'png';
    link.download = `generated-image-${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageClick = (generationId: string | null, variationIndex: number | null, imageIndex: number) => {
    setSelectedGenerationId(generationId);
    setSelectedVariationIndex(variationIndex);
    setSelectedImageIndex(imageIndex);
    setIsDialogOpen(true);
  };

  const handlePrevious = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedImageIndex !== null && selectedImageIndex < allImages.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedImageIndex(null);
    setSelectedGenerationId(null);
    setSelectedVariationIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      handlePrevious();
    } else if (e.key === "ArrowRight") {
      handleNext();
    } else if (e.key === "Escape") {
      handleCloseDialog();
    }
  };

  const selectedImage = selectedImageIndex !== null ? allImages[selectedImageIndex] : null;

  const hasContent = images.length > 0 || generations.length > 0 || isGenerating;

  // Show skeleton loaders while loading history
  if (isLoadingHistory) {
    return (
      <div className="space-y-8">
        {/* Skeleton for generation history */}
        {[1, 2, 3].map((index) => (
          <div key={index} className="space-y-4">
            {/* Date skeleton */}
            <Skeleton className="h-8 w-64" />
            {/* Prompt skeleton */}
            <Skeleton className="h-6 w-full max-w-2xl" />
            {/* Images grid skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
              {[1, 2].map((imgIndex) => (
                <div
                  key={imgIndex}
                  className="aspect-square rounded-lg border overflow-hidden bg-card"
                >
                  <Skeleton className="w-full h-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Show empty state only after loading is complete and there's no content
  if (!hasContent && !isLoadingHistory) {
    return (
      <div className="flex items-center justify-center py-24 text-center">
        <div className="space-y-2">
          <p className="text-muted-foreground">No images generated yet</p>
          <p className="text-sm text-muted-foreground">
            Start by describing your image below
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Skeleton Loaders for Generating Images - Show at top while generating */}
        {isGenerating && (
          <div className="space-y-4">
            {/* Date skeleton */}
            <Skeleton className="h-8 w-64" />
            {/* Prompt skeleton */}
            <Skeleton className="h-6 w-full max-w-2xl" />
            {/* Images grid skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
              {Array.from({ length: generatingCount.total - generatingCount.current }).map((_, index) => (
                <div
                  key={`skeleton-generating-${index}`}
                  className="aspect-square rounded-lg border overflow-hidden bg-card"
                >
                  <Skeleton className="w-full h-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Session Images - Show at top while generating */}
        {images.length > 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Current Session</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
              {images.map((image, index) => (
                <div
                  key={`${image.timestamp}-${index}`}
                  className="relative group aspect-square rounded-lg border overflow-hidden bg-card animate-in fade-in cursor-pointer"
                  onClick={() => handleImageClick(null, null, index)}
                >
                  <img
                    src={image.dataUrl}
                    alt={`Generated image ${index + 1}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(image.dataUrl, image.prompt);
                      }}
                      className="h-8 w-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generation History from Database - All with same structure (date, prompt, variations) */}
        {generations.map((generation) => (
          <div key={generation.id} className="space-y-4">
            {/* Date and Time */}
            <div>
              <h2 className="text-2xl font-bold">
                {format(new Date(generation.createdAt), "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </h2>
            </div>

            {/* Prompt */}
            <div>
              <p className="text-muted-foreground line-clamp-2">
                {generation.prompt}
              </p>
            </div>

            {/* Variations Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
              {generation.variations.map((variation) => {
                const imageIndex = images.length + 
                  generations
                    .slice(0, generations.indexOf(generation))
                    .reduce((acc, gen) => acc + gen.variations.length, 0) +
                  generation.variations.indexOf(variation);

                return (
                  <div
                    key={variation.id}
                    className="relative group aspect-square rounded-lg border overflow-hidden bg-card cursor-pointer"
                    onClick={() => handleImageClick(generation.id, variation.variationIndex, imageIndex)}
                  >
                    <img
                      src={variation.imageUrl}
                      alt={`Variation ${variation.variationIndex}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(variation.imageUrl, generation.prompt);
                        }}
                        className="h-8 w-8"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent 
          className="max-w-6xl w-full p-0 bg-transparent border-0 shadow-none"
          onKeyDown={handleKeyDown}
        >
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          {selectedImage && (
            <div className="relative w-full h-[80vh] max-h-[800px] flex items-center justify-center">
              {/* Close Button */}
              <Button
                variant="secondary"
                size="icon"
                onClick={handleCloseDialog}
                className="absolute top-4 right-4 z-50 h-10 w-10"
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Previous Button */}
              {selectedImageIndex !== null && selectedImageIndex > 0 && (
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 h-12 w-12"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}

              {/* Next Button */}
              {selectedImageIndex !== null && selectedImageIndex < allImages.length - 1 && (
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 h-12 w-12"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}

              {/* Download Button */}
              <Button
                variant="secondary"
                size="icon"
                onClick={() => selectedImage && handleDownload(selectedImage.url, selectedImage.prompt)}
                className="absolute bottom-4 right-4 z-50 h-12 w-12"
              >
                <Download className="h-6 w-6" />
              </Button>

              {/* Image Preview */}
              <div className="relative w-full h-full flex items-center justify-center bg-background/95 backdrop-blur rounded-lg overflow-hidden">
                <img
                  src={selectedImage.url}
                  alt={`Generated image ${selectedImageIndex !== null ? selectedImageIndex + 1 : ""}`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* Image Counter */}
              <div className="absolute bottom-4 left-4 z-50 bg-background/80 backdrop-blur px-3 py-1.5 rounded-md text-sm">
                {selectedImageIndex !== null ? selectedImageIndex + 1 : 0} / {allImages.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
