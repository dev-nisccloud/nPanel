export declare const zeepoAgentProcedure: import("@trpc/server").TRPCProcedureBuilder<import("../..").Context, object, {
    session: import("../..").Session;
    ipAddress: string | null | undefined;
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
    zeepoBilling: {
        teamId: string | null;
        sessionId: string | null;
    } | null;
}, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, false>;
