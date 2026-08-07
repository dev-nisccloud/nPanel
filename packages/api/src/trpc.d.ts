import type { Context } from "./context";
export type { Context } from "./context";
export declare const t: import("@trpc/server").TRPCRootObject<Context, object, import("@trpc/server").TRPCRuntimeConfigOptions<Context, object>, {
    ctx: Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}>;
export declare const router: import("@trpc/server").TRPCRouterBuilder<{
    ctx: Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}>;
export declare const publicProcedure: import("@trpc/server").TRPCProcedureBuilder<Context, object, {}, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, false>;
export declare const protectedProcedure: import("@trpc/server").TRPCProcedureBuilder<Context, object, {
    session: {
        user: import("./context").SessionUser;
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
    reauthRequired: boolean | undefined;
    createCaller: ((ctx: Context) => unknown) | undefined;
    apiKeyError: string | null | undefined;
    req: import("hono").HonoRequest<any, unknown>;
    getCookie: (name: string) => string | undefined;
    setCookie: (name: string, value: string, options?: import("./context").CookieOptions) => void;
}, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, false>;
