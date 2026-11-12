import AdmZip from "adm-zip";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_UNCOMPRESSED = 20 * 1024 * 1024;
const MAX_ENTRIES = 400;
const BLOCKED_ENTRY = /\.(exe|dll|js|mjs|html|htm|svg|bat|cmd|ps1|vbs|scr|com|jar|msi|apk)$/i;
const PDF_ACTIVE = /\/(JavaScript|JS|Launch|EmbeddedFile|RichMedia|AA)\b/;

export type CareerCvKind = {
	extension: "pdf" | "docx";
	contentType: string;
};

export class CareerCvError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "CareerCvError";
	}
}

function fileBase(fileName: string): string {
	return fileName.split(/[/\\]/).pop()?.replace(/\0/g, "") ?? "";
}

/** Accept only a plain PDF or a DOCX with no macros or embedded programs. */
export function inspectCareerCv(fileName: string, bytes: Buffer): CareerCvKind {
	if (bytes.length === 0 || bytes.length > MAX_BYTES) {
		throw new CareerCvError("Upload a PDF or DOCX up to 5 MB.");
	}
	const base = fileBase(fileName);
	const lower = base.toLowerCase();
	if (!base || base.startsWith(".") || /\.(exe|js|html|svg|bat|cmd|ps1)\./i.test(lower)) {
		throw new CareerCvError("Upload a PDF or DOCX.");
	}
	if (lower.endsWith(".pdf")) return inspectPdf(bytes);
	if (lower.endsWith(".docx")) return inspectDocx(bytes);
	throw new CareerCvError("Upload a PDF or DOCX.");
}

function inspectPdf(bytes: Buffer): CareerCvKind {
	if (!bytes.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
		throw new CareerCvError("That PDF could not be read. Export it again and upload the PDF.");
	}
	if (PDF_ACTIVE.test(bytes.toString("latin1"))) {
		throw new CareerCvError("This PDF includes active content. Export a plain PDF and upload that.");
	}
	return { extension: "pdf", contentType: "application/pdf" };
}

function inspectDocx(bytes: Buffer): CareerCvKind {
	if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
		throw new CareerCvError("That DOCX could not be read. Export it again from Word or Google Docs.");
	}
	let zip: AdmZip;
	try {
		zip = new AdmZip(bytes);
	} catch {
		throw new CareerCvError("That DOCX could not be read. Export it again from Word or Google Docs.");
	}
	const entries = zip.getEntries();
	if (entries.length === 0 || entries.length > MAX_ENTRIES) {
		throw new CareerCvError("That DOCX could not be read.");
	}
	let uncompressed = 0;
	let hasDocument = false;
	for (const entry of entries) {
		const name = entry.entryName.replace(/\\/g, "/");
		if (name.includes("..") || name.startsWith("/") || /vbaProject/i.test(name) || BLOCKED_ENTRY.test(name)) {
			throw new CareerCvError("This document includes content we cannot accept. Save it as a plain DOCX without macros.");
		}
		uncompressed += entry.header.size;
		if (uncompressed > MAX_UNCOMPRESSED) {
			throw new CareerCvError("That DOCX is too large when opened.");
		}
		if (name === "word/document.xml") hasDocument = true;
	}
	if (!hasDocument) throw new CareerCvError("That DOCX could not be read.");
	return {
		extension: "docx",
		contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	};
}
