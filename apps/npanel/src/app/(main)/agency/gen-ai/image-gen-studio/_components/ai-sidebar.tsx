"use client";

import { useState, useCallback, useRef } from "react";
import { Loader, AlertTriangle, Trash2, Sparkles, X } from "lucide-react";
import { useFilePicker } from "use-file-picker";

import { ActiveTool, Editor } from "../_lib/types";
import { useGenerateImage } from "../_api/use-generate-image";
import { useGetAiGenerations } from "../_api/use-get-ai-generations";
import { useDeleteAiGeneration } from "../_api/use-delete-ai-generation";
import { useCreateUpload } from "../_api/use-create-upload";
import { uploadFiles } from "@/hooks/use-uploadthing";
import { UPLOAD_ENDPOINTS } from "@/lib/uploadthing";
import { ToolSidebarClose } from "./tool-sidebar-close";
import { ToolSidebarHeader } from "./tool-sidebar-header";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/utils/trpc";

interface AiSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

interface ReferenceImage {
  id: string; // Upload ID or temporary ID for new files
  url: string; // Image URL
  fileName: string;
  isNewFile?: boolean; // If true, needs to be uploaded first
  file?: File; // File object if it's a new file
}

export const AiSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: AiSidebarProps) => {
  const [prompt, setPrompt] = useState("");
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const generateMutation = useGenerateImage();
  const updateGenerationMutation = trpc.imageGenStudio.ai.updateGenerationAfterUpload.useMutation();
  const createUploadMutation = useCreateUpload();
  const utils = trpc.useUtils();

  // Get AI generations history
  const { data: generationsData, isLoading: isLoadingGenerations, isError: isErrorGenerations } = useGetAiGenerations({
    page: 1,
    limit: 20,
  });
  const deleteGenerationMutation = useDeleteAiGeneration();

  // File picker for new reference images - limit to 3 images
  const { openFilePicker } = useFilePicker({
    accept: [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"],
    multiple: true,
    onFilesSuccessfullySelected: ({ plainFiles }: { plainFiles: File[] }) => {
      const newImages: ReferenceImage[] = plainFiles.map((file: File) => ({
        id: `temp-${Date.now()}-${Math.random()}`,
        url: URL.createObjectURL(file),
        fileName: file.name,
        isNewFile: true,
        file,
      }));
      setReferenceImages((prev) => {
        // Limit to 3 images max
        const total = prev.length + newImages.length;
        if (total > 3) {
          const allowed = 3 - prev.length;
          if (allowed <= 0) return prev; // Already at max
          return [...prev, ...newImages.slice(0, allowed)];
        }
        return [...prev, ...newImages];
      });
    },
  });

  const removeReferenceImage = useCallback((id: string) => {
    if (isGenerating) return; // Disable removal during generation
    setReferenceImages((prev) => {
      const newImages = prev.filter((img) => img.id !== id);
      // Revoke object URL if it's a new file
      const removed = prev.find((img) => img.id === id);
      if (removed?.isNewFile && removed.url.startsWith("blob:")) {
        URL.revokeObjectURL(removed.url);
      }
      return newImages;
    });
  }, [isGenerating]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    if (isGenerating) return;

    setIsGenerating(true);

    try {
      // Step 1: Upload new reference images to UploadThing
      const newFiles = referenceImages.filter((img) => img.isNewFile && img.file);
      const uploadedReferenceUrls: string[] = [];

      if (newFiles.length > 0) {
        for (const refImage of newFiles) {
          if (!refImage.file) continue;

          const response = await uploadFiles(UPLOAD_ENDPOINTS.IMAGE, {
            files: [refImage.file],
          });

          if (response && response.length > 0) {
            const uploadedFile = response[0];
            const fileUrl = uploadedFile.ufsUrl || uploadedFile.url || "";
            if (fileUrl) {
              uploadedReferenceUrls.push(fileUrl);

              // Save to uploads database
              await createUploadMutation.mutateAsync({
                fileUrl,
                fileKey: uploadedFile.key || "",
                fileName: uploadedFile.name || refImage.file.name,
                fileSize: uploadedFile.size || refImage.file.size,
                mimeType: uploadedFile.type || refImage.file.type || "image/png",
                fileMetadata: undefined, // Dimensions not available from UploadThing response
              });
            }
          }
        }
      }

      // All reference images are new files (from local computer)
      const allReferenceUrls = uploadedReferenceUrls;

      // Step 2: Call AI generation API
      const result = await generateMutation.mutateAsync({
        prompt: prompt.trim(),
        referenceImageUrls: allReferenceUrls.length > 0 ? allReferenceUrls : undefined,
      });

      if (!result.data) {
        throw new Error("No image URL returned from generation");
      }

      const generatedImageUrl = result.data;
      const generationId = result.generationId;

      // Step 3: Add generated image to canvas
      if (editor) {
        editor.addImage(generatedImageUrl);
      }

      // Step 4: Download and upload generated image to UploadThing
      const imageResponse = await fetch(generatedImageUrl);
      if (!imageResponse.ok) {
        throw new Error("Failed to download generated image");
      }

      const blob = await imageResponse.blob();
      const file = new File([blob], `ai-generated-${Date.now()}.png`, { type: "image/png" });

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

      // Step 5: Update generation record with UploadThing data
      if (generationId) {
        await updateGenerationMutation.mutateAsync({
          generationId,
          imageUrl: finalImageUrl,
          imageKey: uploadedFile.key || "",
          imageFileName: uploadedFile.name || file.name,
          imageSize: uploadedFile.size || file.size,
          imageMimeType: uploadedFile.type || "image/png",
        });
      }

      // Step 6: Save generated image to uploads database
      await createUploadMutation.mutateAsync({
        fileUrl: finalImageUrl,
        fileKey: uploadedFile.key || "",
        fileName: uploadedFile.name || file.name,
        fileSize: uploadedFile.size || file.size,
        mimeType: uploadedFile.type || "image/png",
        fileMetadata: undefined, // Dimensions not available from UploadThing response
      });

      // Step 7: Clear form and refresh data
      setPrompt("");
      setReferenceImages([]);
      utils.imageGenStudio.aiGenerations.list.invalidate();
      utils.imageGenStudio.uploads.list.invalidate();
    } catch (error) {
      console.error("Error generating image:", error);
      // Error toast is handled by the mutation
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, referenceImages, isGenerating, editor, generateMutation, createUploadMutation, updateGenerationMutation, utils]);

  const handleImageClick = useCallback(
    (imageUrl: string) => {
      editor?.addImage(imageUrl);
        },
    [editor]
    );

  const handleDeleteGeneration = useCallback(
    async (generationId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      await deleteGenerationMutation.mutateAsync({ id: generationId });
    },
    [deleteGenerationMutation]
  );

  const onClose = () => {
    onChangeActiveTool("select");
  };

  return (
    <aside
      className={cn(
        "relative z-[40] flex h-full max-h-full min-h-0 w-[360px] shrink-0 flex-col overflow-hidden border-r bg-white",
        activeTool === "ai" ? "flex" : "hidden",
      )}
    >
      <ToolSidebarHeader
        title="AI"
        description="Generate images using AI"
      />
      
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Input Section */}
        <div className="flex-shrink-0 p-4 border-b space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Prompt</label>
          <Textarea
              ref={textareaRef}
              disabled={isGenerating}
            placeholder="An astronaut riding a horse on mars, hd, dramatic lighting"
            required
            minLength={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="resize-none min-h-[80px] max-h-[200px] overflow-y-auto"
              rows={4}
            />
          </div>

          {/* Reference Images Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Reference Images ({referenceImages.length}/3)
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openFilePicker()}
                disabled={isGenerating || referenceImages.length >= 3}
              >
                Select Images
              </Button>
            </div>

            {/* Selected Reference Images - Only show after selecting local images */}
            {referenceImages.length > 0 && (
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-2">
                  {referenceImages.map((refImage) => (
                    <div
                      key={refImage.id}
                      className="relative flex-shrink-0 w-20 h-20 rounded border overflow-hidden group"
                    >
                      <img
                        src={refImage.url}
                        alt={refImage.fileName}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeReferenceImage(refImage.id)}
                        disabled={isGenerating}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 rounded p-1 disabled:opacity-0 disabled:cursor-not-allowed z-10"
                      >
                        <X className="size-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader className="size-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="size-4 mr-2" />
            Generate
              </>
            )}
          </Button>
        </div>

        {/* Divider */}
        <Separator />

        {/* History Section */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="px-4 py-2 flex-shrink-0">
            <p className="text-sm font-medium">Your generations</p>
          </div>
          {isLoadingGenerations ? (
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <Loader className="size-6 text-muted-foreground animate-spin" />
            </div>
          ) : isErrorGenerations ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2">
              <AlertTriangle className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Failed to load generations</p>
            </div>
          ) : !generationsData?.data || generationsData.data.length === 0 ? (
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <p className="text-sm text-muted-foreground">No generations yet</p>
            </div>
          ) : (
            <ScrollArea className="h-full min-h-0">
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Type assertion to work around TypeScript's "Type instantiation is excessively deep" error */}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {((generationsData?.data as any) || []).map((generation: { id: string; imageUrl: string; prompt: string }) => (
                    <div
                      key={generation.id}
                      onClick={() => handleImageClick(generation.imageUrl)}
                      className="relative w-full aspect-square group hover:opacity-75 transition bg-muted rounded-sm overflow-hidden border cursor-pointer"
                    >
                      <img
                        src={generation.imageUrl}
                        alt={generation.prompt.substring(0, 50)}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <button
                        onClick={(e) => handleDeleteGeneration(generation.id, e)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 rounded p-1 z-10"
                      >
                        <Trash2 className="size-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <ScrollBar orientation="vertical" />
      </ScrollArea>
          )}
        </div>
      </div>
      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};
