export declare const zeepoAiMessagesRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    feedback: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            messageId: string;
            feedback: "like" | "dislike" | "clear";
        };
        output: {
            ok: boolean;
            feedback: "like" | "dislike" | null;
        };
        meta: object;
    }>;
    registerAttachment: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            sessionId: string;
            url: string;
            name: string;
            mimeType: string;
            storageKey?: string | undefined;
            sizeBytes?: number | undefined;
        };
        output: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            url: string;
            name: string;
            mimeType: string;
        };
        meta: object;
    }>;
}>>;
export declare const zeepoAiSkillsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            id: string;
            category: string;
            title: string;
            description: string;
            available: boolean;
            starterPrompt: string | null;
        }[];
        meta: object;
    }>;
}>>;
