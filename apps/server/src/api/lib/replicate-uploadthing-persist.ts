import { isReplicateHostedMediaUrl } from "@npanel/api/lib/replicate-hosted-url";
import {
	ObjectStoragePersistError,
	persistRemoteUrlToObjectStorage,
} from "@npanel/api/lib/object-storage/persist";

export class ReplicatePersistError extends Error {
	constructor(message: string, options?: { cause?: unknown }) {
		super(message, options);
		this.name = "ReplicatePersistError";
	}
}

/**
 * Recursively re-upload Replicate delivery URLs to object storage for durable URLs.
 * Used by Zeepo Canvas and Zeepo Agent Replicate webhooks.
 */
export async function persistReplicateOutputToUploadThing(
	output: unknown,
): Promise<unknown> {
	if (!output) return output;

	if (typeof output === "string") {
		if (!isReplicateHostedMediaUrl(output)) return output;
		try {
			console.log(
				"[persistReplicateOutput] Re-uploading Replicate URL to object storage:",
				output,
			);
			const { fileUrl } = await persistRemoteUrlToObjectStorage(output, {
				skipNonReplicate: false,
			});
			console.log("[persistReplicateOutput] Persisted to:", fileUrl);
			return fileUrl;
		} catch (e) {
			if (e instanceof ReplicatePersistError || e instanceof ObjectStoragePersistError) {
				throw new ReplicatePersistError(e.message, { cause: e });
			}
			console.error("[persistReplicateOutput] Upload failed:", output, e);
			throw new ReplicatePersistError(
				"Could not persist Replicate asset to object storage",
				{ cause: e },
			);
		}
	}

	if (Array.isArray(output)) {
		return Promise.all(
			output.map((item) => persistReplicateOutputToUploadThing(item)),
		);
	}

	if (typeof output === "object" && output !== null) {
		const newObj: Record<string, unknown> = {};
		const entries = Object.entries(output);
		await Promise.all(
			entries.map(async ([key, value]) => {
				newObj[key] = await persistReplicateOutputToUploadThing(value);
			}),
		);
		return newObj;
	}

	return output;
}

/** Preferred name for new code */
export const persistReplicateOutputToStorage = persistReplicateOutputToUploadThing;
