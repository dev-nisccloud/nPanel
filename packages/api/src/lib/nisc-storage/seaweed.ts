import { createReadStream, createWriteStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import {
	CopyObjectCommand,
	CreateBucketCommand,
	DeleteBucketCommand,
	DeleteObjectCommand,
	DeleteObjectsCommand,
	GetBucketEncryptionCommand,
	GetObjectCommand,
	HeadBucketCommand,
	HeadObjectCommand,
	ListBucketsCommand,
	ListObjectsV2Command,
	PutBucketCorsCommand,
	PutBucketEncryptionCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { XMLParser } from "fast-xml-parser";

import { readNiscStorageConfig, type NiscStorageConfig } from "./config";
import { sanitizeStorageError, StorageOperationError } from "./errors";
import { signedFetch } from "./sigv4";

const PRESIGN_SECONDS = 15 * 60;
/** A slow file can take hours. The signature is checked for the whole PUT. */
const UPLOAD_PRESIGN_SECONDS = 6 * 60 * 60;
const xml = new XMLParser({ ignoreAttributes: true });

let clientCache: { key: string; client: S3Client; config: NiscStorageConfig } | null = null;

function config(): NiscStorageConfig {
	return readNiscStorageConfig();
}

function client(): { client: S3Client; config: NiscStorageConfig } {
	const current = config();
	const key = `${current.endpoint}|${current.accessKey}|${current.region}`;
	if (!clientCache || clientCache.key !== key) {
		clientCache = {
			key,
			config: current,
			client: new S3Client({
				endpoint: current.endpoint,
				region: current.region,
				credentials: {
					accessKeyId: current.accessKey,
					secretAccessKey: current.secretKey,
				},
				forcePathStyle: true,
				requestChecksumCalculation: "WHEN_REQUIRED",
				responseChecksumValidation: "WHEN_REQUIRED",
				maxAttempts: 2,
			}),
		};
	}
	return { client: clientCache.client, config: current };
}

function errorName(error: unknown): string {
	if (!error || typeof error !== "object" || !("name" in error)) return "";
	return String((error as { name: unknown }).name);
}

function httpStatus(error: unknown): number | null {
	if (!error || typeof error !== "object" || !("$metadata" in error)) return null;
	const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
	return typeof status === "number" ? status : null;
}

export function isMissingObject(error: unknown): boolean {
	const name = errorName(error);
	const status = httpStatus(error);
	return name === "NotFound" || name === "NoSuchKey" || status === 404;
}

export function isBucketAlreadyExists(error: unknown): boolean {
	const name = errorName(error);
	return name === "BucketAlreadyExists" || name === "BucketAlreadyOwnedByYou";
}

function findAll(node: unknown, key: string, out: string[] = []): string[] {
	if (!node || typeof node !== "object") return out;
	if (Array.isArray(node)) {
		for (const item of node) findAll(item, key, out);
		return out;
	}
	for (const [name, value] of Object.entries(node as Record<string, unknown>)) {
		if (name === key && (typeof value === "string" || typeof value === "number")) out.push(String(value));
		else findAll(value, key, out);
	}
	return out;
}

function bucketPolicy(bucket: string): string {
	return JSON.stringify({
		Version: "2012-10-17",
		Statement: [
			{
				Effect: "Allow",
				Action: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
				Resource: [`arn:aws:s3:::${bucket}`, `arn:aws:s3:::${bucket}/*`],
			},
		],
	});
}

async function iam(
	action: string,
	fields: Record<string, string>,
): Promise<{ status: number; ids: string[]; secret: string | null; code: string | null }> {
	const current = config();
	const body = new URLSearchParams({ Action: action, Version: "2010-05-08", ...fields }).toString();
	const url = new URL(current.endpoint);
	url.pathname = "/";
	url.search = "";
	const response = await signedFetch({
		method: "POST",
		url,
		service: "iam",
		region: current.region,
		accessKey: current.accessKey,
		secretKey: current.secretKey,
		body,
		headers: { "content-type": "application/x-www-form-urlencoded; charset=utf-8" },
	});
	const text = await response.text();
	let parsed: unknown = null;
	try {
		parsed = xml.parse(text);
	} catch {
		parsed = null;
	}
	const code = findAll(parsed, "Code")[0] ?? null;
	if (!response.ok && code !== "EntityAlreadyExists" && code !== "NoSuchEntity") {
		throw new StorageOperationError(
			sanitizeStorageError(new Error(code ?? `Storage identity request failed (${response.status})`)),
			"FAILED",
		);
	}
	return {
		status: response.status,
		ids: findAll(parsed, "AccessKeyId"),
		secret: findAll(parsed, "SecretAccessKey")[0] ?? null,
		code,
	};
}

async function quotaRequest(method: "GET" | "PUT", bucket: string, body?: string): Promise<Response> {
	const current = config();
	const url = new URL(current.endpoint);
	url.pathname = `/${bucket}`;
	url.search = "seaweedfs-quota";
	return signedFetch({
		method,
		url,
		service: "s3",
		region: current.region,
		accessKey: current.accessKey,
		secretKey: current.secretKey,
		body,
		headers: body ? { "content-type": "application/json" } : undefined,
	});
}

export async function createStorageBucket(bucket: string, reuseExisting: boolean): Promise<void> {
	const { client: s3 } = client();
	try {
		await s3.send(new CreateBucketCommand({ Bucket: bucket }));
	} catch (error) {
		if (isBucketAlreadyExists(error) && reuseExisting) return;
		if (isBucketAlreadyExists(error)) {
			throw new StorageOperationError("That bucket name is already taken.", "CONFLICT");
		}
		throw new StorageOperationError(sanitizeStorageError(error), "FAILED");
	}
}

export async function headStorageBucket(bucket: string): Promise<boolean> {
	const { client: s3 } = client();
	try {
		await s3.send(new HeadBucketCommand({ Bucket: bucket }));
		return true;
	} catch (error) {
		if (httpStatus(error) === 404 || errorName(error) === "NotFound") return false;
		throw new StorageOperationError(sanitizeStorageError(error), "FAILED");
	}
}

const browserCorsReady = new Set<string>();

/**
 * Browser uploads are cross-origin PUTs. Without this rule the preflight
 * fails and the file never starts, so the progress ring stays empty.
 * The signature still authorizes the upload. The browser does not send cookies.
 */
export async function ensureBucketBrowserCors(bucket: string): Promise<void> {
	if (browserCorsReady.has(bucket)) return;
	const { client: s3 } = client();
	try {
		await s3.send(
			new PutBucketCorsCommand({
				Bucket: bucket,
				CORSConfiguration: {
					CORSRules: [
						{
							AllowedOrigins: ["*"],
							AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
							AllowedHeaders: ["*"],
							ExposeHeaders: ["ETag", "Content-Length", "Content-Type"],
							MaxAgeSeconds: 3600,
						},
					],
				},
			}),
		);
	} catch (error) {
		throw new StorageOperationError(sanitizeStorageError(error), "FAILED");
	}
	browserCorsReady.add(bucket);
}

export async function allowBrowserUploadsOnBuckets(): Promise<number> {
	const { client: s3 } = client();
	const listed = await s3.send(new ListBucketsCommand({}));
	const names = (listed.Buckets ?? [])
		.map((bucket) => bucket.Name)
		.filter((name): name is string => Boolean(name));
	for (const name of names) {
		browserCorsReady.delete(name);
		await ensureBucketBrowserCors(name);
	}
	return names.length;
}

export async function putStorageEncryption(bucket: string): Promise<void> {
	const { client: s3 } = client();
	await s3.send(
		new PutBucketEncryptionCommand({
			Bucket: bucket,
			ServerSideEncryptionConfiguration: {
				Rules: [{ ApplyServerSideEncryptionByDefault: { SSEAlgorithm: "AES256" } }],
			},
		}),
	);
}

export async function getStorageEncryption(bucket: string): Promise<string | null> {
	const { client: s3 } = client();
	const result = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucket }));
	return (
		result.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault
			?.SSEAlgorithm ?? null
	);
}

