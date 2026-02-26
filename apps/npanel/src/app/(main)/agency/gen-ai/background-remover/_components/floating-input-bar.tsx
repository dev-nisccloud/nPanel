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

export function FloatingInputBar() {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isStarting, setIsStarting] = React.useState(false);

  const utils = trpc.useUtils();
  const startMutation = trpc.backgroundRemover.startBackgroundRemoval.useMutation({
    onSuccess: () => {
      utils.backgroundRemover.getGenerations.invalidate();
      toast.success("Background removal started. Result will appear when ready.");
    },
  });

  const handleDrop = React.useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setSelectedFile(file);
  }, []);

  const handleRemoveFile = React.useCallback(() => {
    setSelectedFile(null);
  }, []);

  const handleGenerate = async () => {
    if (!selectedFile) {
      toast.error("Please select an image first");
      return;
    }

    setIsStarting(true);
    try {
      const originalUploadResponse = await uploadFiles(UPLOAD_ENDPOINTS.IMAGE, {
        files: [selectedFile],
      });

      if (!originalUploadResponse?.length) {
        throw new Error("Failed to upload original image");
      }

      const file = originalUploadResponse[0];
      const originalImageUrl = file.ufsUrl ?? file.url ?? "";
      if (!originalImageUrl) {
        throw new Error("Original image URL not found");
      }

      await startMutation.mutateAsync({
        image: originalImageUrl,
        originalImageKey: file.key ?? undefined,
        originalImageFileName: file.name ?? selectedFile.name,
        originalImageSize: file.size ?? selectedFile.size,
        originalImageMimeType: file.type ?? selectedFile.type,
      });
      setSelectedFile(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to start background removal";
      toast.error(message);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-0 border-t border-border bg-background/95 backdrop-blur-sm pb-1.5 pt-2">
      <div className="max-w-4xl mx-auto px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            {!selectedFile ? (
              <Dropzone
                onDrop={handleDrop}
                accept={{
                  "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
                }}
                maxFiles={1}
                maxSize={10 * 1024 * 1024}
                disabled={isStarting}
                className={cn(
                  "rounded-lg border border-dashed border-border bg-muted/20 transition-colors min-h-[52px]",
                  "hover:border-primary/30 hover:bg-muted/30",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                )}
              >
                <DropzoneEmptyState>
                  <div className="flex items-center justify-center gap-2 py-2 text-center">
                    <Upload className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
                    <p className="text-xs text-muted-foreground">
                      Drop image or click to browse · PNG, JPG, WebP up to 10MB
                    </p>
                  </div>
                </DropzoneEmptyState>
              </Dropzone>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-2 py-1.5">
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded bg-muted">
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">
                    {selectedFile.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                  disabled={isStarting}
                  className="h-6 w-6 shrink-0"
                  aria-label="Remove selected image"
                >
                  <X className="h-3 w-3" aria-hidden />
                </Button>
              </div>
            )}
          </div>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={!selectedFile || isStarting}
            size="sm"
            className="shrink-0"
          >
            {isStarting ? (
              <>
                <Spinner className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Starting...
              </>
            ) : (
              <>
                <ImageIcon className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Remove
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
