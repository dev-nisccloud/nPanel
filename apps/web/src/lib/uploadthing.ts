/**
 * UploadThing Client Configuration
 * Reusable client for all upload operations across the application
 */

import { createUploadthing } from "uploadthing/next";

export const f = createUploadthing();

/**
 * Helper function to get file size in bytes from string (e.g., "32MB" -> 33554432)
 */
export function parseFileSize(size: string): number {
  const units: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
  };

  const match = size.match(/^(\d+)([A-Z]+)$/);
  if (!match) {
    throw new Error(`Invalid file size format: ${size}`);
  }

  const [, value, unit] = match;
  return parseInt(value, 10) * (units[unit] || 1);
}

/**
 * File upload endpoints
 * Use these to reference specific upload endpoints
 */
export const UPLOAD_ENDPOINTS = {
  FILE: "fileUploader",
  IMAGE: "imageUploader",
  EMAIL_BUILDER_IMAGE: "emailBuilderImage",
  DOCUMENT: "documentUploader",
  CREATIVE_ASSET_VERSION: "creativeAssetVersion",
  CREATIVE_ASSET: "creativeAsset",
  CONTENT_CALENDAR_MEDIA: "contentCalendarMedia",
  ZEEPO_AGENT_ATTACHMENT: "zeepoAgentAttachment",
} as const;

/**
 * Common file type validators
 */
export const FILE_TYPES = {
  IMAGES: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  DOCUMENTS: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ],
  ALL: [] as string[],
} as const;

