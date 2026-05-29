/** Short preview word in the font picker (sans/serif) — on-brand, reads well at small sizes. */
export const NEB_FONT_PREVIEW_SAMPLE = "nPanel";

export type EmailFontCategory =
	| "sans"
	| "serif"
	| "display"
	| "mono"
	| "handwriting";

export type GoogleEmailFont = {
	id: string;
	label: string;
	/** CSS font-family stack applied to the selected element */
	fontFamily: string;
	category: EmailFontCategory;
	/** Weights loaded from Google Fonts for preview + bold toggles */
	weights: number[];
};

const sans = (id: string, label: string, weights = [300, 400, 500, 600, 700]): GoogleEmailFont => ({
	id,
	label,
	fontFamily: `"${label}", Arial, Helvetica, sans-serif`,
	category: "sans",
	weights,
});

const serif = (id: string, label: string, weights = [400, 600, 700]): GoogleEmailFont => ({
	id,
	label,
	fontFamily: `"${label}", Georgia, "Times New Roman", serif`,
	category: "serif",
	weights,
});

const display = (id: string, label: string, weights = [400, 700]): GoogleEmailFont => ({
	id,
	label,
	fontFamily: `"${label}", Arial, sans-serif`,
	category: "display",
	weights,
});

const handwriting = (
	id: string,
	label: string,
	weights = [400, 700],
): GoogleEmailFont => ({
	id,
	label,
	fontFamily: `"${label}", "Brush Script MT", cursive`,
	category: "handwriting",
	weights,
});

/** Curated Google Fonts — email-safe, web-hosted stacks with fallbacks. */
export const GOOGLE_EMAIL_FONTS: GoogleEmailFont[] = [
	sans("inter", "Inter"),
	sans("roboto", "Roboto"),
	sans("open-sans", "Open Sans"),
	sans("lato", "Lato"),
	sans("poppins", "Poppins"),
	sans("montserrat", "Montserrat"),
	sans("nunito", "Nunito"),
	sans("raleway", "Raleway"),
	sans("source-sans-3", "Source Sans 3"),
	sans("work-sans", "Work Sans"),
	sans("dm-sans", "DM Sans"),
	sans("ubuntu", "Ubuntu"),
	sans("fira-sans", "Fira Sans"),
	sans("barlow", "Barlow"),
	sans("oswald", "Oswald", [400, 500, 600, 700]),
	sans("rubik", "Rubik"),
	sans("manrope", "Manrope"),
	sans("outfit", "Outfit"),
	sans("plus-jakarta", "Plus Jakarta Sans"),
	sans("kanit", "Kanit", [300, 400, 500, 600, 700]),
	sans("cabin", "Cabin"),
	sans("karla", "Karla"),
	sans("mulish", "Mulish"),
	sans("public-sans", "Public Sans"),
	sans("ibm-plex-sans", "IBM Plex Sans"),
	sans("josefin-sans", "Josefin Sans", [300, 400, 600, 700]),
	sans("quicksand", "Quicksand", [400, 500, 600, 700]),
	sans("signika", "Signika", [400, 600, 700]),
	serif("playfair", "Playfair Display"),
	serif("lora", "Lora"),
	serif("merriweather", "Merriweather"),
	serif("pt-serif", "PT Serif"),
	serif("libre-baskerville", "Libre Baskerville", [400, 700]),
	serif("eb-garamond", "EB Garamond", [400, 500, 600, 700]),
	serif("cormorant", "Cormorant Garamond", [400, 500, 600, 700]),
	serif("crimson-pro", "Crimson Pro", [400, 600, 700]),
	serif("bitter", "Bitter", [400, 600, 700]),
	serif("domine", "Domine", [400, 600, 700]),
	serif("spectral", "Spectral", [400, 600, 700]),
	serif("fraunces", "Fraunces", [400, 600, 700]),
	serif("noto-serif", "Noto Serif", [400, 600, 700]),
	serif("alegreya", "Alegreya", [400, 600, 700]),
	display("bebas-neue", "Bebas Neue", [400]),
	display("anton", "Anton", [400]),
	display("archivo-black", "Archivo Black", [400]),
	display("league-spartan", "League Spartan", [400, 600, 700]),
	display("righteous", "Righteous", [400]),
	display("abril-fatface", "Abril Fatface", [400]),
	handwriting("dancing-script", "Dancing Script", [400, 700]),
	handwriting("pacifico", "Pacifico", [400]),
	handwriting("great-vibes", "Great Vibes", [400]),
	handwriting("satisfy", "Satisfy", [400]),
	{
		id: "roboto-mono",
		label: "Roboto Mono",
		fontFamily: '"Roboto Mono", "Courier New", monospace',
		category: "mono",
		weights: [400, 500, 600, 700],
	},
];

