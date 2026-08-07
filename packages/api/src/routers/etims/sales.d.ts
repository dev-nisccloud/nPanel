export declare const etimsSalesRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Submit a sales transaction to KRA and generate a tax invoice.
     * POST /saveTrnsSalesOsdc
     */
    sendSalesTransaction: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            transaction: {
                trdInvcNo: string | number;
                invcNo: number;
                orgInvcNo: number;
                salesTyCd: string;
                rcptTyCd: string;
                salesSttsCd: string;
                cfmDt: string;
                salesDt: string;
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
                prchrAcptcYn: "Y" | "N";
                regrId: string;
                regrNm: string;
                modrId: string;
                modrNm: string;
                receipt: {
                    rcptPbctDt: string;
                    prchrAcptcYn: "Y" | "N";
                    custTin?: string | null | undefined;
                    custMblNo?: string | null | undefined;
                    trdeNm?: string | null | undefined;
                    adrs?: string | null | undefined;
                    topMsg?: string | null | undefined;
                    btmMsg?: string | null | undefined;
                };
                itemList: {
                    itemSeq: number;
                    itemCd: string;
                    itemNm: string;
                    pkgUnitCd: string;
                    pkg: number;
                    qtyUnitCd: string;
                    qty: number;
                    prc: number;
                    splyAmt: number;
                    dcRt: number;
                    dcAmt: number;
                    taxTyCd: "A" | "B" | "C" | "D" | "E";
                    taxblAmt: number;
                    taxAmt: number;
                    totAmt: number;
                    itemClsCd?: string | null | undefined;
                    bcd?: string | null | undefined;
                    isrccCd?: string | null | undefined;
                    isrccNm?: string | null | undefined;
                    isrcRt?: number | null | undefined;
                    isrcAmt?: number | null | undefined;
                }[];
                custTin?: string | null | undefined;
                custNm?: string | null | undefined;
                pmtTyCd?: string | null | undefined;
                stockRlsDt?: string | null | undefined;
                cnclReqDt?: string | null | undefined;
                cnclDt?: string | null | undefined;
                rfdDt?: string | null | undefined;
                rfdRsnCd?: string | null | undefined;
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
     * Issue a credit note against a prior sale.
     * POST /saveTrnsSalesOsdc (rcptTyCd=R, orgInvcNo=original invoice)
     */
    sendCreditNote: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            transaction: {
                trdInvcNo: string | number;
                invcNo: number;
                salesTyCd: string;
                salesSttsCd: string;
                cfmDt: string;
                salesDt: string;
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
                prchrAcptcYn: "Y" | "N";
                regrId: string;
                regrNm: string;
                modrId: string;
                modrNm: string;
                receipt: {
                    rcptPbctDt: string;
                    prchrAcptcYn: "Y" | "N";
                    custTin?: string | null | undefined;
                    custMblNo?: string | null | undefined;
                    trdeNm?: string | null | undefined;
                    adrs?: string | null | undefined;
                    topMsg?: string | null | undefined;
                    btmMsg?: string | null | undefined;
                };
                itemList: {
                    itemSeq: number;
                    itemCd: string;
                    itemNm: string;
                    pkgUnitCd: string;
                    pkg: number;
                    qtyUnitCd: string;
                    qty: number;
                    prc: number;
                    splyAmt: number;
                    dcRt: number;
                    dcAmt: number;
                    taxTyCd: "A" | "B" | "C" | "D" | "E";
                    taxblAmt: number;
                    taxAmt: number;
                    totAmt: number;
                    itemClsCd?: string | null | undefined;
                    bcd?: string | null | undefined;
                    isrccCd?: string | null | undefined;
                    isrccNm?: string | null | undefined;
                    isrcRt?: number | null | undefined;
                    isrcAmt?: number | null | undefined;
                }[];
                rcptTyCd: "R";
                orgInvcNo: number;
                rfdDt: string;
                rfdRsnCd: "01" | "02" | "03" | "04" | "05" | "06";
                custTin?: string | null | undefined;
                custNm?: string | null | undefined;
                pmtTyCd?: string | null | undefined;
                stockRlsDt?: string | null | undefined;
                cnclReqDt?: string | null | undefined;
                cnclDt?: string | null | undefined;
                remark?: string | null | undefined;
            };
        };
        output: {
            success: boolean;
            data: null;
            errorMessage: string;
        } | {
            success: boolean;
            data: unknown;
            errorMessage?: undefined;
        };
        meta: object;
    }>;
    /**
     * POST /selectTrnsSalesList
     */
    getSalesTransactions: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            lastReqDt: string;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /** POST /selectInvoiceDetails */
    getInvoiceDetails: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            invcNo: number;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
}>>;
