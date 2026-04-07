/**
 * KENIC EPP domain transfer (RFC 5731, op="request").
 * Initiates transfer of a domain to us (gaining registrar). Auth code must be obtained from current registrar.
 */
export declare const kenicDomainTransferRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    request: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name: string;
            authCode: string;
            roid?: string | undefined;
            period?: number | undefined;
        };
        output: import("../../lib/kenic-transfer-request").ExecuteKenicTransferResult;
        meta: object;
    }>;
}>>;