export async function putStorageQuota(bucket: string, bytes: bigint): Promise<void> {
	if (bytes > BigInt(Number.MAX_SAFE_INTEGER)) {
		throw new StorageOperationError("Quota is too large to apply.", "LIMIT");
	}
	const response = await quotaRequest(
		"PUT",
		bucket,
		JSON.stringify({ quota_size: Number(bytes), quota_unit: "B", quota_enabled: true }),
	);
	await response.arrayBuffer().catch(() => undefined);
	if (response.status !== 204 && response.status !== 200) {
		throw new StorageOperationError("The storage quota could not be saved.", "FAILED");
	}
}

export async function getStorageQuota(
	bucket: string,
): Promise<{ bytes: bigint; enabled: boolean } | null> {
	const response = await quotaRequest("GET", bucket);
	if (response.status === 404) return null;
	if (!response.ok) throw new StorageOperationError("The storage quota could not be read.", "FAILED");
	const body = (await response.json()) as {
		quota_size?: number;
		quota_unit?: string;
		quota_enabled?: boolean;
	};
	if (body.quota_unit !== "B" || typeof body.quota_size !== "number" || !Number.isFinite(body.quota_size)) {
		return null;
	}
	return { bytes: BigInt(Math.trunc(body.quota_size)), enabled: body.quota_enabled === true };
}

