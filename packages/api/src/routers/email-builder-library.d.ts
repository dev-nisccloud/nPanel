export declare const emailBuilderLibraryRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Create a library item from an UploadThing upload.
     * This is intentionally decoupled from UploadThing's internal types.
     */
    createFromUpload: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            fileName: string;
            fileSize: number;
            mimeType: string;
            fileUrl: string;
            storageKey?: string | undefined;
            description?: string | undefined;
            metadata?: any;
            teamId?: string | undefined;
        };
        output: {
            data: {
                id: string;
                userId: string;
                teamId: string | null;
                fileName: string;
                fileSize: number;
                mimeType: string;
                fileUrl: string;
                storageKey: string | null;
                description: string | null;
                metadata: unknown;
                createdAt: Date;
            };
        };
        meta: object;
    }>;
    /**
     * List library items for the current user (and optionally a specific team).
     * Defaults to images-only, ordered by most recent first.
     */
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            page?: number | undefined;
            limit?: number | undefined;
            teamId?: string | undefined;
            onlyImages?: boolean | undefined;
            search?: string | undefined;
        };
        output: {
            data: {
                id: string;
                userId: string;
                teamId: string | null;
                fileName: string;
                fileSize: number;
                mimeType: string;
                fileUrl: string;
                storageKey: string | null;
                description: string | null;
                metadata: unknown;
                createdAt: Date;
            }[];
            nextPage: number | null;
        };
        meta: object;
    }>;
}>>;
