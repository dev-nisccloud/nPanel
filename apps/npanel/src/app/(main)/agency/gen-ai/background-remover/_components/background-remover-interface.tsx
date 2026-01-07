"use client";

import * as React from "react";
import { BackgroundRemoverUpload } from "./background-remover-upload";
import { BackgroundRemoverResults } from "./background-remover-results";

export function BackgroundRemoverInterface() {
  const [originalImage, setOriginalImage] = React.useState<File | null>(null);
  const [processedImage, setProcessedImage] = React.useState<{
    dataUrl: string;
    mimeType: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleImageProcessed = (imageData: { dataUrl: string; mimeType: string }) => {
    setProcessedImage(imageData);
  };

  const handleClear = () => {
    setOriginalImage(null);
    setProcessedImage(null);
  };

  const handleNewUpload = (file: File) => {
    setOriginalImage(file);
    setProcessedImage(null);
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-4 pb-8">
      <div className="space-y-6">
        {/* Upload Section */}
        <BackgroundRemoverUpload
          onImageUpload={handleNewUpload}
          onProcess={handleImageProcessed}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          disabled={isProcessing}
        />

        {/* Results Section */}
        {originalImage && (
          <BackgroundRemoverResults
            originalImage={originalImage}
            processedImage={processedImage}
            isProcessing={isProcessing}
            onClear={handleClear}
          />
        )}
      </div>
    </div>
  );
}

