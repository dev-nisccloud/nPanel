import { UTApi } from "uploadthing/server";
const utapi = new UTApi();
const DURABLE_IMAGE_HOSTS = [
    "utfs.io",
    "uploadthing.com",
    "ufs.sh",
    "cloudinary.com",
];
function isDurablePublicImageUrl(url) {
    try {
        const host = new URL(url).hostname.toLowerCase();
        return DURABLE_IMAGE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
    }
    catch {
        return false;
    }
}
function inferReferer(sourceUrl, refererHint) {
    if (refererHint?.trim()) {
        try {
            return `${new URL(refererHint.trim()).origin}/`;
        }
        catch {
            /* fall through */
        }
    }
    try {
        return `${new URL(sourceUrl).origin}/`;
    }
    catch {
        return undefined;
    }
}
function extensionFromMime(mime) {
    const map = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/svg+xml": "svg",
    };
    return map[mime.toLowerCase()] ?? "png";
}
async function uploadBuffer(buffer, mime, filename) {
    const file = new File([buffer], filename, { type: mime });
    const res = await utapi.uploadFiles(file);
    const result = Array.isArray(res) ? res[0] : res;
    if (result?.data) {
        return result.data.ufsUrl ?? result.data.url;
    }
    const msg = result?.error &&
        typeof result.error === "object" &&
        "message" in result.error
        ? String(result.error.message)
        : "UploadThing upload failed";
    throw new Error(msg);
}
async function fetchImageWithReferer(sourceUrl, referer) {
    const res = await fetch(sourceUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (compatible; nPanel/1.0; +https://www.nisccloud.com)",
            Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
            ...(referer ? { Referer: referer } : {}),
        },
        redirect: "follow",
        signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText} fetching ${sourceUrl}`);
    }
    const mime = res.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
    if (!mime.startsWith("image/")) {
        throw new Error(`Unexpected content-type ${mime} for ${sourceUrl}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length === 0) {
        throw new Error(`Empty image body from ${sourceUrl}`);
    }
    return { buffer, mime };
}
async function uploadFromUrlViaUploadThing(sourceUrl) {
    const res = await utapi.uploadFilesFromUrl(sourceUrl);
    const result = Array.isArray(res) ? res[0] : res;
    if (result?.data) {
        return result.data.ufsUrl ?? result.data.url;
    }
    throw new Error("UploadThing uploadFilesFromUrl failed");
}
async function uploadFromUrlViaProxy(sourceUrl) {
    const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(sourceUrl)}`;
    return uploadFromUrlViaUploadThing(proxyUrl);
}
/**
 * Re-host an external image on UploadThing so Replicate (and email clients) can fetch it.
 * Tries direct fetch with site referer first, then UploadThing URL ingest, then wsrv.nl proxy.
 */
export async function mirrorExternalImageUrl(sourceUrl, options) {
    const trimmed = sourceUrl.trim();
    if (!trimmed)
        throw new Error("Empty image URL");
    if (isDurablePublicImageUrl(trimmed))
        return trimmed;
    const referer = inferReferer(trimmed, options?.refererHint);
    const prefix = options?.filenamePrefix ?? "neb-image";
    const errors = [];
    try {
        const { buffer, mime } = await fetchImageWithReferer(trimmed, referer);
        const ext = extensionFromMime(mime);
        return await uploadBuffer(buffer, mime, `${prefix}-${Date.now()}.${ext}`);
    }
    catch (e) {
        errors.push(`fetch+upload: ${e instanceof Error ? e.message : String(e)}`);
    }
    try {
        return await uploadFromUrlViaUploadThing(trimmed);
    }
    catch (e) {
        errors.push(`uploadFilesFromUrl: ${e instanceof Error ? e.message : String(e)}`);
    }
    try {
        return await uploadFromUrlViaProxy(trimmed);
    }
    catch (e) {
        errors.push(`proxy: ${e instanceof Error ? e.message : String(e)}`);
    }
    throw new Error(`Could not mirror image URL: ${errors.join("; ")}`);
}
