export declare const wpBackgroundTasksRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /** Poll task status from a WP Toolkit task URL (relative path only). */
    getByUrl: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            taskUrl: string;
        };
        output: {
            task: import("../../lib/plesk/wp-meta-parser").WpTaskPayload | null;
            raw: any;
        };
        meta: object;
    }>;
    /**
  
     * Attempt to cancel a running task. WP Toolkit may not support cancel on all task types;
  
     * returns cancelSupported: false when the server rejects the request.
  
     */
    cancelByUrl: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            taskUrl: string;
        };
        output: {
            cancelled: boolean;
            cancelSupported: boolean;
            message?: undefined;
        } | {
            cancelled: boolean;
            cancelSupported: boolean;
            message: string;
        };
        meta: object;
    }>;
}>>;