export async function ensureIamUser(userName: string): Promise<void> {
	await iam("CreateUser", { UserName: userName });
}

export async function replaceAccessKey(userName: string): Promise<{ accessKeyId: string; secret: string }> {
	const existing = await iam("ListAccessKeys", { UserName: userName });
	for (const accessKeyId of existing.ids) {
		await iam("DeleteAccessKey", { UserName: userName, AccessKeyId: accessKeyId });
	}
	const created = await iam("CreateAccessKey", { UserName: userName });
	const accessKeyId = created.ids[0];
	if (!accessKeyId || !created.secret) {
		throw new StorageOperationError("The storage identity could not be created.", "FAILED");
	}
	return { accessKeyId, secret: created.secret };
}

export async function putIdentityPolicy(userName: string, bucket: string): Promise<void> {
	await iam("PutUserPolicy", {
		UserName: userName,
		PolicyName: "bucket-only",
		PolicyDocument: bucketPolicy(bucket),
	});
}

export async function deleteIdentity(userName: string): Promise<void> {
	const existing = await iam("ListAccessKeys", { UserName: userName });
	if (existing.code === "NoSuchEntity") return;
	for (const accessKeyId of existing.ids) {
		await iam("DeleteAccessKey", { UserName: userName, AccessKeyId: accessKeyId });
	}
	await iam("DeleteUserPolicy", { UserName: userName, PolicyName: "bucket-only" });
	await iam("DeleteUser", { UserName: userName });
}

export async function disableIdentity(userName: string): Promise<void> {
	const existing = await iam("ListAccessKeys", { UserName: userName });
	if (existing.code === "NoSuchEntity") return;
	for (const accessKeyId of existing.ids) {
		await iam("DeleteAccessKey", { UserName: userName, AccessKeyId: accessKeyId });
	}
}

export async function presignUpload(params: {
	bucket: string;
	key: string;
	contentType: string;
	contentLength: number;
}): Promise<string> {
	const { client: s3 } = client();
	return getSignedUrl(
		s3,
		new PutObjectCommand({
			Bucket: params.bucket,
			Key: params.key,
			ContentType: params.contentType,
			ContentLength: params.contentLength,
		}),
		{ expiresIn: UPLOAD_PRESIGN_SECONDS },
	);
}

export async function presignDownload(params: {
	bucket: string;
	key: string;
	fileName: string;
}): Promise<string> {
	const { client: s3 } = client();
	const ascii = params.fileName.replace(/[^\w.\- ]+/g, "_").slice(0, 180) || "download";
	return getSignedUrl(
		s3,
		new GetObjectCommand({
			Bucket: params.bucket,
			Key: params.key,
			ResponseContentDisposition: `attachment; filename="${ascii}"`,
		}),
		{ expiresIn: PRESIGN_SECONDS },
	);
}

export async function headStoredObject(
	bucket: string,
	key: string,
): Promise<{ size: number; lastModified: string | null } | null> {
	const { client: s3 } = client();
	try {
		const result = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
		return {
			size: Number(result.ContentLength ?? 0),
			lastModified: result.LastModified?.toISOString() ?? null,
		};
	} catch (error) {
		if (isMissingObject(error)) return null;
		throw new StorageOperationError(sanitizeStorageError(error), "FAILED");
	}
}

