export declare const etimsImportsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Retrieve imported items from customs system
     */
    getImportedItems: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            tin: string;
            bhfId: string;
            lastReqDt: string;
            accessToken?: string | undefined;
            cmcKey?: string | undefined;
        };
        output: {
            success: boolean;
            data: any;
        };
        meta: object;
    }>;
    /**
     * Confirm imported items and map to local item codes
     */
    confirmImportedItem: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            tin: string;
            bhfId: string;
            conversion: {
                taskCd: string;
                dclDe: string;
                itemSeq: number;
                hsCd: string;
                itemClsCd: string;
                itemCd: string;
                imptItemSttsCd: string;
                remark: string | null;
                modrNm: string;
                modrId: string;
            };
            accessToken?: string | undefined;
            cmcKey?: string | undefined;
        };
        output: {
            success: boolean;
            data: any;
        };
        meta: object;
    }>;
}>>;
