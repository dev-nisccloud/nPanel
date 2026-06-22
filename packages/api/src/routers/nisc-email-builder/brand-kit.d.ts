export declare const nebBrandKitRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamId?: string | undefined;
        };
        output: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            teamId: string | null;
            userId: string;
            logoAssetId: string | null;
            colors: unknown;
            fonts: unknown;
            footerLegal: string | null;
            socialLinks: unknown;
        }[];
        meta: object;
    }>;
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name: string;
            teamId?: string | undefined;
            colors?: Record<string, string> | undefined;
            footerLegal?: string | undefined;
            logoAssetId?: string | undefined;
        };
        output: {
            id: `${string}-${string}-${string}-${string}-${string}`;
        };
        meta: object;
    }>;
}>>;
