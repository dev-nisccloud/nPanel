"use client";

import * as React from "react";
import { Download, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface GeneratedImage {
  dataUrl: string;
  mimeType: string;
  seed: number;
  prompt: string;
  timestamp: string;
}

interface GeneratedImagesViewProps {
  images: GeneratedImage[];
  isGenerating?: boolean;
  generatingCount?: { current: number; total: number };
  onClearAll?: () => void;
}

export function GeneratedImagesView({ 
  images, 
  isGenerating = false,
  generatingCount = { current: 0, total: 0 },
  onClearAll 
}: GeneratedImagesViewProps) {
  const [selectedImageIndex, setSelectedImageIndex] = React.useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleDownload = (image: GeneratedImage, index: number) => {
    const link = document.createElement("a");
    link.href = image.dataUrl;
    const format = image.mimeType.split("/")[1];
    link.download = `generated-image-${index + 1}-${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsDialogOpen(true);
  };

  const handlePrevious = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedImageIndex !== null && selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedImageIndex(null);
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

  const selectedImage = selectedImageIndex !== null ? images[selectedImageIndex] : null;

  const hasImages = images.length > 0 || isGenerating;

  if (!hasImages) {
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
      {/* Images Grid - Responsive horizontal layout with slightly larger images */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {/* Generated Images */}
        {images.map((image, index) => (
          <div
            key={`${image.timestamp}-${index}`}
            className="relative group aspect-square rounded-lg border overflow-hidden bg-card animate-in fade-in cursor-pointer"
            onClick={() => handleImageClick(index)}
          >
            <img
              src={image.dataUrl}
              alt={`Generated image ${index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />

            {/* Download Button Overlay - Only show on hover */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(image, index);
                }}
                className="h-8 w-8"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {/* Skeleton Loaders for Generating Images */}
        {isGenerating &&
          Array.from({ length: generatingCount.total - generatingCount.current }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="aspect-square rounded-lg border overflow-hidden bg-card"
            >
              <Skeleton className="w-full h-full rounded-lg" />
            </div>
          ))}
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent 
          className="max-w-6xl w-full p-0 bg-transparent border-0 shadow-none"
          onKeyDown={handleKeyDown}
        >
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
              {selectedImageIndex !== null && selectedImageIndex < images.length - 1 && (
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
                onClick={() => selectedImageIndex !== null && handleDownload(selectedImage, selectedImageIndex)}
                className="absolute bottom-4 right-4 z-50 h-12 w-12"
              >
                <Download className="h-6 w-6" />
              </Button>

              {/* Image Preview */}
              <div className="relative w-full h-full flex items-center justify-center bg-background/95 backdrop-blur rounded-lg overflow-hidden">
                <img
                  src={selectedImage.dataUrl}
                  alt={`Generated image ${selectedImageIndex !== null ? selectedImageIndex + 1 : ""}`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* Image Counter */}
              <div className="absolute bottom-4 left-4 z-50 bg-background/80 backdrop-blur px-3 py-1.5 rounded-md text-sm">
                {selectedImageIndex !== null ? selectedImageIndex + 1 : 0} / {images.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
