export declare const subdomainsCreateRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            parent: string;
            name: string;
            wwwRoot?: string | undefined;
            ssh?: boolean | undefined;
            safeMode?: boolean | undefined;
            php?: string | undefined;
            cgi?: boolean | undefined;
            perl?: boolean | undefined;
            python?: boolean | undefined;
            ruby?: boolean | undefined;
            nodejs?: boolean | undefined;
            webstat?: "custom" | "none" | "awstats" | "webalizer" | "analog" | undefined;
            hosting?: {
                ipAddress?: string | undefined;
                ftpLogin?: string | undefined;
                ftpPassword?: string | undefined;
            } | undefined;
        };
        output: {
            raw: string;
            parsed: any;
            success: boolean;
            subdomainId: any;
        };
        meta: object;
    }>;
}>>;
