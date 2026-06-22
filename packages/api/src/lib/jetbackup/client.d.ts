export interface JetBackupResponse<T = any> {
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
export interface JetBackupResult<T = any> {
    data: T | null;
    message: string;
    success: boolean;
    statusCode: number;
    system?: JetBackupResponse['system'];
}
export declare function sendJetBackupRequest<T = any>(functionName: string, params?: Record<string, any>): Promise<JetBackupResult<T>>;
export interface JetBackupDownloadFileResult {
    success: boolean;
    statusCode: number;
    body: ReadableStream | null;
    filename?: string;
    contentType?: string;
    contentLength?: number;
    message?: string;
}
/** Stream a completed JetBackup download archive (headerless.php?download=1). */
export declare function fetchJetBackupDownloadArchive(downloadId: string): Promise<JetBackupDownloadFileResult>;
