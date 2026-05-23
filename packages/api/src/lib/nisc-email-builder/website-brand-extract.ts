import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { env } from "@npanel/env/server";

import { callBraveLlmContext } from "../brave-search";

const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 4;

const HEX_COLOR_RE = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
const RGB_COLOR_RE =
	/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+\s*)?\)/gi;

const CSS_VAR_DECL_RE = /--([\w-]+)\s*:\s*([^;}\n]+)/gi;
const MAX_STYLESHEETS = 6;
const MAX_STYLESHEET_BYTES = 512 * 1024;

const LOGO_HINT_RE = /logo|brand-mark|site-logo|navbar-brand|header-logo/i;

export type BrandColorRole = "primary" | "accent" | "secondary";

export type BrandPalette = Record<BrandColorRole, string | null>;

const BRAND_ROLES: BrandColorRole[] = ["primary", "accent", "secondary"];

/** Exact / common token names per role (order = priority). */
const ROLE_VAR_PATTERNS: Record<BrandColorRole, RegExp[]> = {
	primary: [
		/^primary$/i,
		/^color-primary$/i,
		/^primary-color$/i,
		/^brand-primary$/i,
		/^colors-primary$/i,
		/^brand$/i,
		/^main$/i,
		/^main-color$/i,
		/^theme-color$/i,
		/^color-brand$/i,
		/preset--color--primary/i,
		/^palette-primary$/i,
	],
	secondary: [
		/^secondary$/i,
		/^color-secondary$/i,
		/^secondary-color$/i,
		/^brand-secondary$/i,
		/^colors-secondary$/i,
		/preset--color--secondary/i,
		/^palette-secondary$/i,
	],
	accent: [
		/^accent$/i,
		/^color-accent$/i,
		/^accent-color$/i,
		/^brand-accent$/i,
		/^colors-accent$/i,
		/^highlight$/i,
		/^cta$/i,
		/^action$/i,
		/preset--color--accent/i,
		/^palette-accent$/i,
	],
};

export type WebsiteBrandEnrichment = {
	websiteUrl: string;
	hostname: string;
	logoUrl: string | null;
	logoSource: string | null;
	/** Ordered: primary, accent, secondary (only set roles included). */
	brandColors: string[];
	brandPalette: BrandPalette;
	colorSources: string[];
	siteName: string | null;
	/** On-page meta description when available. */
	onPageDescription: string | null;
	/** Combined research for UI (markdown). */
	companyContext: string | null;
	webSearchConducted: boolean;
	webSearchFound: boolean;
	/** Full block for creative director / planner prompts. */
	webContext: string | null;
	warnings: string[];
};

export function paletteToColorArray(palette: BrandPalette): string[] {
	return BRAND_ROLES.map((r) => palette[r]).filter((c): c is string => Boolean(c));
}

export function colorsToPalette(colors: string[]): BrandPalette {
	return {
		primary: colors[0] ?? null,
		accent: colors[1] ?? null,
		secondary: colors[2] ?? null,
	};
}

type LogoCandidate = {
	url: string;
	source: string;
	priority: number;
};

type ColorCandidate = {
	hex: string;
	source: string;
	priority: number;
};

export function normalizeWebsiteUrl(input: string): string {
	let s = input.trim();
	if (!s) throw new Error("Website URL is required");
	if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
	const u = new URL(s);
	if (u.protocol !== "http:" && u.protocol !== "https:") {
		throw new Error("Only http and https URLs are allowed");
	}
	u.hash = "";
	return u.href;
}

function isPrivateOrReservedIp(ip: string): boolean {
	const v = ip.toLowerCase();
	if (v === "::1" || v === "0:0:0:0:0:0:0:1") return true;
	if (isIP(v) === 4) {
		const [a, b] = v.split(".").map(Number);
		if (a === 127 || a === 0 || a === 10) return true;
		if (a === 169 && b === 254) return true;
		if (a === 172 && b >= 16 && b <= 31) return true;
		if (a === 192 && b === 168) return true;
		if (a >= 224) return true;
		return false;
	}
	if (isIP(v) === 6) {
		if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80")) return true;
	}
	return false;
}

function isBlockedHostname(hostname: string): boolean {
	const h = hostname.toLowerCase().replace(/\.$/, "");
	if (h === "localhost" || h.endsWith(".localhost")) return true;
	if (h.endsWith(".local") || h.endsWith(".internal")) return true;
	if (h === "metadata.google.internal") return true;
	return false;
}

