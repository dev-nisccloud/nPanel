/**
 * Builds Imagen prompts for email icons. backgroundColor hex is metadata only —
 * never echoed as #RRGGBB in the prompt (models often render it as visible text).
 */

function parseHexRgb(hex: string): { r: number; g: number; b: number } | null {
	const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
	if (!m) return null;
	const raw = m[1]!;
	return {
		r: parseInt(raw.slice(0, 2), 16),
		g: parseInt(raw.slice(2, 4), 16),
		b: parseInt(raw.slice(4, 6), 16),
	};
}

/** Human-readable fill for image gen — no hex strings. */
export function hexToPlainBackgroundDescription(hex: string): string {
	const rgb = parseHexRgb(hex);
	if (!rgb) return "neutral light";

	const { r, g, b } = rgb;
	const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const chroma = max - min;

	let lightness: string;
	if (l > 0.92) lightness = "near-white";
	else if (l > 0.78) lightness = "very light";
	else if (l > 0.58) lightness = "light";
	else if (l > 0.38) lightness = "medium";
	else if (l > 0.18) lightness = "dark";
	else lightness = "very dark";

	if (chroma < 18) {
		return lightness === "near-white" ? "white" : `${lightness} gray`;
	}

	const hue =
		max === r
			? ((g - b) / chroma) % 6
			: max === g
				? (b - r) / chroma + 2
				: (r - g) / chroma + 4;
	const h = hue * 60;

	let family = "neutral";
	if (h < 30 || h >= 330) family = "red";
	else if (h < 70) family = "orange";
	else if (h < 150) family = "green";
	else if (h < 210) family = "teal";
	else if (h < 270) family = "blue";
	else family = "purple";

	const sat = chroma < 40 ? "muted" : chroma < 90 ? "soft" : "vivid";
	return `${sat} ${lightness} ${family}`.replace(/\s+/g, " ").trim();
}

const ICON_PROMPT_GUARDRAILS =
	"Icon graphic only on a flat seamless background fill. " +
	"NO text, NO numbers, NO hex codes, NO color labels, NO swatches, NO watermarks, NO borders, NO emoji. " +
	"Flat line-art or solid style, perfectly centred.";

export function buildIconImagePrompt(params: {
	prompt: string;
	backgroundColorHex?: string;
	compRefLine?: string;
}): string {
	const bg = hexToPlainBackgroundDescription(
		params.backgroundColorHex?.trim() || "#FFFFFF",
	);
	const parts = [
		params.prompt.trim(),
		params.compRefLine?.trim(),
		`Single isolated icon on a flat seamless ${bg} background (matches the email section behind the icon).`,
		ICON_PROMPT_GUARDRAILS,
	];
	return parts.filter(Boolean).join("\n");
}
