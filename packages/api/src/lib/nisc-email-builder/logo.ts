import type { NebBrief } from "./types";
import { mirrorExternalImageUrl } from "./mirror-external-image";

export function resolveNebLogoUrl(
	brief: NebBrief,
	brandKit?: { logoUrl?: string | null },
): string | null {
	const fromBrief = brief.logoUrl?.trim();
	if (fromBrief) return fromBrief;
	const fromKit = brandKit?.logoUrl?.trim();
	if (fromKit) return fromKit;
	return null;
}

/**
 * Download a hotlink-protected logo and re-host on UploadThing for Replicate + email HTML.
 * Returns null if mirroring fails (caller should omit image_input rather than pass the raw URL).
 */
export async function ensureNebLogoAccessible(
	logoUrl: string,
	websiteUrl?: string | null,
): Promise<string | null> {
	try {
		return await mirrorExternalImageUrl(logoUrl, {
			refererHint: websiteUrl,
			filenamePrefix: "neb-logo",
		});
	} catch (error) {
		console.warn(
			"[Neb] Logo mirror failed - Replicate will not receive image_input:",
			error instanceof Error ? error.message : error,
		);
		return null;
	}
}

/** Mirror logo on the brief when needed. Never returns a hotlink-only URL for Replicate. */
export async function mirrorNebBriefLogoIfNeeded(
	brief: NebBrief,
	brandKit?: { logoUrl?: string | null },
): Promise<{ brief: NebBrief; replicateLogoUrl: string | null }> {
	const rawLogoUrl = resolveNebLogoUrl(brief, brandKit);
	if (!rawLogoUrl) return { brief, replicateLogoUrl: null };

	const accessible = await ensureNebLogoAccessible(rawLogoUrl, brief.websiteUrl);
	if (!accessible) {
		return { brief, replicateLogoUrl: null };
	}

	if (accessible === rawLogoUrl) {
		return { brief, replicateLogoUrl: accessible };
	}

	return {
		brief: { ...brief, logoUrl: accessible },
		replicateLogoUrl: accessible,
	};
}

/** Extra instructions appended to Nano Banana when a brand logo is supplied via image_input. */
export function buildNanoBananaLogoDirective(logoUrl: string): string {
	return [
		"",
		"━━━ BRAND LOGO (MANDATORY) ━━━",
		`The first image in image_input is the official brand logo (${logoUrl}).`,
		"You MUST reproduce this exact logo in the email header - same shape, colours, and proportions.",
		"NEVER substitute a placeholder rectangle, generic icon, invented wordmark, or alternate logo.",
	].join("\n");
}
