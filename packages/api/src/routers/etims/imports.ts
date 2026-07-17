import { z } from "zod";
import { router } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { getEtimsContext } from "../../lib/etims-config";
import { etimsProcedure, skipEtimsAuthChecks } from "./_procedure";

const isAgencyUser = (r: string | null | undefined) =>
    ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(r ?? "");
const isSuperAdmin = (r: string | null | undefined) => r === "AGENCY_SUPER_ADMIN";

function assertRead(role: string | null | undefined) {
    if (skipEtimsAuthChecks()) return;
    if (!isAgencyUser(role)) throw new TRPCError({ code: "FORBIDDEN", message: "Only agency users can access eTIMS imports data." });
}
function assertWrite(role: string | null | undefined) {
    if (skipEtimsAuthChecks()) return;
    if (!isSuperAdmin(role)) throw new TRPCError({ code: "FORBIDDEN", message: "Only agency super admins can update eTIMS imported items." });
}

export const etimsImportsRouter = router({
    /**
     * Retrieve imported items from KRA customs system.
     * POST /selectImportItemList
     */
    getImportedItems: etimsProcedure
        .input(z.object({ lastReqDt: z.string().regex(/^\d{14}$/) }))
        .query(async ({ ctx, input }) => {
            assertRead(ctx.session?.user?.role);
            const { client, oscu } = await getEtimsContext();
            try {
                const result = await client.selectImportItemList(oscu, input.lastReqDt);
                return { success: true, data: result };
            } catch (e: unknown) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: (e as Error).message || "Failed to retrieve imported items" });
            }
        }),

    /**
     * Confirm an imported item and map it to a local item code.
     * POST /updateImportItem
     */
    confirmImportedItem: etimsProcedure
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
                const result = await client.updateImportItem(oscu, input.item as Record<string, unknown>);
                return { success: true, data: result };
            } catch (e: unknown) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: (e as Error).message || "Failed to confirm imported item" });
            }
        }),
});
