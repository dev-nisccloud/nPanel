export type ObjectStorageConfig = {
    endpoint: string;
    accessKey: string;
    secretKey: string;
    bucket: string;
    region: string;
    publicBaseUrl: string;
};
export declare class ObjectStorageNotConfiguredError extends Error {
    constructor(message?: string);
}
export declare function isObjectStorageConfigured(): boolean;
export declare function getObjectStorageConfig(): ObjectStorageConfig;
export declare function getPublicObjectUrl(key: string): string;
