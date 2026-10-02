import { randomBytes } from "node:crypto";
import { createWriteStream, existsSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, posix } from "node:path";
import { PassThrough, Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { Client } from "basic-ftp";
import { openPromise, validateFileName, type Entry, type ZipFile } from "yauzl";

import {
	FTP_PUBLIC_ERROR_MESSAGE,
	connectFtp,
	isOptionalFtpSizeError,
	type FtpDownloadCredentials,
	openFtpTicket,
	sealFtpTicket,
} from "./ftp-download";

const TICKET_TTL_MS = 5 * 60 * 1000;
export const FTP_UPLOAD_MAX_BYTES = 50 * 1024 * 1024;
export const FTP_EXTRACT_MAX_BYTES = 500 * 1024 * 1024;
const EXTRACT_ENTRY_LIMIT = 20_000;
const FAILED_PATH_LIMIT = 20;

export type FtpUploadTicket = {
	uid: string;
	exp: number;
	remotePath: string;
	maxBytes: number;
	credentials: FtpDownloadCredentials;
};

export type FtpExtractTicket = {
	uid: string;
	exp: number;
	zipPath: string;
	extractTo: string;
	overwrite: boolean;
	maxBytes: number;
	credentials: FtpDownloadCredentials;
};

export type FtpExtractResult = {
	success: true;
	extractedCount: number;
	failedCount: number;
	failedFiles: string[];
	message: string;
};

class FtpTransferError extends Error {
	constructor(
		readonly status: number,
		message: string,
	) {
		super(message);
	}
}

export function createFtpUploadUrl(ticket: Omit<FtpUploadTicket, "exp">): string {
	const token = sealFtpTicket("upload", { ...ticket }, TICKET_TTL_MS);
	return `/api/hosting/ftp/upload?ticket=${encodeURIComponent(token)}`;
}

export function openFtpUploadTicket(token: string): FtpUploadTicket | null {
	const parsed = openFtpTicket<FtpUploadTicket>("upload", token);
	if (!parsed?.uid || !parsed.exp || !parsed.remotePath || !parsed.credentials?.host) return null;
	if (parsed.exp < Date.now()) return null;
	if (!Number.isFinite(parsed.maxBytes) || parsed.maxBytes < 0 || parsed.maxBytes > FTP_UPLOAD_MAX_BYTES) {
		return null;
	}
	return parsed;
}

export function createFtpExtractUrl(ticket: Omit<FtpExtractTicket, "exp">): string {
	const token = sealFtpTicket("extract", { ...ticket }, TICKET_TTL_MS);
	return `/api/hosting/ftp/extract?ticket=${encodeURIComponent(token)}`;
}

export function openFtpExtractTicket(token: string): FtpExtractTicket | null {
	const parsed = openFtpTicket<FtpExtractTicket>("extract", token);
	if (!parsed?.uid || !parsed.exp || !parsed.zipPath || !parsed.extractTo || !parsed.credentials?.host) {
		return null;
	}
	if (parsed.exp < Date.now()) return null;
	if (!Number.isFinite(parsed.maxBytes) || parsed.maxBytes <= 0 || parsed.maxBytes > FTP_EXTRACT_MAX_BYTES) {
		return null;
	}
	return parsed;
}

function jsonError(message: string, status: number): Response {
	return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

export function safeRemotePath(path: string): string | null {
	const normalized = path.replace(/\\/g, "/").replace(/\/+/g, "/");
	if (!normalized.startsWith("/")) return null;
	if (normalized.split("/").some((part) => part === "..")) return null;
	return normalized.length > 1 ? normalized.replace(/\/+$/, "") : "/";
}

function safeZipEntry(name: string): string | null {
	const normalized = name.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
	if (!normalized) return null;
	if (validateFileName(normalized)) return null;
	if (normalized.split("/").includes("__MACOSX")) return null;
	return normalized;
}

export async function receiveFtpUpload(
	ticket: FtpUploadTicket,
	body: ReadableStream<Uint8Array> | null,
	contentLength: number | null,
	revealDetails: boolean,
): Promise<Response> {
	if (!body) return jsonError(FTP_PUBLIC_ERROR_MESSAGE, 400);
	if (contentLength != null && contentLength !== ticket.maxBytes) {
		const overLimit = contentLength > FTP_UPLOAD_MAX_BYTES;
		return jsonError(
			overLimit
				? "This file is larger than the 50MB upload limit."
				: revealDetails
					? "Upload size did not match the declared file size."
					: FTP_PUBLIC_ERROR_MESSAGE,
			overLimit ? 413 : 400,
		);
	}

	const remotePath = safeRemotePath(ticket.remotePath);
	if (!remotePath || remotePath === "/") return jsonError(FTP_PUBLIC_ERROR_MESSAGE, 400);

	const tempFile = join(tmpdir(), `ftp-upload-${Date.now()}-${randomBytes(6).toString("hex")}`);
	let client: Client | null = null;
	try {
		let seen = 0;
		const limit = new Transform({
			transform(chunk: Buffer, _encoding, callback) {
				seen += chunk.length;
				if (seen > ticket.maxBytes) {
					const overLimit = ticket.maxBytes >= FTP_UPLOAD_MAX_BYTES;
					callback(
						new FtpTransferError(
							overLimit ? 413 : 400,
							overLimit
								? "This file is larger than the 50MB upload limit."
								: revealDetails
									? "Upload size did not match the declared file size."
									: FTP_PUBLIC_ERROR_MESSAGE,
						),
					);
					return;
				}
				callback(null, chunk);
			},
		});
		await pipeline(Readable.fromWeb(body), limit, createWriteStream(tempFile));
		if (seen !== ticket.maxBytes) {
			throw new FtpTransferError(
				400,
				revealDetails ? "Upload size did not match the declared file size." : FTP_PUBLIC_ERROR_MESSAGE,
			);
		}

		client = await connectFtp(ticket.credentials);
		const parent = posix.dirname(remotePath);
		if (parent && parent !== "/" && parent !== ".") {
			await client.ensureDir(parent);
		}
		await client.uploadFrom(tempFile, remotePath);
		return Response.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
	} catch (error) {
		if (error instanceof FtpTransferError) {
			return jsonError(error.message, error.status);
		}
		console.error("FTP upload failed:", error);
		const detail = error instanceof Error ? error.message : "";
		return jsonError(revealDetails && detail ? detail.slice(0, 500) : FTP_PUBLIC_ERROR_MESSAGE, 502);
	} finally {
		try {
			client?.close();
		} catch (error) {
			console.error("Failed to close FTP upload client:", error);
		}
		try {
			if (existsSync(tempFile)) rmSync(tempFile, { force: true });
		} catch (error) {
			console.error("Failed to cleanup FTP upload temp file:", error);
		}
	}
}

function remoteDir(path: string): string {
	const parent = posix.dirname(path);
	return parent === "." ? "/" : parent;
}

function isInsideNewDirectory(path: string, created: ReadonlySet<string>): boolean {
	let current = path;
	while (current && current !== "/" && current !== ".") {
		if (created.has(current)) return true;
		const parent = posix.dirname(current);
		if (parent === current) return false;
		current = parent;
	}
	return false;
}

/** Create every directory with one walk, instead of restarting from `/` for each file. */
async function ensureRemoteTree(client: Client, directories: Iterable<string>): Promise<Set<string>> {
	const created = new Set<string>();
	const unique = [...new Set(directories)].filter((dir) => dir && dir !== "/").sort((a, b) => a.localeCompare(b));
	if (unique.length === 0) return created;

	await client.cd("/");
	let cwd = "/";
	for (const dir of unique) {
		const parts = dir.split("/").filter(Boolean);
		const cwdParts = cwd === "/" ? [] : cwd.split("/").filter(Boolean);
		let shared = 0;
		while (shared < cwdParts.length && shared < parts.length && cwdParts[shared] === parts[shared]) {
			shared += 1;
		}
		if (shared < cwdParts.length) {
			const ancestor = shared === 0 ? "/" : `/${cwdParts.slice(0, shared).join("/")}`;
			await client.cd(ancestor);
			cwd = ancestor;
		}
		for (let index = shared; index < parts.length; index += 1) {
			const name = parts[index];
			if (!name) continue;
			try {
				await client.send(`MKD ${name}`);
				const next = cwd === "/" ? `/${name}` : `${cwd}/${name}`;
				created.add(next);
			} catch {
				// The directory is already on the server.
			}
			await client.cd(name);
			cwd = cwd === "/" ? `/${name}` : `${cwd}/${name}`;
		}
	}
	return created;
}

async function uploadZipEntry(
	client: Client,
	zipfile: ZipFile,
	entry: Entry,
	remoteFile: string,
	maxBytes: number,
): Promise<void> {
	const source = await zipfile.openReadStreamPromise(entry);
	let written = 0;
	const limited = new Transform({
		transform(chunk: Buffer, _encoding, callback) {
			written += chunk.length;
			if (written > maxBytes) {
				callback(new FtpTransferError(413, "Unpacked archive is larger than the 500MB limit."));
				return;
			}
			callback(null, chunk);
		},
	});
	const pass = new PassThrough();
	const upload = client.uploadFrom(pass, remoteFile);
	const write = pipeline(source, limited, pass);
	try {
		await Promise.all([write, upload]);
	} catch (error) {
		source.destroy();
		pass.destroy();
		await Promise.allSettled([write, upload]);
		throw error;
	}
}

export async function runFtpExtract(ticket: FtpExtractTicket, revealDetails: boolean): Promise<Response> {
	const zipPath = safeRemotePath(ticket.zipPath);
	const extractTo = safeRemotePath(ticket.extractTo);
	if (!zipPath || zipPath === "/" || !extractTo) return jsonError(FTP_PUBLIC_ERROR_MESSAGE, 400);

	const maxBytes = Math.min(ticket.maxBytes, FTP_EXTRACT_MAX_BYTES);
	const tempZip = join(tmpdir(), `ftp-extract-${Date.now()}-${randomBytes(6).toString("hex")}.zip`);
	let client: Client | null = null;
	let zipfile: ZipFile | null = null;
	try {
		client = await connectFtp(ticket.credentials);
		let zipSize: number | undefined;
		try {
			zipSize = await client.size(zipPath);
		} catch (error) {
			if (!isOptionalFtpSizeError(error)) throw error;
		}
		if (typeof zipSize === "number" && zipSize === 0) {
			return jsonError("Zip file is empty.", 400);
		}
		if (typeof zipSize === "number" && zipSize > maxBytes) {
			return jsonError(
				`Zip file size (${Math.round(zipSize / 1024 / 1024)}MB) exceeds the maximum allowed size (${Math.round(maxBytes / 1024 / 1024)}MB).`,
				413,
			);
		}

		await client.downloadTo(tempZip, zipPath);
		const downloaded = statSync(tempZip).size;
		if (downloaded === 0) return jsonError("Zip file is empty.", 400);
		if (downloaded > maxBytes) {
			return jsonError(
				`Zip file size (${Math.round(downloaded / 1024 / 1024)}MB) exceeds the maximum allowed size (${Math.round(maxBytes / 1024 / 1024)}MB).`,
				413,
			);
		}

		zipfile = await openPromise(tempZip, {
			autoClose: false,
			lazyEntries: true,
			validateEntrySizes: true,
			strictFileNames: false,
		});
		if (zipfile.entryCount === 0) return jsonError("Zip file is empty.", 400);
		if (zipfile.entryCount > EXTRACT_ENTRY_LIMIT) {
			return jsonError("This archive has too many files to extract.", 413);
		}

		const planned: Array<{ entry: Entry; relative: string; directory: boolean }> = [];
		const failedFiles: string[] = [];
		let failedCount = 0;
		let uncompressed = 0;
		const noteFailure = (path: string) => {
			failedCount += 1;
			if (failedFiles.length < FAILED_PATH_LIMIT) failedFiles.push(path);
		};

		for await (const entry of zipfile.eachEntry()) {
			const directory = entry.fileName.endsWith("/");
			const relative = safeZipEntry(entry.fileName);
			if (!relative) {
				const raw = entry.fileName.replace(/\\/g, "/");
				if (!directory && !raw.split("/").includes("__MACOSX")) noteFailure(entry.fileName);
				continue;
			}
			if (!directory) {
				uncompressed += entry.uncompressedSize;
				if (uncompressed > maxBytes) {
					return jsonError("Unpacked archive is larger than the 500MB limit.", 413);
				}
			}
			planned.push({ entry, relative, directory });
		}

		const directories = new Set<string>([extractTo]);
		for (const item of planned) {
			const remoteFile = `${extractTo}/${item.relative}`.replace(/\/+/g, "/");
			directories.add(item.directory ? remoteFile : remoteDir(remoteFile));
		}
		let createdDirectories: Set<string>;
		try {
			createdDirectories = await ensureRemoteTree(client, directories);
		} catch (error) {
			console.error("Failed to create extract directories:", error);
			throw error;
		}

		const existingNames = new Map<string, Set<string>>();
		const remoteFileExists = async (remoteFile: string): Promise<boolean> => {
			const parent = remoteDir(remoteFile);
			if (isInsideNewDirectory(parent, createdDirectories)) return false;
			let names = existingNames.get(parent);
			if (!names) {
				try {
					const entries = await client.list(parent);
					names = new Set(entries.filter((entry) => !entry.isDirectory).map((entry) => entry.name));
				} catch {
					names = new Set();
				}
				existingNames.set(parent, names);
			}
			return names.has(posix.basename(remoteFile));
		};

		let extractedCount = 0;
		for (const item of planned) {
			const remoteFile = `${extractTo}/${item.relative}`.replace(/\/+/g, "/");
			if (item.directory) continue;

			try {
				if (!ticket.overwrite && (await remoteFileExists(remoteFile))) {
					noteFailure(remoteFile);
					continue;
				}
				await uploadZipEntry(client, zipfile, item.entry, remoteFile, maxBytes);
				extractedCount += 1;
			} catch (error) {
				if (error instanceof FtpTransferError) throw error;
				console.error(`Failed to extract ${remoteFile}:`, error);
				noteFailure(remoteFile);
			}
		}

		const message = `Successfully extracted ${extractedCount} file(s)${failedCount > 0 ? `, ${failedCount} file(s) failed` : ""}`;
		const result: FtpExtractResult = {
			success: true,
			extractedCount,
			failedCount,
			failedFiles,
			message,
		};
		return Response.json(result, { headers: { "Cache-Control": "no-store" } });
	} catch (error) {
		if (error instanceof FtpTransferError) return jsonError(error.message, error.status);
		console.error("FTP extract failed:", error);
		const detail = error instanceof Error ? error.message : "";
		return jsonError(revealDetails && detail ? detail.slice(0, 500) : FTP_PUBLIC_ERROR_MESSAGE, 502);
	} finally {
		try {
			zipfile?.close();
		} catch (error) {
			console.error("Failed to close zip file:", error);
		}
		try {
			client?.close();
		} catch (error) {
			console.error("Failed to close FTP extract client:", error);
		}
		try {
			if (existsSync(tempZip)) rmSync(tempZip, { force: true });
		} catch (error) {
			console.error("Failed to cleanup FTP extract files:", error);
		}
	}
}
