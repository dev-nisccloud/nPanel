import { z } from "zod";
import { router, protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { getEtimsContext } from "../../lib/etims-config";

const isAgencyUser = (r: string | null | undefined) =>
    ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(r ?? "");
const isSuperAdmin = (r: string | null | undefined) => r === "AGENCY_SUPER_ADMIN";

function assertRead(role: string | null | undefined) {
    if (!isAgencyUser(role)) throw new TRPCError({ code: "FORBIDDEN", message: "Only agency users can access eTIMS purchase data." });
}
function assertWrite(role: string | null | undefined) {
    if (!isSuperAdmin(role)) throw new TRPCError({ code: "FORBIDDEN", message: "Only agency super admins can submit eTIMS purchases." });
}

const purchaseItemSchema = z.object({
    itemSeq: z.number().int().min(1),
    itemCd: z.string().max(20),
    itemClsCd: z.string().max(10),
    itemNm: z.string().max(200),
    bcd: z.string().max(20).nullable().optional(),
    spplrItemClsCd: z.string().max(10).nullable().optional(),
    spplrItemCd: z.string().max(20).nullable().optional(),
    spplrItemNm: z.string().max(200).nullable().optional(),
    pkgUnitCd: z.string().max(5),
    pkg: z.number(),
    qtyUnitCd: z.string().max(5),
    qty: z.number(),
    prc: z.number(),
    splyAmt: z.number(),
    dcRt: z.number(),
    dcAmt: z.number(),
    taxblAmt: z.number(),
    taxTyCd: z.string().max(5),
    taxAmt: z.number(),
    totAmt: z.number(),
    itemExprDt: z.string().nullable().optional(),
});

const purchaseSchema = z.object({
    spplrTin: z.string().nullable().optional(),
    invcNo: z.number().int().min(0),
    orgInvcNo: z.number().int().min(0),
    spplrBhfId: z.string().nullable().optional(),
    spplrNm: z.string().max(60).nullable().optional(),
    spplrInvcNo: z.number().nullable().optional(),
    regTyCd: z.string().max(5),
    pchsTyCd: z.string().max(5),
    rcptTyCd: z.string().max(5),
    pmtTyCd: z.string().max(5),
    pchsSttsCd: z.string().max(5),
    cfmDt: z.string().nullable().optional(),
    pchsDt: z.string().nullable().optional(),
    wrhsDt: z.string().nullable().optional(),
    cnclReqDt: z.string().nullable().optional(),
    cnclDt: z.string().nullable().optional(),
    rfdDt: z.string().nullable().optional(),
    totItemCnt: z.number().int().min(0),
    taxblAmtA: z.number(), taxblAmtB: z.number(), taxblAmtC: z.number(), taxblAmtD: z.number(), taxblAmtE: z.number(),
    taxRtA: z.number(), taxRtB: z.number(), taxRtC: z.number(), taxRtD: z.number(), taxRtE: z.number(),
    taxAmtA: z.number(), taxAmtB: z.number(), taxAmtC: z.number(), taxAmtD: z.number(), taxAmtE: z.number(),
    totTaxblAmt: z.number(),
    totTaxAmt: z.number(),
    totAmt: z.number(),
    remark: z.string().max(400).nullable().optional(),
    regrId: z.string().max(20),
    regrNm: z.string().max(60),
    modrId: z.string().max(20),
    modrNm: z.string().max(60),
    itemList: z.array(purchaseItemSchema).min(1),
});

export const etimsPurchasesRouter = router({
    /**
     * Retrieve inbound purchase invoices from KRA (supplier sales registered against our PIN).
     * POST /selectTrnsPurchaseSalesList
     *
     * Verified on KRA sandbox: this is the only valid list endpoint for purchases.
     * resultCd "001" means no supplier invoices exist yet  not an API/endpoint error.
     */
    getPurchaseTransactions: protectedProcedure
        .input(z.object({ lastReqDt: z.string().regex(/^\d{14}$/) }))
        .query(async ({ ctx, input }) => {
            assertRead(ctx.session?.user?.role);
            const { client, oscu } = await getEtimsContext();
            try {
                const result = await client.selectTrnsPurchaseSalesList(oscu, input.lastReqDt);
                return { success: true, data: result };
            } catch (e: unknown) {
                const msg = (e as Error).message;
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg || "Failed to retrieve purchase transactions" });
            }
        }),

    /**
     * Submit a purchase transaction to KRA.
     * POST /insertTrnsPurchase
     */
    sendPurchaseTransaction: protectedProcedure
        .input(z.object({ purchase: purchaseSchema }))
        .mutation(async ({ ctx, input }) => {
            assertWrite(ctx.session?.user?.role);
            const { client, oscu } = await getEtimsContext();
            try {
                const result = await client.insertTrnsPurchase(oscu, input.purchase as Record<string, unknown>);
                return { success: true, data: result };
            } catch (e: unknown) {
                const msg = (e as Error).message;
                console.warn("[eTIMS] sendPurchaseTransaction failed:", msg);
                return { success: false, data: null, errorMessage: msg || "Failed to send purchase transaction" };
            }
        }),
});
