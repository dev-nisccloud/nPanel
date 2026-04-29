export declare const niscEmailMarketingTransactionalRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    send: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            to: string;
            subject: string;
            html?: string | undefined;
            text?: string | undefined;
            replyTo?: string | null | undefined;
            teamId?: string | null | undefined;
        };
        output: {
            emailId: string;
            sesMessageId: string | null;
            status: string;
        };
        meta: object;
    }>;
}>>;
