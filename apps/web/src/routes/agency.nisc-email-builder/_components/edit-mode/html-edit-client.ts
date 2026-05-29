export const NEB_EDITOR_STYLE_ID = "neb-editor-styles";

/** Stable element ids for edit mode; works on HTTP and older browsers. */
function generateNebElementId(): string {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}
	return `neb-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export type NebElementKind = "text" | "image" | "button" | "link" | "section" | "unknown";

export type NebElementSnapshot = {
	id: string;
	kind: NebElementKind;
	tagName: string;
	textContent: string;
	innerHTML: string;
	href: string;
	src: string;
	alt: string;
	fontFamily: string;
	fontSize: string;
	fontWeight: string;
	fontStyle: string;
	textDecoration: string;
	textAlign: string;
	color: string;
	backgroundColor: string;
	borderRadius: string;
	paddingTop: string;
	paddingRight: string;
	paddingBottom: string;
	paddingLeft: string;
	width: string;
	height: string;
	objectFit: string;
	verticalAlign: string;
	horizontalAlign: string;
};

const EDITABLE_SELECTOR =
	"img, a, p, h1, h2, h3, h4, h5, h6, td, th, span, div.paragraph_block, li";

export function injectEditorStyles(doc: Document): void {
	if (doc.getElementById(NEB_EDITOR_STYLE_ID)) return;
	const style = doc.createElement("style");
	style.id = NEB_EDITOR_STYLE_ID;
	style.textContent = `
    [data-neb-id].neb-editable { cursor: pointer; }
    [data-neb-id].neb-editable-hover { outline: 2px dashed rgba(139, 92, 246, 0.45) !important; outline-offset: 1px; }
    [data-neb-id].neb-selected { outline: 2px solid rgb(139, 92, 246) !important; outline-offset: 2px; }
  `;
	doc.head.appendChild(style);
}

export function injectEditIds(doc: Document): void {
	const body = doc.body;
	if (!body) return;

	const candidates = body.querySelectorAll<HTMLElement>(EDITABLE_SELECTOR);
	for (const el of candidates) {
		if (el.closest(`#${NEB_EDITOR_STYLE_ID}`)) continue;
		if (!el.getAttribute("data-neb-id")) {
			el.setAttribute("data-neb-id", generateNebElementId());
		}
		el.classList.add("neb-editable");
	}
}

export function classifyElement(el: HTMLElement): NebElementKind {
	const tag = el.tagName.toLowerCase();
	if (tag === "img") return "image";

	const isButton =
		tag === "a" &&
		(el.getAttribute("role") === "button" ||
			el.style.display === "block" ||
			/\bcta\b/i.test(el.className) ||
			Boolean(el.closest("td")?.getAttribute("bgcolor")));

	if (isButton) return "button";
	if (tag === "a") return "link";

	if (
		["p", "h1", "h2", "h3", "h4", "h5", "h6", "span", "li"].includes(tag) ||
		(tag === "td" && (el.textContent?.trim().length ?? 0) > 0)
	) {
		return "text";
	}

	if (tag === "td" || tag === "table" || tag === "tr") return "section";
	return "unknown";
}

function pxFromComputed(value: string): string {
	if (!value || value === "auto" || value === "normal") return "0";
	return value.endsWith("px") ? value.replace("px", "") : value;
}

/** Parse a dimension string from inspector input or attributes (digits only). */
function normalizeDimensionInput(value: string): string {
	return value.replace(/px$/i, "").trim();
}

/**
 * Read authored image dimensions (HTML attrs + inline style), not rendered/computed size.
 * Generated emails use `.fluid { width:100% !important }` which makes computed width misleading.
 */
function readImageDimensionPx(img: HTMLImageElement, axis: "width" | "height"): string {
	const attr = img.getAttribute(axis);
	if (attr && attr !== "auto") {
		const n = parseFloat(attr);
		if (!Number.isNaN(n) && n > 0) return String(Math.round(n));
	}

	const stylePx = img.style.getPropertyValue(axis);
	const styleMatch = stylePx.match(/(\d+(?:\.\d+)?)\s*px/i);
	if (styleMatch) return String(Math.round(Number(styleMatch[1])));

	const win = img.ownerDocument?.defaultView;
	const computed = win?.getComputedStyle(img)?.[axis] ?? "";
	return pxFromComputed(computed);
}

