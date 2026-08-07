import { getPublicObjectUrl } from "./config";
export declare class ObjectStoragePersistError extends Error {
    constructor(message: string, options?: {
        cause?: unknown;
    });
}
export declare function isPersistedStorageAsset(fileUrl: string, storageKey?: string | null): boolean;
/** @deprecated Use isPersistedStorageAsset */
export declare const isPersistedUploadThingAsset: typeof isPersistedStorageAsset;
export declare function persistBufferToObjectStorage(params: {
    buffer: Buffer | Uint8Array;
    contentType: string;
    fileName: string;
    prefix?: string;
    userId?: string;
}): Promise<{
    fileUrl: string;
    storageKey: string;
}>;
export declare function persistRemoteUrlToObjectStorage(sourceUrl: string, options?: {
    prefix?: string;
    fileName?: string;
    userId?: string;
    /** When true, non-Replicate URLs that are already durable are returned unchanged */
    skipNonReplicate?: boolean;
}): Promise<{
    fileUrl: string;
    storageKey: string;
}>;
/** Persist a remote URL and return only the public URL (Zeepo image edits). */
export declare function persistImageUrlToStorage(sourceUrl: string): Promise<string>;
export declare function isDurablePublicMediaUrl(url: string): boolean;
export declare function persistExternalImageToStorage(sourceUrl: string, options?: {
    refererHint?: string | null;
    filenamePrefix?: string;
}): Promise<string>;
/** @deprecated Use persistRemoteUrlToObjectStorage */
export declare function persistUrlToUploadThing(replicateUrl: string): Promise<{
    fileUrl: string;
    storageKey: string | undefined;
}>;
export { getPublicObjectUrl };