export async function assertSafeWebsiteUrl(websiteUrl: string): Promise<URL> {
	const normalized = normalizeWebsiteUrl(websiteUrl);
	const parsed = new URL(normalized);
	if (isBlockedHostname(parsed.hostname)) {
		throw new Error("This hostname is not allowed");
	}
	const port = parsed.port ? Number(parsed.port) : parsed.protocol === "https:" ? 443 : 80;
	if (![80, 443].includes(port)) {
		throw new Error("Only standard web ports (80, 443) are allowed");
	}
	if (isIP(parsed.hostname)) {
		if (isPrivateOrReservedIp(parsed.hostname)) {
			throw new Error("This IP address is not allowed");
		}
		return parsed;
	}
	const records = await lookup(parsed.hostname, { all: true });
	for (const { address } of records) {
		if (isPrivateOrReservedIp(address)) {
			throw new Error("This hostname resolves to a private network address");
		}
	}
	return parsed;
}

function resolveUrl(base: string, ref: string | null | undefined): string | null {
	if (!ref?.trim()) return null;
	const trimmed = ref.trim();
	if (trimmed.startsWith("data:")) return null;
	try {
		return new URL(trimmed, base).href;
	} catch {
		return null;
	}
}

function normalizeHexColor(raw: string): string | null {
	const s = raw.trim().toLowerCase();
	if (!s) return null;
	if (s.startsWith("#")) {
		const hex = s.slice(1);
		if (hex.length === 3) {
			return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
		}
		if (hex.length === 6 && /^[0-9a-f]{6}$/.test(hex)) {
			return `#${hex}`;
		}
		return null;
	}
	const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(s);
	if (rgb) {
		const r = Number(rgb[1]);
		const g = Number(rgb[2]);
		const b = Number(rgb[3]);
		if ([r, g, b].some((n) => n > 255)) return null;
		return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
	}
	const hsl = /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i.exec(s);
	if (hsl) {
		return hslToHex(Number(hsl[1]), Number(hsl[2]), Number(hsl[3]));
	}
	/** shadcn / Tailwind: `--primary: 222.2 47.4% 11.2%` */
	const hslChannels = /^([\d.]+)(?:\s+|\s*,\s*)([\d.]+)%\s+([\d.]+)%/.exec(s);
	if (hslChannels) {
		return hslToHex(
			Number(hslChannels[1]),
			Number(hslChannels[2]),
			Number(hslChannels[3]),
		);
	}
	return null;
}

function hslToHex(h: number, s: number, l: number): string | null {
	if (!Number.isFinite(h) || !Number.isFinite(s) || !Number.isFinite(l)) return null;
	const sat = s / 100;
	const lig = l / 100;
	const a = sat * Math.min(lig, 1 - lig);
	const f = (n: number) => {
		const k = (n + h / 30) % 12;
		const col = lig - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
		return Math.round(255 * col)
			.toString(16)
			.padStart(2, "0");
	};
	return `#${f(0)}${f(8)}${f(4)}`;
}

function buildCssVariableMap(cssChunks: string[]): Map<string, string> {
	const map = new Map<string, string>();
	for (const chunk of cssChunks) {
		CSS_VAR_DECL_RE.lastIndex = 0;
		let match: RegExpExecArray | null;
		while ((match = CSS_VAR_DECL_RE.exec(chunk)) !== null) {
			const key = `--${match[1]}`;
			const val = match[2]!.trim();
			if (val) map.set(key, val);
		}
	}
	return map;
}

function resolveCssVariableValue(
	raw: string,
	varMap: Map<string, string>,
	depth = 0,
): string {
	if (depth > 5) return raw.trim();
	let value = raw.trim();
	const varCall = /^var\(\s*(--[\w-]+)(?:\s*,\s*([^)]+))?\s*\)/i.exec(value);
	if (varCall) {
		const fromMap = varMap.get(varCall[1]!);
		const fallback = varCall[2]?.trim();
		const next = fromMap ?? fallback;
		if (next) return resolveCssVariableValue(next, varMap, depth + 1);
	}
	return value;
}

