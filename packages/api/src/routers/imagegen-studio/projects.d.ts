export declare const imageGenProjectsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name: string;
            json: string;
            width: number;
            height: number;
            teamId?: string | undefined;
        };
        output: {
            data: {
                id: string;
                name: string;
                json: string;
                width: number;
                height: number;
                thumbnailUrl: string | null;
                userId: string;
                teamId: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
        };
        meta: object;
    }>;
    get: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            data: {
                id: string;
                name: string;
                json: string;
                width: number;
                height: number;
                thumbnailUrl: string | null;
                userId: string;
                teamId: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
        };
        meta: object;
    }>;
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            page?: number | undefined;
            limit?: number | undefined;
            teamId?: string | undefined;
        };
        output: {
            data: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                teamId: string | null;
                userId: string;
                thumbnailUrl: string | null;
                height: number;
                width: number;
            }[];
            nextPage: number | null;
        };
        meta: object;
    }>;
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            name?: string | undefined;
            json?: string | undefined;
            width?: number | undefined;
            height?: number | undefined;
            thumbnailUrl?: string | undefined;
        };
        output: {
            data: {
                id: string;
                name: string;
                json: string;
                width: number;
                height: number;
                thumbnailUrl: string | null;
                userId: string;
                teamId: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
        };
        meta: object;
    }>;
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            data: {
                id: string;
            };
        };
        meta: object;
    }>;
    duplicate: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            data: {
                id: string;
                name: string;
                json: string;
                width: number;
                height: number;
                thumbnailUrl: string | null;
                userId: string;
                teamId: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
        };
        meta: object;
    }>;
}>>;
