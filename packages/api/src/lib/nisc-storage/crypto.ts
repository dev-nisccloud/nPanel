import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

import { env } from "@npanel/env/server";

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

let cachedKey: Buffer | null = null;

function encryptionKey(): Buffer {
	if (!cachedKey) {
		cachedKey = scryptSync(env.BETTER_AUTH_SECRET, "nisc-storage-secret-v1", 32);
	}
	return cachedKey;
}

/** AES-256-GCM. The returned string is not a credential by itself. */
export function encryptStorageSecret(plaintext: string): string {
	if (!plaintext) throw new Error("Cannot encrypt an empty storage secret");
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
	const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
	const tag = cipher.getAuthTag();
	return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptStorageSecret(ciphertext: string): string {
	const [ivHex, tagHex, dataHex] = ciphertext.split(":");
	if (!ivHex || !tagHex || !dataHex) throw new Error("Stored storage secret is unreadable");
	const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivHex, "hex"));
	decipher.setAuthTag(Buffer.from(tagHex, "hex"));
	const plain = Buffer.concat([
		decipher.update(Buffer.from(dataHex, "hex")),
		decipher.final(),
	]);
	if (plain.length === 0 || tagHex.length !== AUTH_TAG_LENGTH * 2) {
		throw new Error("Stored storage secret is unreadable");
	}
	return plain.toString("utf8");
}
