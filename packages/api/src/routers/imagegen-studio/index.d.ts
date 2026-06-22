export declare const imageGenStudioRouter: import("@trpc/server").TRPCBuiltRouter<{
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
    templates: import("@trpc/server").TRPCBuiltRouter<{
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
    ai: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        generateImage: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                prompt: string;
                referenceImageUrls?: string[] | undefined;
                teamId?: string | undefined;
            };
            output: {
                data: string;
                generationId: string;
            };
            meta: object;
        }>;
        updateGenerationAfterUpload: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                generationId: string;
                imageUrl: string;
                imageKey: string;
                imageFileName: string;
                imageSize: number;
                imageMimeType: string;
            };
            output: {
                data: {
                    id: string;
                };
            };
            meta: object;
        }>;
        removeBg: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                image: string;
            };
            output: {
                data: string;
            };
            meta: object;
        }>;
    }>>;
    images: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                page?: number | undefined;
                perPage?: number | undefined;
                query?: string | undefined;
            };
            output: {
                data: any[];
                hasMore: boolean;
            };
            meta: object;
        }>;
    }>>;
    uploads: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                fileUrl: string;
                fileKey: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                fileMetadata?: Record<string, any> | undefined;
                teamId?: string | undefined;
            };
            output: {
                data: {
                    id: string;
                    fileUrl: string;
                    fileName: string;
                    fileSize: number;
                    mimeType: string;
                    fileMetadata: Record<string, any> | null;
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
                    fileUrl: string;
                    fileName: string;
                    fileSize: number;
                    mimeType: string;
                    fileMetadata: Record<string, any> | null;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                nextPage: number | null;
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
    aiGenerations: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                page?: number | undefined;
                limit?: number | undefined;
                teamId?: string | undefined;
            };
            output: {
                data: {
                    id: string;
                    prompt: string;
                    referenceImageUrls: string[];
                    imageUrl: string;
                    imageFileName: string;
                    imageSize: number;
                    imageMimeType: string;
                    imageMetadata: Record<string, any> | null;
                    modelId: string;
                    modelName: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                nextPage: number | null;
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
}>>;
