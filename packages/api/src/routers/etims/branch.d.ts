export declare const etimsBranchRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Retrieve the list of registered branches for this taxpayer.
     * POST /selectBhfList
     */
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
    /**
     * Register or update a customer record for a branch.
     * POST /saveBhfCustomer
     */
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
    /**
     * Create or update a branch user account.
     * POST /saveBhfUser
     */
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
}>>;
