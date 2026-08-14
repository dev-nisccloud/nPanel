export declare const zeepoAiProcedure: import("@trpc/server").TRPCProcedureBuilder<import("../..").Context, object, {
    ipAddress: string | null | undefined;
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
    apiKey: {
        id: string;
        permissions: string[];
    } | undefined;
    mfaRequired: boolean | undefined;
    mfaVerified: boolean | undefined;
    mfaSetupRequired: boolean | undefined;
    reauthRequired: boolean | undefined;
    createCaller: ((ctx: import("../..").Context) => unknown) | undefined;
    apiKeyError: string | null | undefined;
    req: import("hono").HonoRequest<any, unknown>;
    getCookie: (name: string) => string | undefined;
    setCookie: (name: string, value: string, options?: import("../../context").CookieOptions) => void;
}, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, false>;
