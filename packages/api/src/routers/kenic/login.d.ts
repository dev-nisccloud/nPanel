/**
 * KENIC EPP login router.
 * Connects, receives greeting, sends login, returns response for type discovery.
 */
export declare const kenicLoginRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Connect to KENIC EPP, send login with credentials from env, return raw and parsed response.
     * Use the response shape to derive types. No UI; API only.
     */
    login: import("@trpc/server").TRPCMutationProcedure<{
        input: Record<string, never> | undefined;
        output: {
            raw: string;
            parsed: null;
            parseError: string;
            resultCode: null;
            resultMsg: null;
            success: boolean;
        } | {
            raw: string;
            parsed: Record<string, unknown>;
            resultCode: string;
            resultMsg: string;
            success: boolean;
            parseError?: undefined;
        };
        meta: object;
    }>;
}>>;
