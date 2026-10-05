/** Normalized customer shape returned to the UI. */
export type EtimsCustomerLookup = {
    custmTin: string;
    custmNm: string;
    adrs?: string | null;
    telNo?: string | null;
    email?: string | null;
    taxprSttsCd?: string | null;
    source: "kra_registry" | "branch_list";
};
/** Normalized branch customer for list/detail UI. */
export type EtimsBranchCustomer = {
    custNo: string;
    custTin: string;
    custNm: string;
    adrs?: string | null;
    telNo?: string | null;
    email?: string | null;
    faxNo?: string | null;
    useYn?: string | null;
    remark?: string | null;
};
export declare const etimsDataRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Retrieve standard code lists (payment types, receipt types, tax codes, etc.)
     * POST /selectCodeList
     */
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
    /**
     * Retrieve item classification codes for categorizing products.
     * POST /selectItemClsList
     * @deprecated Prefer getItemClassMeta + listItemClassifications.
     */
    getItemClassList: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            lastReqDt: string;
        };
        output: {
            success: boolean;
            data: unknown;
            source: "db";
            errorMessage?: undefined;
        } | {
            success: boolean;
            data: null;
            source: "db";
            errorMessage: string;
        };
        meta: object;
    }>;
    /** Cached KRA item classification metadata (level counts, last sync). */
    getItemClassMeta: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            success: boolean;
            meta: import("../../lib/etims-item-classification-store").EtimsItemClassMeta | null;
            empty: boolean;
            needsSync: boolean;
            allowAutoSync: boolean;
            errorMessage?: string;
        };
        meta: object;
    }>;
    /** Paginated, searchable item classifications for a chosen hierarchy level. */
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
            empty?: boolean;
            success: boolean;
            errorMessage?: string;
        };
        meta: object;
    }>;
    /** Look up one classification code from the Redis cache. */
    getItemClassification: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            itemClsCd: string;
        };
        output: {
            success: boolean;
            item: import("../../lib/etims-item-classification-store").EtimsItemClassification | null;
            errorMessage?: string;
        };
        meta: object;
    }>;
    /**
     * Look up a customer by KRA TIN.
     * 1. POST /selectCustomer  KRA central taxpayer registry
     * 2. POST /selectCustomerList  branch customers saved via saveBhfCustomer (sandbox fallback)
     */
    lookupCustomer: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            custmTin: string;
        };
        output: {
            success: boolean;
            data: EtimsCustomerLookup;
        } | {
            success: boolean;
            data: null;
        };
        meta: object;
    }>;
    /**
     * List customers registered on the active eTIMS branch.
     * POST /selectCustomerList
     */
    getCustomerList: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            lastReqDt?: string | undefined;
        };
        output: {
            success: boolean;
            data: EtimsBranchCustomer[];
        };
        meta: object;
    }>;
    /**
     * Retrieve KRA notices (announcements, policy changes).
     * POST /selectNoticeList
     */
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
    /** Dashboard test case: POST /selectNotices */
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
    /** POST /selectTaxPayerInfo */
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
