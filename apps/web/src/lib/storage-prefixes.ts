/** MinIO / S3 key prefixes  keep in sync with packages/api object-storage/prefixes.ts */
export const STORAGE_PREFIXES = {
	FILES: "uploads/files",
	IMAGES: "uploads/images",
	CREATIVE_ASSETS: "creative-assets",
	EMAIL_BUILDER: "email-builder",
	ZEEPO_AGENT: "zeepo-agent",
	ZEEPO_AI: "zeepo-ai",
} as const;
