export declare const hivelocityProcedure: import("@trpc/server").TRPCProcedureBuilder<import("../..").Context, object, {
    session: {
        user: import("../..").SessionUser;
        session: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            expiresAt: Date;
            token: string;
            ipAddress?: string | null | undefined | undefined;
            userAgent?: string | null | undefined | undefined;
        };
    };
    ipAddress: string | null | undefined;
    apiKey: {
        id: string;
        permissions: string[];
    } | undefined;
    mfaRequired: boolean | undefined;
    mfaVerified: boolean | undefined;
    mfaSetupRequired: boolean | undefined;
    createCaller: ((ctx: import("../..").Context) => unknown) | undefined;
    apiKeyError: string | null | undefined;
    req: import("hono").HonoRequest<any, unknown>;
}, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, false>;
