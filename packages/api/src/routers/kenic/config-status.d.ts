/**
 * Safe runtime config snapshot for debugging KENIC connectivity in staging/prod.
 * Does not return credentials or secrets.
 */
export declare const kenicConfigStatusRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    get: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            host: string;
            hostIsIp: boolean;
            port: number;
            timeoutMs: number;
            tlsServernameResolved: string;
            hasExplicitTlsServername: boolean;
            allowLegacyCommonNameFallback: boolean;
            hasCredentialsConfigured: boolean;
        };
        meta: object;
    }>;
    /**
     * Connects to KENIC EPP with TLS verification off, reads the leaf certificate only.
     * Use to see CN/SAN and pick `KENIC_EPP_TLS_SERVERNAME`. Optional `sniServername` probes a different SNI.
     */
    inspectTls: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            sniServername?: string | undefined;
        } | undefined;
        output: import("../../lib/epp/epp-client").EppTlsPeerInspectResult;
        meta: object;
    }>;
}>>;