function collectCssTextFromHtml(html: string): string[] {
	const chunks: string[] = [];
	const styleBlocks = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) ?? [];
	for (const block of styleBlocks) {
		const inner = /<style[^>]*>([\s\S]*?)<\/style>/i.exec(block)?.[1];
		if (inner) chunks.push(inner);
	}
	const rootInline =
		/(?:<html[^>]*style=["']([^"']+)["'][^>]*>|<body[^>]*style=["']([^"']+)["'][^>]*>)/gi;
	let inlineRoot: RegExpExecArray | null;
	while ((inlineRoot = rootInline.exec(html)) !== null) {
		const style = inlineRoot[1] ?? inlineRoot[2];
		if (style) chunks.push(style);
	}
	return chunks;
}

function extractStylesheetUrls(html: string, pageUrl: string): string[] {
	const page = new URL(pageUrl);
	const urls: string[] = [];
	const links = html.match(/<link[^>]+>/gi) ?? [];
	for (const tag of links) {
		if (!/rel=["'][^"']*stylesheet/i.test(tag)) continue;
		const href = /href=["']([^"']+)["']/i.exec(tag)?.[1];
		const resolved = resolveUrl(pageUrl, href);
		if (!resolved) continue;
		try {
			const u = new URL(resolved);
			if (u.hostname === page.hostname) urls.push(u.href);
		} catch {
			/* skip */
		}
	}
	return [...new Set(urls)].slice(0, MAX_STYLESHEETS);
}

async function fetchStylesheetCss(url: string): Promise<string | null> {
	try {
		const parsed = await assertSafeWebsiteUrl(url);
		const res = await fetch(parsed.href, {
			method: "GET",
			signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
			headers: {
				Accept: "text/css,*/*;q=0.1",
				"User-Agent":
					"nPanel-NiscEmailBuilder/1.0 (+https://npanel.io; brand-enrichment)",
			},
		});
		if (!res.ok) return null;
		const buf = await res.arrayBuffer();
		if (buf.byteLength > MAX_STYLESHEET_BYTES) return null;
		return new TextDecoder("utf-8", { fatal: false }).decode(buf);
	} catch {
		return null;
	}
}

async function gatherPageCss(html: string, pageUrl: string): Promise<string[]> {
	const chunks = collectCssTextFromHtml(html);
	const sheetUrls = extractStylesheetUrls(html, pageUrl);
	const fetched = await Promise.all(sheetUrls.map((u) => fetchStylesheetCss(u)));
	for (const css of fetched) {
		if (css) chunks.push(css);
	}
	return chunks;
}

function isBoringColor(hex: string): boolean {
	const h = hex.replace("#", "");
	const r = parseInt(h.slice(0, 2), 16);
	const g = parseInt(h.slice(2, 4), 16);
	const b = parseInt(h.slice(4, 6), 16);
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	if (max - min < 12 && max > 220) return true;
	if (max - min < 12 && max < 35) return true;
	if (max - min < 18 && max > 180 && max < 240) return true;
	return false;
}

function pickBestLogo(candidates: LogoCandidate[]): LogoCandidate | null {
	if (!candidates.length) return null;
	const seen = new Set<string>();
	const unique = candidates.filter((c) => {
		const key = c.url.toLowerCase();
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
	unique.sort((a, b) => b.priority - a.priority);
	return unique[0] ?? null;
}

function varNameMatchesRole(shortName: string, role: BrandColorRole): boolean {
	if (ROLE_VAR_PATTERNS[role].some((p) => p.test(shortName))) return true;
	const n = shortName.toLowerCase();
	if (/foreground|on-|^on|\bmuted\b|\blight\b|\bdark\b|\bcontrast\b|\bborder\b|\bhover\b/.test(n)) {
		return false;
	}
	if (role === "primary" && /\bprimary\b/.test(n)) return true;
	if (role === "secondary" && /\bsecondary\b/.test(n)) return true;
	if (role === "accent" && (/\baccent\b/.test(n) || /\bhighlight\b/.test(n) || /\bcta\b/.test(n))) {
		return true;
	}
	return false;
}

function resolveVarToHex(
	varName: string,
	rawValue: string,
	varMap: Map<string, string>,
): string | null {
	const resolved = resolveCssVariableValue(rawValue, varMap);
	const hex = normalizeHexColor(resolved);
	if (!hex || isBoringColor(hex)) return null;
	return hex;
}

function findRoleColorFromVariables(
	role: BrandColorRole,
	varMap: Map<string, string>,
): { hex: string | null; source: string | null } {
	const entries = [...varMap.entries()].sort(([a], [b]) => a.length - b.length);
	for (const [varName, rawValue] of entries) {
		const short = varName.replace(/^--/, "");
		if (!varNameMatchesRole(short, role)) continue;
		const hex = resolveVarToHex(varName, rawValue, varMap);
		if (hex) return { hex, source: varName };
	}
	return { hex: null, source: null };
}

function colorSaturation(hex: string): number {
	const h = hex.replace("#", "");
	const r = parseInt(h.slice(0, 2), 16) / 255;
	const g = parseInt(h.slice(2, 4), 16) / 255;
	const b = parseInt(h.slice(4, 6), 16) / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	if (max === 0) return 0;
	return (max - min) / max;
}

function collectDistinctFallbackColors(
	varMap: Map<string, string>,
	cssChunks: string[],
	html: string,
): ColorCandidate[] {
	const pool: ColorCandidate[] = [];
	const seen = new Set<string>();
	const push = (raw: string, source: string, priority: number) => {
		const hex = normalizeHexColor(raw);
		if (!hex || isBoringColor(hex) || seen.has(hex)) return;
		seen.add(hex);
		pool.push({ hex, source, priority });
	};

	push(extractMetaContent(html, "theme-color") ?? "", "meta theme-color", 95);
	push(
		extractMetaContent(html, "msapplication-TileColor") ?? "",
		"meta msapplication-TileColor",
		70,
	);

	for (const [varName, rawValue] of varMap.entries()) {
		const short = varName.replace(/^--/, "").toLowerCase();
		if (/gray|grey|neutral|border|shadow|muted|white|black|surface|background/.test(short)) {
			continue;
		}
		if (!/color|primary|secondary|accent|brand|theme|main|highlight|cta/.test(short)) {
			continue;
		}
		const hex = resolveVarToHex(varName, rawValue, varMap);
		if (hex) push(hex, varName, 50 + colorSaturation(hex) * 30);
	}

	for (const chunk of cssChunks) {
		const rootOnly = chunk.match(/(?::root|html)\s*\{[^}]*\}/gi)?.join("\n") ?? "";
		const scan = rootOnly || chunk.slice(0, 8000);
		let hexMatch: RegExpExecArray | null;
		HEX_COLOR_RE.lastIndex = 0;
		while ((hexMatch = HEX_COLOR_RE.exec(scan)) !== null) {
			push(hexMatch[0], ":root hex", 35 + colorSaturation(hexMatch[0]) * 20);
		}
	}

	pool.sort((a, b) => b.priority - a.priority);
	return pool;
}

function resolveBrandPalette(
	varMap: Map<string, string>,
	cssChunks: string[],
	html: string,
): { palette: BrandPalette; sources: string[] } {
	const palette: BrandPalette = { primary: null, accent: null, secondary: null };
	const sources: string[] = [];

	for (const role of BRAND_ROLES) {
		const found = findRoleColorFromVariables(role, varMap);
		if (found.hex) {
			palette[role] = found.hex;
			sources.push(`${role}: ${found.source}`);
		}
	}

	if (!palette.primary) {
		const theme = normalizeHexColor(extractMetaContent(html, "theme-color") ?? "");
		if (theme && !isBoringColor(theme)) {
			palette.primary = theme;
			sources.push("primary: meta theme-color");
		}
	}

	const pool = collectDistinctFallbackColors(varMap, cssChunks, html);
	const used = new Set(BRAND_ROLES.map((r) => palette[r]).filter(Boolean));

	for (const role of BRAND_ROLES) {
		if (palette[role]) continue;
		const next = pool.find((c) => !used.has(c.hex));
		if (!next) continue;
		palette[role] = next.hex;
		used.add(next.hex);
		sources.push(`${role}: fallback (${next.source})`);
	}

	return { palette, sources };
}

export function cleanSiteName(raw: string | null | undefined, hostname: string): string {
	const fromHost = () => {
		const base = hostname.replace(/^www\./i, "").split(".")[0] ?? hostname;
		if (!base) return "Brand";
		return base.charAt(0).toUpperCase() + base.slice(1);
	};
	if (!raw?.trim()) return fromHost();
	let s = raw.trim();
	s = s.replace(/\s*[-|·–—]\s*.+$/, "").trim();
	s = s.replace(/\s*:\s*.+$/, "").trim();
	s = s.replace(/\s*\|\s*.+$/, "").trim();
	s = s.replace(/\s+(Home|Official Site|Welcome|Homepage)\s*$/i, "").trim();
	if (s.length > 80) s = s.slice(0, 80).trim();
	return s || fromHost();
}

function extractMetaContent(html: string, key: string): string | null {
	const patterns = [
		new RegExp(
			`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
			"i",
		),
		new RegExp(
			`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
			"i",
		),
	];
	for (const re of patterns) {
		const m = re.exec(html);
		if (m?.[1]?.trim()) return m[1].trim();
	}
	return null;
}

function extractLinkHref(html: string, relPattern: RegExp): string | null {
	const linkTags = html.match(/<link[^>]+>/gi) ?? [];
	for (const tag of linkTags) {
		if (!relPattern.test(tag)) continue;
		const href = /href=["']([^"']+)["']/i.exec(tag)?.[1];
		if (href) return href;
	}
	return null;
}

function collectJsonLdLogo(
	value: unknown,
	baseUrl: string,
	add: (url: string, source: string, priority: number) => void,
): void {
	if (!value) return;
	if (Array.isArray(value)) {
		for (const item of value) collectJsonLdLogo(item, baseUrl, add);
		return;
	}
	if (typeof value !== "object") return;
	const obj = value as Record<string, unknown>;

	if (obj["@graph"]) collectJsonLdLogo(obj["@graph"], baseUrl, add);

	const typeVal = obj["@type"];
	const types = Array.isArray(typeVal)
		? typeVal.map(String)
		: typeVal
			? [String(typeVal)]
			: [];

	const isOrg = types.some((t) =>
		/Organization|Brand|Corporation|LocalBusiness|Store|WebSite/i.test(t),
	);

	if (isOrg && obj.logo) {
		if (typeof obj.logo === "string") {
			const u = resolveUrl(baseUrl, obj.logo);
			if (u) add(u, "json-ld Organization.logo", 100);
		} else if (typeof obj.logo === "object" && obj.logo !== null) {
			const logoObj = obj.logo as Record<string, unknown>;
			const url =
				(typeof logoObj.url === "string" && logoObj.url) ||
				(typeof logoObj.contentUrl === "string" && logoObj.contentUrl);
			const resolved = resolveUrl(baseUrl, url);
			if (resolved) add(resolved, "json-ld Organization.logo (ImageObject)", 100);
		}
	}

	for (const v of Object.values(obj)) {
		if (v && typeof v === "object") collectJsonLdLogo(v, baseUrl, add);
	}
}

function extractLogosFromHtml(
	html: string,
	baseUrl: string,
): { logo: LogoCandidate | null } {
	const candidates: LogoCandidate[] = [];
	const add = (ref: string | null | undefined, source: string, priority: number) => {
		const url = resolveUrl(baseUrl, ref);
		if (url) candidates.push({ url, source, priority });
	};

	const jsonLdBlocks =
		html.matchAll(
			/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
		);
	for (const block of jsonLdBlocks) {
		try {
			const parsed = JSON.parse(block[1]!) as unknown;
			collectJsonLdLogo(parsed, baseUrl, add);
		} catch {
			/* skip invalid JSON-LD */
		}
	}

	add(extractMetaContent(html, "og:logo"), "meta og:logo", 95);

	const ogImage = extractMetaContent(html, "og:image");
	if (ogImage) {
		const priority = /logo/i.test(ogImage) ? 88 : 52;
		add(ogImage, "meta og:image", priority);
	}

	add(
		extractMetaContent(html, "twitter:image"),
		"meta twitter:image",
		ogImage ? 48 : 55,
	);

	add(extractLinkHref(html, /apple-touch-icon/i), "link apple-touch-icon", 78);
	add(extractLinkHref(html, /rel=["'][^"']*icon[^"']*["'][^>]*sizes=["'][^"']*(?:192|180|152|144|128)/i), "link icon (large)", 72);
	add(extractLinkHref(html, /\bicon\b/i), "link rel=icon", 45);

	const imgTags = html.match(/<img[^>]+>/gi) ?? [];
	for (const tag of imgTags) {
		const src = /src=["']([^"']+)["']/i.exec(tag)?.[1];
		if (!src) continue;
		if (LOGO_HINT_RE.test(tag)) {
			add(src, "img (logo hint in attributes)", 66);
		}
	}

	const headerMatch = html.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
	if (headerMatch?.[1]) {
		const headerImgs = headerMatch[1].match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi) ?? [];
		for (const tag of headerImgs.slice(0, 3)) {
			const src = /src=["']([^"']+)["']/i.exec(tag)?.[1];
			add(src, "img in <header>", 62);
		}
	}

	const navMatch = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i);
	if (navMatch?.[1]) {
		const navImgs = navMatch[1].match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi) ?? [];
		for (const tag of navImgs.slice(0, 2)) {
			const src = /src=["']([^"']+)["']/i.exec(tag)?.[1];
			add(src, "img in <nav>", 58);
		}
	}

	const svgWithLogo = html.match(/<svg[^>]*(?:logo|brand)[^>]*>[\s\S]*?<\/svg>/gi);
	if (svgWithLogo?.[0]) {
		const svgUrl = /(?:xlink:)?href=["']([^"']+\.svg[^"']*)["']/i.exec(svgWithLogo[0])?.[1];
		add(svgUrl, "svg logo reference", 55);
	}

	return { logo: pickBestLogo(candidates) };
}

