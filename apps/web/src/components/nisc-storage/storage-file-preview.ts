import JSZip from "jszip";

const IMAGE = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif", "ico"]);
const VIDEO = new Set(["mp4", "webm", "ogv", "mov", "m4v"]);
const AUDIO = new Set(["mp3", "wav", "ogg", "m4a", "aac", "flac"]);
const TEXT = new Set([
	"txt", "md", "markdown", "json", "xml", "csv", "tsv", "log", "html", "htm", "css", "js", "jsx", "ts", "tsx",
	"yml", "yaml", "ini", "conf", "env", "sql", "py", "rb", "go", "rs", "java", "php", "sh", "toml",
]);

export type StoragePreviewKind = "image" | "video" | "audio" | "pdf" | "text" | "docx" | "sheet" | "slides" | "download";

const PREVIEW_BYTE_LIMIT = 20 * 1024 * 1024;

export function fileExtension(name: string): string {
	const base = name.split("/").pop() ?? name;
	const dot = base.lastIndexOf(".");
	return dot > 0 ? base.slice(dot + 1).toLowerCase() : "";
}

export function previewKind(name: string): StoragePreviewKind {
	const ext = fileExtension(name);
	if (IMAGE.has(ext)) return "image";
	if (VIDEO.has(ext)) return "video";
	if (AUDIO.has(ext)) return "audio";
	if (ext === "pdf") return "pdf";
	if (TEXT.has(ext) || ext === "rtf") return "text";
	if (ext === "docx" || ext === "doc" || ext === "odt") return "docx";
	if (ext === "xlsx" || ext === "xlsm" || ext === "xls" || ext === "ods") return "sheet";
	if (ext === "pptx" || ext === "ppt" || ext === "odp") return "slides";
	return "download";
}

export function storageObjectUrl(resourceId: string, key: string): string {
	return `/api/nisc-storage/object?resourceId=${encodeURIComponent(resourceId)}&key=${encodeURIComponent(key)}`;
}

export function previewNeedsBytes(kind: StoragePreviewKind): boolean {
	return kind === "text" || kind === "docx" || kind === "sheet" || kind === "slides";
}

export async function loadPreviewHtml(kind: StoragePreviewKind, name: string, bytes: ArrayBuffer): Promise<string> {
	if (bytes.byteLength > PREVIEW_BYTE_LIMIT) {
		return "<p>This file is too large to preview here. Download it to open the full file.</p>";
	}
	if (kind === "text") return textPreview(name, bytes);
	if (kind === "docx") return documentPreview(bytes);
	if (kind === "sheet") return workbookPreview(bytes);
	if (kind === "slides") return slidesPreview(bytes);
	return "<p>Download this file to open it.</p>";
}

function textPreview(name: string, bytes: ArrayBuffer): string {
	const ext = fileExtension(name);
	const text = new TextDecoder().decode(bytes);
	if (ext === "csv" || ext === "tsv") return tableHtml(parseDelimited(text, ext === "tsv" ? "\t" : ","));
	if (ext === "rtf") return paragraphs(stripRtf(text));
	return `<pre>${escapeHtml(text.slice(0, 500_000))}</pre>`;
}

async function documentPreview(bytes: ArrayBuffer): Promise<string> {
	const zip = await JSZip.loadAsync(bytes).catch(() => null);
	if (!zip) return "<p>This document can be downloaded and opened on your computer.</p>";
	const word = await zip.file("word/document.xml")?.async("string");
	if (word) return paragraphs(wordParagraphs(word));
	const odt = await zip.file("content.xml")?.async("string");
	if (odt) return paragraphs(xmlTexts(odt, "text:p"));
	return "<p>This document can be downloaded and opened on your computer.</p>";
}

async function workbookPreview(bytes: ArrayBuffer): Promise<string> {
	const zip = await JSZip.loadAsync(bytes).catch(() => null);
	if (!zip) return "<p>This spreadsheet can be downloaded and opened on your computer.</p>";
	const content = await zip.file("content.xml")?.async("string");
	if (content) return odsPreview(content);
	const shared = sharedStrings(await zip.file("xl/sharedStrings.xml")?.async("string"));
	const rels = await zip.file("xl/_rels/workbook.xml.rels")?.async("string");
	const book = await zip.file("xl/workbook.xml")?.async("string");
	if (!book || !rels) return "<p>This spreadsheet can be downloaded and opened on your computer.</p>";
	const sheets = workbookSheets(book, rels).slice(0, 8);
	const parts: string[] = [];
	for (const sheet of sheets) {
		const xml = await zip.file(sheet.path)?.async("string");
		if (!xml) continue;
		parts.push(`<h2>${escapeHtml(sheet.name)}</h2>${tableHtml(sheetRows(xml, shared))}`);
	}
	return parts.join("") || "<p>This spreadsheet has no rows to show.</p>";
}

