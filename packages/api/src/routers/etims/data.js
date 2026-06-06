import { z } from "zod";
import { router, protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { getEtimsContext } from "../../lib/etims-config";
const isAgencyUser = (role) => ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");
function assertReadAccess(role) {
    if (!isAgencyUser(role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only agency users can access eTIMS data." });
    }
}
export const etimsDataRouter = router({
    /**
     * Retrieve standard code lists (payment types, receipt types, tax codes, etc.)
     * POST /selectCodeList
     */
    getCodeList: protectedProcedure
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
     */
    getItemClassList: protectedProcedure
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
    /**
     * Look up a specific customer by their KRA TIN.
     * POST /selectCustomer  (requires custmTin, NOT lastReqDt)
     */
    lookupCustomer: protectedProcedure
        .input(z.object({
        custmTin: z.string().min(1, "Customer TIN is required"),
    }))
        .query(async ({ ctx, input }) => {
        assertReadAccess(ctx.session?.user?.role);
        const { client, oscu } = await getEtimsContext();
        try {
            const result = await client.selectCustomer(oscu, input.custmTin);
            return { success: true, data: result };
        }
        catch (error) {
            const msg = error.message;
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg || "Failed to look up customer" });
        }
    }),
    /**
     * Retrieve KRA notices (announcements, policy changes).
     * POST /selectNoticeList
     */
    getNoticeList: protectedProcedure
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
});
