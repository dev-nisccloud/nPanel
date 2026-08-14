export declare const zeepoCanvasProjectsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name: string;
            teamId?: string | undefined;
            canvasJson?: any;
            width?: number | undefined;
            height?: number | undefined;
        };
        output: {
            data: {
                id: string;
                name: string;
                userId: string;
                teamId: string | null;
                canvasJson: any;
                width: number;
                height: number;
                thumbnailUrl: string | null;
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
                userId: string;
                teamId: string | null;
                canvasJson: any;
                width: number;
                height: number;
                thumbnailUrl: string | null;
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
                userId: string;
                teamId: string | null;
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
            canvasJson?: any;
            width?: number | undefined;
            height?: number | undefined;
            thumbnailUrl?: string | null | undefined;
        };
        output: {
            data: {
                id: string;
                name: string;
                userId: string;
                teamId: string | null;
                canvasJson: any;
                width: number;
                height: number;
                thumbnailUrl: string | null;
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
                userId: string;
                teamId: string | null;
                canvasJson: any;
                width: number;
                height: number;
                thumbnailUrl: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
        };
        meta: object;
    }>;
}>>;
