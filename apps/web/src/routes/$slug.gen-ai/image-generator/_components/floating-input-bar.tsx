"use client";

import * as React from "react";
import { Image as ImageIcon, Wand2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AspectRatioSelector, type AspectRatio } from "./aspect-ratio-selector";
import { FormatSelector, type OutputFormat } from "./format-selector";
import { ResolutionSelector } from "./resolution-selector";
import { VariationsSelector } from "./variations-selector";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronDown } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { uploadFiles } from "@/hooks/use-uploadthing";
import { UPLOAD_ENDPOINTS } from "@/lib/uploadthing";
import { RefineOptions } from "./refine-options";
import {
  DEFAULT_REFINE_VALUES,
  REFINE_OPTION_NONE,
  type VisualCreativeRefineValues,
} from "./refine-options-config";

type Resolution = "1K" | "2K" | "4K";

/** Normal = standard generation; visual-creative = for advanced visual/creative prompts (prompt refinement TBD). */
export type GenerationMode = "normal" | "visual-creative";

const GENERATION_MODES: { value: GenerationMode; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "visual-creative", label: "Visual & creative design" },
];

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

export function FloatingInputBar({
  teamId,
  creditsValue,
}: { teamId?: string; creditsValue?: number | null } = {}) {
  const [prompt, setPrompt] = React.useState("");
  const [aspectRatio, setAspectRatio] = React.useState<AspectRatio>("4:3");
  const [outputFormat, setOutputFormat] = React.useState<OutputFormat>("png");
  const [resolution, setResolution] = React.useState<Resolution>("2K");
  const [variations, setVariations] = React.useState<number>(1);

  const maxVariations =
    creditsValue != null && typeof creditsValue === "number" ? creditsValue : undefined;
  const hasNoCredits = creditsValue === 0;

  React.useEffect(() => {
    if (maxVariations != null && variations > maxVariations) {
      setVariations(maxVariations);
    }
  }, [maxVariations, variations]);
  const [generationMode, setGenerationMode] = React.useState<GenerationMode>("normal");
  const [selectedImages, setSelectedImages] = React.useState<File[]>([]);
  const [isStarting, setIsStarting] = React.useState(false);
  const [isRefining, setIsRefining] = React.useState(false);
  const [generationModeOpen, setGenerationModeOpen] = React.useState(false);
  const [refineValues, setRefineValues] =
    React.useState<VisualCreativeRefineValues>(DEFAULT_REFINE_VALUES);

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 72,
    maxHeight: 300,
  });

  const utils = trpc.useUtils();
  const startMutation = trpc.imageGenerator.startGeneration.useMutation({
    onSuccess: () => {
      utils.imageGenerator.getGenerations.invalidate();
      setPrompt("");
      setSelectedImages([]);
      adjustHeight(true);
      toast.success("Generation started. This can take about 30 seconds to 10 minutes depending on complexity. Images will appear as they’re ready.");
    },
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    if (hasNoCredits) return;

    setIsStarting(true);
    try {
      let referenceImageUrls: string[] = [];
      if (selectedImages.length > 0) {
        const uploadPromises = selectedImages.map(async (file) => {
          const response = await uploadFiles(UPLOAD_ENDPOINTS.IMAGE, {
            files: [file],
          });
          if (!response?.length) throw new Error(`Failed to upload ${file.name}`);
          const url = response[0].ufsUrl ?? response[0].url ?? "";
          if (!url) throw new Error("File URL not found");
          return url;
        });
        referenceImageUrls = await Promise.all(uploadPromises);
      }

      await startMutation.mutateAsync({
        prompt: prompt.trim(),
        referenceImageUrls: referenceImageUrls.length > 0 ? referenceImageUrls : undefined,
        aspectRatio,
        outputFormat,
        resolution,
        variations,
        ...(teamId ? { teamId } : {}),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to start generation";
      toast.error(message);
    } finally {
      setIsStarting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === "Enter" &&
      (e.metaKey || e.ctrlKey) &&
      prompt.trim() &&
      !isStarting &&
      !hasNoCredits
    ) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleEnhancePrompt = async () => {
    if (isRefining || isStarting) return;
    setIsRefining(true);
    try {
      const body: Record<string, unknown> = {
        prompt: prompt.trim() || "",
        generationMode,
        aspectRatio,
        outputFormat,
        resolution,
      };
      if (generationMode === "visual-creative") {
        const add = (key: string, v: string) => {
          if (v && v !== REFINE_OPTION_NONE) body[key] = v;
        };
        add("style", refineValues.style);
        add("composition", refineValues.composition);
        add("colorPalette", refineValues.colorPalette);
        add("colorMood", refineValues.colorMood);
        add("typography", refineValues.typography);
        add("lighting", refineValues.lighting);
        add("texture", refineValues.texture);
        add("mood", refineValues.mood);
        if (refineValues.primaryColor?.trim()) body.primaryColor = refineValues.primaryColor.trim();
        if (refineValues.secondaryColor?.trim()) body.secondaryColor = refineValues.secondaryColor.trim();
        if (refineValues.accentColor?.trim()) body.accentColor = refineValues.accentColor.trim();
        if (refineValues.audience?.trim()) body.audience = refineValues.audience.trim();
        if (refineValues.intent?.trim()) body.intent = refineValues.intent.trim();
      }
      const res = await fetch("/api/ai/refine-image-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Failed to refine prompt");
      }
      if (data.refinedPrompt) {
        setPrompt(data.refinedPrompt);
        adjustHeight(true);
        toast.success("Prompt refined.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to refine prompt";
      toast.error(message);
    } finally {
      setIsRefining(false);
    }
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
    if (isStarting) return;
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-0 border-t border-border bg-background/95 backdrop-blur-sm pb-1.5 pt-2">
      <div className="mx-auto max-w-4xl px-4 py-3 md:px-6 md:py-3">
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
                  type="button"
                  onClick={() => removeImage(index)}
                  disabled={isStarting}
                  className={cn(
                    "absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground transition-colors hover:bg-destructive/90",
                    isStarting && "opacity-50 cursor-not-allowed"
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
                  disabled={isStarting}
                  className={cn(
                    "min-h-[72px] w-full resize-none rounded-xl rounded-b-none border-none bg-black/5 px-4 py-3 placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-white/5",
                    selectedImages.length > 0 && "pr-20"
                  )}
                />
              </div>

              {/* Refine options (7 pillars) —only in Visual & creative design mode */}
              {generationMode === "visual-creative" && (
                <div className="px-3 pt-4 pb-2">
                  <RefineOptions
                    values={refineValues}
                    onChange={setRefineValues}
                    disabled={isStarting || isRefining}
                    defaultOpen={true}
                  />
                </div>
              )}

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
                            (selectedImages.length >= 3 || isStarting) && "opacity-50 cursor-not-allowed"
                          )}
                          aria-label="Upload images"
                        >
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageSelect}
                            disabled={selectedImages.length >= 3 || isStarting}
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

                    {/* Generation mode: Normal vs Visual & creative */}
                    <Popover open={generationModeOpen} onOpenChange={setGenerationModeOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          disabled={isStarting}
                          className="h-8 gap-1.5 px-2 text-xs rounded-md bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-blue-500"
                        >
                          {GENERATION_MODES.find((m) => m.value === generationMode)?.label ?? "Normal"}
                          <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-1" align="start">
                        <div className="space-y-1">
                          {GENERATION_MODES.map((mode) => (
                            <button
                              key={mode.value}
                              onClick={() => {
                                setGenerationMode(mode.value);
                                setGenerationModeOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors",
                                generationMode === mode.value && "bg-accent"
                              )}
                            >
                              <span>{mode.label}</span>
                              {generationMode === mode.value && <Check className="h-4 w-4" />}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Aspect Ratio */}
                    <AspectRatioSelector
                      value={aspectRatio}
                      onChange={setAspectRatio}
                      disabled={isStarting}
                    />

                    {/* Variations */}
                    <VariationsSelector
                      value={variations}
                      onChange={setVariations}
                      disabled={isStarting}
                      maxVariations={maxVariations}
                    />

                    {/* Format */}
                    <FormatSelector
                      value={outputFormat}
                      onChange={setOutputFormat}
                      disabled={isStarting}
                    />

                    {/* Resolution */}
                    <ResolutionSelector
                      value={resolution}
                      onChange={setResolution}
                      disabled={isStarting}
                    />
                  </div>

                  {/* Right Side Actions */}
                  <div className="flex items-center gap-2">
                    {/* Refine prompt (Master Design Guide) */}
                    <button
                      type="button"
                      onClick={handleEnhancePrompt}
                      disabled={isStarting || isRefining}
                      className={cn(
                        "rounded-lg p-2 transition-colors",
                        "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10",
                        "text-muted-foreground hover:text-foreground",
                        "focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                      aria-label="Refine prompt using AI"
                    >
                      {isRefining ? (
                        <Spinner size={16} />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                    </button>

                    {/* Generate Button */}
                    {hasNoCredits ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex">
                            <button
                              type="button"
                              disabled
                              className={cn(
                                "flex items-center gap-2 rounded-lg px-4 py-2 transition-colors",
                                "bg-primary text-primary-foreground",
                                "opacity-50 cursor-not-allowed"
                              )}
                              aria-label="Generate images (no credits)"
                            >
                              <span className="text-sm">Generate</span>
                              <Plus className="h-4 w-4" />
                            </button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Purchase more credits to generate images</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={!prompt.trim() || isStarting}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-4 py-2 transition-colors",
                          "bg-primary text-primary-foreground hover:bg-primary/90",
                          "focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                        aria-label="Generate images"
                      >
                        {isStarting ? (
                          <>
                            <Spinner size={16} />
                            <span className="text-sm">Starting...</span>
                          </>
                        ) : (
                          <>
                            <span className="text-sm">Generate</span>
                            <Plus className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    )}
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
