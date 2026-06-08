export declare const etimsInitializationRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Initialize the OSCU device with KRA and obtain the cmcKey.
     *
     * Correct endpoint: POST /selectInitOsdcInfo
     * Headers:  Authorization: Bearer <token>  (NO tin/bhfId/cmcKey yet)
     * Body:     { tin, bhfId, dvcSrlNo }
     * Response: { resultCd: "000", data: { info: { cmcKey, ... } } }
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
            cmcKey: string;
            configId: string;
            info: {
                cmcKey?: string;
                taxprNm?: string;
                bhfNm?: string;
                sdcId?: string;
                mrcNo?: string;
            };
        };
        meta: object;
    }>;
}>>;
