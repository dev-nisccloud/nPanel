/**
 * Allowlist for Zeepo AI attachment / reference / edit image URLs (SSRF guard).
 */
import { TRPCError } from "@trpc/server";
import { isDurablePublicMediaUrl } from "./object-storage/persist";
import { getObjectStorageConfig, isObjectStorageConfigured } from "./object-storage/config";

/** data: URLs are allowed for in-browser masks (base64), not for remote SSRF. */
export function isZeepoAiDataImageUrl(url: string): boolean {
	return /^data:image\/[a-z0-9.+-]+;base64,/i.test(url.trim());
}

export function isAllowedZeepoAiMediaUrl(url: string): boolean {
	const trimmed = url.trim();
	if (!trimmed) return false;
	if (isZeepoAiDataImageUrl(trimmed)) return true;
	if (isDurablePublicMediaUrl(trimmed)) return true;

	if (isObjectStorageConfigured()) {
		try {
			const { publicBaseUrl } = getObjectStorageConfig();
			const base = new URL(publicBaseUrl);
			const target = new URL(trimmed);
			if (target.protocol !== "http:" && target.protocol !== "https:") return false;
			if (target.hostname.toLowerCase() === base.hostname.toLowerCase()) return true;
		} catch {
			/* ignore */
		}
	}

	return false;
}

export function assertAllowedZeepoAiMediaUrl(url: string, label = "Image URL"): void {
	if (!isAllowedZeepoAiMediaUrl(url)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `${label} must be a trusted storage URL.`,
		});
	}
}
