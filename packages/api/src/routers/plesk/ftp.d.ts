export declare const ftpRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    testConnection: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            host: string;
            user: string;
            password: string;
            port?: number | undefined;
            secure?: boolean | undefined;
            timeout?: number | undefined;
        };
        output: {
            success: boolean;
            currentPath: string;
            message: string;
        };
        meta: object;
    }>;
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            credentials: {
                host: string;
                user: string;
                password: string;
                port?: number | undefined;
                secure?: boolean | undefined;
                timeout?: number | undefined;
            };
            path?: string | undefined;
        };
        output: {
            success: boolean;
            data: {
                name: string;
                type: "file" | "directory";
                size?: number | undefined;
                date?: string | undefined;
                permissions?: any;
                owner?: string | undefined;
                group?: string | undefined;
            }[];
            path: string;
        };
        meta: object;
    }>;
    pwd: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            credentials: {
                host: string;
                user: string;
                password: string;
                port?: number | undefined;
                secure?: boolean | undefined;
                timeout?: number | undefined;
            };
        };
        output: {
            success: boolean;
            data: string;
        };
        meta: object;
    }>;
    cd: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            credentials: {
                host: string;
                user: string;
                password: string;
                port?: number | undefined;
                secure?: boolean | undefined;
                timeout?: number | undefined;
            };
            path: string;
        };
        output: {
            success: boolean;
            data: string;
        };
        meta: object;
    }>;
    getFileInfo: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            credentials: {
                host: string;
                user: string;
                password: string;
                port?: number | undefined;
                secure?: boolean | undefined;
                timeout?: number | undefined;
            };
            path: string;
        };
        output: {
            success: boolean;
            data: {
                path: string;
                size: number;
                lastModified: Date;
            };
        };
        meta: object;
    }>;
    upload: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            credentials: {
                host: string;
                user: string;
                password: string;
                port?: number | undefined;
                secure?: boolean | undefined;
                timeout?: number | undefined;
            };
            localPath: string;
            remotePath: string;
        };
        output: {
            success: boolean;
            message: string;
        };
        meta: object;
    }>;
    uploadFile: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            credentials: {
                host: string;
                user: string;
                password: string;
                port?: number | undefined;
                secure?: boolean | undefined;
                timeout?: number | undefined;
            };
            fileData: string;
            fileName: string;
            remotePath: string;
        };
        output: {
            success: boolean;
            message: string;
            remotePath: string;
        };
        meta: object;
    }>;
    download: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            credentials: {
                host: string;
                user: string;
                password: string;
                port?: number | undefined;
                secure?: boolean | undefined;
                timeout?: number | undefined;
            };
            remotePath: string;
            localPath: string;
        };
        output: {
            success: boolean;
            message: string;
        };
        meta: object;
    }>;
    rename: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            credentials: {
                host: string;
                user: string;
                password: string;
                port?: number | undefined;
                secure?: boolean | undefined;
                timeout?: number | undefined;
            };
            oldPath: string;
            newPath: string;
        };
        output: {
            success: boolean;
            message: string;
        };
        meta: object;
    }>;
    deleteFile: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            credentials: {
                host: string;
                user: string;
                password: string;
                port?: number | undefined;
                secure?: boolean | undefined;
                timeout?: number | undefined;
            };
            path: string;
        };
        output: {
            success: boolean;
            message: string;
        };
        meta: object;
    }>;
    deleteDirectory: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            credentials: {
                host: string;
                user: string;
                password: string;
                port?: number | undefined;
                secure?: boolean | undefined;
                timeout?: number | undefined;
            };
            path: string;
        };
        output: {
            success: boolean;
            message: string;
        };
        meta: object;
    }>;
    createDirectory: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            credentials: {
                host: string;
                user: string;
                password: string;
                port?: number | undefined;
                secure?: boolean | undefined;
                timeout?: number | undefined;
            };
            path: string;
        };
        output: {
            success: boolean;
            message: string;
        };
        meta: object;
    }>;
    getFeatures: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            credentials: {
                host: string;
                user: string;
                password: string;
                port?: number | undefined;
                secure?: boolean | undefined;
                timeout?: number | undefined;
            };
        };
        output: {
            success: boolean;
            data: {
                [k: string]: string;
            };
        };
        meta: object;
    }>;
    downloadFile: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            credentials: {
                host: string;
                user: string;
                password: string;
                port?: number | undefined;
                secure?: boolean | undefined;
                timeout?: number | undefined;
            };
            remotePath: string;
        };
        output: {
            success: boolean;
            data: Buffer;
            filename: string;
        };
        meta: object;
    }>;
    downloadFolder: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            credentials: {
                host: string;
                user: string;
                password: string;
                port?: number | undefined;
                secure?: boolean | undefined;
                timeout?: number | undefined;
            };
            remotePath: string;
            folderName: string;
        };
        output: {
            success: boolean;
            data: Buffer;
            filename: string;
        };
        meta: object;
    }>;
    readFile: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            credentials: {
                host: string;
                user: string;
                password: string;
                port?: number | undefined;
                secure?: boolean | undefined;
                timeout?: number | undefined;
            };
            remotePath: string;
            maxSize?: number | undefined;
        };
        output: {
            success: boolean;
            content: string;
            filename: string;
            encoding: string;
        };
        meta: object;
    }>;
    extractZip: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            credentials: {
                host: string;
                user: string;
                password: string;
                port?: number | undefined;
                secure?: boolean | undefined;
                timeout?: number | undefined;
            };
            zipPath: string;
            extractTo?: string | undefined;
            overwrite?: boolean | undefined;
            maxSize?: number | undefined;
        };
        output: {
            success: boolean;
            extractedCount: number;
            failedCount: number;
            files: string[];
            failedFiles: string[] | undefined;
            message: string;
        };
        meta: object;
    }>;
}>>;
