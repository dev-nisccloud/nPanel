import { UTApi } from "uploadthing/server";

import { isReplicateHostedMediaUrl } from "@npanel/api/lib/replicate-hosted-url";

const utapi = new UTApi();

export class ReplicatePersistError extends Error {
	constructor(message: string, options?: { cause?: unknown }) {
		super(message, options);
		this.name = "ReplicatePersistError";
	}
}

/**
 * Recursively re-upload Replicate delivery URLs to UploadThing for durable URLs.
 * Used by Zeepo Canvas and Zeepo Agent Replicate webhooks.
 *
 * **Throws ReplicatePersistError** if any Replicate-hosted URL cannot be persisted —
 * callers must mark the generation FAILED instead of saving ephemeral URLs.
 */
export async function persistReplicateOutputToUploadThing(
	output: unknown,
): Promise<unknown> {
	if (!output) return output;

	if (typeof output === "string") {
		if (!isReplicateHostedMediaUrl(output)) return output;
		try {
			console.log(
				"[persistReplicateOutput] Re-uploading Replicate URL to UploadThing:",
				output,
			);
			const res = await utapi.uploadFilesFromUrl(output);
			const result = Array.isArray(res) ? res[0] : res;

			if (result?.data) {
				const persistentUrl = result.data.ufsUrl || result.data.url;
				console.log("[persistReplicateOutput] Persisted to:", persistentUrl);
				return persistentUrl;
			}
			const msg =
				result?.error &&
				typeof result.error === "object" &&
				"message" in result.error
					? String((result.error as { message?: string }).message)
					: "UploadThing returned no data";
			throw new ReplicatePersistError(msg);
		} catch (e) {
			if (e instanceof ReplicatePersistError) throw e;
			console.error("[persistReplicateOutput] Upload failed:", output, e);
			throw new ReplicatePersistError(
				"Could not persist Replicate asset to UploadThing",
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
