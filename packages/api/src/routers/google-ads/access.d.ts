type AuthCtx = {
    session?: {
        user?: {
            id?: string;
            role?: string | null;
        };
    } | null;
};
export declare function getGoogleAdsExecutionContext(ctx: AuthCtx, customerId: string): Promise<{
    userId: string;
    role: string | null | undefined;
    customerIdWithoutDashes: string;
    integration: {
        id: string;
        userId: string;
        status: string;
        refreshToken: string;
        accessToken: string;
        accessTokenExpiresAt: Date | null;
        scope: string | null;
        tokenType: string | null;
        lastTokenRefreshAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    };
}>;
export {};
