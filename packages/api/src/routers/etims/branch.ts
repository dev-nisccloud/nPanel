import { z } from "zod";
import { router, protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { getEtimsContext } from "../../lib/etims-config";

const isAgencyUser = (r: string | null | undefined) =>
    ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(r ?? "");
const isSuperAdmin = (r: string | null | undefined) => r === "AGENCY_SUPER_ADMIN";

function assertRead(role: string | null | undefined) {
    if (!isAgencyUser(role)) throw new TRPCError({ code: "FORBIDDEN", message: "Only agency users can access eTIMS branch data." });
}
function assertWrite(role: string | null | undefined) {
    if (!isSuperAdmin(role)) throw new TRPCError({ code: "FORBIDDEN", message: "Only agency super admins can modify eTIMS branch data." });
}

export const etimsBranchRouter = router({
    /**
     * Retrieve the list of registered branches for this taxpayer.
     * POST /selectBhfList
     */
    getBranchList: protectedProcedure
        .input(z.object({ lastReqDt: z.string().regex(/^\d{14}$/) }))
        .query(async ({ ctx, input }) => {
            assertRead(ctx.session?.user?.role);
            const { client, oscu } = await getEtimsContext();
            try {
                const result = await client.selectBhfList(oscu, input.lastReqDt);
                return { success: true, data: result };
            } catch (e: unknown) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: (e as Error).message || "Failed to retrieve branch list" });
            }
        }),

    /**
     * Register or update a customer record for a branch.
     * POST /saveBhfCustomer
     */
    saveCustomer: protectedProcedure
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
                const result = await client.saveBhfCustomer(oscu, input.customer as Record<string, unknown>);
                const body = result as { resultCd?: string; resultMsg?: string };
                if (body?.resultCd && body.resultCd !== "000") {
                    return { success: false, data: null, errorMessage: body.resultMsg ?? "Failed to save branch customer" };
                }
                return { success: true, data: result };
            } catch (e: unknown) {
                const msg = (e as Error).message;
                console.warn("[eTIMS] saveCustomer failed:", msg);
                return { success: false, data: null, errorMessage: msg || "Failed to save branch customer" };
            }
        }),

    /**
     * Create or update a branch user account.
     * POST /saveBhfUser
     */
    saveBranchUser: protectedProcedure
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
                const result = await client.saveBhfUser(oscu, input.user as Record<string, unknown>);
                return { success: true, data: result };
            } catch (e: unknown) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: (e as Error).message || "Failed to save branch user" });
            }
        }),
});
