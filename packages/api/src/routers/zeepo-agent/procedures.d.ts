export declare const zeepoAgentProcedure: import("@trpc/server").TRPCProcedureBuilder<import("../..").Context, object, {
    ipAddress: string | null | undefined;
    session: import("../..").Session;
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
    zeepoBilling: {
        teamId: string | null;
        sessionId: string | null;
    } | null;
}, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, false>;
