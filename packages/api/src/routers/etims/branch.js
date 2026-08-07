import { z } from "zod";
import { router } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { getEtimsContext } from "../../lib/etims-config";
import { etimsProcedure, skipEtimsAuthChecks } from "./_procedure";
const isAgencyUser = (r) => ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(r ?? "");
const isSuperAdmin = (r) => r === "AGENCY_SUPER_ADMIN";
function assertRead(role) {
    if (skipEtimsAuthChecks())
        return;
    if (!isAgencyUser(role))
        throw new TRPCError({ code: "FORBIDDEN", message: "Only agency users can access eTIMS branch data." });
}
function assertWrite(role) {
    if (skipEtimsAuthChecks())
        return;
    if (!isSuperAdmin(role))
        throw new TRPCError({ code: "FORBIDDEN", message: "Only agency super admins can modify eTIMS branch data." });
}
export const etimsBranchRouter = router({
    getBranchList: etimsProcedure
        .input(z.object({ lastReqDt: z.string().regex(/^\d{14}$/) }))
        .query(async ({ ctx, input }) => {
        assertRead(ctx.session?.user?.role);
        const { client, oscu } = await getEtimsContext();
        try {
            const result = await client.selectBhfList(oscu, input.lastReqDt);
            return { success: true, data: result };
        }
        catch (e) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: e.message || "Failed to retrieve branch list" });
        }
    }),
    saveCustomer: etimsProcedure
        .input(z.object({
        customer: z.object({
            custNo: z.string().min(1),
            custTin: z.string().min(1),
            custNm: z.string().min(1),
            adrs: z.string().nullable().optional(),
            telNo: z.string().nullable().optional(),
            email: z.union([z.string().email(), z.literal("")]).nullable().optional().transform((v) => v || null),
            faxNo: z.string().nullable().optional(),
            useYn: z.enum(["Y", "N"]).default("Y"),
            remark: z.string().nullable().optional(),
            regrId: z.string().default("Admin"),
            regrNm: z.string().default("Admin"),
            modrId: z.string().default("Admin"),
            modrNm: z.string().default("Admin"),
        }),
    }))
        .mutation(async ({ ctx, input }) => {
        assertWrite(ctx.session?.user?.role);
        const { client, oscu } = await getEtimsContext();
        try {
            const result = await client.saveBhfCustomer(oscu, input.customer);
            const body = result;
            if (body?.resultCd && body.resultCd !== "000") {
                return { success: false, data: null, errorMessage: body.resultMsg ?? "Failed to save branch customer" };
            }
            return { success: true, data: result };
        }
        catch (e) {
            const msg = e.message;
            console.warn("[eTIMS] saveCustomer failed:", msg);
            return { success: false, data: null, errorMessage: msg || "Failed to save branch customer" };
        }
    }),
    saveBranchUser: etimsProcedure
        .input(z.object({
        user: z.object({
            userId: z.string().min(1),
            userNm: z.string().min(1),
            pwd: z.string().min(1),
            adrs: z.string().nullable().optional(),
            cntc: z.string().nullable().optional(),
            authCd: z.string().nullable().optional(),
            remark: z.string().nullable().optional(),
            useYn: z.enum(["Y", "N"]).default("Y"),
            regrId: z.string().min(1),
            regrNm: z.string().min(1),
            modrId: z.string().min(1),
            modrNm: z.string().min(1),
        }),
    }))
        .mutation(async ({ ctx, input }) => {
        assertWrite(ctx.session?.user?.role);
        const { client, oscu } = await getEtimsContext();
        try {
            const result = await client.saveBhfUser(oscu, input.user);
            return { success: true, data: result };
        }
        catch (e) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: e.message || "Failed to save branch user" });
        }
    }),
    /** POST /saveBhfInsurance */
    saveBranchInsurance: etimsProcedure
        .input(z.object({
        insurance: z.object({
            isrccCd: z.string().min(1).max(10),
            isrccNm: z.string().min(1).max(100),
            isrcRt: z.number(),
            useYn: z.enum(["Y", "N"]).default("Y"),
            regrId: z.string().default("Admin"),
            regrNm: z.string().default("Admin"),
            modrId: z.string().default("Admin"),
            modrNm: z.string().default("Admin"),
        }),
    }))
        .mutation(async ({ ctx, input }) => {
        assertWrite(ctx.session?.user?.role);
        const { client, oscu } = await getEtimsContext();
        try {
            const result = await client.saveBhfInsurance(oscu, input.insurance);
            return { success: true, data: result };
        }
        catch (e) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: e.message || "Failed to save branch insurance" });
        }
    }),
});
