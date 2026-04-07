export declare const dnsUpdateRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            siteId: number;
            recordId: number;
            type: string;
            host: string;
            value: string;
            domainName?: string | undefined;
            opt?: string | number | undefined;
            ttl?: number | undefined;
        };
        output: {
            success: boolean;
            recordId: any;
        };
        meta: object;
    }>;
}>>;
