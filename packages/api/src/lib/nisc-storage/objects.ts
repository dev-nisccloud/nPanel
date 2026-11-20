import { createHash, randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

import { and, eq, lt, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { niscStorageResource, niscStorageUploadReservation } from "@npanel/db/schema/nisc-storage";
import archiver from "archiver";
import { openPromise, validateFileName, type Entry, type ZipFile } from "yauzl";

import { assertFileAccess, type StorageAccess, type StorageActor } from "./access";
import { StorageOperationError } from "./errors";
import { listAccess, syntheticFolders } from "./grants";
import {
	INTERNAL_OBJECT_PREFIX,
	isUnderPrefix,
	joinStorageKey,
	normalizeObjectKey,
	normalizeStoragePrefix,
	parseByteCount,
} from "./keys";
import {
	copyStoredObject,
	downloadStoredObject,
	headStoredObject,
	listRawKeys,
	listStoredObjects,
	presignDownload,
	putFolderMarker,
	putStoredObjectBody,
	removeStoredObject,
	removeStoredObjects,
	uploadStoredFile,
} from "./seaweed";

const CONTENT_TYPE = /^[\w!#$&^.+-]{1,64}\/[\w!#$&^.+-]{1,120}$/;
const ZIP_MAX_BYTES = 500 * 1024 * 1024;
const ZIP_MAX_ENTRIES = 1000;
const ZIP_MAX_SELECTED = 100;
const EXTRACT_RATIO = 100n;

function requireKey(input: string): string {
	const key = normalizeObjectKey(input);
	if (!key) throw new StorageOperationError("That file name is not allowed.", "LIMIT");
	return key;
}

function requireFolder(input: string): string {
	const prefix = normalizeStoragePrefix(input);
	if (prefix === null) throw new StorageOperationError("That folder name is not allowed.", "LIMIT");
	return prefix;
}

function contentTypeOrThrow(value: string): string {
	if (!CONTENT_TYPE.test(value)) {
		throw new StorageOperationError("That file type is not allowed.", "LIMIT");
	}
	return value;
}

async function adjustUsage(resourceId: string, delta: bigint): Promise<void> {
	if (delta === 0n) return;
	const [row] = await db
		.select({ usedBytes: niscStorageResource.usedBytes })
		.from(niscStorageResource)
		.where(eq(niscStorageResource.id, resourceId))
		.limit(1);
	if (!row) return;
	const next = (parseByteCount(row.usedBytes) ?? 0n) + delta;
	await db
		.update(niscStorageResource)
		.set({ usedBytes: (next > 0n ? next : 0n).toString(), updatedAt: new Date() })
		.where(and(eq(niscStorageResource.id, resourceId), eq(niscStorageResource.usedBytes, row.usedBytes)));
}

export async function listStorageFolder(
	access: StorageAccess,
	actor: StorageActor,
	folderInput: string,
	maxKeys: number,
	token?: string,
) {
	const folder = requireFolder(folderInput);
	if (access.scope === "member") {
		const mode = listAccess(access.grants, folder);
		if (mode === "none") throw new StorageOperationError("You do not have access to this folder.", "DENIED");
		const sample = access.grants.find((grant) => grant.canList);
		await assertFileAccess(access, actor, "list", sample?.prefix || folder || "folder");
		if (mode === "synthetic") {
			return {
				folders: syntheticFolders(access.grants, folder).map((prefix) => ({ prefix })),
				files: [],
				nextToken: null,
			};
		}
	} else {
		await assertFileAccess(access, actor, "list", folder || "folder");
	}

	const listed = await listStoredObjects({
		bucket: access.resource.bucketName,
		prefix: folder === "" ? "" : `${folder}/`,
		delimiter: "/",
		maxKeys,
		token,
	});
	const folders = listed.folders
		.map((prefix) => prefix.replace(/\/+$/, ""))
		.filter((prefix) => prefix && !prefix.split("/").includes(INTERNAL_OBJECT_PREFIX))
		.filter((prefix) => access.scope !== "member" || listAccess(access.grants, prefix) !== "none");
	const files = listed.files.filter((file) => {
		if (!normalizeObjectKey(file.key)) return false;
		if (access.scope === "member" && !isUnderPrefix(folder, file.key)) return false;
		return true;
	});
	return {
		folders: folders.map((prefix) => ({ prefix })),
		files,
		nextToken: listed.nextToken,
	};
}

export async function createStorageFolder(access: StorageAccess, actor: StorageActor, folderInput: string) {
	const folder = requireFolder(folderInput);
	if (!folder) throw new StorageOperationError("Choose a folder name.", "LIMIT");
	await assertFileAccess(access, actor, "put", folder);
	await putFolderMarker(access.resource.bucketName, `${folder}/`);
	return { prefix: folder };
}

export async function createStorageUpload(
	access: StorageAccess,
	actor: StorageActor,
	folderInput: string,
	fileName: string,
	contentTypeInput: string,
	fileSize: number,
) {
	contentTypeOrThrow(contentTypeInput);
	const key = joinStorageKey(folderInput, fileName);
	if (!key) throw new StorageOperationError("That file name is not allowed.", "LIMIT");
	await assertFileAccess(access, actor, "put", key);

	const maxObject = parseByteCount(access.resource.maxObjectBytes) ?? 0n;
	const quota = parseByteCount(access.resource.quotaBytes) ?? 0n;
	const size = BigInt(fileSize);
	if (size <= 0n || size > maxObject) {
		throw new StorageOperationError("This file is larger than the plan allows.", "LIMIT");
	}
	if (await headStoredObject(access.resource.bucketName, key)) {
		throw new StorageOperationError("A file with that name is already in this folder.", "CONFLICT");
	}

	await db.transaction(async (tx) => {
		await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${access.resource.id}))`);
		const now = new Date();
		await tx
			.delete(niscStorageUploadReservation)
			.where(
				and(
					eq(niscStorageUploadReservation.resourceId, access.resource.id),
					lt(niscStorageUploadReservation.expiresAt, now),
				),
			);
		const heldRows = await tx
			.select({ bytes: niscStorageUploadReservation.bytes, objectKey: niscStorageUploadReservation.objectKey })
			.from(niscStorageUploadReservation)
			.where(eq(niscStorageUploadReservation.resourceId, access.resource.id));
		if (heldRows.some((row) => row.objectKey === key)) {
			throw new StorageOperationError("An upload to this file is already in progress.", "CONFLICT");
		}
		const [fresh] = await tx
			.select({ usedBytes: niscStorageResource.usedBytes })
			.from(niscStorageResource)
			.where(eq(niscStorageResource.id, access.resource.id))
			.limit(1);
		let held = parseByteCount(fresh?.usedBytes ?? "0") ?? 0n;
		for (const row of heldRows) held += parseByteCount(row.bytes) ?? 0n;
		if (held + size > quota) {
			throw new StorageOperationError("This upload would pass the plan's storage quota.", "LIMIT");
		}
		await tx.insert(niscStorageUploadReservation).values({
			id: randomUUID(),
			resourceId: access.resource.id,
			objectKey: key,
			bytes: size.toString(),
			userId: actor.userId,
			expiresAt: new Date(now.getTime() + 6 * 60 * 60 * 1000),
		});
	});

	const uploadUrl = `/api/nisc-storage/upload?resourceId=${encodeURIComponent(access.resource.id)}&key=${encodeURIComponent(key)}`;
	return { key, uploadUrl, expiresInSeconds: 6 * 60 * 60 };
}

/** Stores bytes for a reservation created by createStorageUpload. */
export async function writeReservedUpload(
	access: StorageAccess,
	actor: StorageActor,
	keyInput: string,
	body: ReadableStream<Uint8Array>,
	contentTypeInput: string,
	contentLength: number,
) {
	const key = requireKey(keyInput);
	await assertFileAccess(access, actor, "put", key);
	const contentType = contentTypeOrThrow(contentTypeInput.split(";")[0]?.trim() ?? "");
	if (!Number.isInteger(contentLength) || contentLength <= 0) {
		throw new StorageOperationError("This file is empty.", "LIMIT");
	}
	const [reservation] = await db
		.select()
		.from(niscStorageUploadReservation)
		.where(
			and(
				eq(niscStorageUploadReservation.resourceId, access.resource.id),
				eq(niscStorageUploadReservation.objectKey, key),
				eq(niscStorageUploadReservation.userId, actor.userId),
			),
		)
		.limit(1);
	if (!reservation || reservation.expiresAt.getTime() <= Date.now()) {
		throw new StorageOperationError("This upload is not in progress.", "NOT_FOUND");
	}
	if (reservation.bytes !== String(contentLength)) {
		throw new StorageOperationError("This file is a different size than the one that was started.", "LIMIT");
	}
	await putStoredObjectBody({
		bucket: access.resource.bucketName,
		key,
		body,
		contentType,
		contentLength,
	});
	return { key };
}

export async function completeStorageUpload(access: StorageAccess, actor: StorageActor, keyInput: string) {
	const key = requireKey(keyInput);
	await assertFileAccess(access, actor, "put", key);
	const head = await headStoredObject(access.resource.bucketName, key);
	const [reservation] = await db
		.select()
		.from(niscStorageUploadReservation)
		.where(
			and(
				eq(niscStorageUploadReservation.resourceId, access.resource.id),
				eq(niscStorageUploadReservation.objectKey, key),
				eq(niscStorageUploadReservation.userId, actor.userId),
			),
		)
		.limit(1);
	if (!head) {
		if (reservation) {
			await db.delete(niscStorageUploadReservation).where(eq(niscStorageUploadReservation.id, reservation.id));
		}
		throw new StorageOperationError("The upload has not finished.", "NOT_FOUND");
	}
	const maxObject = parseByteCount(access.resource.maxObjectBytes) ?? 0n;
	if (BigInt(head.size) > maxObject) {
		await removeStoredObject(access.resource.bucketName, key);
		if (reservation) {
			await db.delete(niscStorageUploadReservation).where(eq(niscStorageUploadReservation.id, reservation.id));
		}
		throw new StorageOperationError("This file is larger than the plan allows.", "LIMIT");
	}
	if (reservation) {
		await db.delete(niscStorageUploadReservation).where(eq(niscStorageUploadReservation.id, reservation.id));
		await adjustUsage(access.resource.id, BigInt(head.size));
	}
	return { key, size: head.size };
}

/** Drops an upload that never finished, including a file that already reached the bucket. */
export async function cancelStorageUpload(access: StorageAccess, actor: StorageActor, keyInput: string) {
	const key = requireKey(keyInput);
	await assertFileAccess(access, actor, "put", key);
	const [reservation] = await db
		.select()
		.from(niscStorageUploadReservation)
		.where(
			and(
				eq(niscStorageUploadReservation.resourceId, access.resource.id),
				eq(niscStorageUploadReservation.objectKey, key),
				eq(niscStorageUploadReservation.userId, actor.userId),
			),
		)
		.limit(1);
	if (!reservation) {
		throw new StorageOperationError("This upload is not in progress.", "NOT_FOUND");
	}
	await removeStoredObject(access.resource.bucketName, key).catch(() => undefined);
	await db.delete(niscStorageUploadReservation).where(eq(niscStorageUploadReservation.id, reservation.id));
	return { key };
}

export async function createStorageDownload(access: StorageAccess, actor: StorageActor, keyInput: string) {
	const key = requireKey(keyInput);
	await assertFileAccess(access, actor, "get", key);
	const head = await headStoredObject(access.resource.bucketName, key);
	if (!head) throw new StorageOperationError("That file was not found.", "NOT_FOUND");
	const fileName = key.split("/").pop() ?? "download";
	const downloadUrl = await presignDownload({
		bucket: access.resource.bucketName,
		key,
		fileName,
	});
	return { key, downloadUrl, size: head.size, expiresInSeconds: 15 * 60 };
}

export async function deleteStorageFile(access: StorageAccess, actor: StorageActor, keyInput: string) {
	const key = requireKey(keyInput);
	await assertFileAccess(access, actor, "delete", key);
	const head = await headStoredObject(access.resource.bucketName, key);
	await removeStoredObject(access.resource.bucketName, key);
	if (head && head.size > 0) {
		const [row] = await db
			.select({ usedBytes: niscStorageResource.usedBytes })
			.from(niscStorageResource)
			.where(eq(niscStorageResource.id, access.resource.id))
			.limit(1);
		const next = (parseByteCount(row?.usedBytes ?? "0") ?? 0n) - BigInt(head.size);
		await db
			.update(niscStorageResource)
			.set({ usedBytes: (next > 0n ? next : 0n).toString(), updatedAt: new Date() })
			.where(eq(niscStorageResource.id, access.resource.id));
	}
	return { key };
}

export async function deleteStoragePrefix(access: StorageAccess, actor: StorageActor, folderInput: string) {
	const folder = requireFolder(folderInput);
	if (!folder) throw new StorageOperationError("Choose a folder to delete.", "LIMIT");
	await assertFileAccess(access, actor, "delete", folder);
	const prefix = `${folder}/`;
	let deleted = 0;
	let token: string | undefined;
	for (let page = 0; page < 4; page += 1) {
		const listed = await listRawKeys({
			bucket: access.resource.bucketName,
			prefix,
			token,
			maxKeys: 500,
		});
		const keys = listed.objects.map((object) => object.key).filter((key) => key.startsWith(prefix));
		if (keys.length === 0) return { prefix: folder, deleted, complete: true };
		await removeStoredObjects(access.resource.bucketName, keys);
		deleted += keys.length;
		if (!listed.nextToken) return { prefix: folder, deleted, complete: true };
		token = listed.nextToken;
	}
	return { prefix: folder, deleted, complete: false };
}

export async function moveStorageFile(
	access: StorageAccess,
	actor: StorageActor,
	sourceInput: string,
	destinationFolder: string,
	destinationName: string,
) {
	const source = requireKey(sourceInput);
	const destination = joinStorageKey(destinationFolder, destinationName);
	if (!destination) throw new StorageOperationError("That file name is not allowed.", "LIMIT");
	if (source === destination) return { key: destination };
	await assertFileAccess(access, actor, "delete", source);
	await assertFileAccess(access, actor, "put", destination);
	if (!(await headStoredObject(access.resource.bucketName, source))) {
		throw new StorageOperationError("That file was not found.", "NOT_FOUND");
	}
	if (await headStoredObject(access.resource.bucketName, destination)) {
		throw new StorageOperationError("A file with that name is already in this folder.", "CONFLICT");
	}
	await copyStoredObject(access.resource.bucketName, source, destination);
	try {
		await removeStoredObject(access.resource.bucketName, source);
	} catch {
		throw new StorageOperationError(
			"The file was copied, and the original is still in the old folder.",
			"CONFLICT",
		);
	}
	return { key: destination };
}

function safeZipRelative(name: string): string | null {
	if (validateFileName(name)) return null;
	const normalized = name.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
	if (!normalized || normalized.split("/").includes("__MACOSX")) return null;
	if (normalized.split("/").some((part) => part === ".DS_Store")) return null;
	return normalizeObjectKey(normalized);
}

export async function extractStorageZip(
	access: StorageAccess,
	actor: StorageActor,
	zipKeyInput: string,
	destinationInput: string,
) {
	const zipKey = requireKey(zipKeyInput);
	const destination = requireFolder(destinationInput);
	if (!zipKey.toLowerCase().endsWith(".zip")) {
		throw new StorageOperationError("Choose a zip file.", "LIMIT");
	}
	await assertFileAccess(access, actor, "get", zipKey);
	if (
		access.scope === "member" &&
		destination === "" &&
		!access.grants.some((grant) => grant.prefix === "" && grant.canPut)
	) {
		throw new StorageOperationError("You do not have access to this folder.", "DENIED");
	}
	await assertFileAccess(access, actor, "put", destination === "" ? zipKey : destination);
	const head = await headStoredObject(access.resource.bucketName, zipKey);
	if (!head) throw new StorageOperationError("That file was not found.", "NOT_FOUND");
	const maxObject = Number(parseByteCount(access.resource.maxObjectBytes) ?? 0n);
	const quota = parseByteCount(access.resource.quotaBytes) ?? 0n;
	const used = parseByteCount(access.resource.usedBytes) ?? 0n;
	const remaining = quota > used ? quota - used : 0n;
	const zipCap = Math.min(head.size, maxObject, ZIP_MAX_BYTES);
	if (head.size <= 0 || head.size > zipCap) {
		throw new StorageOperationError("This zip is larger than the plan allows.", "LIMIT");
	}

	const directory = await mkdtemp(join(tmpdir(), "nisc-zip-"));
	const zipPath = join(directory, "archive.zip");
	const created: string[] = [];
	let zipfile: ZipFile | null = null;
	try {
		await downloadStoredObject(access.resource.bucketName, zipKey, zipPath);
		const downloaded = (await stat(zipPath)).size;
		if (downloaded !== head.size || downloaded > zipCap) {
			throw new StorageOperationError("This zip is larger than the plan allows.", "LIMIT");
		}
		zipfile = await openPromise(zipPath, { autoClose: false, lazyEntries: true, validateEntrySizes: true });
		if (zipfile.entryCount > ZIP_MAX_ENTRIES) {
			throw new StorageOperationError("This zip has too many files.", "LIMIT");
		}
		const planned: Array<{ entry: Entry; relative: string }> = [];
		let uncompressed = 0n;
		for await (const entry of zipfile.eachEntry()) {
			if (entry.isEncrypted) throw new StorageOperationError("Password-protected zips cannot be unpacked.", "LIMIT");
			if (entry.fileName.endsWith("/")) continue;
			const relative = safeZipRelative(entry.fileName);
			if (!relative) continue;
			uncompressed += BigInt(entry.uncompressedSize);
			if (uncompressed > remaining || uncompressed > BigInt(downloaded) * EXTRACT_RATIO) {
				throw new StorageOperationError("The unpacked files would pass the storage quota.", "LIMIT");
			}
			planned.push({ entry, relative });
		}
		if (planned.length === 0) throw new StorageOperationError("The zip has no files to unpack.", "LIMIT");

		let written = 0n;
		for (const item of planned) {
			const objectKey = destination ? normalizeObjectKey(`${destination}/${item.relative}`) : item.relative;
			if (!objectKey) throw new StorageOperationError("The zip contains a file name that is not allowed.", "LIMIT");
			await assertFileAccess(access, actor, "put", objectKey);
			const entryPath = join(directory, "entry.bin");
			const source = await zipfile.openReadStreamPromise(item.entry);
			let entryBytes = 0;
			const limiter = new Transform({
				transform(chunk: Buffer, _encoding, callback) {
					entryBytes += chunk.length;
					if (BigInt(entryBytes) > remaining - written) {
						callback(new StorageOperationError("The unpacked files would pass the storage quota.", "LIMIT"));
						return;
					}
					callback(null, chunk);
				},
			});
			await pipeline(source, limiter, createWriteStream(entryPath));
			await uploadStoredFile({
				bucket: access.resource.bucketName,
				key: objectKey,
				filePath: entryPath,
				contentType: "application/octet-stream",
			});
			await rm(entryPath, { force: true });
			created.push(objectKey);
			written += BigInt(entryBytes);
		}
		await adjustUsage(access.resource.id, written);
		return { extracted: created.length };
	} catch (error) {
		if (created.length > 0) {
			await removeStoredObjects(access.resource.bucketName, created).catch(() => undefined);
		}
		throw error instanceof StorageOperationError
			? error
			: new StorageOperationError("The zip could not be unpacked.", "FAILED");
	} finally {
		zipfile?.close();
		await rm(directory, { recursive: true, force: true });
	}
}

export async function downloadStorageZip(
	access: StorageAccess,
	actor: StorageActor,
	keyInputs: string[],
) {
	if (keyInputs.length === 0 || keyInputs.length > ZIP_MAX_SELECTED) {
		throw new StorageOperationError("Choose between 1 and 100 files.", "LIMIT");
	}
	const keys = [...new Set(keyInputs.map(requireKey))];
	let total = 0;
	for (const key of keys) {
		await assertFileAccess(access, actor, "get", key);
		const head = await headStoredObject(access.resource.bucketName, key);
		if (!head) throw new StorageOperationError("That file was not found.", "NOT_FOUND");
		total += head.size;
		if (total > ZIP_MAX_BYTES) {
			throw new StorageOperationError("The selected files are larger than 500 MB.", "LIMIT");
		}
	}

	const packFolder = createHash("sha256").update(actor.userId).digest("hex").slice(0, 32);
	const packPrefix = `${INTERNAL_OBJECT_PREFIX}/${packFolder}/`;
	const existing = await listRawKeys({
		bucket: access.resource.bucketName,
		prefix: packPrefix,
		maxKeys: 20,
	});
	if (existing.objects.length > 0) {
		await removeStoredObjects(
			access.resource.bucketName,
			existing.objects.map((object) => object.key),
		);
		const removed = existing.objects.reduce((sum, object) => sum + BigInt(Math.max(0, object.size)), 0n);
		await adjustUsage(access.resource.id, -removed);
	}

	const directory = await mkdtemp(join(tmpdir(), "nisc-pack-"));
	const archivePath = join(directory, "download.zip");
	try {
		const output = createWriteStream(archivePath);
		const archive = archiver("zip", { zlib: { level: 1 } });
		const finished = new Promise<void>((resolve, reject) => {
			output.on("close", () => resolve());
			output.on("error", reject);
			archive.on("error", reject);
		});
		archive.pipe(output);
		const packedFiles: { key: string; filePath: string }[] = [];
		let nextFile = 0;
		const pullers = Array.from({ length: Math.min(3, keys.length) }, async () => {
			while (nextFile < keys.length) {
				const key = keys[nextFile];
				nextFile += 1;
				if (!key) return;
				const filePath = join(directory, `${randomUUID()}.bin`);
				await downloadStoredObject(access.resource.bucketName, key, filePath);
				packedFiles.push({ key, filePath });
			}
		});
		await Promise.all(pullers);
		for (const key of keys) {
			const packed = packedFiles.find((item) => item.key === key);
			if (packed) archive.file(packed.filePath, { name: key });
		}
		await archive.finalize();
		await finished;
		const packed = (await stat(archivePath)).size;
		if (packed > ZIP_MAX_BYTES) {
			throw new StorageOperationError("The zip is larger than 500 MB.", "LIMIT");
		}
		const packKey = `${packPrefix}${randomUUID()}.zip`;
		await uploadStoredFile({
			bucket: access.resource.bucketName,
			key: packKey,
			filePath: archivePath,
			contentType: "application/zip",
		});
		const downloadUrl = await presignDownload({
			bucket: access.resource.bucketName,
			key: packKey,
			fileName: "download.zip",
		});
		await adjustUsage(access.resource.id, BigInt(packed));
		return { downloadUrl, size: packed, expiresInSeconds: 15 * 60 };
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
}
