"use client";

import * as React from "react";
import { Image as ImageIcon, Wand2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AspectRatioSelector, type AspectRatio } from "./aspect-ratio-selector";
import { FormatSelector, type OutputFormat } from "./format-selector";
import { ResolutionSelector } from "./resolution-selector";
import { VariationsSelector } from "./variations-selector";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { uploadFiles } from "@/hooks/use-uploadthing";
import { UPLOAD_ENDPOINTS } from "@/lib/uploadthing";

type Resolution = "1K" | "2K" | "4K";

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: {
  minHeight: number;
  maxHeight?: number;
}) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const adjustHeight = React.useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;

      const newHeight = Math.max(
        minHeight,
        Math.min(
          textarea.scrollHeight,
          maxHeight ?? Number.POSITIVE_INFINITY
        )
      );

      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  React.useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

interface FloatingInputBarProps {
  onGenerate: (images: any[]) => void;
  onGenerationStart: (total: number) => void;
  onGenerationEnd: () => void;
}

export function FloatingInputBar({ 
  onGenerate, 
  onGenerationStart, 
  onGenerationEnd 
}: FloatingInputBarProps) {
  const [prompt, setPrompt] = React.useState("");
  const [aspectRatio, setAspectRatio] = React.useState<AspectRatio>("4:3");
  const [outputFormat, setOutputFormat] = React.useState<OutputFormat>("png");
  const [resolution, setResolution] = React.useState<Resolution>("2K");
  const [variations, setVariations] = React.useState<number>(2);
  const [selectedImages, setSelectedImages] = React.useState<File[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 72,
    maxHeight: 300,
  });

  const utils = trpc.useUtils();
  const generateMutation = trpc.imageGenerator.generateImage.useMutation();
  const updateVariationMutation = trpc.imageGenerator.updateVariationAfterUpload.useMutation();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    // Show skeleton loaders for all variations immediately
    onGenerationStart(variations);

    try {
      // Step 1: Upload reference images to UploadThing first (if any)
      let referenceImageUrls: string[] = [];
      
      if (selectedImages.length > 0) {
        try {
          // Disable removing images during generation
          const uploadPromises = selectedImages.map(async (file) => {
            const response = await uploadFiles(UPLOAD_ENDPOINTS.IMAGE, {
              files: [file],
            });

            if (!response || response.length === 0) {
              throw new Error(`Failed to upload ${file.name}`);
            }

            const uploadedFile = response[0];
            const fileUrl = uploadedFile.ufsUrl || uploadedFile.url || "";
            
            if (!fileUrl) {
              throw new Error("File URL not found in upload response");
            }

            return fileUrl;
          });

          referenceImageUrls = await Promise.all(uploadPromises);
        } catch (error: any) {
          console.error("Error uploading reference images:", error);
          toast.error(`Failed to upload reference images: ${error.message}`);
          setIsGenerating(false);
          onGenerationEnd();
          return;
        }
      }

      // Step 2: Generate images with variations using Replicate
      const result = await generateMutation.mutateAsync({
        prompt: prompt.trim(),
        referenceImageUrls: referenceImageUrls.length > 0 ? referenceImageUrls : undefined,
        aspectRatio,
        outputFormat,
        resolution,
        variations,
      });

      if (!result || !result.variations || result.variations.length === 0) {
        throw new Error("No images were generated");
      }

      // Step 3: Process each variation as it's generated
      // Download each image, upload to UploadThing, and update the variation record
      const generatedImagesList: any[] = [];

      for (const variation of result.variations) {
        try {
          // Download the generated image from Replicate
          const imageResponse = await fetch(variation.imageUrl);
          if (!imageResponse.ok) {
            throw new Error(`Failed to download image: ${imageResponse.statusText}`);
          }

          const blob = await imageResponse.blob();
          const file = new File([blob], variation.imageFileName, { 
            type: variation.imageMimeType || `image/${outputFormat}` 
          });

          // Upload to UploadThing
          const uploadResponse = await uploadFiles(UPLOAD_ENDPOINTS.IMAGE, {
            files: [file],
          });

          if (!uploadResponse || uploadResponse.length === 0) {
            throw new Error("Failed to upload generated image to UploadThing");
          }

          const uploadedFile = uploadResponse[0];
          const finalImageUrl = uploadedFile.ufsUrl || uploadedFile.url || "";

          if (!finalImageUrl) {
            throw new Error("No URL returned from UploadThing");
          }

          // Update variation record with UploadThing data
          await updateVariationMutation.mutateAsync({
            variationId: variation.id,
            imageUrl: finalImageUrl,
            imageKey: uploadedFile.key || "",
            imageFileName: uploadedFile.name || file.name,
            imageSize: uploadedFile.size || file.size,
            imageMimeType: uploadedFile.type || file.type,
          });

          // Create image data for display
          const imageData = {
            dataUrl: finalImageUrl,
            mimeType: variation.imageMimeType,
            prompt: prompt.trim(),
            timestamp: new Date().toISOString(),
            variationId: variation.id,
            variationIndex: variation.variationIndex,
          };

          generatedImagesList.push(imageData);
          // Show each image as it's processed
          onGenerate([imageData]);
        } catch (error: any) {
          console.error(`Error processing variation ${variation.variationIndex}:`, error);
          toast.error(`Failed to process variation ${variation.variationIndex}: ${error.message || "Unknown error"}`);
        }
      }

      // Only show success if we actually generated at least one image
      if (generatedImagesList.length > 0) {
        toast.success(`Generated ${generatedImagesList.length} variation(s) successfully!`);
      } else {
        toast.error("Failed to generate any images. Please try again.");
      }
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to generate images");
    } finally {
      setIsGenerating(false);
      onGenerationEnd();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && prompt.trim() && !isGenerating) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleClearPrompt = () => {
    setPrompt("");
    adjustHeight(true);
  };

  const handleEnhancePrompt = () => {
    // Disabled for now
    toast.info("Prompt enhancement is currently disabled");
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const remainingSlots = 3 - selectedImages.length;
      const newFiles = files.slice(0, remainingSlots);
      setSelectedImages((prev) => [...prev, ...newFiles]);
    }
    // Reset input
    if (e.target) {
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    if (isGenerating) return; // Disable removal during generation
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto">
      <div className="mx-auto max-w-4xl px-4 py-4 md:px-6 md:py-6">
        {/* Image Previews */}
        {selectedImages.length > 0 && (
          <div className="mb-3 flex gap-2 overflow-x-auto pb-3">
            {selectedImages.map((file, index) => (
              <div key={index} className="relative flex-shrink-0">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className="h-16 w-16 rounded-lg border object-cover"
                />
                <button
                  onClick={() => removeImage(index)}
                  disabled={isGenerating}
                  className={cn(
                    "absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground transition-colors hover:bg-destructive/90",
                    isGenerating && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl bg-black/5 p-1.5 dark:bg-white/5">
          <div className="relative">
            <div className="relative flex flex-col">
              {/* Textarea Section */}
              <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
                <Textarea
                  ref={textareaRef}
                  placeholder="Describe your image..."
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    adjustHeight();
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={isGenerating}
                  className={cn(
                    "min-h-[72px] w-full resize-none rounded-xl rounded-b-none border-none bg-black/5 px-4 py-3 placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-white/5",
                    selectedImages.length > 0 && "pr-20"
                  )}
                />
              </div>

              {/* Bottom Bar with Controls */}
              <div className="flex h-14 items-center rounded-b-xl bg-black/5 dark:bg-white/5">
                <div className="absolute left-3 right-3 bottom-3 flex w-[calc(100%-24px)] items-center justify-between">
                  {/* Left Side Controls */}
                  <div className="flex items-center gap-2">
                    {/* Image Picker */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <label
                          className={cn(
                            "flex cursor-pointer items-center justify-center rounded-lg p-2 transition-colors",
                            "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10",
                            "text-muted-foreground hover:text-foreground",
                            "focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0",
                            (selectedImages.length >= 3 || isGenerating) && "opacity-50 cursor-not-allowed"
                          )}
                          aria-label="Upload images"
                        >
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageSelect}
                            disabled={selectedImages.length >= 3 || isGenerating}
                            className="hidden"
                          />
                          <ImageIcon className="h-4 w-4" />
                        </label>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>Add reference images that the AI can use to guide the generation process</p>
                      </TooltipContent>
                    </Tooltip>

                    <div className="h-4 w-px bg-border mx-0.5" />

                    {/* Aspect Ratio */}
                    <AspectRatioSelector
                      value={aspectRatio}
                      onChange={setAspectRatio}
                      disabled={isGenerating}
                    />

                    {/* Variations */}
                    <VariationsSelector
                      value={variations}
                      onChange={setVariations}
                      disabled={isGenerating}
                    />

                    {/* Format */}
                    <FormatSelector
                      value={outputFormat}
                      onChange={setOutputFormat}
                      disabled={isGenerating}
                    />

                    {/* Resolution */}
                    <ResolutionSelector
                      value={resolution}
                      onChange={setResolution}
                      disabled={isGenerating}
                    />
                  </div>

                  {/* Right Side Actions */}
                  <div className="flex items-center gap-2">
                    {/* Enhance Prompt - Disabled */}
                    <button
                      onClick={handleEnhancePrompt}
                      disabled={true}
                      className={cn(
                        "rounded-lg p-2 transition-colors",
                        "bg-black/5 dark:bg-white/5",
                        "text-muted-foreground",
                        "focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0",
                        "opacity-50 cursor-not-allowed"
                      )}
                      aria-label="Enhance prompt (disabled)"
                    >
                      <Wand2 className="h-4 w-4" />
                    </button>

                    {/* Clear Button */}
                    {prompt && (
                      <button
                        onClick={handleClearPrompt}
                        disabled={isGenerating}
                        className={cn(
                          "rounded-lg p-2 transition-colors",
                          "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10",
                          "text-muted-foreground hover:text-foreground",
                          "focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                        aria-label="Clear prompt"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}

                    {/* Generate Button */}
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={!prompt.trim() || isGenerating}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-4 py-2 transition-colors",
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                        "focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                      aria-label="Generate images"
                    >
                      {isGenerating ? (
                        <>
                          <Spinner size={16} />
                          <span className="text-sm">Generating...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm">Generate</span>
                          <Plus className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
