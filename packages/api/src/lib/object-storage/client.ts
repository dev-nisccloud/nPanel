import { randomUUID } from "node:crypto";
import {
	DeleteObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
	getObjectStorageConfig,
	getPublicObjectUrl,
	type ObjectStorageConfig,
} from "./config";

let cachedClient: S3Client | null = null;
let cachedConfig: ObjectStorageConfig | null = null;

function getClient(): { client: S3Client; config: ObjectStorageConfig } {
	const config = getObjectStorageConfig();
	if (!cachedClient || cachedConfig !== config) {
		cachedClient = new S3Client({
			endpoint: config.endpoint,
			region: config.region,
			credentials: {
				accessKeyId: config.accessKey,
				secretAccessKey: config.secretKey,
			},
			forcePathStyle: true,
		});
		cachedConfig = config;
	}
	return { client: cachedClient, config };
}

export function sanitizeFileName(fileName: string): string {
	const base = fileName.split(/[/\\]/).pop() ?? "file";
	const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
	return cleaned.slice(0, 180) || "file";
}

export function buildObjectKey(params: {
	prefix: string;
	fileName: string;
	userId?: string;
}): string {
	const safePrefix = params.prefix.replace(/^\/+|\/+$/g, "") || "uploads";
	const userSegment = params.userId?.trim() ? `${params.userId}/` : "";
	const safeName = sanitizeFileName(params.fileName);
	return `${safePrefix}/${userSegment}${randomUUID()}-${safeName}`;
}

export async function putObjectBuffer(params: {
	key: string;
	body: Buffer | Uint8Array;
	contentType: string;
}): Promise<{ key: string; publicUrl: string }> {
	const { client, config } = getClient();
	await client.send(
		new PutObjectCommand({
			Bucket: config.bucket,
			Key: params.key,
			Body: params.body,
			ContentType: params.contentType,
		}),
	);
	return { key: params.key, publicUrl: getPublicObjectUrl(params.key) };
}

export async function createPresignedUploadUrl(params: {
	key: string;
	contentType: string;
	expiresInSeconds?: number;
}): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
	const { client, config } = getClient();
	const command = new PutObjectCommand({
		Bucket: config.bucket,
		Key: params.key,
		ContentType: params.contentType,
	});

	const uploadUrl = await getSignedUrl(client, command, {
		expiresIn: params.expiresInSeconds ?? 3600,
	});

	return {
		uploadUrl,
		key: params.key,
		publicUrl: getPublicObjectUrl(params.key),
	};
}

export async function deleteObject(key: string): Promise<void> {
	const { client, config } = getClient();
	await client.send(
		new DeleteObjectCommand({
			Bucket: config.bucket,
			Key: key,
		}),
	);
}

export type ListedObject = {
	key: string;
	size: number;
	lastModified: string | null;
	publicUrl: string;
};

export async function listObjects(params: {
	prefix: string;
	maxKeys?: number;
}): Promise<ListedObject[]> {
	const { client, config } = getClient();
	const prefix = params.prefix.replace(/^\/+/, "");
	const response = await client.send(
		new ListObjectsV2Command({
			Bucket: config.bucket,
			Prefix: prefix,
			MaxKeys: params.maxKeys ?? 50,
		}),
	);

	return (response.Contents ?? [])
		.filter((item): item is NonNullable<typeof item> & { Key: string } => Boolean(item.Key))
		.map((item) => ({
			key: item.Key,
			size: item.Size ?? 0,
			lastModified: item.LastModified?.toISOString() ?? null,
			publicUrl: getPublicObjectUrl(item.Key),
		}))
		.sort((a, b) => (b.lastModified ?? "").localeCompare(a.lastModified ?? ""));
}
