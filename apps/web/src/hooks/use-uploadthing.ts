"use client";

import * as React from "react";
import { generateReactHelpers, generateUploadButton, generateUploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing-types";
import { UPLOAD_ENDPOINTS } from "@/lib/uploadthing";

/**
 * Generate React helpers for UploadThing
 * This provides typed hooks and functions for programmatic uploads
 */
export const { useUploadThing: useUploadThingOriginal, uploadFiles } = generateReactHelpers<OurFileRouter>();

/**
 * Upload Button Component
 */
export const UploadButton = generateUploadButton<OurFileRouter>();

/**
 * Upload Dropzone Component
 */
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

interface UseUploadThingOptions {
  endpoint?: keyof typeof UPLOAD_ENDPOINTS;
  onUploadComplete?: (urls: string[]) => void;
  onUploadError?: (error: Error) => void;
}

interface UseUploadThingReturn {
  isUploading: boolean;
  progress: number;
  error: Error | null;
}

/**
 * Reusable hook for UploadThing file uploads
 * 
 * Note: For programmatic uploads, use UploadButton or UploadDropzone components.
 * This hook provides upload state tracking.
 * 
 * @example
 * ```tsx
 * const { isUploading, progress } = useUploadThing({
 *   endpoint: "IMAGE",
 *   onUploadComplete: (urls) => console.log("Uploaded:", urls),
 * });
 * 
 * <UploadButton
 *   endpoint="imageUploader"
 *   onClientUploadComplete={(res) => {
 *     console.log("Files: ", res);
 *   }}
 *   onUploadError={(error: Error) => {
 *     console.error(error);
 *   }}
 * />
 * ```
 */
export function useUploadThing(options: UseUploadThingOptions = {}): UseUploadThingReturn {
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<Error | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  React.useEffect(() => {
    // You can add global upload state listeners here if needed
    // For now, this provides a basic interface
  }, []);

  return {
    isUploading,
    progress,
    error,
  };
}