export function snapshotElement(el: HTMLElement, doc: Document): NebElementSnapshot {
	const win = doc.defaultView;
	const computed = win ? win.getComputedStyle(el) : null;
	const paddingTarget =
		el.tagName.toLowerCase() === "img"
			? (el.parentElement?.closest("td") as HTMLElement | null) ?? el
			: el;

	const padComputed = paddingTarget && win ? win.getComputedStyle(paddingTarget) : computed;
	const layoutTarget =
		el.tagName.toLowerCase() === "img"
			? ((el.parentElement?.closest("td") as HTMLElement | null) ?? el)
			: el;
	const layoutComputed =
		layoutTarget && win ? win.getComputedStyle(layoutTarget) : computed;

	return {
		id: el.getAttribute("data-neb-id") ?? "",
		kind: classifyElement(el),
		tagName: el.tagName.toLowerCase(),
		textContent: el.textContent ?? "",
		innerHTML: el.innerHTML,
		href: el.getAttribute("href") ?? "",
		src: el.getAttribute("src") ?? "",
		alt: el.getAttribute("alt") ?? "",
		fontFamily: computed?.fontFamily ?? "",
		fontSize: pxFromComputed(computed?.fontSize ?? "16"),
		fontWeight: computed?.fontWeight ?? "400",
		fontStyle: computed?.fontStyle ?? "normal",
		textDecoration: computed?.textDecorationLine ?? computed?.textDecoration ?? "none",
		textAlign: computed?.textAlign ?? "left",
		color: rgbToHex(computed?.color ?? "#000000"),
		backgroundColor: rgbToHex(computed?.backgroundColor ?? "transparent"),
		borderRadius: pxFromComputed(computed?.borderRadius ?? "0"),
		paddingTop: pxFromComputed(padComputed?.paddingTop ?? "0"),
		paddingRight: pxFromComputed(padComputed?.paddingRight ?? "0"),
		paddingBottom: pxFromComputed(padComputed?.paddingBottom ?? "0"),
		paddingLeft: pxFromComputed(padComputed?.paddingLeft ?? "0"),
		width:
			el.tagName.toLowerCase() === "img"
				? readImageDimensionPx(el as HTMLImageElement, "width")
				: pxFromComputed(computed?.width ?? "0"),
		height:
			el.tagName.toLowerCase() === "img"
				? readImageDimensionPx(el as HTMLImageElement, "height")
				: pxFromComputed(computed?.height ?? "0"),
		objectFit: computed?.objectFit ?? "fill",
		verticalAlign: layoutComputed?.verticalAlign ?? "top",
		horizontalAlign: layoutComputed?.textAlign ?? "left",
	};
}

/** Cell/wrapper used for spacing around images and blocks in table layouts. */
export function getLayoutTarget(el: HTMLElement): HTMLElement {
	if (el.tagName.toLowerCase() === "img") {
		return (el.parentElement?.closest("td") as HTMLElement | null) ?? el;
	}
	return el;
}

export function applyDimensions(
	el: HTMLElement,
	dims: { width?: string; height?: string },
): void {
	if (el.tagName.toLowerCase() === "img") {
		const img = el as HTMLImageElement;
		if (dims.width !== undefined) {
			const w = normalizeDimensionInput(dims.width);
			if (w) {
				img.setAttribute("width", w);
				img.classList.remove("fluid");
				img.style.setProperty("width", `${w}px`, "important");
				img.style.setProperty("max-width", `${w}px`, "important");
			} else {
				img.removeAttribute("width");
				img.style.removeProperty("width");
				img.style.removeProperty("max-width");
				if (!img.classList.contains("fluid")) {
					img.classList.add("fluid");
				}
			}
		}
		if (dims.height !== undefined) {
			const h = normalizeDimensionInput(dims.height);
			if (h) {
				img.setAttribute("height", h);
				img.classList.remove("fluid");
				img.style.setProperty("height", `${h}px`, "important");
			} else {
				img.removeAttribute("height");
				img.style.removeProperty("height");
				if (dims.width === undefined) {
					img.style.setProperty("height", "auto", "important");
				}
			}
		}
		return;
	}
	const target = getLayoutTarget(el);
	const style: Record<string, string> = {};
	if (dims.width !== undefined) {
		style.width = dims.width ? `${dims.width.replace(/px$/i, "")}px` : "";
	}
	if (dims.height !== undefined) {
		style.height = dims.height ? `${dims.height.replace(/px$/i, "")}px` : "";
	}
	applyInlineStyle(target, style);
}

export function applyCellAlignment(
	el: HTMLElement,
	align: { vertical?: string; horizontal?: string },
): void {
	const target = getLayoutTarget(el);
	const style: Record<string, string> = {};
	if (align.vertical) style.verticalAlign = align.vertical;
	if (align.horizontal) style.textAlign = align.horizontal;
	applyInlineStyle(target, style);
}

