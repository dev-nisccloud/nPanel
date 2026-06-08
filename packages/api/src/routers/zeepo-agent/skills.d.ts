export declare const zeepoAgentSkillsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            data: {
                id: string;
                category: string;
                title: string;
                description: string;
            }[];
        };
        meta: object;
    }>;
}>>;
