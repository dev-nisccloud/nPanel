"use client";

import * as React from "react";
import { generateReactHelpers, generateUploadButton, generateUploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing-types";
import { UPLOAD_ENDPOINTS } from "@/lib/uploadthing";
import { apiUrl } from "@/lib/auth-client";

/**
 * UploadThing route handler lives on the API server (Hono), proxied at `/api/uploadthing`.
 * Same-origin requests send session cookies by default (no custom fetch - avoids breaking ingest XHR).
 */
const uploadthingInit = {
  url: apiUrl("/api/uploadthing"),
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
  if (typeof error === "object" && error !== null && "message" in error) {
    const msg = (error as { message: unknown }).message;
    if (typeof msg === "string" && msg) return msg;
  }
  return "Upload failed. Please try again.";
}

const IMAGE_MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
};

/** Windows/some browsers leave `file.type` empty - normalize before UploadThing signs the upload. */
export function normalizeImageFilesForUpload(files: File[]): File[] {
  return files.map((file) => {
    const type = file.type?.trim();
    if (type && type !== "application/octet-stream") return file;
    const ext = file.name.split(".").pop()?.toLowerCase();
    const resolved = ext ? IMAGE_MIME_BY_EXT[ext] : undefined;
    if (!resolved) return file;
    return new File([file], file.name, { type: resolved, lastModified: file.lastModified });
  });
}

type UploadFilesOptions = NonNullable<Parameters<typeof uploadFiles>[1]>;

/**
 * Zeepo chat attachments - uses the same `creativeAsset` blob route as creative-assets version uploads
 * (one file per request; that route is maxFileCount: 1).
 */
export async function uploadZeepoAgentFiles(
  options: UploadFilesOptions & { files: File[] },
): Promise<Awaited<ReturnType<typeof uploadFiles>>> {
  const files = normalizeImageFilesForUpload(options.files);
  const { onUploadBegin, onUploadProgress, ...rest } = options;
  const uploaded: Awaited<ReturnType<typeof uploadFiles>> = [];

  for (const file of files) {
    onUploadBegin?.({ file });
    const batch = await uploadFiles(UPLOAD_ENDPOINTS.CREATIVE_ASSET, {
      ...rest,
      files: [file],
      onUploadProgress,
    });
    uploaded.push(...batch);
  }

  return uploaded;
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
