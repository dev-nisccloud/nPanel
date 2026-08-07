import { isReplicateHostedMediaUrl } from "../replicate-hosted-url";
import { buildObjectKey, putObjectBuffer, sanitizeFileName } from "./client";
import { getPublicObjectUrl, isObjectStorageConfigured } from "./config";
import { STORAGE_PREFIXES } from "./prefixes";
export class ObjectStoragePersistError extends Error {
    constructor(message, options) {
        super(message, options);
        this.name = "ObjectStoragePersistError";
    }
}
const DURABLE_STORAGE_HOST_PATTERN = /storage\.nisccloud\.com|npanel-uploads|uploadthing\.com|utfs\.io|ufs\.sh/i;
export function isPersistedStorageAsset(fileUrl, storageKey) {
    if (storageKey?.trim())
        return true;
    return DURABLE_STORAGE_HOST_PATTERN.test(fileUrl);
}
/** @deprecated Use isPersistedStorageAsset */
export const isPersistedUploadThingAsset = isPersistedStorageAsset;
function extensionFromMime(mime) {
    const map = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/svg+xml": "svg",
    };
    return map[mime.toLowerCase()] ?? "bin";
}
function parseDataUrl(dataUrl) {
    const [header, b64] = dataUrl.split(",");
    const mimeMatch = header?.match(/data:([^;]+)/);
    const mime = mimeMatch?.[1] ?? "application/octet-stream";
    const buffer = Buffer.from(b64 ?? "", "base64");
    return { buffer, mime };
}
async function fetchRemoteBuffer(sourceUrl) {
    const res = await fetch(sourceUrl);
    if (!res.ok) {
        throw new ObjectStoragePersistError(`Failed to fetch ${sourceUrl}: ${res.status}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "application/octet-stream";
    const fromPath = new URL(sourceUrl).pathname.split("/").pop();
    const fileName = fromPath && fromPath.length > 0 ? sanitizeFileName(fromPath) : `remote-${Date.now()}.${extensionFromMime(mime)}`;
    return { buffer, mime, fileName };
}
export async function persistBufferToObjectStorage(params) {
    if (!isObjectStorageConfigured()) {
        throw new ObjectStoragePersistError("Object storage is not configured");
    }
    const prefix = params.prefix ?? STORAGE_PREFIXES.REPLICATE;
    const key = buildObjectKey({
        prefix,
        fileName: params.fileName,
        userId: params.userId,
    });
    const uploaded = await putObjectBuffer({
        key,
        body: params.buffer,
        contentType: params.contentType,
    });
    return { fileUrl: uploaded.publicUrl, storageKey: uploaded.key };
}
export async function persistRemoteUrlToObjectStorage(sourceUrl, options) {
    const trimmed = sourceUrl.trim();
    if (!trimmed) {
        throw new ObjectStoragePersistError("Empty source URL");
    }
    if (options?.skipNonReplicate !== false && !isReplicateHostedMediaUrl(trimmed)) {
        if (isPersistedStorageAsset(trimmed)) {
            return { fileUrl: trimmed, storageKey: "" };
        }
        return { fileUrl: trimmed, storageKey: "" };
    }
    if (!isObjectStorageConfigured()) {
        throw new ObjectStoragePersistError("Object storage is not configured");
    }
    if (trimmed.startsWith("data:")) {
        const { buffer, mime } = parseDataUrl(trimmed);
        const fileName = options?.fileName ??
            `upload-${Date.now()}.${extensionFromMime(mime)}`;
        return persistBufferToObjectStorage({
            buffer,
            contentType: mime,
            fileName,
            prefix: options?.prefix,
            userId: options?.userId,
        });
    }
    const { buffer, mime, fileName } = await fetchRemoteBuffer(trimmed);
    return persistBufferToObjectStorage({
        buffer,
        contentType: mime,
        fileName: options?.fileName ?? fileName,
        prefix: options?.prefix ?? STORAGE_PREFIXES.REPLICATE,
        userId: options?.userId,
    });
}
/** Persist a remote URL and return only the public URL (Zeepo image edits). */
export async function persistImageUrlToStorage(sourceUrl) {
    const { fileUrl } = await persistRemoteUrlToObjectStorage(sourceUrl, {
        skipNonReplicate: false,
        prefix: STORAGE_PREFIXES.REPLICATE,
    });
    return fileUrl;
}
export function isDurablePublicMediaUrl(url) {
    if (isPersistedStorageAsset(url))
        return true;
    try {
        const host = new URL(url).hostname.toLowerCase();
        return host.includes("cloudinary.com");
    }
    catch {
        return false;
    }
}
export async function persistExternalImageToStorage(sourceUrl, options) {
    const trimmed = sourceUrl.trim();
    if (isDurablePublicMediaUrl(trimmed))
        return trimmed;
    if (!isObjectStorageConfigured()) {
        throw new ObjectStoragePersistError("Object storage is not configured");
    }
    // Try direct fetch with referer (mirror-external-image behaviour)
    const referer = options?.refererHint?.trim()
        ? (() => {
            try {
                return `${new URL(options.refererHint.trim()).origin}/`;
            }
            catch {
                return undefined;
            }
        })()
        : (() => {
            try {
                return `${new URL(trimmed).origin}/`;
            }
            catch {
                return undefined;
            }
        })();
    try {
        const res = await fetch(trimmed, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; nPanel/1.0; +https://www.nisccloud.com)",
                Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
                ...(referer ? { Referer: referer } : {}),
            },
        });
        if (res.ok) {
            const buffer = Buffer.from(await res.arrayBuffer());
            const mime = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "image/png";
            const prefix = options?.filenamePrefix ?? "mirror";
            const { fileUrl } = await persistBufferToObjectStorage({
                buffer,
                contentType: mime,
                fileName: `${prefix}-${Date.now()}.${extensionFromMime(mime)}`,
                prefix: STORAGE_PREFIXES.EXTERNAL_MIRROR,
            });
            return fileUrl;
        }
    }
    catch {
        /* fall through to URL ingest */
    }
    const { fileUrl } = await persistRemoteUrlToObjectStorage(trimmed, {
        skipNonReplicate: false,
        prefix: STORAGE_PREFIXES.EXTERNAL_MIRROR,
        fileName: `${options?.filenamePrefix ?? "mirror"}-${Date.now()}.png`,
    });
    return fileUrl;
}
/** @deprecated Use persistRemoteUrlToObjectStorage */
export async function persistUrlToUploadThing(replicateUrl) {
    const result = await persistRemoteUrlToObjectStorage(replicateUrl);
    return { fileUrl: result.fileUrl, storageKey: result.storageKey || undefined };
}
export { getPublicObjectUrl };
