"use client";

import * as React from "react";
import { GeneratedImagesView } from "./generated-images-view";
import { FloatingInputBar } from "./floating-input-bar";
import { useGetGenerations } from "../_api/use-get-generations";
import { trpc } from "@/utils/trpc";

export function ImageGeneratorInterface() {
  const [generatedImages, setGeneratedImages] = React.useState<any[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generatingCount, setGeneratingCount] = React.useState({ current: 0, total: 0 });

  // Fetch generation history from database
  const { data: generationsData, isLoading: isLoadingHistory, refetch: refetchGenerations } = useGetGenerations({
    page: 1,
    limit: 50, // Load more history
  });

  const utils = trpc.useUtils();

  const handleGenerationStart = (total: number) => {
    setIsGenerating(true);
    setGeneratingCount({ current: 0, total });
  };

  const handleImagesGenerated = (images: any[]) => {
    // Add new images to the list (stacked vertically like chat)
    // Each image gets added individually as it's generated
    setGeneratedImages((prev) => [...prev, ...images]);
    setGeneratingCount((prev) => ({
      ...prev,
      current: prev.current + images.length,
    }));
  };

  const handleGenerationEnd = () => {
    setIsGenerating(false);
    setGeneratingCount({ current: 0, total: 0 });
    // Refetch generations to show the newly created ones in history
    // The generation is already saved to DB, so it will appear in history
    // Current session images remain visible
    refetchGenerations();
    utils.imageGenerator.getGenerations.invalidate();
  };

  const handleClearAll = () => {
    setGeneratedImages([]);
  };

  // Transform database generations to the format expected by the view
  const generations = React.useMemo(() => {
    if (!generationsData?.data) return [];
    
    return generationsData.data.map((gen) => ({
      id: gen.id,
      prompt: gen.prompt,
      createdAt: new Date(gen.createdAt),
      variations: gen.variations.map((variation) => ({
        id: variation.id,
        variationIndex: variation.variationIndex,
        imageUrl: variation.imageUrl,
        imageMimeType: variation.imageMimeType,
      })),
    }));
  }, [generationsData]);

  return (
    <div className="flex flex-col h-full">
      {/* Generated Images - Chat-like view - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
        <div className="max-w-4xl mx-auto w-full">
          <GeneratedImagesView 
            images={generatedImages}
            generations={generations}
            isGenerating={isGenerating}
            generatingCount={generatingCount}
            isLoadingHistory={isLoadingHistory}
          />
        </div>
      </div>

      {/* Floating Input Bar - Fixed at bottom of this container */}
      <FloatingInputBar 
        onGenerate={handleImagesGenerated}
        onGenerationStart={handleGenerationStart}
        onGenerationEnd={handleGenerationEnd}
      />
    </div>
  );
}
