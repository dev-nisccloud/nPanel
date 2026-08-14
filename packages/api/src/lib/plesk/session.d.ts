export declare function getPleskPanelBase(): string;
export interface WebspaceOwnerContext {
    ownerLogin: string;
    domainName?: string;
}
/**
 * Plesk panel login of the subscription owner (`owner-login` / customer by `owner-id`).
 * FTP system users are not Plesk UI logins and cannot be used for phpMyAdmin SSO.
 */
export declare function fetchWebspaceOwnerContext(siteId: number): Promise<WebspaceOwnerContext>;
/**
 * One-time Plesk UI session for the subscription owner. Never impersonate via FTP system user.
 */
export declare function createPleskUiSession(params: {
    login: string;
    userIp?: string | null;
    domainName?: string;
}): Promise<string>;
export declare function buildPleskPhpMyAdminSsoUrl(params: {
    sessionId: string;
    databaseId: number;
}): string;
