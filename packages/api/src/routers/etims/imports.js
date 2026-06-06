import { z } from "zod";
import { router, protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { getEtimsContext } from "../../lib/etims-config";
const isAgencyUser = (r) => ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(r ?? "");
const isSuperAdmin = (r) => r === "AGENCY_SUPER_ADMIN";
function assertRead(role) {
    if (!isAgencyUser(role))
        throw new TRPCError({ code: "FORBIDDEN", message: "Only agency users can access eTIMS imports data." });
}
function assertWrite(role) {
    if (!isSuperAdmin(role))
        throw new TRPCError({ code: "FORBIDDEN", message: "Only agency super admins can update eTIMS imported items." });
}
export const etimsImportsRouter = router({
    /**
     * Retrieve imported items from KRA customs system.
     * POST /selectImportItemList
     */
    getImportedItems: protectedProcedure
        .input(z.object({ lastReqDt: z.string().regex(/^\d{14}$/) }))
        .query(async ({ ctx, input }) => {
        assertRead(ctx.session?.user?.role);
        const { client, oscu } = await getEtimsContext();
        try {
            const result = await client.selectImportItemList(oscu, input.lastReqDt);
            return { success: true, data: result };
        }
        catch (e) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: e.message || "Failed to retrieve imported items" });
        }
    }),
    /**
     * Confirm an imported item and map it to a local item code.
     * POST /updateImportItem
     */
    confirmImportedItem: protectedProcedure
        .input(z.object({
        item: z.object({
            taskCd: z.string(),
            dclDe: z.string().min(8).max(14),
            itemSeq: z.number().int().min(1),
            hsCd: z.string().max(17),
            itemClsCd: z.string().max(10),
            itemCd: z.string().max(20),
            imptItemSttsCd: z.string(),
            modrId: z.string().max(20),
            modrNm: z.string().max(60),
            remark: z.string().nullable().optional(),
        }),
    }))
        .mutation(async ({ ctx, input }) => {
        assertWrite(ctx.session?.user?.role);
        const { client, oscu } = await getEtimsContext();
        try {
            const result = await client.updateImportItem(oscu, input.item);
            return { success: true, data: result };
        }
        catch (e) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: e.message || "Failed to confirm imported item" });
        }
    }),
});
