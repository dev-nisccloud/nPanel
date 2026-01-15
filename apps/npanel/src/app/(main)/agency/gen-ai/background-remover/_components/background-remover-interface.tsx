"use client";

import * as React from "react";
import { BackgroundRemoverResultsView } from "./background-remover-results-view";
import { FloatingInputBar } from "./floating-input-bar";
import { useGetBackgroundRemovals } from "../_api/use-get-background-removals";
import { trpc } from "@/utils/trpc";

type BackgroundRemovalView = {
  id: string;
  createdAt: Date;
  originalImageUrl: string;
  originalImageMimeType: string;
  processedImageUrl: string;
  processedImageMimeType: string;
};

export function BackgroundRemoverInterface() {
  const [generatedImages, setGeneratedImages] = React.useState<Array<{
    originalUrl: string;
    processedUrl: string;
    originalMimeType: string;
    processedMimeType: string;
    timestamp: string;
  }>>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);

  // Fetch generation history from database
  const { data: generationsData, isLoading: isLoadingHistory, refetch: refetchGenerations } = useGetBackgroundRemovals({
    page: 1,
    limit: 50, // Load more history
  });

  const utils = trpc.useUtils();

  const handleGenerationStart = () => {
    setIsGenerating(true);
    // Clear previous current session images when starting a new generation
    setGeneratedImages([]);
  };

  const handleImageGenerated = (image: {
    originalUrl: string;
    processedUrl: string;
    originalMimeType: string;
    processedMimeType: string;
    timestamp: string;
  }) => {
    // Add new image to the list
    setGeneratedImages([image]);
  };

  const handleGenerationEnd = () => {
    setIsGenerating(false);
    // Refetch generations to show the newly created ones in history
    // The generation is already saved to DB, so it will appear in history
    // Current session images remain visible
    refetchGenerations();
    utils.backgroundRemover.getGenerations.invalidate();
  };

  // Transform database generations to the format expected by the view
  const generations = React.useMemo((): BackgroundRemovalView[] => {
    // Extract data early to avoid deep type inference
    const rawData = generationsData?.data;
    if (!rawData) return [];
    
    // Use 'as any' to completely bypass TypeScript inference
    const data = rawData as any;
    
    const result: BackgroundRemovalView[] = [];
    for (let i = 0; i < data.length; i++) {
      const gen = data[i];
      result.push({
        id: String(gen?.id || ''),
        createdAt: gen?.createdAt instanceof Date 
          ? gen.createdAt 
          : new Date(gen?.createdAt || Date.now()),
        originalImageUrl: String(gen?.originalImageUrl || ''),
        originalImageMimeType: String(gen?.originalImageMimeType || 'image/png'),
        processedImageUrl: String(gen?.processedImageUrl || ''),
        processedImageMimeType: String(gen?.processedImageMimeType || 'image/png'),
      });
    }
    return result;
  }, [generationsData]);

  return (
    <div className="flex flex-col h-full">
      {/* Generated Images - Chat-like view - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
        <div className="max-w-4xl mx-auto w-full">
          <BackgroundRemoverResultsView 
            images={generatedImages}
            generations={generations}
            isGenerating={isGenerating}
            isLoadingHistory={isLoadingHistory}
          />
        </div>
      </div>

      {/* Floating Input Bar - Fixed at bottom of this container */}
      <FloatingInputBar 
        onGenerate={handleImageGenerated}
        onGenerationStart={handleGenerationStart}
        onGenerationEnd={handleGenerationEnd}
      />
    </div>
  );
}