async function extractColorsFromPage(
	html: string,
	pageUrl: string,
): Promise<{ palette: BrandPalette; colors: string[]; sources: string[] }> {
	const cssChunks = await gatherPageCss(html, pageUrl);
	const varMap = buildCssVariableMap(cssChunks);
	const { palette, sources } = resolveBrandPalette(varMap, cssChunks, html);
	return { palette, colors: paletteToColorArray(palette), sources };
}

async function fetchWebsiteHtml(pageUrl: string): Promise<string> {
	let current = pageUrl;
	for (let i = 0; i <= MAX_REDIRECTS; i++) {
		const parsed = await assertSafeWebsiteUrl(current);
		const res = await fetch(parsed.href, {
			method: "GET",
			redirect: "manual",
			signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
			headers: {
				Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
				"User-Agent":
					"nPanel-NiscEmailBuilder/1.0 (+https://npanel.io; brand-enrichment)",
			},
		});

		if (res.status >= 300 && res.status < 400) {
			const location = res.headers.get("location");
			if (!location) throw new Error(`Redirect ${res.status} without Location header`);
			current = resolveUrl(parsed.href, location) ?? location;
			continue;
		}

		if (!res.ok) {
			throw new Error(`Could not fetch website (HTTP ${res.status})`);
		}

		const contentType = res.headers.get("content-type") ?? "";
		if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
			throw new Error("URL did not return HTML content");
		}

		const buf = await res.arrayBuffer();
		if (buf.byteLength > MAX_HTML_BYTES) {
			throw new Error("Website HTML is too large to process");
		}
		return new TextDecoder("utf-8", { fatal: false }).decode(buf);
	}
	throw new Error("Too many redirects");
}

