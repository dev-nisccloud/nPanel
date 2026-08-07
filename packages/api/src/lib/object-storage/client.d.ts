export declare function sanitizeFileName(fileName: string): string;
export declare function buildObjectKey(params: {
    prefix: string;
    fileName: string;
    userId?: string;
}): string;
export declare function putObjectBuffer(params: {
    key: string;
    body: Buffer | Uint8Array;
    contentType: string;
}): Promise<{
    key: string;
    publicUrl: string;
}>;
export declare function createPresignedUploadUrl(params: {
    key: string;
    contentType: string;
    expiresInSeconds?: number;
}): Promise<{
    uploadUrl: string;
    key: string;
    publicUrl: string;
}>;
export declare function deleteObject(key: string): Promise<void>;
export type ListedObject = {
    key: string;
    size: number;
    lastModified: string | null;
    publicUrl: string;
};
export declare function listObjects(params: {
    prefix: string;
    maxKeys?: number;
}): Promise<ListedObject[]>;
