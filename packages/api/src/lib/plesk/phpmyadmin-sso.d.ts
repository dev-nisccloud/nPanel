export declare function createPhpMyAdminSsoRedirect(params: {
    siteId: number;
    databaseId: number;
    userId: string;
    role: string | null | undefined;
    teamId?: string;
    userIp?: string | null;
}): Promise<string>;
