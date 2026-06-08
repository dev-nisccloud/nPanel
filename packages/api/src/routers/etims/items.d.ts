export declare const etimsItemsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getItemList: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            lastReqDt: string;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    saveItem: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            item: {
                itemCd: string;
                itemClsCd: string;
                itemTyCd: "1" | "2" | "3";
                itemNm: string;
                taxTyCd: "A" | "B" | "C" | "D" | "E";
                dftPrc: number;
                regrId: string;
                regrNm: string;
                modrId: string;
                modrNm: string;
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
                grpPrcL5?: number | undefined;
                addInfo?: string | null | undefined;
                sftyQty?: number | null | undefined;
                isrcAplcbYn?: "Y" | "N" | undefined;
                useYn?: "Y" | "N" | undefined;
            };
        };
        output: {
            success: boolean;
            data: unknown;
            requiresReinitialization?: undefined;
            errorMessage?: undefined;
        } | {
            success: boolean;
            data: null;
            requiresReinitialization: boolean;
            errorMessage: string;
        };
        meta: object;
    }>;
    saveItemComposition: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            composition: {
                itemCd: string;
                cpstItemCd: string;
                cpstQty: number;
                regrId: string;
                regrNm: string;
                modrId?: string | undefined;
                modrNm?: string | undefined;
            };
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
}>>;
