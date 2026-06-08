import Replicate from "replicate";
import { UTApi } from "uploadthing/server";
import { isReplicateHostedMediaUrl } from "../replicate-hosted-url";
import { NebImagePersistError } from "./imagen";
const utapi = new UTApi();
async function persistUrlToUploadThing(replicateUrl) {
    if (!isReplicateHostedMediaUrl(replicateUrl)) {
        return { fileUrl: replicateUrl };
    }
    const res = await utapi.uploadFilesFromUrl(replicateUrl);
    const result = Array.isArray(res) ? res[0] : res;
    if (result?.data) {
        const fileUrl = result.data.ufsUrl || result.data.url;
        return { fileUrl, storageKey: result.data.key };
    }
    const msg = result?.error &&
        typeof result.error === "object" &&
        "message" in result.error
        ? String(result.error.message)
        : "UploadThing returned no data";
    throw new NebImagePersistError(msg);
}
function extractImageUrl(output) {
    if (typeof output === "string" && output.startsWith("http"))
        return output;
    if (Array.isArray(output) && typeof output[0] === "string")
        return output[0];
    if (output && typeof output === "object" && "url" in output) {
        const u = output.url;
        if (typeof u === "function")
            return u();
    }
    throw new Error(`Unexpected Nano Banana output: ${JSON.stringify(output).slice(0, 200)}`);
}
/**
 * google/nano-banana-pro - creative mockups and email asset imagery.
 */
export async function generateNanoBananaPro(replicate, input) {
    const prediction = await replicate.predictions.create({
        model: "google/nano-banana-pro",
        input: {
            prompt: input.prompt,
            resolution: input.resolution ?? "2K",
            image_input: input.imageInput ?? [],
            aspect_ratio: input.aspectRatio ?? "3:4",
            output_format: input.outputFormat ?? "png",
            safety_filter_level: "block_only_high",
            allow_fallback_model: false,
        },
    });
    let result = prediction;
    const deadline = Date.now() + 180_000;
    while (result.status !== "succeeded" &&
        result.status !== "failed" &&
        result.status !== "canceled") {
        if (Date.now() > deadline) {
            throw new Error(`Nano Banana prediction timed out: ${result.id}`);
        }
        await new Promise((r) => setTimeout(r, 2_000));
        result = await replicate.predictions.get(result.id);
    }
    if (result.status !== "succeeded") {
        throw new Error(result.error ?? `Nano Banana prediction ${result.status}: ${result.id}`);
    }
    const replicateUrl = extractImageUrl(result.output);
    return persistUrlToUploadThing(replicateUrl);
}
