import { persistExternalImageToStorage } from "../object-storage/persist";
/**
 * Re-host an external image on object storage so Replicate (and email clients) can fetch it.
 */
export async function mirrorExternalImageUrl(sourceUrl, options) {
    return persistExternalImageToStorage(sourceUrl, {
        refererHint: options?.refererHint,
        filenamePrefix: options?.filenamePrefix,
    });
}