export const EMAIL_FONT_CATEGORY_LABELS: Record<EmailFontCategory, string> = {
	sans: "Sans serif",
	serif: "Serif",
	display: "Display",
	mono: "Monospace",
	handwriting: "Script & handwriting",
};

export const FONT_WEIGHT_OPTIONS = [
	{ value: "300", label: "Light" },
	{ value: "400", label: "Regular" },
	{ value: "500", label: "Medium" },
	{ value: "600", label: "Semibold" },
	{ value: "700", label: "Bold" },
	{ value: "800", label: "Extra bold" },
] as const;

/** Google family name only — use for dropdown previews (no system fallbacks). */
export function primaryGoogleFontName(font: GoogleEmailFont): string {
	return font.fontFamily.split(",")[0]?.replace(/['"]/g, "").trim() ?? font.label;
}

function primaryGoogleName(font: GoogleEmailFont): string {
	return primaryGoogleFontName(font);
}

function googleFamilyQueryParam(font: GoogleEmailFont): string {
	const name = primaryGoogleName(font).replace(/ /g, "+");
	const weights = [...new Set(font.weights)].sort((a, b) => a - b);
	if (weights.length === 0) return `family=${name}`;
	if (weights.length === 1) return `family=${name}:wght@${weights[0]}`;
	return `family=${name}:wght@${weights.join(";")}`;
}

const FONTS_PER_STYLESHEET = 24;

/** Combined stylesheet(s) for edit iframe + inspector previews. */
export function buildNebGoogleFontsStylesheetUrls(): string[] {
	const chunks: GoogleEmailFont[][] = [];
	for (let i = 0; i < GOOGLE_EMAIL_FONTS.length; i += FONTS_PER_STYLESHEET) {
		chunks.push(GOOGLE_EMAIL_FONTS.slice(i, i + FONTS_PER_STYLESHEET));
	}
	return chunks.map((fonts) => {
		const params = fonts.map(googleFamilyQueryParam).join("&");
		return `https://fonts.googleapis.com/css2?${params}&display=swap`;
	});
}

export function buildNebGoogleFontsStylesheetUrl(): string {
	return buildNebGoogleFontsStylesheetUrls()[0] ?? "";
}

export const NEB_GOOGLE_FONTS_LINK = buildNebGoogleFontsStylesheetUrl();

export const GOOGLE_EMAIL_FONTS_BY_CATEGORY = (
	["sans", "serif", "display", "handwriting", "mono"] as const
).map((category) => ({
	category,
	label: EMAIL_FONT_CATEGORY_LABELS[category],
	fonts: GOOGLE_EMAIL_FONTS.filter((f) => f.category === category),
}));

/** Match computed font-family to picker id (longest label first). */
export function matchGoogleFontId(computedFontFamily: string): string {
	const lower = computedFontFamily.toLowerCase();
	const sorted = [...GOOGLE_EMAIL_FONTS].sort(
		(a, b) => b.label.length - a.label.length,
	);
	for (const font of sorted) {
		if (lower.includes(font.label.toLowerCase())) return font.id;
		const primary = primaryGoogleName(font).toLowerCase();
		if (primary && lower.includes(primary)) return font.id;
	}
	return GOOGLE_EMAIL_FONTS[0]!.id;
}

/** Snap computed weight to nearest supported option. */
export function normalizeFontWeight(weight: string): string {
	const n = Number.parseInt(weight, 10);
	if (Number.isNaN(n)) return "400";
	const options = FONT_WEIGHT_OPTIONS.map((o) => Number(o.value));
	let closest = options[0]!;
	let minDiff = Math.abs(n - closest);
	for (const opt of options) {
		const diff = Math.abs(n - opt);
		if (diff < minDiff) {
			minDiff = diff;
			closest = opt;
		}
	}
	return String(closest);
}
