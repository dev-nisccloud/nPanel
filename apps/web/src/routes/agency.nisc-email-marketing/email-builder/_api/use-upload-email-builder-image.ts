import * as React from "react";
import { trpc } from "@/utils/trpc";
import { useAppFileUpload } from "@/hooks/use-app-file-upload";
import { STORAGE_PREFIXES } from "@/lib/storage-prefixes";
import { mapStorageResultToAttachment } from "@/lib/app-file-upload";
import { toast } from "sonner";

/**
 * Resilient email builder image upload hook.
 * Replaces UploadThing with new object storage system.
 * Tracks uploads as operations for network interruption resilience.
 * 
 * Features:
 * - Direct S3/R2 upload (no UploadThing)
 * - Progress tracking
 * - Auto-saves to library
 * - Creates operation record for tracking
 * - Network interruption resistant
 */
export function useUploadEmailBuilderImage() {
    const utils = trpc.useUtils();
    const { uploadOne, isUploading, progressPercent, progressLabel, resetProgress } = useAppFileUpload();
    const createLibraryItem = trpc.emailBuilderLibrary.createFromUpload.useMutation();
    const createOperation = trpc.emailBuilder.createOperation.useMutation();

    const uploadImage = React.useCallback(
        async (file: File, designId?: string): Promise<{ url: string; storageKey: string }> => {
            try {
                // Create operation record for tracking (like Zeepo generations)
                let operationId: string | undefined;
                if (designId) {
                    const opResult = await createOperation.mutateAsync({
                        designId,
                        operationType: "IMAGE_UPLOAD",
                        status: "PROCESSING",
                        payload: {
                            fileName: file.name,
                            fileSize: file.size,
                            mimeType: file.type,
                        },
                    });
                    operationId = opResult.data?.id;
                }

                // Upload to object storage (not UploadThing)
                const result = await uploadOne(
                    file,
                    STORAGE_PREFIXES.EMAIL_BUILDER,
                    { label: file.name }
                );

                // Save to library for reuse
                await createLibraryItem.mutateAsync({
                    fileName: file.name,
                    fileSize: result.size,
                    mimeType: file.type || result.contentType || "image/png",
                    fileUrl: result.publicUrl,
                    storageKey: result.key,
                });

                // Update operation as completed
                if (operationId && designId) {
                    await createOperation.mutateAsync({
                        designId,
                        operationType: "IMAGE_UPLOAD",
                        status: "COMPLETED",
                        payload: {
                            result: {
                                url: result.publicUrl,
                                key: result.key,
                            },
                        },
                    });
                }

                // Invalidate queries to show new image in library
                utils.emailBuilderLibrary.list.invalidate();

                return {
                    url: result.publicUrl,
                    storageKey: result.key,
                };
            } catch (error) {
                toast.error("Failed to upload image", {
                    description: error instanceof Error ? error.message : "Please try again",
                });
                throw error;
            } finally {
                // Reset progress after upload completes/fails
                setTimeout(resetProgress, 1000);
            }
        },
        [uploadOne, createLibraryItem, createOperation, utils, resetProgress]
    );

    return {
        uploadImage,
        isUploading,
        progressPercent,
        progressLabel,
    };
}
