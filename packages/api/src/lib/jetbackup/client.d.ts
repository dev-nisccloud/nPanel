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
}
export declare function sendJetBackupRequest<T = any>(functionName: string, params?: Record<string, any>): Promise<JetBackupResult<T>>;
