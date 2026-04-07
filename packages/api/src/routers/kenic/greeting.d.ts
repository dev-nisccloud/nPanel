/**
 * KENIC EPP greeting router.
 * Connect to the registry and receive the server greeting to inspect
 * capabilities and response format before implementing login/domain commands.
 */
export declare const kenicGreetingRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Connect to KENIC EPP server and return the server greeting.
     * No login is required for the greeting; it is sent immediately on connect.
     * Use this to see actual capabilities and response structure for building
     * the rest of the EPP routes.
     */
    getGreeting: import("@trpc/server").TRPCQueryProcedure<{
        input: Record<string, never> | undefined;
        output: {
            raw: string;
            parsed: null;
            parseError: string;
            configUsed: {
                host: string;
                port: number;
                timeoutMs: number;
                tlsServername: string | null;
            };
        } | {
            raw: string;
            parsed: unknown;
            configUsed: {
                host: string;
                port: number;
                timeoutMs: number;
                tlsServername: string | null;
            };
            parseError?: undefined;
        };
        meta: object;
    }>;
}>>;
