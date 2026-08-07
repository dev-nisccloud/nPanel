export declare const etimsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    auth: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getConfiguration: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                isInitialized: boolean;
                config: null;
            } | {
                isInitialized: boolean;
                config: {
                    kraPin: string;
                    branchId: string;
                    deviceSerialNumber: string;
                    isSandbox: boolean;
                    updatedAt: Date;
                };
            };
            meta: object;
        }>;
    }>>;
    initialization: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
                } | null;
                reusedExistingCmcKey: boolean;
            };
            meta: object;
        }>;
    }>>;
    data: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getCodeList: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                lastReqDt: string;
            };
            output: {
                success: boolean;
                data: unknown;
            };
            meta: object;
        }>;
        getItemClassList: import("@trpc/server").TRPCQueryProcedure<{
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
        getItemClassMeta: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                success: boolean;
                meta: import("../../lib/etims-item-classification-store").EtimsItemClassMeta | null;
                needsSync: boolean;
            };
            meta: object;
        }>;
        listItemClassifications: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                level: number;
                search?: string | undefined;
                page?: number | undefined;
                pageSize?: number | undefined;
            };
            output: {
                items: import("../../lib/etims-item-classification-store").EtimsItemClassification[];
                total: number;
                page: number;
                pageSize: number;
                totalPages: number;
                needsSync: boolean;
                success: boolean;
            };
            meta: object;
        }>;
        getItemClassification: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                itemClsCd: string;
            };
            output: {
                success: boolean;
                item: import("../../lib/etims-item-classification-store").EtimsItemClassification | null;
            };
            meta: object;
        }>;
        syncItemClassifications: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                lastReqDt?: string | undefined;
                maxPages?: number | undefined;
                reset?: boolean | undefined;
            };
            output: {
                pagesFetched: number;
                rowsFetched: number;
                hasMore: boolean;
                nextLastReqDt: string;
                totalSynced: number;
                isComplete: boolean;
                meta: import("../../lib/etims-item-classification-store").EtimsItemClassMeta | null;
                success: boolean;
            };
            meta: object;
        }>;
        lookupCustomer: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                custmTin: string;
            };
            output: {
                success: boolean;
                data: import("./data").EtimsCustomerLookup;
            } | {
                success: boolean;
                data: null;
            };
            meta: object;
        }>;
        getCustomerList: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                lastReqDt?: string | undefined;
            };
            output: {
                success: boolean;
                data: import("./data").EtimsBranchCustomer[];
            };
            meta: object;
        }>;
        getNoticeList: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                lastReqDt: string;
            };
            output: {
                success: boolean;
                data: unknown;
            };
            meta: object;
        }>;
        getNotices: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                lastReqDt: string;
            };
            output: {
                success: boolean;
                data: unknown;
            };
            meta: object;
        }>;
        getTaxPayerInfo: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                lastReqDt?: string | undefined;
            };
            output: {
                success: boolean;
                data: unknown;
            };
            meta: object;
        }>;
    }>>;
    branch: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getBranchList: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                lastReqDt: string;
            };
            output: {
                success: boolean;
                data: unknown;
            };
            meta: object;
        }>;
        saveCustomer: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                customer: {
                    custNo: string;
                    custTin: string;
                    custNm: string;
                    adrs?: string | null | undefined;
                    telNo?: string | null | undefined;
                    email?: string | null | undefined;
                    faxNo?: string | null | undefined;
                    useYn?: "Y" | "N" | undefined;
                    remark?: string | null | undefined;
                    regrId?: string | undefined;
                    regrNm?: string | undefined;
                    modrId?: string | undefined;
                    modrNm?: string | undefined;
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
        saveBranchUser: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                user: {
                    userId: string;
                    userNm: string;
                    pwd: string;
                    regrId: string;
                    regrNm: string;
                    modrId: string;
                    modrNm: string;
                    adrs?: string | null | undefined;
                    cntc?: string | null | undefined;
                    authCd?: string | null | undefined;
                    remark?: string | null | undefined;
                    useYn?: "Y" | "N" | undefined;
                };
            };
            output: {
                success: boolean;
                data: unknown;
            };
            meta: object;
        }>;
        saveBranchInsurance: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                insurance: {
                    isrccCd: string;
                    isrccNm: string;
                    isrcRt: number;
                    useYn?: "Y" | "N" | undefined;
                    regrId?: string | undefined;
                    regrNm?: string | undefined;
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
    items: import("@trpc/server").TRPCBuiltRouter<{
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
    imports: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
    sales: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
    purchases: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
    stock: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
}>>;
