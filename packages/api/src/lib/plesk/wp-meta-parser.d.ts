/**
 * Normalizes WP Toolkit "meta/value" API shapes into plain objects for the app layer.
 */
export type WpTaskPayload = {
    id?: number;
    code?: string;
    title?: string;
    status?: string;
    progress?: number;
    steps?: Array<{
        code?: string;
        title?: string;
        status?: string;
        progress?: number;
        hint?: string;
    }>;
    publicParams?: Record<string, unknown>;
    errors?: string[];
};
/** WP Toolkit often wraps scalars as `{ value, meta }`. */
export declare function readMetaScalar(field: unknown): string | number | boolean | undefined;
/** Extract string list from meta value arrays like [{ value: "gif", meta: {} }, ...] */
export declare function parseMetaStringList(raw: unknown): string[];
export declare function parseHotlinkSettingsMeta(data: unknown): {
    domains: string[];
    fileExtensions: string[];
    defaultDomains: string[];
    defaultFileExtensions: string[];
};
/** Flat hotlink settings response (PUT/DELETE) */
export declare function parseHotlinkSettingsFlat(data: unknown): {
    domains: string[];
    fileExtensions: string[];
};
export declare function extractTaskFromResponse(data: unknown): WpTaskPayload | null;
/** Normalize Plesk task URLs to `/v1/background-tasks/{code}/{id}` for REST requests. */
export declare function normalizeWpToolkitTaskUrl(taskUrl: string): string;
export declare function tryNormalizeWpToolkitTaskUrl(taskUrl: string): string | null;
export type ParsedIntegrityTask = {
    code: string;
    title?: string;
    status?: string;
};
export type ParsedIntegrityInfo = {
    status?: string;
    available?: boolean;
    tasks: ParsedIntegrityTask[];
    message?: string;
};
export declare function parseIntegrityInfo(data: unknown): ParsedIntegrityInfo;
/** Parse task URL like /v1/background-tasks/mass-check-updates/1 → id segment */
export type ParsedBackupItem = {
    fileName: string;
    fileSize?: number;
    createdAt?: string;
    absoluteFilePath?: string;
};
export declare function parseBackupsMetaList(data: unknown): {
    items: ParsedBackupItem[];
    fileManagerUrl?: string;
    limit?: number;
    dirName?: string;
};
/** Normalize flat backup array from GET /backups */
export declare function parseBackupsFlatList(data: unknown): ParsedBackupItem[];
export declare function parseWpCronMeta(data: unknown): {
    available: boolean;
    status: boolean;
    taskReplacementStatus: boolean;
    managementUri?: string;
};
export declare function parseBackgroundTaskPath(taskUrl: string): string | null;