const MIN_RESEARCH_CHARS = 80;
const MAX_RESEARCH_FOR_UI = 12_000;
const MAX_RESEARCH_FOR_PROMPT = 7_000;

function extractOnPageCompanyDescription(html: string): string | null {
	const desc =
		extractMetaContent(html, "og:description") ??
		extractMetaContent(html, "description") ??
		extractMetaContent(html, "twitter:description");
	if (!desc?.trim()) return null;
	return desc.trim().slice(0, 1200);
}

async function runBraveResearchQuery(params: {
	apiKey: string;
	query: string;
	goggles?: string;
	depth?: "quick" | "standard";
}): Promise<string | null> {
	try {
		const text = await callBraveLlmContext({
			apiKey: params.apiKey,
			query: params.query.slice(0, 500),
			depth: params.depth ?? "standard",
			goggles: params.goggles,
		});
		if (!text || text.length < 40) return null;
		return text.trim();
	} catch (e) {
		console.warn(
			"[neb] Brave research query failed:",
			e instanceof Error ? e.message : e,
		);
		return null;
	}
}

async function fetchCompanyWebResearch(params: {
	hostname: string;
	companyName: string;
	onPageDescription: string | null;
}): Promise<{
	conducted: boolean;
	found: boolean;
	sections: string[];
}> {
	const apiKey = env.BRAVE_SEARCH_API_KEY;
	if (!apiKey?.trim()) {
		return { conducted: false, found: false, sections: [] };
	}

	const name = params.companyName.trim() || params.hostname;
	const goggles = `$discard\n$site=${params.hostname}`;

	const [siteScoped, broader] = await Promise.all([
		runBraveResearchQuery({
			apiKey,
			query: `${name} company about mission products services pricing customers`,
			goggles,
			depth: "standard",
		}),
		runBraveResearchQuery({
			apiKey,
			query: `${name} ${params.hostname} what does the company do products services industry`,
			depth: "standard",
		}),
	]);

	const sections: string[] = [];
	if (params.onPageDescription) {
		sections.push(`### From their website\n${params.onPageDescription}`);
	}
	if (siteScoped) {
		sections.push(`### Official site (${params.hostname})\n${siteScoped}`);
	}
	if (broader) {
		sections.push(`### Web research\n${broader}`);
	}

	const combinedLen =
		sections.join("\n\n").length +
		(params.onPageDescription?.length ?? 0);
	const found = combinedLen >= MIN_RESEARCH_CHARS;

	return { conducted: true, found, sections };
}

