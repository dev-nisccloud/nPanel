export declare const wpInstallRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    install: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            domainName: string;
            username: string;
            adminEmail: string;
            adminPassword: string;
            wpVersion?: string | undefined;
            siteTitle?: string | undefined;
            language?: string | undefined;
            protocol?: "http" | "https" | undefined;
            databaseName?: string | undefined;
            dbUser?: string | undefined;
        };
        output: {
            success: boolean;
            data: any;
            message: string;
        };
        meta: object;
    }>;
}>>;