export async function listStoredObjects(params: {
	bucket: string;
	prefix: string;
	maxKeys: number;
	token?: string;
	delimiter?: string;
}): Promise<{
	folders: string[];
	files: { key: string; size: number; lastModified: string | null }[];
	nextToken: string | null;
}> {
	const { client: s3 } = client();
	const listed = await s3.send(
		new ListObjectsV2Command({
			Bucket: params.bucket,
			Prefix: params.prefix,
			Delimiter: params.delimiter,
			MaxKeys: params.maxKeys,
			ContinuationToken: params.token,
		}),
	);
	return {
		folders: (listed.CommonPrefixes ?? [])
			.map((entry) => entry.Prefix ?? "")
			.filter((prefix) => prefix.length > 0),
		files: (listed.Contents ?? [])
			.filter((entry) => entry.Key && !entry.Key.endsWith("/"))
			.map((entry) => ({
				key: entry.Key as string,
				size: Number(entry.Size ?? 0),
				lastModified: entry.LastModified?.toISOString() ?? null,
			})),
		nextToken: listed.IsTruncated ? listed.NextContinuationToken ?? null : null,
	};
}

export async function putFolderMarker(bucket: string, key: string): Promise<void> {
	const { client: s3 } = client();
	await s3.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: "",
			ContentType: "application/x-directory",
			ContentLength: 0,
		}),
	);
}

export async function removeStoredObject(bucket: string, key: string): Promise<void> {
	const { client: s3 } = client();
	await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function removeStoredObjects(bucket: string, keys: string[]): Promise<void> {
	if (keys.length === 0) return;
	const { client: s3 } = client();
	await s3.send(
		new DeleteObjectsCommand({
			Bucket: bucket,
			Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
		}),
	);
}

export async function copyStoredObject(bucket: string, sourceKey: string, destinationKey: string): Promise<void> {
	const { client: s3 } = client();
	const copySource = [bucket, ...sourceKey.split("/")].map(encodeURIComponent).join("/");
	await s3.send(
		new CopyObjectCommand({
			Bucket: bucket,
			Key: destinationKey,
			CopySource: copySource,
		}),
	);
}

export async function downloadStoredObject(bucket: string, key: string, filePath: string): Promise<void> {
	const { client: s3 } = client();
	const result = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
	if (!result.Body) throw new StorageOperationError("The file could not be read.", "FAILED");
	await pipeline(Readable.from(result.Body as AsyncIterable<Uint8Array>), createWriteStream(filePath));
}

/** Writes a reserved upload from the panel. The browser never talks to object storage. */
export async function putStoredObjectBody(params: {
	bucket: string;
	key: string;
	body: ReadableStream<Uint8Array>;
	contentType: string;
	contentLength: number;
}): Promise<void> {
	const { client: s3 } = client();
	await s3.send(
		new PutObjectCommand({
			Bucket: params.bucket,
			Key: params.key,
			Body: Readable.fromWeb(params.body as import("node:stream/web").ReadableStream),
			ContentType: params.contentType,
			ContentLength: params.contentLength,
		}),
	);
}

export async function uploadStoredFile(params: {
	bucket: string;
	key: string;
	filePath: string;
	contentType: string;
}): Promise<number> {
	const { client: s3 } = client();
	const size = (await stat(params.filePath)).size;
	await s3.send(
		new PutObjectCommand({
			Bucket: params.bucket,
			Key: params.key,
			Body: createReadStream(params.filePath),
			ContentType: params.contentType,
			ContentLength: size,
		}),
	);
	return size;
}

export async function listRawKeys(params: {
	bucket: string;
	prefix?: string;
	token?: string;
	maxKeys: number;
}): Promise<{ objects: { key: string; size: number }[]; nextToken: string | null }> {
	const { client: s3 } = client();
	const listed = await s3.send(
		new ListObjectsV2Command({
			Bucket: params.bucket,
			Prefix: params.prefix,
			MaxKeys: params.maxKeys,
			ContinuationToken: params.token,
		}),
	);
	return {
		objects: (listed.Contents ?? [])
			.filter((entry) => entry.Key)
			.map((entry) => ({ key: entry.Key as string, size: Number(entry.Size ?? 0) })),
		nextToken: listed.IsTruncated ? listed.NextContinuationToken ?? null : null,
	};
}

export async function deleteStorageBucket(bucket: string): Promise<void> {
	const { client: s3 } = client();
	try {
		await s3.send(new DeleteBucketCommand({ Bucket: bucket }));
	} catch (error) {
		if (httpStatus(error) === 404 || errorName(error) === "NoSuchBucket") return;
		throw new StorageOperationError(sanitizeStorageError(error), "FAILED");
	}
}

export function storageClusterId(): string | null {
	return config().clusterId;
}

export function commercialCapacityBytes(): bigint {
	return config().commercialCapacityBytes;
}
