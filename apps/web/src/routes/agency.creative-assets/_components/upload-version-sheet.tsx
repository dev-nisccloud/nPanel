"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";
import { Upload, XIcon, File, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Dropzone, DropzoneEmptyState, DropzoneContent } from "@/components/ui/shadcn-io/dropzone";
import { formatFileSize } from "./utils";
import { cn } from "@/lib/utils";
import { UploadProgressRing } from "@/components/upload-progress-ring";
import { useAppFileUpload } from "@/hooks/use-app-file-upload";
import {
	mapStorageResultToCreativeVersion,
	uploadErrorMessage,
} from "@/lib/app-file-upload";
import { STORAGE_PREFIXES } from "@/lib/storage-prefixes";
import { trpc } from "@/utils/trpc";
import { captureEvent } from "@/lib/posthog";

const FormSchema = z.object({
  versionNotes: z.string().optional(),
  changesSummary: z.string().optional(),
});

interface UploadVersionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
  currentInternalVersion: number | null;
  onUploadVersion?: () => void;
}

/**
 * Normalize progress value from UploadThing to a 0-100 percentage
 * Handles different formats: number, object with progress property, or loaded/totalLoaded
 */
function normalizeProgress(progress: unknown): number {
  // If it's already a number (0-100 percentage)
  if (typeof progress === "number") {
    return Math.round(Math.min(100, Math.max(0, progress)));
  }

  // If it's an object
  if (progress && typeof progress === "object") {
    const progressObj = progress as Record<string, unknown>;

    // Prefer progress.progress if it exists
    if ("progress" in progressObj && typeof progressObj.progress === "number") {
      const progressValue = progressObj.progress;
      // If > 1, it's already a percentage; otherwise it's a decimal (0-1)
      if (progressValue > 1) {
        return Math.round(Math.min(100, Math.max(0, progressValue)));
      }
      return Math.round(Math.min(100, Math.max(0, progressValue * 100)));
    }

    // Fall back to loaded/totalLoaded calculation
    if ("loaded" in progressObj && "totalLoaded" in progressObj) {
      const loaded = Number(progressObj.loaded) || 0;
      const total = Number(progressObj.totalLoaded) || 1;
      if (total > 0) {
        return Math.round(Math.min(100, Math.max(0, (loaded / total) * 100)));
      }
    }
  }

  return 0;
}

export function UploadVersionSheet({
  open,
  onOpenChange,
  assetId,
  currentInternalVersion,
  onUploadVersion,
}: UploadVersionSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const { uploadOne, isUploading, progressPercent, progressLabel, resetProgress } =
    useAppFileUpload();

  const utils = trpc.useUtils();
  const uploadVersionMutation = trpc.creativeAssets.uploadVersion.useMutation({
    onSuccess: (_data, variables) => {
      captureEvent("creative_asset_version_uploaded", {
        file_size_mb: Math.round((variables.fileSize / (1024 * 1024)) * 100) / 100,
        file_type: variables.mimeType,
        version_number: (currentInternalVersion ?? 0) + 1,
      });
      // Invalidate queries to refresh the asset data
      utils.creativeAssets.getById.invalidate({ id: assetId });
      toast.success("Version uploaded successfully!");
      form.reset();
      setSelectedFile(null);
      resetProgress();
      onOpenChange(false);
      onUploadVersion?.();
    },
    onError: (error) => {
      console.error("Error saving version to database:", error);
      toast.error("Failed to save version", {
        description: error.message || "Please try again.",
      });
    },
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      versionNotes: "",
      changesSummary: "",
    },
  });

  // Calculate next version number
  const nextVersionNumber = React.useMemo(() => {
    return (currentInternalVersion ?? 0) + 1;
  }, [currentInternalVersion]);

  // Reset file and progress when sheet closes
  React.useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      resetProgress();
      form.reset();
    }
  }, [open, form, resetProgress]);

  const handleDrop = React.useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const handleRemoveFile = React.useCallback(() => {
    setSelectedFile(null);
  }, []);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsSubmitting(true);

    try {
      const uploaded = await uploadOne(selectedFile, STORAGE_PREFIXES.CREATIVE_ASSETS, {
        label: selectedFile.name,
      });
      const fileMeta = mapStorageResultToCreativeVersion(uploaded, selectedFile);

      await uploadVersionMutation.mutateAsync({
        creativeAssetId: assetId,
        fileUrl: fileMeta.fileUrl,
        fileKey: fileMeta.fileKey,
        fileName: fileMeta.fileName,
        fileSize: fileMeta.fileSize,
        mimeType: fileMeta.mimeType,
        versionNotes: data.versionNotes || undefined,
        changesSummary: data.changesSummary || undefined,
      });

      // Success is handled in mutation onSuccess
    } catch (error) {
      console.error("Error uploading version:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error("Failed to upload version", {
        description: uploadErrorMessage(error),
      });
      resetProgress();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-bold">Upload New Version</SheetTitle>
              <SheetDescription className="text-base">
                Upload version {nextVersionNumber} of this creative asset
              </SheetDescription>
            </div>
          </div>
          <SheetClose asChild>
            <Button
              size="icon"
              variant="ghost"
              className="p-0 m-0 size-auto hover:bg-transparent"
            >
              <XIcon className="h-5 w-5" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {/* File Upload Dropzone */}
              <div className="space-y-2">
                <FormLabel>File</FormLabel>
                <Dropzone
                  onDrop={handleDrop}
                  maxFiles={1}
                  maxSize={100 * 1024 * 1024} // 100MB
                  src={selectedFile ? [selectedFile] : undefined}
                  className={cn(
                    "w-full border-2 border-dashed transition-colors",
                    selectedFile && "border-primary/50"
                  )}
                >
                  <DropzoneEmptyState>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="mb-3 p-3 bg-primary/10 rounded-full">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-sm font-medium mb-1">Upload a file</p>
                      <p className="text-xs text-muted-foreground">
                        Drag and drop or click to select
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum file size: 100MB
                      </p>
                    </div>
                  </DropzoneEmptyState>
                  <DropzoneContent>
                    {selectedFile && (
                      <div className="w-full">
                        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
                          <div className="flex-shrink-0 p-2 bg-background rounded-md">
                            <File className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(selectedFile.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="flex-shrink-0 h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile();
                            }}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove file</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </DropzoneContent>
                </Dropzone>
              </div>

              <FormField
                control={form.control}
                name="versionNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Version Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add notes about this version..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="changesSummary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Changes Summary</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Summarize the changes in this version..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isUploading ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <UploadProgressRing
                    percent={progressPercent}
                    size={88}
                    label={progressLabel ?? selectedFile?.name}
                  />
                  <p className="text-sm text-muted-foreground">Uploading to storage…</p>
                </div>
              ) : null}
            </div>

            <SheetFooter className="gap-2 sm:gap-0">
              <SheetClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting || isUploading}>
                  Cancel
                </Button>
              </SheetClose>
              <Button type="submit" disabled={isSubmitting || isUploading || !selectedFile}>
                {(isSubmitting || isUploading) ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    {isUploading ? "Uploading..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Version
                  </>
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

