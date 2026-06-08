export declare const etimsImportsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Retrieve imported items from KRA customs system.
     * POST /selectImportItemList
     */
    getImportedItems: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            lastReqDt: string;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Confirm an imported item and map it to a local item code.
     * POST /updateImportItem
     */
    confirmImportedItem: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            item: {
                taskCd: string;
                dclDe: string;
                itemSeq: number;
                hsCd: string;
                itemClsCd: string;
                itemCd: string;
                imptItemSttsCd: string;
                modrId: string;
                modrNm: string;
                remark?: string | null | undefined;
            };
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
}>>;