export function rgbToHex(color: string): string {
	if (!color || color === "transparent") return "";
	if (color.startsWith("#")) return color.length === 4 ? expandShortHex(color) : color;
	const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
	if (!m) return color;
	const r = Number(m[1]);
	const g = Number(m[2]);
	const b = Number(m[3]);
	return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function expandShortHex(hex: string): string {
	return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
}

export function findElementById(doc: Document, id: string | null): HTMLElement | null {
	if (!id) return null;
	return doc.querySelector<HTMLElement>(`[data-neb-id="${id}"]`);
}

export function setSelection(doc: Document, selectedId: string | null): void {
	for (const el of doc.querySelectorAll<HTMLElement>(".neb-selected")) {
		el.classList.remove("neb-selected");
	}
	if (!selectedId) return;
	const el = findElementById(doc, selectedId);
	if (el) el.classList.add("neb-selected");
}

export function serializeDocumentHtml(doc: Document): string {
	const clone = doc.documentElement.cloneNode(true) as HTMLElement;
	const style = clone.querySelector(`#${NEB_EDITOR_STYLE_ID}`);
	style?.remove();
	for (const el of clone.querySelectorAll<HTMLElement>("[data-neb-id]")) {
		el.removeAttribute("data-neb-id");
		el.classList.remove("neb-editable", "neb-selected", "neb-editable-hover");
		el.removeAttribute("contenteditable");
	}
	return `<!DOCTYPE html>\n${clone.outerHTML}`;
}

export function applyTextContent(el: HTMLElement, text: string): void {
	if (el.tagName.toLowerCase() === "td" || el.children.length > 0) {
		el.textContent = text;
	} else {
		el.textContent = text;
	}
}

export function applyInlineStyle(
	el: HTMLElement,
	props: Partial<Record<string, string>>,
): void {
	for (const [key, value] of Object.entries(props)) {
		if (value === undefined) continue;
		(el.style as unknown as Record<string, string>)[key] = value;
	}
}

export function applyPadding(
	el: HTMLElement,
	padding: { top: number; right: number; bottom: number; left: number },
): void {
	const target =
		el.tagName.toLowerCase() === "img"
			? (el.parentElement?.closest("td") as HTMLElement | null) ?? el
			: el;
	applyInlineStyle(target, {
		paddingTop: `${padding.top}px`,
		paddingRight: `${padding.right}px`,
		paddingBottom: `${padding.bottom}px`,
		paddingLeft: `${padding.left}px`,
	});
}

/** Curated Google Fonts for the edit-mode picker (single combined stylesheet). */
export const NEB_GOOGLE_FONTS_LINK =
	"https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Roboto:wght@400;500;700&family=Playfair+Display:wght@400;700&family=Lora:wght@400;600&family=Montserrat:wght@400;600;700&display=swap";

export const NEB_GOOGLE_FONTS_LINK_ID = "neb-google-fonts";

export type GoogleEmailFont = {
	id: string;
	label: string;
	/** CSS font-family stack applied to the selected element */
	fontFamily: string;
};

export const GOOGLE_EMAIL_FONTS: GoogleEmailFont[] = [
	{ id: "inter", label: "Inter", fontFamily: '"Inter", Arial, sans-serif' },
	{ id: "roboto", label: "Roboto", fontFamily: '"Roboto", Arial, sans-serif' },
	{
		id: "playfair",
		label: "Playfair Display",
		fontFamily: '"Playfair Display", Georgia, serif',
	},
	{ id: "lora", label: "Lora", fontFamily: '"Lora", Georgia, serif' },
	{
		id: "montserrat",
		label: "Montserrat",
		fontFamily: '"Montserrat", Arial, sans-serif',
	},
];

/** Inject Google Fonts stylesheet into the edit iframe so previews match sent email. */
export function ensureGoogleFontsLink(doc: Document): void {
	if (doc.getElementById(NEB_GOOGLE_FONTS_LINK_ID)) return;
	const link = doc.createElement("link");
	link.id = NEB_GOOGLE_FONTS_LINK_ID;
	link.rel = "stylesheet";
	link.href = NEB_GOOGLE_FONTS_LINK;
	doc.head.appendChild(link);
}

/** Match computed font-family to one of our Google font options. */
export function matchGoogleFontId(computedFontFamily: string): string {
	const lower = computedFontFamily.toLowerCase();
	for (const font of GOOGLE_EMAIL_FONTS) {
		if (lower.includes(font.label.toLowerCase())) return font.id;
		const primary = font.fontFamily.split(",")[0]?.replace(/['"]/g, "").trim().toLowerCase();
		if (primary && lower.includes(primary)) return font.id;
	}
	return GOOGLE_EMAIL_FONTS[0].id;
}
