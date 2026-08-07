import { env } from "@npanel/env/server";
export class ObjectStorageNotConfiguredError extends Error {
    constructor(message = "Object storage is not configured. Set S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, and S3_BUCKET.") {
        super(message);
        this.name = "ObjectStorageNotConfiguredError";
    }
}
export function isObjectStorageConfigured() {
    return Boolean(env.S3_ENDPOINT && env.S3_ACCESS_KEY && env.S3_SECRET_KEY && env.S3_BUCKET);
}
export function getObjectStorageConfig() {
    const endpoint = env.S3_ENDPOINT;
    const accessKey = env.S3_ACCESS_KEY;
    const secretKey = env.S3_SECRET_KEY;
    const bucket = env.S3_BUCKET;
    if (!endpoint || !accessKey || !secretKey || !bucket) {
        throw new ObjectStorageNotConfiguredError();
    }
    const publicBaseUrl = env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "") ??
        `${endpoint.replace(/\/$/, "")}/${bucket}`;
    return {
        endpoint,
        accessKey,
        secretKey,
        bucket,
        region: env.S3_REGION ?? "us-east-1",
        publicBaseUrl,
    };
}
export function getPublicObjectUrl(key) {
    const { publicBaseUrl } = getObjectStorageConfig();
    return `${publicBaseUrl}/${key.replace(/^\//, "")}`;
}
