"use client";

import * as React from "react";
import { Sparkles, Image as ImageIcon, Wand2, X, ChevronDown, Plus, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StyleSelector } from "./style-selector";
import { AspectRatioSelector } from "./aspect-ratio-selector";
import { FormatSelector } from "./format-selector";
import { ModelSelector } from "./model-selector";
import { VariationsSelector } from "./variations-selector";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

type AspectRatio = "1:1" | "4:5" | "2:3" | "9:16" | "16:9" | "21:9" | "3:2" | "5:4" | "9:21";
type OutputFormat = "webp" | "jpeg" | "png";
type ModelType = "ultra" | "core" | "sd3";
type StylePreset =
  | "3d-model"
  | "analog-film"
  | "anime"
  | "cinematic"
  | "comic-book"
  | "digital-art"
  | "enhance"
  | "fantasy-art"
  | "isometric"
  | "line-art"
  | "low-poly"
  | "modeling-compound"
  | "neon-punk"
  | "origami"
  | "photographic"
  | "pixel-art"
  | "tile-texture"
  | null;

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
  const [selectedStyle, setSelectedStyle] = React.useState<StylePreset>(null);
  const [aspectRatio, setAspectRatio] = React.useState<AspectRatio>("1:1");
  const [outputFormat, setOutputFormat] = React.useState<OutputFormat>("png");
  const [model, setModel] = React.useState<ModelType>("core");
  const [sd3Model, setSd3Model] = React.useState<"sd3.5-large" | "sd3.5-large-turbo" | "sd3.5-medium" | "sd3.5-flash">("sd3.5-large");
  const [variations, setVariations] = React.useState<number>(3);
  const [selectedImages, setSelectedImages] = React.useState<File[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 72,
    maxHeight: 300,
  });

  const utils = trpc.useUtils();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    onGenerationStart(variations);

    try {
      const baseParams = {
        prompt: prompt.trim(),
        negativePrompt: undefined,
        model,
        ...(model === "sd3" && sd3Model ? { sd3Model } : {}),
        aspectRatio,
        stylePreset: selectedStyle || undefined,
        outputFormat,
        seed: 0,
      };

      const generatedImagesList: any[] = [];
      
      // Generate variations sequentially to show progress
      for (let index = 0; index < variations; index++) {
        try {
          const variationSeed = 0; // Random seed
          const result = await utils.client.stabilityAi.generate.mutate({
            ...baseParams,
            seed: variationSeed,
          });

          const imageData = {
            dataUrl: `data:${result.mimeType};base64,${result.image}`,
            mimeType: result.mimeType,
            seed: result.seed,
            prompt: prompt.trim(),
            timestamp: new Date().toISOString(),
          };

          console.log(`Generated image ${index + 1}:`, {
            hasImage: !!result.image,
            imageLength: result.image?.length,
            mimeType: result.mimeType,
          });

          generatedImagesList.push(imageData);
          // Show each image as it's generated
          onGenerate([imageData]);
        } catch (error: any) {
          console.error(`Error generating variation ${index + 1}:`, error);
          toast.error(`Failed to generate variation ${index + 1}: ${error.message || "Unknown error"}`);
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
    // TODO: Implement prompt enhancement
    toast.info("Prompt enhancement coming soon");
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
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Get aspect ratio display label
  const aspectRatioLabels: Record<AspectRatio, string> = {
    "1:1": "Square",
    "4:5": "Portrait",
    "2:3": "Portrait",
    "9:16": "Portrait",
    "16:9": "Landscape",
    "21:9": "Landscape",
    "3:2": "Photo",
    "5:4": "Classic",
    "9:21": "Portrait",
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
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground transition-colors hover:bg-destructive/90"
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
                            selectedImages.length >= 3 && "opacity-50 cursor-not-allowed"
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

                    {/* Upload Sketch */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <label
                          className={cn(
                            "flex cursor-pointer items-center justify-center rounded-lg p-2 transition-colors",
                            "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10",
                            "text-muted-foreground hover:text-foreground",
                            "focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0",
                            isGenerating && "opacity-50 cursor-not-allowed"
                          )}
                          aria-label="Upload sketch"
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={() => {}}
                            disabled={isGenerating}
                            className="hidden"
                          />
                          <PenTool className="h-4 w-4" />
                        </label>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-sm">
                        <div className="space-y-2">
                          <p className="font-semibold">Sketch</p>
                          <p className="text-xs">
                            This service offers an ideal solution for design projects that require brainstorming and frequent iterations. It upgrades rough hand-drawn sketches to refined outputs with precise control. For non-sketch images, it allows detailed manipulation of the final appearance by leveraging the contour lines and edges within the image.
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>

                    <div className="h-4 w-px bg-border mx-0.5" />

                    {/* Style Selector */}
                    <StyleSelector
                      selectedStyle={selectedStyle}
                      onStyleSelect={setSelectedStyle}
                      disabled={isGenerating}
                    />

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

                    {/* Model */}
                    <ModelSelector
                      value={model}
                      sd3Model={sd3Model}
                      onModelChange={setModel}
                      onSd3ModelChange={setSd3Model}
                      disabled={isGenerating}
                    />
                  </div>

                  {/* Right Side Actions */}
                  <div className="flex items-center gap-2">
                    {/* Enhance Prompt */}
                    <button
                      onClick={handleEnhancePrompt}
                      disabled={isGenerating}
                      className={cn(
                        "rounded-lg p-2 transition-colors",
                        "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10",
                        "text-muted-foreground hover:text-foreground",
                        "focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                      aria-label="Enhance prompt"
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
