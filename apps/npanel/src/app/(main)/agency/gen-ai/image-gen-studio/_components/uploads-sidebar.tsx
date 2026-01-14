"use client";

import { useState, useCallback } from "react";
import { Upload, Loader, AlertTriangle, Trash2, Check } from "lucide-react";
import { useFilePicker } from "use-file-picker";

import { ActiveTool, Editor } from "../_lib/types";
import { useCreateUpload } from "../_api/use-create-upload";
import { useGetUploads } from "../_api/use-get-uploads";
import { useDeleteUpload } from "../_api/use-delete-upload";
import { uploadFiles } from "@/hooks/use-uploadthing";
import { UPLOAD_ENDPOINTS } from "@/lib/uploadthing";
import { ToolSidebarClose } from "./tool-sidebar-close";
import { ToolSidebarHeader } from "./tool-sidebar-header";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useConfirm } from "@/hooks/use-confirm";

interface UploadsSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

interface SelectedFile {
  file: File;
  preview: string;
  progress?: number; // 0-100
  status?: "pending" | "uploading" | "completed" | "error";
}

/**
 * Normalize progress value from UploadThing to a 0-100 percentage
 */
function normalizeProgress(progress: unknown): number {
  if (typeof progress === "number") {
    return Math.round(Math.min(100, Math.max(0, progress)));
  }

  if (progress && typeof progress === "object") {
    const progressObj = progress as Record<string, unknown>;
    if ("progress" in progressObj && typeof progressObj.progress === "number") {
      const progressValue = progressObj.progress;
      if (progressValue > 1) {
        return Math.round(Math.min(100, Math.max(0, progressValue)));
      }
      return Math.round(Math.min(100, Math.max(0, progressValue * 100)));
    }
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

export const UploadsSidebar = ({ editor, activeTool, onChangeActiveTool }: UploadsSidebarProps) => {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUploadingIndex, setCurrentUploadingIndex] = useState(0);

  const [ConfirmDialog, confirm] = useConfirm(
    "Delete Upload",
    "Are you sure you want to delete this upload? This action cannot be undone."
  );

  const createUploadMutation = useCreateUpload();
  const { data: uploadsData, isLoading: isLoadingUploads, isError: isErrorUploads } = useGetUploads({
    page: 1,
    limit: 50,
  });
  const deleteUploadMutation = useDeleteUpload();

  // File picker - only images
  const { openFilePicker } = useFilePicker({
    accept: [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"],
    multiple: true,
    onFilesSuccessfullySelected: ({ plainFiles }: { plainFiles: File[] }) => {
      const newFiles: SelectedFile[] = plainFiles.map((file: File) => ({
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: "pending" as const,
      }));
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    },
  });

  const removeSelectedFile = useCallback((index: number) => {
    if (isUploading) return; // Disable removal during upload
    setSelectedFiles((prev) => {
      const newFiles = [...prev];
      // Revoke object URL to prevent memory leak
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  }, [isUploading]);

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    const filesToUpload = [...selectedFiles]; // Capture current files
    setCurrentUploadingIndex(0);

    let errorIndex = 0;
    try {
      // Upload files one at a time to track per-file progress
      for (let i = 0; i < filesToUpload.length; i++) {
        errorIndex = i;
        setCurrentUploadingIndex(i);
        const selectedFile = filesToUpload[i];

        // Mark current file as uploading
        setSelectedFiles((prev) => {
          const newFiles = [...prev];
          if (newFiles[i]) {
            newFiles[i] = {
              ...newFiles[i],
              status: "uploading" as const,
              progress: 0,
            };
          }
          return newFiles;
        });

        // Upload single file to UploadThing
        const response = await uploadFiles(UPLOAD_ENDPOINTS.IMAGE, {
          files: [selectedFile.file],
          onUploadProgress: (progress) => {
            const normalizedProgress = normalizeProgress(progress);
            
            // Update progress for current uploading file
            setSelectedFiles((prev) => {
              const newFiles = [...prev];
              if (newFiles[i]) {
                newFiles[i] = {
                  ...newFiles[i],
                  progress: normalizedProgress,
                };
              }
              return newFiles;
            });
          },
        });

        if (!response || response.length === 0) {
          throw new Error(`Failed to upload ${selectedFile.file.name}`);
        }

        const uploadedFile = response[0];
        const fileUrl = uploadedFile.ufsUrl || uploadedFile.url || "";
        
        if (!fileUrl) {
          throw new Error("File URL not found in upload response");
        }

        // Mark as completed before saving to DB
        setSelectedFiles((prev) => {
          const newFiles = [...prev];
          if (newFiles[i]) {
            newFiles[i] = {
              ...newFiles[i],
              status: "completed" as const,
              progress: 100,
            };
          }
          return newFiles;
        });

        // Save to database
        await createUploadMutation.mutateAsync({
          fileUrl,
          fileKey: uploadedFile.key || "",
          fileName: uploadedFile.name || selectedFile.file.name,
          fileSize: uploadedFile.size || selectedFile.file.size,
          mimeType: uploadedFile.type || selectedFile.file.type || "image/png",
          fileMetadata: undefined, // Dimensions not available from UploadThing response
        });
      }

      // Wait a bit to show completed state, then clear
      setTimeout(() => {
        filesToUpload.forEach((sf) => URL.revokeObjectURL(sf.preview));
        setSelectedFiles([]);
        setCurrentUploadingIndex(0);
      }, 1500);
    } catch (error) {
      console.error("Error uploading files:", error);
      // Mark current file as error
      setSelectedFiles((prev) => {
        const newFiles = [...prev];
        if (newFiles[errorIndex]) {
          newFiles[errorIndex] = {
            ...newFiles[errorIndex],
            status: "error" as const,
          };
        }
        return newFiles;
      });
    } finally {
      setIsUploading(false);
    }
  }, [selectedFiles, createUploadMutation]);

  const handleImageClick = useCallback(
    (fileUrl: string) => {
      editor?.addImage(fileUrl);
    },
    [editor]
  );

  const handleDeleteUpload = useCallback(
    async (uploadId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const ok = await confirm();
      if (ok) {
        await deleteUploadMutation.mutateAsync({ id: uploadId });
      }
    },
    [deleteUploadMutation, confirm]
  );

  const onClose = () => {
    onChangeActiveTool("select");
  };

  return (
    <aside
      className={cn(
        "bg-white relative border-r z-[40] w-[360px] h-full flex-col overflow-hidden",
        activeTool === "uploads" ? "flex" : "hidden"
      )}
    >
      <ConfirmDialog />
      <ToolSidebarHeader title="Uploads" description="Upload and manage your images" />
      
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Upload Section */}
        <div className="flex-shrink-0 p-4 border-b space-y-4">
          <Button
            onClick={() => openFilePicker()}
            variant="outline"
            className="w-full"
            disabled={isUploading}
          >
            <Upload className="size-4 mr-2" />
            Select Images
          </Button>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Selected images</p>
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-2">
                  {selectedFiles.map((selectedFile, index) => {
                    const progress = selectedFile.progress || 0;
                    const isCompleted = selectedFile.status === "completed";
                    const isFileUploading = selectedFile.status === "uploading" && index === currentUploadingIndex;
                    const blurHeight = isCompleted ? 100 : progress;

                    return (
                      <div
                        key={index}
                        className="relative flex-shrink-0 w-20 h-20 rounded border overflow-hidden group"
                      >
                        <img
                          src={selectedFile.preview}
                          alt={selectedFile.file.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Progress blur overlay from bottom to top */}
                        {(isFileUploading || isCompleted) && (
                          <div
                            className={cn(
                              "absolute bottom-0 left-0 right-0 transition-all duration-300",
                              isCompleted ? "bg-green-500/60 backdrop-blur-sm" : "bg-black/40 backdrop-blur-sm"
                            )}
                            style={{
                              height: `${blurHeight}%`,
                            }}
                          >
                            {isCompleted && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Check className="size-6 text-white" />
                              </div>
                            )}
                          </div>
                        )}
                        {/* Remove button - disabled during upload */}
                        {!isUploading && (
                          <button
                            onClick={() => removeSelectedFile(index)}
                            disabled={isUploading}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center disabled:opacity-0 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="size-4 text-white" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader className="size-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="size-4 mr-2" />
                    Upload {selectedFiles.length} image{selectedFiles.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Divider */}
        {selectedFiles.length > 0 && <Separator />}

        {/* Uploaded Images List */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="px-4 py-2 flex-shrink-0">
            <p className="text-sm font-medium">Your uploads</p>
          </div>
          {isLoadingUploads ? (
            <div className="flex items-center justify-center flex-1">
              <Loader className="size-6 text-muted-foreground animate-spin" />
            </div>
          ) : isErrorUploads ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-2">
              <AlertTriangle className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Failed to load uploads</p>
            </div>
          ) : !uploadsData?.data || uploadsData.data.length === 0 ? (
            <div className="flex items-center justify-center flex-1">
              <p className="text-sm text-muted-foreground">No uploads yet</p>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Type assertion to work around TypeScript's "Type instantiation is excessively deep" error */}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {((uploadsData?.data as any) || []).map((upload: { id: string; fileUrl: string; fileName: string }) => (
                    <div
                      key={upload.id}
                      onClick={() => handleImageClick(upload.fileUrl)}
                      className="relative w-full aspect-square group hover:opacity-75 transition bg-muted rounded-sm overflow-hidden border cursor-pointer"
                    >
                      <img
                        src={upload.fileUrl}
                        alt={upload.fileName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <button
                        onClick={(e) => handleDeleteUpload(upload.id, e)}
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
