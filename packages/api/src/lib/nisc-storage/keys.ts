import { randomBytes } from "node:crypto";

const CONTROL = /[\u0000-\u001f\u007f]/;
const BUCKET_NAME = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;

/** Server-generated zip downloads. Customers cannot choose this prefix. */
export const INTERNAL_OBJECT_PREFIX = "_nisc-packs";

export function sanitizeFileSegment(name: string): string | null {
	if (typeof name !== "string") return null;
	const trimmed = name.trim();
	if (!trimmed || trimmed.length > 200) return null;
	if (CONTROL.test(trimmed) || /[\\/]/.test(trimmed)) return null;
	if (trimmed === "." || trimmed === "..") return null;
	if (trimmed.startsWith(INTERNAL_OBJECT_PREFIX) || trimmed.startsWith("_nisc-")) return null;
	return trimmed;
}

/**
 * Folder prefix. Empty string is the bucket root.
 * Rejects traversal, empty segments, and the internal pack prefix.
 */
export function normalizeStoragePrefix(input: string): string | null {
	if (typeof input !== "string" || input.length > 1024) return null;
	if (CONTROL.test(input)) return null;
	const collapsed = input
		.replace(/\\/g, "/")
		.replace(/^\/+/, "")
		.replace(/\/+$/, "")
		.replace(/\/+/g, "/");
	if (collapsed === "") return "";
	const parts = collapsed.split("/");
	if (parts.length > 32) return null;
	if (parts.some((part) => part.length === 0 || part === "." || part === ".." || part.length > 255)) {
		return null;
	}
	if (parts[0] === INTERNAL_OBJECT_PREFIX || parts[0].startsWith("_nisc-")) return null;
	return parts.join("/");
}

/** A file key. The root itself is not a file. */
export function normalizeObjectKey(input: string): string | null {
	const prefix = normalizeStoragePrefix(input);
	if (prefix === null || prefix === "") return null;
	return prefix;
}

export function joinStorageKey(prefix: string, fileName: string): string | null {
	const folder = normalizeStoragePrefix(prefix);
	const segment = sanitizeFileSegment(fileName);
	if (folder === null || !segment) return null;
	const key = folder === "" ? segment : `${folder}/${segment}`;
	return normalizeObjectKey(key);
}

/** A bucket name chosen by staff. Null when it breaks S3 naming rules. */
export function parseBucketName(input: string): string | null {
	const normalized = input.trim().toLowerCase().replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
	if (!BUCKET_NAME.test(normalized) || /^\d{1,3}(\.\d{1,3}){3}$/.test(normalized)) return null;
	return normalized;
}

export function bucketNameFromSlug(slug: string | null | undefined): {
	bucketName: string;
	source: "TEAM_SLUG" | "GENERATED";
} {
	const normalized = (slug ?? "")
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "");
	if (BUCKET_NAME.test(normalized) && !/^\d{1,3}(\.\d{1,3}){3}$/.test(normalized)) {
		return { bucketName: normalized, source: "TEAM_SLUG" };
	}
	return { bucketName: generatedBucketName(), source: "GENERATED" };
}

export function generatedBucketName(): string {
	return `nc-st-${randomBytes(8).toString("hex")}`;
}

export function parseByteCount(value: string): bigint | null {
	if (!/^\d{1,18}$/.test(value)) return null;
	return BigInt(value);
}

export function isUnderPrefix(prefix: string, objectKey: string): boolean {
	if (prefix === "") return true;
	return objectKey === prefix || objectKey.startsWith(`${prefix}/`);
}
