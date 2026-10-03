import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { existsSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough, Readable } from "node:stream";
import { Client, enterPassiveModeIPv4 } from "basic-ftp";
import archiver from "archiver";

export const FTP_PUBLIC_ERROR_MESSAGE =
	"An error occurred. Please try again later or contact support.";

const DOWNLOAD_TTL_MS = 5 * 60 * 1000;
const MAX_FOLDER_BYTES = 500 * 1024 * 1024;

export type FtpDownloadCredentials = {
	host: string;
	port: number;
	user: string;
	password: string;
	secure: boolean;
	timeout: number;
};

export type FtpDownloadTicket = {
	uid: string;
	exp: number;
	kind: "file" | "folder" | "text" | "preview";
	filename: string;
	remotePath: string;
	folderName?: string;
	maxBytes?: number;
	credentials: FtpDownloadCredentials;
};

function ticketKey(purpose: string): Buffer {
	const secret = process.env.BETTER_AUTH_SECRET;
	if (!secret || secret.length < 32) {
		throw new Error("Download signing secret is not configured");
	}
	return createHash("sha256").update(`npanel-ftp-${purpose}:${secret}`).digest();
}

export function sealFtpTicket(purpose: string, payload: Record<string, unknown>, ttlMs: number): string {
	const iv = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", ticketKey(purpose), iv);
	const plaintext = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + ttlMs }), "utf8");
	const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
	return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64url");
}

export function openFtpTicket<T>(purpose: string, token: string): T | null {
	try {
		const raw = Buffer.from(token, "base64url");
		if (raw.length < 29) return null;
		const decipher = createDecipheriv("aes-256-gcm", ticketKey(purpose), raw.subarray(0, 12));
		decipher.setAuthTag(raw.subarray(12, 28));
		const json = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
		return JSON.parse(json) as T;
	} catch {
		return null;
	}
}

export function createFtpDownloadUrl(ticket: Omit<FtpDownloadTicket, "exp">): string {
	const token = sealFtpTicket("download", { ...ticket }, DOWNLOAD_TTL_MS);
	return `/api/hosting/ftp/download?ticket=${encodeURIComponent(token)}`;
}

export function openFtpDownloadTicket(token: string): FtpDownloadTicket | null {
	const parsed = openFtpTicket<FtpDownloadTicket>("download", token);
	if (!parsed?.uid || !parsed.exp || !parsed.remotePath || !parsed.credentials?.host) return null;
	if (parsed.kind !== "file" && parsed.kind !== "folder" && parsed.kind !== "text" && parsed.kind !== "preview") return null;
	if (parsed.exp < Date.now()) return null;
	return parsed;
}

