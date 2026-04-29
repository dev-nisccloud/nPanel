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
        generateToken: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                grantType?: "client_credentials" | undefined;
            };
            output: {
                success: boolean;
                data: import("../../lib/etims-client").AuthResponse;
            };
            meta: object;
        }>;
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
    data: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getCodeList: import("@trpc/server").TRPCQueryProcedure<{
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
        getItemClassList: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                lastReqDt: string;
                bhfId?: string | undefined;
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
        getBranchList: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                lastReqDt: string;
            };
            output: {
                success: boolean;
                data: any;
            };
            meta: object;
        }>;
        getNoticeList: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                lastReqDt: string;
            };
            output: {
                success: boolean;
                data: any;
            };
            meta: object;
        }>;
        getTaxpayerInfo: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                lastReqDt: string;
            };
            output: {
                success: boolean;
                data: any;
            };
            meta: object;
        }>;
        getCustomerList: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                lastReqDt: string;
            };
            output: {
                success: boolean;
                data: any;
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
        saveCustomer: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                tin: string;
                bhfId: string;
                customer: {
                    custNo: string;
                    custTin: string;
                    custNm: string;
                    adrs: string | null;
                    telNo: string | null;
                    email: string | null;
                    faxNo: string | null;
                    remark: string | null;
                    useYn?: "Y" | "N" | undefined;
                    regrNm?: string | undefined;
                    regrId?: string | undefined;
                    modrNm?: string | undefined;
                    modrId?: string | undefined;
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
        saveBranchUser: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                tin: string;
                bhfId: string;
                user: {
                    userId: string;
                    userNm: string;
                    pwd: string;
                    adrs: string | null;
                    cntc: string | null;
                    authCd: string | null;
                    remark: string | null;
                    regrNm: string;
                    regrId: string;
                    modrNm: string;
                    modrId: string;
                    useYn?: "Y" | "N" | undefined;
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
    items: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
                requiresReinitialization?: undefined;
                errorMessage?: undefined;
            } | {
                success: boolean;
                data: null;
                requiresReinitialization: boolean;
                errorMessage: any;
            };
            meta: object;
        }>;
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
    imports: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
    sales: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        sendSalesTransaction: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                transaction: any;
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
        getSalesTransactions: import("@trpc/server").TRPCQueryProcedure<{
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
        getInvoiceDetail: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                invcNo: string;
            };
            output: {
                success: boolean;
                data: any;
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
                bhfId?: string | undefined;
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
        sendPurchaseTransaction: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                purchase: any;
                bhfId?: string | undefined;
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
                data: any;
                errorMessage?: undefined;
            } | {
                success: boolean;
                data: null;
                errorMessage: any;
            };
            meta: object;
        }>;
        sendStockIO: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                stockData: any;
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
        saveStockMaster: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                stockMaster: {
                    itemCd: string;
                    rsdQty: number;
                    regrId: string;
                    regrNm: string;
                    modrNm: string;
                    modrId: string;
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
    }>>;
}>>;
