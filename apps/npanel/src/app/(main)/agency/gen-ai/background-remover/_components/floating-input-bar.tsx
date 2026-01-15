"use client";

import * as React from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/ui/shadcn-io/dropzone";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
import { uploadFiles } from "@/hooks/use-uploadthing";
import { UPLOAD_ENDPOINTS } from "@/lib/uploadthing";

interface FloatingInputBarProps {
  onGenerate: (image: { originalUrl: string; processedUrl: string; originalMimeType: string; processedMimeType: string; timestamp: string }) => void;
  onGenerationStart: () => void;
  onGenerationEnd: () => void;
}

export function FloatingInputBar({ 
  onGenerate, 
  onGenerationStart, 
  onGenerationEnd 
}: FloatingInputBarProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const removeBackgroundMutation = trpc.backgroundRemover.removeBackground.useMutation();
  const updateGenerationMutation = trpc.backgroundRemover.updateGenerationAfterUpload.useMutation();

  const handleDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      setSelectedFile(file);
    },
    []
  );

  const handleRemoveFile = React.useCallback(() => {
    setSelectedFile(null);
  }, []);

  const handleGenerate = async () => {
    if (!selectedFile) {
      toast.error("Please select an image first");
      return;
    }

    setIsGenerating(true);
    onGenerationStart();

    try {
      // Step 1: Upload original image to UploadThing
      const originalUploadResponse = await uploadFiles(UPLOAD_ENDPOINTS.IMAGE, {
        files: [selectedFile],
      });

      if (!originalUploadResponse || originalUploadResponse.length === 0) {
        throw new Error("Failed to upload original image to UploadThing");
      }

      const originalUploadedFile = originalUploadResponse[0];
      const originalImageUrl = originalUploadedFile.ufsUrl || originalUploadedFile.url || "";

      if (!originalImageUrl) {
        throw new Error("Original image URL not found in upload response");
      }

      // Step 2: Send to Replicate for processing
      const result = await removeBackgroundMutation.mutateAsync({
        image: originalImageUrl,
      });

      if (!result.data) {
        throw new Error("No processed image URL returned from generation");
      }

      const processedImageUrl = result.data;
      const generationId = result.generationId;

      // Step 3: Download processed image and upload to UploadThing
      const processedImageResponse = await fetch(processedImageUrl);
      if (!processedImageResponse.ok) {
        throw new Error("Failed to download processed image");
      }

      const processedBlob = await processedImageResponse.blob();
      const processedFile = new File([processedBlob], `background-removed-${Date.now()}.png`, { type: "image/png" });

      const processedUploadResponse = await uploadFiles(UPLOAD_ENDPOINTS.IMAGE, {
        files: [processedFile],
      });

      if (!processedUploadResponse || processedUploadResponse.length === 0) {
        throw new Error("Failed to upload processed image to UploadThing");
      }

      const processedUploadedFile = processedUploadResponse[0];
      const finalProcessedImageUrl = processedUploadedFile.ufsUrl || processedUploadedFile.url || "";

      if (!finalProcessedImageUrl) {
        throw new Error("Processed image URL not found in upload response");
      }

      // Step 4: Update generation record with UploadThing data
      if (generationId) {
        await updateGenerationMutation.mutateAsync({
          generationId,
          originalImageUrl: originalImageUrl,
          originalImageKey: originalUploadedFile.key || "",
          originalImageFileName: originalUploadedFile.name || selectedFile.name,
          originalImageSize: originalUploadedFile.size || selectedFile.size,
          originalImageMimeType: originalUploadedFile.type || selectedFile.type,
          processedImageUrl: finalProcessedImageUrl,
          processedImageKey: processedUploadedFile.key || "",
          processedImageFileName: processedUploadedFile.name || processedFile.name,
          processedImageSize: processedUploadedFile.size || processedFile.size,
          processedImageMimeType: processedUploadedFile.type || "image/png",
        });
      }

      // Step 5: Add to current session
      onGenerate({
        originalUrl: originalImageUrl,
        processedUrl: finalProcessedImageUrl,
        originalMimeType: originalUploadedFile.type || selectedFile.type,
        processedMimeType: processedUploadedFile.type || "image/png",
        timestamp: Date.now().toString(),
      });

      toast.success("Background removed successfully!");
    } catch (error: any) {
      console.error("Error removing background:", error);
      toast.error(`Failed to remove background: ${error.message || "Unknown error"}`);
    } finally {
      setIsGenerating(false);
      onGenerationEnd();
    }
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-end gap-3">
          {/* Dropzone */}
          <div className="flex-1">
            {!selectedFile ? (
              <Dropzone
                onDrop={handleDrop}
                accept={{
                  "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
                }}
                maxFiles={1}
                maxSize={10 * 1024 * 1024} // 10MB
                disabled={isGenerating}
                className="border-2 border-dashed"
              >
                <DropzoneEmptyState>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="mb-3 p-3 bg-primary/10 rounded-full">
                      <Upload className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Drop your images here to remove the background
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      or click to select an image
                    </p>
                  </div>
                </DropzoneEmptyState>
              </Dropzone>
            ) : (
              <div className="relative border-2 border-dashed rounded-lg p-3 bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-background flex items-center justify-center flex-shrink-0">
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                    disabled={isGenerating}
                    className="h-8 w-8 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Remove Background Button */}
          <Button
            onClick={handleGenerate}
            disabled={!selectedFile || isGenerating}
            size="lg"
            className="flex-shrink-0"
          >
            {isGenerating ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Processing...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                Remove Background
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
