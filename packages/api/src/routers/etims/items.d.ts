export declare const etimsItemsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Create or update item/product information
     */
    saveItem: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            item: {
                itemClsCd: string;
                itemTyCd: "1" | "2" | "3";
                itemNm: string;
                taxTyCd: "A" | "B" | "C" | "D" | "E";
                dftPrc: number;
                regrNm: string;
                regrId: string;
                modrNm: string;
                modrId: string;
                itemCd?: string | undefined;
                itemStdNm?: string | null | undefined;
                orgnNatCd?: string | undefined;
                pkgUnitCd?: string | undefined;
                qtyUnitCd?: string | undefined;
                btchNo?: string | null | undefined;
                bcd?: string | null | undefined;
                grpPrcL1?: number | undefined;
                grpPrcL2?: number | undefined;
                grpPrcL3?: number | undefined;
                grpPrcL4?: number | undefined;
                grpPrcL5?: number | null | undefined;
                addInfo?: string | null | undefined;
                sftyQty?: number | null | undefined;
                isrcAplcbYn?: "Y" | "N" | undefined;
                useYn?: "Y" | "N" | undefined;
            };
        };
        output: {
            success: boolean;
            data: any;
            errorMessage?: undefined;
        } | {
            success: boolean;
            data: null;
            errorMessage: any;
        };
        meta: object;
    }>;
    /**
     * Retrieve saved items
     */
    getItemInfo: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            lastReqDt: string;
            bhfId?: string | undefined;
        };
        output: {
            success: boolean;
            data: any;
        };
        meta: object;
    }>;
    /**
     * Define composite items (items made from other items)
     */
    saveItemComposition: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            composition: {
                itemCd: string;
                cpstItemCd: string;
                cpstQty: number;
                regrId: string;
                regrNm: string;
            };
        };
        output: {
            success: boolean;
            data: any;
        };
        meta: object;
    }>;
}>>;