export function formatCompanyContextForUi(sections: string[]): string | null {
	if (!sections.length) return null;
	const body = sections.join("\n\n").trim().slice(0, MAX_RESEARCH_FOR_UI);
	return body.length >= MIN_RESEARCH_CHARS ? body : null;
}

/**
 * Fetch a public website and extract logo URL + brand colors using ordered fallbacks.
 * Never throws for enrichment failures — returns partial results and warnings instead.
 */
export async function enrichWebsiteBrand(
	websiteUrlInput: string,
	options?: { companyHint?: string },
): Promise<WebsiteBrandEnrichment> {
	const warnings: string[] = [];
	let pageUrl: string;
	let hostname: string;

	try {
		const parsed = await assertSafeWebsiteUrl(websiteUrlInput);
		pageUrl = parsed.href;
		hostname = parsed.hostname;
	} catch (e) {
		const msg = e instanceof Error ? e.message : "Invalid website URL";
		return {
			websiteUrl: websiteUrlInput,
			hostname: "",
			logoUrl: null,
			logoSource: null,
			brandColors: [],
			brandPalette: { primary: null, accent: null, secondary: null },
			colorSources: [],
			siteName: null,
			onPageDescription: null,
			companyContext: null,
			webSearchConducted: false,
			webSearchFound: false,
			webContext: null,
			warnings: [msg],
		};
	}

	let html: string;
	try {
		html = await fetchWebsiteHtml(pageUrl);
	} catch (e) {
		warnings.push(e instanceof Error ? e.message : "Failed to fetch website");
		const siteName = cleanSiteName(null, hostname);
		const research = await fetchCompanyWebResearch({
			hostname,
			companyName: options?.companyHint ?? siteName,
			onPageDescription: null,
		});
		const companyContext = formatCompanyContextForUi(research.sections);
		const enrichmentStub: WebsiteBrandEnrichment = {
			websiteUrl: pageUrl,
			hostname,
			logoUrl: null,
			logoSource: null,
			brandColors: [],
			brandPalette: { primary: null, accent: null, secondary: null },
			colorSources: [],
			siteName,
			onPageDescription: null,
			companyContext,
			webSearchConducted: research.conducted,
			webSearchFound: research.found && Boolean(companyContext),
			webContext: null,
			warnings,
		};
		enrichmentStub.webContext = buildBrandAgentContext(
			{ companyName: siteName, websiteUrl: pageUrl },
			enrichmentStub,
		);
		return enrichmentStub;
	}

	const onPageDescription = extractOnPageCompanyDescription(html);
	const siteNameRaw =
		extractMetaContent(html, "og:site_name") ??
		extractMetaContent(html, "application-name") ??
		/<title[^>]*>([^<]{1,120})<\/title>/i.exec(html)?.[1]?.trim() ??
		null;
	const siteName = cleanSiteName(siteNameRaw, hostname);
	const companyLabel = options?.companyHint?.trim() || siteName;

	const [logoResult, colorResult, research] = await Promise.all([
		Promise.resolve(extractLogosFromHtml(html, pageUrl)),
		extractColorsFromPage(html, pageUrl),
		fetchCompanyWebResearch({
			hostname,
			companyName: companyLabel,
			onPageDescription,
		}),
	]);

	const { logo } = logoResult;
	const { palette, colors, sources } = colorResult;
	const companyContext = formatCompanyContextForUi(research.sections);

	if (!logo) warnings.push("No logo found — try uploading one in brand kit later.");
	const missingRoles = BRAND_ROLES.filter((r) => !palette[r]);
	if (missingRoles.length === 3) {
		warnings.push(
			"Could not detect primary, accent, or secondary — set them below before generating.",
		);
	} else if (missingRoles.length > 0) {
		warnings.push(
			`Could not detect ${missingRoles.join(", ")} — set ${missingRoles.length === 1 ? "it" : "them"} below.`,
		);
	}

	const enrichment: WebsiteBrandEnrichment = {
		websiteUrl: pageUrl,
		hostname,
		logoUrl: logo?.url ?? null,
		logoSource: logo?.source ?? null,
		brandColors: colors,
		brandPalette: palette,
		colorSources: sources,
		siteName,
		onPageDescription,
		companyContext,
		webSearchConducted: research.conducted,
		webSearchFound: research.found && Boolean(companyContext),
		webContext: null,
		warnings,
	};

	enrichment.webContext = buildBrandAgentContext(
		{
			companyName: siteName,
			websiteUrl: pageUrl,
			logoUrl: enrichment.logoUrl ?? undefined,
			brandColors: colors,
		},
		enrichment,
	);

	return enrichment;
}

