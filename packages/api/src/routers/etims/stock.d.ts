export declare const etimsStockRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Retrieve stock movement history.
     * POST /selectStockMoveList
     */
    getStockMovements: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            lastReqDt: string;
        };
        output: {
            success: boolean;
            data: unknown;
            errorMessage?: undefined;
        } | {
            success: boolean;
            data: null;
            errorMessage: string;
        };
        meta: object;
    }>;
    /**
     * Record stock in/out transaction.
     * POST /insertStockIO
     */
    sendStockIO: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            stockData: {
                sarNo: number;
                orgSarNo: number;
                regTyCd: string;
                sarTyCd: string;
                ocrnDt: string;
                totItemCnt: number;
                totTaxblAmt: number;
                totTaxAmt: number;
                totAmt: number;
                regrId: string;
                regrNm: string;
                modrId: string;
                modrNm: string;
                itemList: {
                    itemSeq: number;
                    itemCd: string;
                    itemClsCd: string;
                    itemNm: string;
                    pkgUnitCd: string;
                    pkg: number;
                    qtyUnitCd: string;
                    qty: number;
                    prc: number;
                    splyAmt: number;
                    totDcAmt: number;
                    taxblAmt: number;
                    taxTyCd: string;
                    taxAmt: number;
                    totAmt: number;
                    bcd?: string | null | undefined;
                    itemExprDt?: string | null | undefined;
                }[];
                custTin?: string | null | undefined;
                custNm?: string | null | undefined;
                custBhfId?: string | null | undefined;
                remark?: string | null | undefined;
            };
        };
        output: {
            success: boolean;
            data: unknown;
            errorMessage?: undefined;
        } | {
            success: boolean;
            data: null;
            errorMessage: string;
        };
        meta: object;
    }>;
    /**
     * Update the stock master record with current on-hand quantity.
     * POST /saveStockMaster
     */
    saveStockMaster: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            stockMaster: {
                itemCd: string;
                rsdQty: number;
                regrId: string;
                regrNm: string;
                modrId: string;
                modrNm: string;
            };
        };
        output: {
            success: boolean;
            data: unknown;
            errorMessage?: undefined;
        } | {
            success: boolean;
            data: null;
            errorMessage: string;
        };
        meta: object;
    }>;
}>>;
