/** MinIO / S3 key prefixes for nPanel uploads */
export declare const STORAGE_PREFIXES: {
    readonly FILES: "uploads/files";
    readonly IMAGES: "uploads/images";
    readonly CREATIVE_ASSETS: "creative-assets";
    readonly EMAIL_BUILDER: "email-builder";
    readonly ZEEPO_AGENT: "zeepo-agent";
    readonly ZEEPO_AI: "zeepo-ai";
    readonly REPLICATE: "replicate";
    readonly EXTERNAL_MIRROR: "external-mirror";
};
export type StoragePrefix = (typeof STORAGE_PREFIXES)[keyof typeof STORAGE_PREFIXES];
