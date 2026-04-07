export declare const etimsInitializationRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Initialize OSCU device and obtain communication key (cmcKey)
     */
    /**
     * Initialize OSCU device and obtain communication key (cmcKey)
     */
    initializeDevice: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            tin: string;
            dvcSrlNo: string;
            bhfId?: string | undefined;
            isSandbox?: boolean | undefined;
        };
        output: {
            success: boolean;
            data: {
                configId: string;
                resultCd?: string;
                resultMsg?: string;
                data?: {
                    info?: {
                        cmcKey?: string;
                    };
                    cmcKey?: string;
                };
                responseHeader?: {
                    customerMessage?: string;
                    debugMessage?: string;
                };
                responseBody?: {
                    resultCd?: string;
                    resultMsg?: string;
                    data?: {
                        info?: {
                            cmcKey?: string;
                        };
                        cmcKey?: string;
                    } | null;
                };
            };
        };
        meta: object;
    }>;
}>>;
