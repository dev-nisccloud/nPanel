import { randomUUID } from "node:crypto";
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { nebMediaLibrary } from "@npanel/db/schema/nisc-email-builder";
import { isPersistedStorageAsset } from "../object-storage/persist";
/** True when the asset lives on durable object storage (not a transient Replicate URL). */
export function isPersistedUploadThingAsset(fileUrl, storageKey) {
    return isPersistedStorageAsset(fileUrl, storageKey);
}
export { isPersistedStorageAsset };
/**
 * Upsert-by-URL into the user's Nisc media library (deduped per user + fileUrl).
 * Safe to call from builds, revisions, and manual uploads.
 */
export async function saveToNebMediaLibrary(params) {
    if (!isPersistedUploadThingAsset(params.fileUrl, params.storageKey)) {
        return null;
    }
    const existing = await db.query.nebMediaLibrary.findFirst({
        where: and(eq(nebMediaLibrary.userId, params.userId), eq(nebMediaLibrary.fileUrl, params.fileUrl)),
    });
    if (existing)
        return existing;
    const [item] = await db
        .insert(nebMediaLibrary)
        .values({
        id: randomUUID(),
        userId: params.userId,
        teamId: params.teamId ?? null,
        fileName: params.fileName,
        fileSize: params.fileSize,
        mimeType: params.mimeType,
        fileUrl: params.fileUrl,
        storageKey: params.storageKey ?? null,
        description: params.description ?? null,
        metadata: params.metadata ?? undefined,
        createdAt: new Date(),
    })
        .returning();
    return item ?? null;
}
