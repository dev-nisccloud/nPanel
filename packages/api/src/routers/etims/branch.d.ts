export declare const etimsBranchRouter: import("@trpc/server").TRPCBuiltRouter<{
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
    /** POST /saveBhfInsurance */
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
