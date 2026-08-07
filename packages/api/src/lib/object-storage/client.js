import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client, } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getObjectStorageConfig, getPublicObjectUrl, } from "./config";
let cachedClient = null;
let cachedConfig = null;
function getClient() {
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
export function sanitizeFileName(fileName) {
    const base = fileName.split(/[/\\]/).pop() ?? "file";
    const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
    return cleaned.slice(0, 180) || "file";
}
export function buildObjectKey(params) {
    const safePrefix = params.prefix.replace(/^\/+|\/+$/g, "") || "uploads";
    const userSegment = params.userId?.trim() ? `${params.userId}/` : "";
    const safeName = sanitizeFileName(params.fileName);
    return `${safePrefix}/${userSegment}${randomUUID()}-${safeName}`;
}
export async function putObjectBuffer(params) {
    const { client, config } = getClient();
    await client.send(new PutObjectCommand({
        Bucket: config.bucket,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
    }));
    return { key: params.key, publicUrl: getPublicObjectUrl(params.key) };
}
export async function createPresignedUploadUrl(params) {
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
export async function deleteObject(key) {
    const { client, config } = getClient();
    await client.send(new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key,
    }));
}
export async function listObjects(params) {
    const { client, config } = getClient();
    const prefix = params.prefix.replace(/^\/+/, "");
    const response = await client.send(new ListObjectsV2Command({
        Bucket: config.bucket,
        Prefix: prefix,
        MaxKeys: params.maxKeys ?? 50,
    }));
    return (response.Contents ?? [])
        .filter((item) => Boolean(item.Key))
        .map((item) => ({
        key: item.Key,
        size: item.Size ?? 0,
        lastModified: item.LastModified?.toISOString() ?? null,
        publicUrl: getPublicObjectUrl(item.Key),
    }))
        .sort((a, b) => (b.lastModified ?? "").localeCompare(a.lastModified ?? ""));
}