export function safeFtpDownloadName(name: string | undefined, fallback: string): string {
	const base = (name ?? "").split(/[/\\]/).pop()?.replace(/[\r\n"]/g, "").trim() || fallback;
	return base.slice(0, 180) || fallback;
}

function rawFtpDetail(error: unknown): string {
	if (!error || typeof error !== "object") return String(error ?? "").slice(0, 500);
	const record = error as { code?: unknown; message?: unknown };
	const code = typeof record.code === "string" ? record.code : "";
	const text = error instanceof Error ? error.message : String(record.message ?? "");
	return [code, text].filter((part) => part.trim()).join(": ").replace(/\s+/g, " ").trim().slice(0, 500);
}

export function isOptionalFtpSizeError(error: unknown): boolean {
	const text = rawFtpDetail(error).toLowerCase();
	return text.includes("not implemented") || text.includes("command not understood") || /\b502\b/.test(text);
}

function failureResponse(error: unknown, revealDetails: boolean): Response {
	console.error("FTP download failed:", error);
	const detail = rawFtpDetail(error);
	return Response.json(
		{ message: revealDetails && detail ? detail : FTP_PUBLIC_ERROR_MESSAGE },
		{ status: 502, headers: { "Cache-Control": "no-store" } },
	);
}

function contentDisposition(filename: string): string {
	const ascii = filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
	return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function connectFtp(credentials: FtpDownloadCredentials): Promise<Client> {
	const client = new Client(credentials.timeout || 30_000);
	client.prepareTransfer = enterPassiveModeIPv4;
	await client.access({
		host: credentials.host,
		port: credentials.port,
		user: credentials.user,
		password: credentials.password,
		secure: credentials.secure,
	});
	return client;
}

function tempPath(): string {
	return join(tmpdir(), `ftp-download-${Date.now()}-${randomBytes(6).toString("hex")}`);
}

function removeTemp(path: string): void {
	try {
		if (existsSync(path)) unlinkSync(path);
	} catch (error) {
		console.error("Failed to cleanup FTP download temp file:", error);
	}
}

async function listFiles(client: Client, dirPath: string): Promise<Array<{ path: string; size: number }>> {
	const files: Array<{ path: string; size: number }> = [];
	const entries = await client.list(dirPath);
	for (const entry of entries) {
		if (entry.name === "." || entry.name === "..") continue;
		const fullPath = dirPath === "/" ? `/${entry.name}` : `${dirPath}/${entry.name}`;
		if (entry.isDirectory) {
			files.push(...(await listFiles(client, fullPath)));
		} else {
			files.push({ path: fullPath, size: entry.size || 0 });
		}
	}
	return files;
}

function relativeZipPath(filePath: string, remotePath: string): string | null {
	const relative = filePath.startsWith(remotePath)
		? filePath.slice(remotePath.length).replace(/^\/+/, "")
		: filePath.replace(/^\/+/, "");
	if (!relative || relative.split("/").includes("..")) return null;
	return relative;
}

const TEXT_VIEW_MAX_BYTES = 5 * 1024 * 1024;

export async function respondToFtpDownload(
	ticket: FtpDownloadTicket,
	revealDetails: boolean,
): Promise<Response> {
	if (ticket.kind === "folder") return streamFolder(ticket, revealDetails);
	if (ticket.kind === "text") return streamText(ticket, revealDetails);
	if (ticket.kind === "preview") {
		const contentType = previewContentType(ticket.filename);
		return streamFile(ticket, revealDetails, {
			inline: true,
			// Images can paint without a length. Video players need Content-Length, so keep one SIZE on this same connection.
			skipSize: contentType.startsWith("image/"),
			contentType,
		});
	}
	return streamFile(ticket, revealDetails);
}

const PREVIEW_CONTENT_TYPES: Record<string, string> = {
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	gif: "image/gif",
	webp: "image/webp",
	svg: "image/svg+xml",
	bmp: "image/bmp",
	ico: "image/x-icon",
	apng: "image/apng",
	avif: "image/avif",
	mp4: "video/mp4",
	webm: "video/webm",
	ogg: "video/ogg",
	ogv: "video/ogg",
	mov: "video/quicktime",
	m4v: "video/mp4",
	avi: "video/x-msvideo",
	mkv: "video/x-matroska",
	"3gp": "video/3gpp",
};

function previewContentType(filename: string): string {
	const extension = filename.split(".").pop()?.toLowerCase() ?? "";
	return PREVIEW_CONTENT_TYPES[extension] ?? "application/octet-stream";
}

async function streamText(ticket: FtpDownloadTicket, revealDetails: boolean): Promise<Response> {
	const maxBytes =
		typeof ticket.maxBytes === "number" && ticket.maxBytes > 0
			? Math.min(ticket.maxBytes, TEXT_VIEW_MAX_BYTES)
			: TEXT_VIEW_MAX_BYTES;
	let client: Client | null = null;
	const tempFile = tempPath();
	try {
		client = await connectFtp(ticket.credentials);
		let size: number | undefined;
		try {
			size = await client.size(ticket.remotePath);
		} catch (error) {
			if (!isOptionalFtpSizeError(error)) throw error;
		}
		if (typeof size === "number" && size > maxBytes) {
			client.close();
			client = null;
			return Response.json(
				{ message: "This file is too large to open in the editor." },
				{ status: 413, headers: { "Cache-Control": "no-store" } },
			);
		}
		await client.downloadTo(tempFile, ticket.remotePath);
		client.close();
		client = null;
		const { readFileSync, statSync } = await import("node:fs");
		const actual = statSync(tempFile).size;
		if (actual > maxBytes) {
			return Response.json(
				{ message: "This file is too large to open in the editor." },
				{ status: 413, headers: { "Cache-Control": "no-store" } },
			);
		}
		const content = readFileSync(tempFile);
		return new Response(content, {
			status: 200,
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
				"Cache-Control": "no-store",
				"X-Content-Type-Options": "nosniff",
			},
		});
	} catch (error) {
		client?.close();
		return failureResponse(error, revealDetails);
	} finally {
		removeTemp(tempFile);
	}
}

async function streamFile(
	ticket: FtpDownloadTicket,
	revealDetails: boolean,
	options?: { inline?: boolean; skipSize?: boolean; contentType?: string },
): Promise<Response> {
	let client: Client | null = null;
	try {
		client = await connectFtp(ticket.credentials);
		let size: number | undefined;
		if (!options?.skipSize) {
			try {
				size = await client.size(ticket.remotePath);
			} catch (error) {
				if (!isOptionalFtpSizeError(error)) {
					client.close();
					return failureResponse(error, revealDetails);
				}
			}
		}

		const pass = new PassThrough();
		const ftp = client;
		client = null;
		void ftp
			.downloadTo(pass, ticket.remotePath)
			.catch((error: unknown) => {
				console.error("FTP file stream failed:", error);
				pass.destroy(error instanceof Error ? error : new Error("Download failed"));
			})
			.finally(() => {
				ftp.close();
			});

		const filename = ticket.filename || "download";
		const headers = new Headers({
			"Content-Type": options?.contentType || "application/octet-stream",
			"Content-Disposition": options?.inline
				? `inline; filename="${filename.replace(/["\\]/g, "_")}"`
				: contentDisposition(filename),
			"Cache-Control": options?.inline ? "private, max-age=60" : "no-store",
			"X-Content-Type-Options": "nosniff",
		});
		if (typeof size === "number" && size >= 0) headers.set("Content-Length", String(size));
		return new Response(Readable.toWeb(pass) as ReadableStream, { status: 200, headers });
	} catch (error) {
		client?.close();
		return failureResponse(error, revealDetails);
	}
}

async function streamFolder(ticket: FtpDownloadTicket, revealDetails: boolean): Promise<Response> {
	let client: Client | null = null;
	try {
		client = await connectFtp(ticket.credentials);
		const files = await listFiles(client, ticket.remotePath);
		const totalSize = files.reduce((sum, file) => sum + file.size, 0);
		if (files.length === 0) {
			client.close();
			return failureResponse(new Error("This folder is empty, so there is nothing to download."), revealDetails);
		}
		if (totalSize > MAX_FOLDER_BYTES) {
			client.close();
			return failureResponse(
				new Error(`Folder too large (${Math.round(totalSize / 1024 / 1024)}MB). Maximum allowed size is 500MB.`),
				revealDetails,
			);
		}

		const pass = new PassThrough();
		const archive = archiver("zip", { zlib: { level: 1 } });
		archive.on("error", (error) => pass.destroy(error));
		archive.pipe(pass);

		const ftp = client;
		client = null;
		void (async () => {
			try {
				let packed = 0;
				for (const file of files) {
					const relative = relativeZipPath(file.path, ticket.remotePath);
					if (!relative) continue;
					const source = new PassThrough();
					archive.append(source, { name: relative });
					try {
						await ftp.downloadTo(source, file.path);
						packed += 1;
					} catch (error) {
						console.error(`FTP folder download skipped ${file.path}:`, error);
						source.destroy();
					}
				}
				if (packed === 0) {
					throw new Error("None of the files in this folder could be downloaded.");
				}
				await archive.finalize();
			} catch (error) {
				console.error("FTP folder stream failed:", error);
				archive.abort();
				pass.destroy(error instanceof Error ? error : new Error("Download failed"));
			} finally {
				ftp.close();
			}
		})();

		return new Response(Readable.toWeb(pass) as ReadableStream, {
			status: 200,
			headers: {
				"Content-Type": "application/zip",
				"Content-Disposition": contentDisposition(ticket.filename || "folder.zip"),
				"Cache-Control": "no-store",
				"X-Content-Type-Options": "nosniff",
			},
		});
	} catch (error) {
		client?.close();
		return failureResponse(error, revealDetails);
	}
}
