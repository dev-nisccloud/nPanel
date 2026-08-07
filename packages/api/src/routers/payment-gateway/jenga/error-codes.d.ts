/**
 * Jenga API error codes from JENGA-CARDS.md
 */
export type JengaErrorInfo = {
    code: number | string;
    userMessage: string;
    retryable: boolean;
};
export declare function getJengaErrorInfo(code: number | string): JengaErrorInfo;
export declare function getJengaUserFriendlyError(code: number | string | undefined): string;
