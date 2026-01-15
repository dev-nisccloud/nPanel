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

interface BackgroundRemovalImage {
  originalUrl: string;
  processedUrl: string;
  originalMimeType: string;
  processedMimeType: string;
  timestamp: string;
}

interface BackgroundRemovalFromDB {
  id: string;
  createdAt: Date;
  originalImageUrl: string;
  originalImageMimeType: string;
  processedImageUrl: string;
  processedImageMimeType: string;
}

interface BackgroundRemoverResultsViewProps {
  images: BackgroundRemovalImage[];
  generations?: BackgroundRemovalFromDB[];
  isGenerating?: boolean;
  isLoadingHistory?: boolean;
}

export function BackgroundRemoverResultsView({ 
  images, 
  generations = [],
  isGenerating = false,
  isLoadingHistory = false,
}: BackgroundRemoverResultsViewProps) {
  const [selectedGenerationId, setSelectedGenerationId] = React.useState<string | "current-session" | null>(null);
  const [selectedImageType, setSelectedImageType] = React.useState<"original" | "processed" | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  // Get images for the selected generation
  const getSelectedGenerationImages = React.useMemo(() => {
    if (selectedGenerationId === "current-session") {
      // Current session images
      if (images.length > 0) {
        return {
          original: images[0].originalUrl,
          processed: images[0].processedUrl,
        };
      }
    } else if (selectedGenerationId) {
      // DB generation images
      const generation = generations.find(gen => gen.id === selectedGenerationId);
      if (generation) {
        return {
          original: generation.originalImageUrl,
          processed: generation.processedImageUrl,
        };
      }
    }
    return null;
  }, [selectedGenerationId, images, generations]);

  const handleDownload = (imageUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    const format = imageUrl.split('.').pop() || 'png';
    link.download = `${fileName}-${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageClick = (generationId: string | "current-session" | null, imageType: "original" | "processed") => {
    setSelectedGenerationId(generationId);
    setSelectedImageType(imageType);
    setIsDialogOpen(true);
  };

  const handlePrevious = () => {
    if (!getSelectedGenerationImages) return;
    
    if (selectedImageType === "processed") {
      setSelectedImageType("original");
    }
  };

  const handleNext = () => {
    if (!getSelectedGenerationImages) return;
    
    if (selectedImageType === "original") {
      setSelectedImageType("processed");
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedGenerationId(null);
    setSelectedImageType(null);
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

  // Get the currently selected image
  const selectedImage = selectedImageType && getSelectedGenerationImages
    ? getSelectedGenerationImages[selectedImageType]
    : null;

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
            {/* Images skeleton */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] max-w-[300px]">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="aspect-square rounded-lg w-full" />
              </div>
              <div className="flex-1 min-w-[200px] max-w-[300px]">
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="aspect-square rounded-lg w-full" />
              </div>
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
          <p className="text-muted-foreground">No background removals yet</p>
          <p className="text-sm text-muted-foreground">
            Start by uploading an image below
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Skeleton Loader for Generating - Show at top while generating */}
        {isGenerating && (
          <div className="space-y-4">
            {/* Date skeleton */}
            <Skeleton className="h-8 w-64" />
            {/* Images skeleton */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] max-w-[300px]">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="aspect-square rounded-lg w-full" />
              </div>
              <div className="flex-1 min-w-[200px] max-w-[300px]">
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="aspect-square rounded-lg w-full" />
              </div>
            </div>
          </div>
        )}

        {/* Current Session Images - Show at top */}
        {images.length > 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Current Session</h3>
            </div>
            <div className="flex flex-wrap gap-4">
              {/* Original Image */}
              <div className="flex-1 min-w-[200px] max-w-[300px] space-y-2">
                <h4 className="text-sm font-medium">Original Image</h4>
                <div
                  className="relative group aspect-square rounded-lg border overflow-hidden bg-card cursor-pointer w-full"
                  onClick={() => handleImageClick("current-session", "original")}
                >
                  <img
                    src={images[0].originalUrl}
                    alt="Original"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(images[0].originalUrl, "original");
                      }}
                      className="h-8 w-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Background Removed Image */}
              <div className="flex-1 min-w-[200px] max-w-[300px] space-y-2">
                <h4 className="text-sm font-medium">Background Removed</h4>
                <div
                  className="relative group aspect-square rounded-lg border overflow-hidden bg-card cursor-pointer w-full"
                  onClick={() => handleImageClick("current-session", "processed")}
                >
                  <img
                    src={images[0].processedUrl}
                    alt="Background Removed"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(images[0].processedUrl, "background-removed");
                      }}
                      className="h-8 w-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generation History from Database */}
        {generations.map((generation) => (
          <div key={generation.id} className="space-y-4">
            {/* Date and Time */}
            <div>
              <h2 className="text-2xl font-bold">
                {format(new Date(generation.createdAt), "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </h2>
            </div>

            {/* Images */}
            <div className="flex flex-wrap gap-4">
              {/* Original Image */}
              <div className="flex-1 min-w-[200px] max-w-[300px] space-y-2">
                <h4 className="text-sm font-medium">Original Image</h4>
                <div
                  className="relative group aspect-square rounded-lg border overflow-hidden bg-card cursor-pointer w-full"
                  onClick={() => handleImageClick(generation.id, "original")}
                >
                  <img
                    src={generation.originalImageUrl}
                    alt="Original"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(generation.originalImageUrl, "original");
                      }}
                      className="h-8 w-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Background Removed Image */}
              <div className="flex-1 min-w-[200px] max-w-[300px] space-y-2">
                <h4 className="text-sm font-medium">Background Removed</h4>
                <div
                  className="relative group aspect-square rounded-lg border overflow-hidden bg-card cursor-pointer w-full"
                  onClick={() => handleImageClick(generation.id, "processed")}
                >
                  <img
                    src={generation.processedImageUrl}
                    alt="Background Removed"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(generation.processedImageUrl, "background-removed");
                      }}
                      className="h-8 w-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
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

              {/* Previous Button - Only show if viewing processed image */}
              {selectedImageType === "processed" && getSelectedGenerationImages && (
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 h-12 w-12"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}

              {/* Next Button - Only show if viewing original image */}
              {selectedImageType === "original" && getSelectedGenerationImages && (
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
                onClick={() => selectedImage && handleDownload(selectedImage, selectedImageType === "original" ? "original" : "background-removed")}
                className="absolute bottom-4 right-4 z-50 h-12 w-12"
              >
                <Download className="h-6 w-6" />
              </Button>

              {/* Image Preview */}
              <div className="relative w-full h-full flex items-center justify-center bg-background/95 backdrop-blur rounded-lg overflow-hidden">
                <img
                  src={selectedImage}
                  alt={selectedImageType === "original" ? "Original" : "Background Removed"}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* Image Counter */}
              <div className="absolute bottom-4 left-4 z-50 bg-background/80 backdrop-blur px-3 py-1.5 rounded-md text-sm">
                {selectedImageType === "original" ? "1" : "2"} / 2
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
