export declare const emailsUpdateRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            siteId: number;
            name: string;
            password?: string | undefined;
            passwordType?: "plain" | "crypt" | undefined;
            antivir?: "off" | "out" | "in" | "inout" | undefined;
            outgoingMessagesLimit?: number | undefined;
            description?: string | undefined;
            autoresponder?: {
                enabled?: boolean | undefined;
                subject?: string | undefined;
                content?: string | undefined;
                contentType?: string | undefined;
            } | undefined;
            mailbox?: {
                enabled?: boolean | undefined;
                quota?: number | undefined;
            } | undefined;
        };
        output: {
            message: string;
            summary: {
                total: number;
                successful: number;
                failed: number;
            };
            success: boolean;
            mailName: string;
            siteId: number;
            operationsPerformed: string[];
            fieldResults: Record<string, any>;
            warnings: string[];
        };
        meta: object;
    }>;
}>>;
