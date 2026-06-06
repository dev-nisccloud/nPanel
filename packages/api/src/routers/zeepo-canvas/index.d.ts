export declare const zeepoCanvasRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    projects: import("@trpc/server").TRPCBuiltRouter<{
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
    models: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getModels: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                data: Record<string, import("./models").ZeepoModel[]>;
            };
            meta: object;
        }>;
    }>>;
    generate: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        start: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                projectId: string;
                nodeId: string;
                modelCategory: string;
                modelId: string;
                teamId?: string | undefined;
                prompt?: string | undefined;
                inputs?: any;
            };
            output: {
                generationId: `${string}-${string}-${string}-${string}-${string}`;
                status: string;
            };
            meta: object;
        }>;
        getGeneration: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                generationId: string;
            };
            output: {
                data: any;
            };
            meta: object;
        }>;
        getGenerationsByNode: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                projectId: string;
                nodeId: string;
            };
            output: {
                data: any[];
            };
            meta: object;
        }>;
    }>>;
}>>;