async function slidesPreview(bytes: ArrayBuffer): Promise<string> {
	const zip = await JSZip.loadAsync(bytes).catch(() => null);
	if (!zip) return "<p>This presentation can be downloaded and opened on your computer.</p>";
	const names = Object.keys(zip.files)
		.filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
		.sort((a, b) => slideNumber(a) - slideNumber(b))
		.slice(0, 40);
	if (names.length > 0) {
		const parts: string[] = [];
		for (const [index, name] of names.entries()) {
			const xml = await zip.file(name)?.async("string");
			const lines = xml ? xmlTexts(xml, "a:t") : [];
			parts.push(`<h2>Slide ${index + 1}</h2>${paragraphs(lines)}`);
		}
		return parts.join("");
	}
	const odp = await zip.file("content.xml")?.async("string");
	if (odp) return paragraphs(xmlTexts(odp, "text:p"));
	return "<p>This presentation can be downloaded and opened on your computer.</p>";
}

function odsPreview(xml: string): string {
	const tables = xml.split(/<table:table[\s>]/).slice(1).slice(0, 8);
	return tables
		.map((table) => {
			const name = attr(table, "table:name") || "Sheet";
			const rows = table
				.split(/<table:table-row[\s>]/)
				.slice(1)
				.slice(0, 200)
				.map((row) =>
					row
						.split(/<table:table-cell[\s>]/)
						.slice(1)
						.slice(0, 40)
						.map((cell) => xmlTexts(cell, "text:p").join(" ")),
				);
			return `<h2>${escapeHtml(name)}</h2>${tableHtml(rows)}`;
		})
		.join("");
}

function wordParagraphs(xml: string): string[] {
	return xml
		.split(/<\/w:p>/)
		.map((paragraph) => xmlTexts(paragraph, "w:t").join(""))
		.filter((line) => line.trim().length > 0)
		.slice(0, 2000);
}

function sharedStrings(xml: string | undefined): string[] {
	if (!xml) return [];
	return xml.split(/<\/si>/).map((item) => xmlTexts(item, "t").join(""));
}

function workbookSheets(book: string, rels: string): { name: string; path: string }[] {
	const targets = new Map<string, string>();
	for (const rel of rels.split(/<Relationship\b/)) {
		const id = attr(rel, "Id");
		const target = attr(rel, "Target");
		if (!id || !target) continue;
		const path = target.replace(/^\/+/, "");
		targets.set(id, path.startsWith("xl/") ? path : `xl/${path.replace(/^(\.\.\/)+/, "")}`);
	}
	const sheets: { name: string; path: string }[] = [];
	for (const sheet of book.split(/<sheet\b/)) {
		const name = attr(sheet, "name");
		const id = attr(sheet, "r:id");
		const path = id ? targets.get(id) : undefined;
		if (name && path) sheets.push({ name, path });
	}
	return sheets;
}

function sheetRows(xml: string, strings: string[]): string[][] {
	const rows: string[][] = [];
	for (const row of xml.split(/<row\b/).slice(1).slice(0, 200)) {
		const cells: string[] = [];
		for (const cell of row.split(/<c\b/).slice(1).slice(0, 40)) {
			const ref = attr(cell, "r") ?? "";
			const column = columnIndex(ref.replace(/\d+/g, ""));
			const kind = attr(cell, "t");
			const value = tagValue(cell, "v") ?? (kind === "inlineStr" ? xmlTexts(cell, "t").join("") : "");
			const text = kind === "s" ? strings[Number(value)] ?? "" : decodeXml(value);
			while (cells.length < column) cells.push("");
			cells[column] = text;
		}
		rows.push(cells);
	}
	return rows;
}

function parseDelimited(text: string, delimiter: string): string[][] {
	return text
		.split(/\r?\n/)
		.slice(0, 200)
		.filter((line) => line.length > 0)
		.map((line) => line.split(delimiter).slice(0, 40).map((cell) => cell.replace(/^"|"$/g, "")));
}

function tableHtml(rows: string[][]): string {
	if (rows.length === 0) return "<p>Nothing to show in this sheet.</p>";
	const body = rows
		.map(
			(row) =>
				`<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
		)
		.join("");
	return `<table>${body}</table>`;
}

function paragraphs(lines: string[]): string {
	if (lines.length === 0) return "<p>Nothing to show in this file.</p>";
	return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}

function xmlTexts(xml: string, tag: string): string[] {
	const pattern = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "g");
	return [...xml.matchAll(pattern)].map((match) => decodeXml(match[1] ?? ""));
}

function tagValue(xml: string, tag: string): string | null {
	const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`));
	return match ? decodeXml(match[1] ?? "") : null;
}

function attr(xml: string, name: string): string | null {
	const match = xml.match(new RegExp(`\\b${name}="([^"]*)"`));
	return match?.[1] ? decodeXml(match[1]) : null;
}

function columnIndex(letters: string): number {
	let index = 0;
	for (const char of letters.toUpperCase()) {
		const code = char.charCodeAt(0);
		if (code < 65 || code > 90) break;
		index = index * 26 + (code - 64);
	}
	return Math.max(0, index - 1);
}

function slideNumber(name: string): number {
	const match = name.match(/(\d+)/);
	return match ? Number(match[1]) : 0;
}

function stripRtf(value: string): string[] {
	return value
		.replace(/\\par[d]?/g, "\n")
		.replace(/\\'[0-9a-fA-F]{2}/g, " ")
		.replace(/\\[a-z]+-?\d* ?/g, "")
		.replace(/[{}]/g, "")
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.slice(0, 2000);
}

function decodeXml(value: string): string {
	return value
		.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
		.replace(/&#x([0-9a-fA-F]+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
		.replace(/&amp;/g, "&");
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}
