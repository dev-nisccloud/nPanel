"use client";

import * as React from "react";
import { Download, X, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface BackgroundRemoverResultsProps {
  originalImage: File;
  processedImage: { dataUrl: string; mimeType: string } | null;
  isProcessing: boolean;
  onClear: () => void;
}

export function BackgroundRemoverResults({
  originalImage,
  processedImage,
  isProcessing,
  onClear,
}: BackgroundRemoverResultsProps) {
  const originalImageUrl = URL.createObjectURL(originalImage);

  const handleDownload = React.useCallback(() => {
    if (!processedImage) return;

    const link = document.createElement("a");
    link.href = processedImage.dataUrl;
    const format = processedImage.mimeType.split("/")[1];
    const timestamp = Date.now();
    link.download = `background-removed-${timestamp}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [processedImage]);

  React.useEffect(() => {
    // Cleanup object URL on unmount
    return () => {
      URL.revokeObjectURL(originalImageUrl);
    };
  }, [originalImageUrl]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Results</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            disabled={isProcessing}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original Image */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Original</h3>
            </div>
            <div className="relative aspect-square rounded-lg border overflow-hidden bg-muted">
              <img
                src={originalImageUrl}
                alt="Original"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Processed Image */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Background Removed</h3>
              </div>
              {processedImage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              )}
            </div>
            <div className="relative aspect-square rounded-lg border overflow-hidden bg-muted">
              {isProcessing ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : processedImage ? (
                <img
                  src={processedImage.dataUrl}
                  alt="Background Removed"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <p className="text-sm">Click &quot;Remove Background&quot; to process</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

