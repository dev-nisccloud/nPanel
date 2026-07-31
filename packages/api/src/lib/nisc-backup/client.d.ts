export interface NiscBackupResponse<T = any> {
    success: number;
    message: string;
    data: T;
    system: {
        version: string;
        tier: string;
        type: string;
        disableui: boolean;
        dr: boolean;
        agreement_panel: boolean;
        agreement: boolean;
        licenseIssue: boolean;
    };
}
export interface NiscBackupResult<T = any> {
    data: T | null;
    message: string;
    success: boolean;
    statusCode: number;
    system?: NiscBackupResponse['system'];
}
export declare function sendNiscBackupRequest<T = any>(functionName: string, params?: Record<string, any>): Promise<NiscBackupResult<T>>;
export interface NiscBackupDownloadFileResult {
    success: boolean;
    statusCode: number;
    body: ReadableStream | null;
    filename?: string;
    contentType?: string;
    contentLength?: number;
    message?: string;
}
/** Stream a completed NiscBackup download archive (headerless.php?download=1). */
export declare function fetchNiscBackupDownloadArchive(downloadId: string): Promise<NiscBackupDownloadFileResult>;
