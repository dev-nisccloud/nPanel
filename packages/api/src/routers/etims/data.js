import { z } from "zod";
import { router } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { getEtimsContext } from "../../lib/etims-config";
import { getEtimsItemClassMeta, getEtimsItemClassificationByCode, listEtimsItemClassifications, syncEtimsItemClassificationsBatch, } from "../../lib/etims-item-classification-store";
import { etimsProcedure, skipEtimsAuthChecks } from "./_procedure";
const isAgencyUser = (role) => ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");
function assertReadAccess(role) {
    if (skipEtimsAuthChecks())
        return;
    if (!isAgencyUser(role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only agency users can access eTIMS data." });
    }
}
function normalizeRegistryCustomer(raw, fallbackTin) {
    const name = raw.taxprNm ?? raw.custmNm ?? raw.custNm;
    const tin = raw.tin ?? raw.custmTin ?? raw.custTin ?? fallbackTin;
    if (!name || typeof name !== "string")
        return null;
    const addressParts = [raw.locDesc, raw.sctrNm, raw.dstrtNm, raw.prvncNm, raw.adrs]
        .filter((v) => typeof v === "string" && v.trim().length > 0);
    return {
        custmTin: String(tin).toUpperCase(),
        custmNm: String(name),
        adrs: addressParts.length ? addressParts.join(", ") : raw.adrs ?? null,
        telNo: raw.telNo ?? null,
        email: raw.email ?? null,
        taxprSttsCd: raw.taxprSttsCd ?? null,
        source: raw.custNo ? "branch_list" : "kra_registry",
    };
}
function extractRegistryPayload(result) {
    if (!result || typeof result !== "object")
        return null;
    const root = result;
    if (root.resultCd === "001" || root.data == null)
        return null;
    if (root.data && typeof root.data === "object")
        return root.data;
    return root;
}
function extractBranchCustomerList(result) {
    if (!result || typeof result !== "object")
        return [];
    const root = result;
    const data = root.data;
    if (!data || typeof data !== "object")
        return [];
    const list = data.custList;
    return Array.isArray(list) ? list : [];
}
function normalizeBranchCustomer(raw) {
    const custNo = raw.custNo ?? raw.custmNo;
    const custTin = raw.custTin ?? raw.custmTin ?? raw.tin;
    const custNm = raw.custNm ?? raw.custmNm ?? raw.taxprNm;
    if (!custNo || !custTin || !custNm)
        return null;
    return {
        custNo: String(custNo),
        custTin: String(custTin).toUpperCase(),
        custNm: String(custNm),
        adrs: raw.adrs ?? null,
        telNo: raw.telNo ?? null,
        email: raw.email ?? null,
        faxNo: raw.faxNo ?? null,
        useYn: raw.useYn ?? null,
        remark: raw.remark ?? null,
    };
}
export const etimsDataRouter = router({
    /**
     * Retrieve standard code lists (payment types, receipt types, tax codes, etc.)
     * POST /selectCodeList
     */
    getCodeList: etimsProcedure
        .input(z.object({
        lastReqDt: z.string().regex(/^\d{14}$/, "Must be YYYYMMDDHHmmss"),
    }))
        .query(async ({ ctx, input }) => {
        assertReadAccess(ctx.session?.user?.role);
        const { client, oscu } = await getEtimsContext();
        try {
            const result = await client.selectCodeList(oscu, input.lastReqDt);
            return { success: true, data: result };
        }
        catch (error) {
            const msg = error.message;
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg || "Failed to retrieve code list" });
        }
    }),
    /**
     * Retrieve item classification codes for categorizing products.
     * POST /selectItemClsList
     * @deprecated Prefer getItemClassMeta + listItemClassifications.
     */
    getItemClassList: etimsProcedure
        .input(z.object({
        lastReqDt: z.string().regex(/^\d{14}$/, "Must be YYYYMMDDHHmmss"),
    }))
        .query(async ({ ctx, input }) => {
        assertReadAccess(ctx.session?.user?.role);
        const { client, oscu } = await getEtimsContext();
        try {
            const result = await client.selectItemClsList(oscu, input.lastReqDt);
            return { success: true, data: result };
        }
        catch (error) {
            const msg = error.message;
            // Non-fatal: KRA sandbox can return errors here during test session issues.
            // Return a graceful failure so the UI can prompt the user to enter codes manually.
            console.warn("[eTIMS] getItemClassList failed:", msg);
            return { success: false, data: null, errorMessage: msg || "Failed to retrieve item class list" };
        }
    }),
    /** Cached KRA item classification metadata (level counts, last sync). */
    getItemClassMeta: etimsProcedure
        .query(async ({ ctx }) => {
        assertReadAccess(ctx.session?.user?.role);
        const { oscu } = await getEtimsContext();
        const meta = await getEtimsItemClassMeta(oscu);
        return { success: true, meta, needsSync: !meta };
    }),
    /** Paginated, searchable item classifications for a chosen hierarchy level. */
    listItemClassifications: etimsProcedure
        .input(z.object({
        level: z.number().int().min(1).max(5),
        search: z.string().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(25),
    }))
        .query(async ({ ctx, input }) => {
        assertReadAccess(ctx.session?.user?.role);
        const { oscu } = await getEtimsContext();
        try {
            const result = await listEtimsItemClassifications(oscu, input);
            return { success: true, ...result };
        }
        catch (error) {
            const msg = error.message;
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg || "Failed to list item classifications" });
        }
    }),
    /** Look up one classification code from the Redis cache. */
    getItemClassification: etimsProcedure
        .input(z.object({ itemClsCd: z.string().min(1) }))
        .query(async ({ ctx, input }) => {
        assertReadAccess(ctx.session?.user?.role);
        const { oscu } = await getEtimsContext();
        const item = await getEtimsItemClassificationByCode(oscu, input.itemClsCd.trim());
        return { success: true, item };
    }),
    /** Pull batches from KRA into Redis (call repeatedly until isComplete). */
    syncItemClassifications: etimsProcedure
        .input(z.object({
        lastReqDt: z.string().regex(/^\d{14}$/, "Must be YYYYMMDDHHmmss").optional(),
        maxPages: z.number().int().min(1).max(10).default(3),
        reset: z.boolean().default(false),
    }))
        .mutation(async ({ ctx, input }) => {
        assertReadAccess(ctx.session?.user?.role);
        const { client, oscu } = await getEtimsContext();
        try {
            const result = await syncEtimsItemClassificationsBatch(client, oscu, input);
            return { success: true, ...result };
        }
        catch (error) {
            const msg = error.message;
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg || "Failed to sync item classifications" });
        }
    }),
    /**
     * Look up a customer by KRA TIN.
     * 1. POST /selectCustomer  KRA central taxpayer registry
     * 2. POST /selectCustomerList  branch customers saved via saveBhfCustomer (sandbox fallback)
     */
    lookupCustomer: etimsProcedure
        .input(z.object({
        custmTin: z.string().min(1, "Customer TIN is required"),
    }))
        .query(async ({ ctx, input }) => {
        assertReadAccess(ctx.session?.user?.role);
        const { client, oscu } = await getEtimsContext();
        const custmTin = input.custmTin.trim().toUpperCase();
        try {
            const registryResult = await client.selectCustomer(oscu, custmTin);
            const registryPayload = extractRegistryPayload(registryResult);
            if (registryPayload) {
                const normalized = normalizeRegistryCustomer(registryPayload, custmTin);
                if (normalized) {
                    return { success: true, data: normalized };
                }
            }
            const listResult = await client.selectCustomerList(oscu, "20230101000000");
            const branchMatch = extractBranchCustomerList(listResult).find((c) => String(c.custTin ?? "").toUpperCase() === custmTin);
            if (branchMatch) {
                const normalized = normalizeRegistryCustomer(branchMatch, custmTin);
                if (normalized) {
                    return { success: true, data: normalized };
                }
            }
            return { success: true, data: null };
        }
        catch (error) {
            const msg = error.message;
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg || "Failed to look up customer" });
        }
    }),
    /**
     * List customers registered on the active eTIMS branch.
     * POST /selectCustomerList
     */
    getCustomerList: etimsProcedure
        .input(z.object({
        lastReqDt: z.string().regex(/^\d{14}$/, "Must be YYYYMMDDHHmmss").default("20230101000000"),
    }))
        .query(async ({ ctx, input }) => {
        assertReadAccess(ctx.session?.user?.role);
        const { client, oscu } = await getEtimsContext();
        try {
            const result = await client.selectCustomerList(oscu, input.lastReqDt);
            const customers = extractBranchCustomerList(result)
                .map(normalizeBranchCustomer)
                .filter((c) => c != null);
            return { success: true, data: customers };
        }
        catch (error) {
            const msg = error.message;
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg || "Failed to retrieve customer list" });
        }
    }),
    /**
     * Retrieve KRA notices (announcements, policy changes).
     * POST /selectNoticeList
     */
    getNoticeList: etimsProcedure
        .input(z.object({
        lastReqDt: z.string().regex(/^\d{14}$/, "Must be YYYYMMDDHHmmss"),
    }))
        .query(async ({ ctx, input }) => {
        assertReadAccess(ctx.session?.user?.role);
        const { client, oscu } = await getEtimsContext();
        try {
            const result = await client.selectNoticeList(oscu, input.lastReqDt);
            return { success: true, data: result };
        }
        catch (error) {
            const msg = error.message;
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg || "Failed to retrieve notice list" });
        }
    }),
    /** Dashboard test case: POST /selectNotices */
    getNotices: etimsProcedure
        .input(z.object({
        lastReqDt: z.string().regex(/^\d{14}$/, "Must be YYYYMMDDHHmmss"),
    }))
        .query(async ({ ctx, input }) => {
        assertReadAccess(ctx.session?.user?.role);
        const { client, oscu } = await getEtimsContext();
        try {
            const result = await client.selectNotices(oscu, input.lastReqDt);
            return { success: true, data: result };
        }
        catch (error) {
            const msg = error.message;
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg || "Failed to retrieve notices" });
        }
    }),
    /** POST /selectTaxPayerInfo */
    getTaxPayerInfo: etimsProcedure
        .input(z.object({
        lastReqDt: z.string().regex(/^\d{14}$/, "Must be YYYYMMDDHHmmss").default("20180101000000"),
    }))
        .query(async ({ ctx, input }) => {
        assertReadAccess(ctx.session?.user?.role);
        const { client, oscu } = await getEtimsContext();
        try {
            const result = await client.selectTaxPayerInfo(oscu, input.lastReqDt);
            return { success: true, data: result };
        }
        catch (error) {
            const msg = error.message;
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg || "Failed to retrieve taxpayer info" });
        }
    }),
});
