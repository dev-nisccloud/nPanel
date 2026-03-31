"use client";

import * as React from "react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

interface ImageRendererProps {
  fileUrl: string;
  fileName?: string;
  mimeType?: string;
  alt?: string;
}

/**
 * Reusable Image renderer component
 * Supports common image formats: JPEG, PNG, GIF, WebP, SVG, TIFF, BMP
 */
export function ImageRenderer({ 
  fileUrl, 
  fileName, 
  mimeType,
  alt 
}: ImageRendererProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [imageDimensions, setImageDimensions] = React.useState<{
    width: number;
    height: number;
  } | null>(null);

  const imgRef = React.useRef<HTMLImageElement>(null);

  const handleLoad = React.useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    const img = event.currentTarget;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
  }, []);

  const handleError = React.useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  React.useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setImageDimensions(null);
  }, [fileUrl]);

  if (hasError) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-muted">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Unable to load image
          </p>
          <p className="text-xs text-muted-foreground">
            The image may be corrupted or unavailable
          </p>
        </div>
      </div>
    );
  }

  const displayAlt = alt || fileName || "Image preview";

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-muted overflow-auto">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="text-center space-y-2">
            <Spinner size={32} className="mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading {fileName || "image"}...
            </p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-center w-full h-full p-4">
        <img
          ref={imgRef}
          src={fileUrl}
          alt={displayAlt}
          className="max-w-full max-h-full object-contain"
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      </div>
      {imageDimensions && !isLoading && (
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
          {imageDimensions.width} × {imageDimensions.height}
        </div>
      )}
    </div>
  );
}

// Image MIME types
export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/tiff",
  "image/bmp",
] as const;

