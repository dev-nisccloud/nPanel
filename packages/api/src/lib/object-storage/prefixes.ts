/** MinIO / S3 key prefixes for nPanel uploads */
export const STORAGE_PREFIXES = {
	FILES: "uploads/files",
	IMAGES: "uploads/images",
	CREATIVE_ASSETS: "creative-assets",
	EMAIL_BUILDER: "email-builder",
	EMAIL_MARKETING_UPLOADS: "email-marketing-uploads",
	ZEEPO_AGENT: "zeepo-agent",
	ZEEPO_AI: "zeepo-ai",
	REPLICATE: "replicate",
	EXTERNAL_MIRROR: "external-mirror",
} as const;

export type StoragePrefix = (typeof STORAGE_PREFIXES)[keyof typeof STORAGE_PREFIXES];
