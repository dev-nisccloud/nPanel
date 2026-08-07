export declare const objectStorageRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getConfig: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            configured: false;
            bucket: null;
            endpoint: null;
            publicBaseUrl: null;
            region: null;
        } | {
            configured: true;
            bucket: string;
            endpoint: string;
            publicBaseUrl: string;
            region: string;
        };
        meta: object;
    }>;
    createUploadUrl: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            fileName: string;
            contentType: string;
            fileSize: number;
            prefix?: string | undefined;
        };
        output: {
            uploadUrl: string;
            key: string;
            publicUrl: string;
        };
        meta: object;
    }>;
    listTestObjects: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            prefix?: string | undefined;
            maxKeys?: number | undefined;
        } | undefined;
        output: import("../../lib/object-storage").ListedObject[];
        meta: object;
    }>;
    deleteObject: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            key: string;
        };
        output: {
            success: true;
        };
        meta: object;
    }>;
}>>;
