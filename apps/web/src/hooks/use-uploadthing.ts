"use client";

import * as React from "react";
import { generateReactHelpers, generateUploadButton, generateUploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing-types";
import { UPLOAD_ENDPOINTS } from "@/lib/uploadthing";
import { apiUrl } from "@/lib/auth-client";

/**
 * UploadThing route handler lives on the API server (Hono), not the static web app.
 * In dev, apiUrl("/api/uploadthing") stays relative and Vite proxies /api → server.
 * In production, apiUrl points at VITE_SERVER_URL so session cookies are sent (same as tRPC/auth).
 */
const uploadthingUrl = apiUrl("/api/uploadthing");

const uploadthingInit = {
  url: uploadthingUrl,
  fetch: ((input, init) =>
    fetch(input, { ...init, credentials: "include" })) as typeof fetch,
};

export const { useUploadThing: useUploadThingOriginal, uploadFiles } =
  generateReactHelpers<OurFileRouter>(uploadthingInit);

export const UploadButton = generateUploadButton<OurFileRouter>(uploadthingInit);

export const UploadDropzone = generateUploadDropzone<OurFileRouter>(uploadthingInit);

/** UploadThing v7 may return `ufsUrl` instead of `url`. */
export function uploadThingFileUrl(file: {
  url?: string | null;
  ufsUrl?: string | null;
}): string {
  const url = file.ufsUrl ?? file.url ?? "";
  if (!url) throw new Error("File URL missing from upload response");
  return url;
}

export function uploadErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Upload failed. Please try again.";
}

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
 */
export function useUploadThing(_options: UseUploadThingOptions = {}): UseUploadThingReturn {
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<Error | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  return {
    isUploading,
    progress,
    error,
  };
}
