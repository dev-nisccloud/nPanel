import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { isObjectStorageConfigured } from "../object-storage/config";
import { getObjectBuffer, putObjectBuffer } from "../object-storage/client";

const LOCAL_DIR = path.resolve(process.cwd(), "data/career-cvs");
const KEY_PATTERN = /^(?:s3:private\/career-cvs|local:)([0-9a-f-]{36})\.(pdf|docx)$/;

export async function storeCareerCv(params: {
	id: string;
	extension: "pdf" | "docx";
	contentType: string;
	bytes: Buffer;
}): Promise<string> {
	const fileName = `${params.id}.${params.extension}`;
	if (isObjectStorageConfigured()) {
		const key = `private/career-cvs/${fileName}`;
		await putObjectBuffer({ key, body: params.bytes, contentType: params.contentType });
		return `s3:${key}`;
	}
	await mkdir(LOCAL_DIR, { recursive: true });
	await writeFile(path.join(LOCAL_DIR, fileName), params.bytes, { flag: "wx" });
	return `local:${fileName}`;
}

export async function readCareerCv(storageKey: string): Promise<Buffer> {
	const match = KEY_PATTERN.exec(storageKey);
	if (!match) throw new Error("Invalid CV reference");
	const fileName = `${match[1]}.${match[2]}`;
	if (storageKey.startsWith("s3:")) {
		return getObjectBuffer(`private/career-cvs/${fileName}`);
	}
	const full = path.join(LOCAL_DIR, fileName);
	if (path.dirname(full) !== LOCAL_DIR) throw new Error("Invalid CV reference");
	return readFile(full);
}
