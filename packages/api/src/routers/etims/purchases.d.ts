export declare const etimsPurchasesRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Retrieve purchase transactions from KRA.
     * POST /selectTrnsPurchaseSalesList
     */
    getPurchaseTransactions: import("@trpc/server").TRPCQueryProcedure<{
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
     * Submit a purchase transaction to KRA.
     * POST /insertTrnsPurchase
     */
    sendPurchaseTransaction: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            purchase: {
                invcNo: number;
                orgInvcNo: number;
                regTyCd: string;
                pchsTyCd: string;
                rcptTyCd: string;
                pmtTyCd: string;
                pchsSttsCd: string;
                totItemCnt: number;
                taxblAmtA: number;
                taxblAmtB: number;
                taxblAmtC: number;
                taxblAmtD: number;
                taxblAmtE: number;
                taxRtA: number;
                taxRtB: number;
                taxRtC: number;
                taxRtD: number;
                taxRtE: number;
                taxAmtA: number;
                taxAmtB: number;
                taxAmtC: number;
                taxAmtD: number;
                taxAmtE: number;
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
                    dcRt: number;
                    dcAmt: number;
                    taxblAmt: number;
                    taxTyCd: string;
                    taxAmt: number;
                    totAmt: number;
                    bcd?: string | null | undefined;
                    spplrItemClsCd?: string | null | undefined;
                    spplrItemCd?: string | null | undefined;
                    spplrItemNm?: string | null | undefined;
                    itemExprDt?: string | null | undefined;
                }[];
                spplrTin?: string | null | undefined;
                spplrBhfId?: string | null | undefined;
                spplrNm?: string | null | undefined;
                spplrInvcNo?: number | null | undefined;
                cfmDt?: string | null | undefined;
                pchsDt?: string | null | undefined;
                wrhsDt?: string | null | undefined;
                cnclReqDt?: string | null | undefined;
                cnclDt?: string | null | undefined;
                rfdDt?: string | null | undefined;
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
}>>;
