import { isPersistedStorageAsset } from "../object-storage/persist";
export type SaveNebMediaLibraryParams = {
    userId: string;
    teamId?: string | null;
    fileName: string;
    fileSize: number;
    mimeType: string;
    fileUrl: string;
    storageKey?: string | null;
    description?: string | null;
    metadata?: Record<string, unknown>;
};
/** True when the asset lives on durable object storage (not a transient Replicate URL). */
export declare function isPersistedUploadThingAsset(fileUrl: string, storageKey?: string | null): boolean;
export { isPersistedStorageAsset };
/**
 * Upsert-by-URL into the user's Nisc media library (deduped per user + fileUrl).
 * Safe to call from builds, revisions, and manual uploads.
 */
export declare function saveToNebMediaLibrary(params: SaveNebMediaLibraryParams): Promise<{
    id: string;
    createdAt: Date;
    userId: string;
    teamId: string | null;
    metadata: unknown;
    description: string | null;
    storageKey: string | null;
    mimeType: string;
    fileName: string;
    fileSize: number;
    fileUrl: string;
} | null>;
