export declare const emailsCreateRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            siteId: number;
            name: string;
            password: string;
            passwordType?: "plain" | "crypt" | "md5" | "sha256" | "sha512" | undefined;
            mailbox?: {
                enabled?: boolean | undefined;
                quota?: number | undefined;
            } | undefined;
            forwarding?: {
                enabled: boolean;
                addresses?: string[] | undefined;
            } | undefined;
            autoresponder?: {
                enabled: boolean;
                subject?: string | undefined;
                contentType?: string | undefined;
                content?: string | undefined;
            } | undefined;
            antivir?: string | undefined;
            cpAccess?: boolean | undefined;
            outgoingMessagesLimit?: number | undefined;
            description?: string | undefined;
        };
        output: {
            raw: string;
            parsed: any;
        };
        meta: object;
    }>;
}>>;
