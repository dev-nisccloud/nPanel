"use client";

import * as React from "react";
import { GeneratedImagesView } from "./generated-images-view";
import { FloatingInputBar } from "./floating-input-bar";

export function ImageGeneratorInterface() {
  const [generatedImages, setGeneratedImages] = React.useState<any[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generatingCount, setGeneratingCount] = React.useState({ current: 0, total: 0 });

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
  };

  const handleClearAll = () => {
    setGeneratedImages([]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Generated Images - Chat-like view - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
        <div className="max-w-4xl mx-auto w-full">
          <GeneratedImagesView 
            images={generatedImages}
            isGenerating={isGenerating}
            generatingCount={generatingCount}
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