export function mergeBrandEnrichment(
	brief: {
		companyName?: string;
		productName?: string;
		audience?: string;
		goal?: string;
		tone?: string;
		emailType?: string;
		instructions?: string;
		brandColors?: string[];
		ctaUrl?: string;
		websiteUrl?: string;
		logoUrl?: string;
	},
	enrichment: WebsiteBrandEnrichment,
): typeof brief {
	const merged = { ...brief, websiteUrl: enrichment.websiteUrl };

	if (enrichment.logoUrl && !brief.logoUrl) {
		merged.logoUrl = enrichment.logoUrl;
	}

	if (enrichment.brandColors.length) {
		merged.brandColors = enrichment.brandColors;
	}

	if (enrichment.siteName) {
		merged.companyName = enrichment.siteName;
	}

	if (!brief.ctaUrl?.trim() && enrichment.websiteUrl) {
		merged.ctaUrl = enrichment.websiteUrl;
	}

	if (enrichment.companyContext) {
		merged.companyContext = enrichment.companyContext;
	}
	merged.webSearchFound = enrichment.webSearchFound;

	return merged;
}

/** Unified brand block: logo, palette, and company research for AI agents. */
export function buildBrandAgentContext(
	brief: {
		companyName?: string;
		websiteUrl?: string;
		logoUrl?: string;
		brandColors?: string[];
	},
	enrichment: WebsiteBrandEnrichment | null,
): string | null {
	const parts: string[] = [
		"BRAND COMPLIANCE CONTEXT — follow for copy, visual hierarchy, and tone:",
	];

	const company = brief.companyName ?? enrichment?.siteName;
	if (company) parts.push(`Company: ${company}`);
	if (brief.websiteUrl ?? enrichment?.websiteUrl) {
		parts.push(`Website: ${brief.websiteUrl ?? enrichment?.websiteUrl}`);
	}

	const [primary, accent, secondary] = brief.brandColors ?? enrichment?.brandColors ?? [];
	if (primary) parts.push(`Primary brand color: ${primary}`);
	if (accent) parts.push(`Accent color: ${accent}`);
	if (secondary) parts.push(`Secondary color: ${secondary}`);

	const logo = brief.logoUrl ?? enrichment?.logoUrl;
	if (logo) {
		parts.push(
			`Logo URL (use in email header <img>, preserve aspect ratio): ${logo}`,
		);
	} else if (enrichment?.logoSource) {
		parts.push(`Logo source: ${enrichment.logoSource}`);
	}

	if (enrichment?.onPageDescription) {
		parts.push("", "Website summary:", enrichment.onPageDescription);
	}

	if (enrichment?.companyContext) {
		parts.push(
			"",
			"COMPANY RESEARCH (products, services, positioning — stay factually aligned):",
			enrichment.companyContext.slice(0, MAX_RESEARCH_FOR_PROMPT),
		);
	}

	if (parts.length <= 1) return null;
	return parts.join("\n");
}

/** @deprecated Use buildBrandAgentContext */
export function formatWebContextForPrompt(
	enrichment: WebsiteBrandEnrichment,
	brief?: Parameters<typeof buildBrandAgentContext>[0],
): string | null {
	if (enrichment.webContext?.trim()) return enrichment.webContext;
	return buildBrandAgentContext(
		brief ?? {
			companyName: enrichment.siteName ?? undefined,
			websiteUrl: enrichment.websiteUrl,
			logoUrl: enrichment.logoUrl ?? undefined,
			brandColors: enrichment.brandColors,
		},
		enrichment,
	);
}
