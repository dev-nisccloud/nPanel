export declare const imageGenTemplatesRouter: import("@trpc/server").TRPCBuiltRouter<{
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
            isPublic?: boolean | undefined;
        };
        output: {
            data: {
                id: string;
                name: string;
                json: string;
                width: number;
                height: number;
                thumbnailUrl: string | null;
                isPublic: boolean;
                userId: string;
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
                isPublic: boolean;
                userId: string;
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
        };
        output: {
            data: {
                id: string;
                name: string;
                json: string;
                width: number;
                height: number;
                thumbnailUrl: string | null;
                isPublic: boolean;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
            }[];
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
            isPublic?: boolean | undefined;
        };
        output: {
            data: {
                id: string;
                name: string;
                json: string;
                width: number;
                height: number;
                thumbnailUrl: string | null;
                isPublic: boolean;
                userId: string;
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
}>>;
