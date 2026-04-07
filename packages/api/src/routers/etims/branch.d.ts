export declare const etimsBranchRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Register customer information for a branch
     */
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
    /**
     * Create/update branch user account
     */
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
