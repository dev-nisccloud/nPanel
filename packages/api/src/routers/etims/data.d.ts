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
            errorMessage?: undefined;
        } | {
            success: boolean;
            data: null;
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
            needsSync: boolean;
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
            success: boolean;
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
        };
        meta: object;
    }>;
    /** Pull batches from KRA into Redis (call repeatedly until isComplete). */
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
}>>;
