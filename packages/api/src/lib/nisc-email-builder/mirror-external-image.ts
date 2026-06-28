import { persistExternalImageToStorage } from "../object-storage/persist";

export type MirrorExternalImageOptions = {
	refererHint?: string | null;
	filenamePrefix?: string;
};

/**
 * Re-host an external image on object storage so Replicate (and email clients) can fetch it.
 */
export async function mirrorExternalImageUrl(
	sourceUrl: string,
	options?: MirrorExternalImageOptions,
): Promise<string> {
	return persistExternalImageToStorage(sourceUrl, {
		refererHint: options?.refererHint,
		filenamePrefix: options?.filenamePrefix,
	});
}
