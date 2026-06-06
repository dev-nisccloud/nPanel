import { z } from "zod";
import { router, protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { getEtimsContext } from "../../lib/etims-config";
const isAgencyUser = (r) => ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(r ?? "");
const isSuperAdmin = (r) => r === "AGENCY_SUPER_ADMIN";
function assertRead(role) {
    if (!isAgencyUser(role))
        throw new TRPCError({ code: "FORBIDDEN", message: "Only agency users can access eTIMS stock data." });
}
function assertWrite(role) {
    if (!isSuperAdmin(role))
        throw new TRPCError({ code: "FORBIDDEN", message: "Only agency super admins can modify eTIMS stock data." });
}
const stockItemSchema = z.object({
    itemSeq: z.number().int().min(1),
    itemCd: z.string().max(20),
    itemClsCd: z.string().max(10),
    itemNm: z.string().max(200),
    bcd: z.string().nullable().optional(),
    pkgUnitCd: z.string().max(5),
    pkg: z.number(),
    qtyUnitCd: z.string().max(5),
    qty: z.number(),
    itemExprDt: z.string().nullable().optional(),
    prc: z.number(),
    splyAmt: z.number(),
    totDcAmt: z.number(),
    taxblAmt: z.number(),
    taxTyCd: z.string().max(5),
    taxAmt: z.number(),
    totAmt: z.number(),
});
const stockIOSchema = z.object({
    sarNo: z.number().int().min(0),
    orgSarNo: z.number().int().min(0),
    regTyCd: z.string().max(5),
    custTin: z.string().nullable().optional(),
    custNm: z.string().max(100).nullable().optional(),
    custBhfId: z.string().nullable().optional(),
    sarTyCd: z.string().max(5),
    ocrnDt: z.string().length(8),
    totItemCnt: z.number().int().min(0),
    totTaxblAmt: z.number(),
    totTaxAmt: z.number(),
    totAmt: z.number(),
    remark: z.string().max(400).nullable().optional(),
    regrId: z.string().max(20),
    regrNm: z.string().max(60),
    modrId: z.string().max(20),
    modrNm: z.string().max(60),
    itemList: z.array(stockItemSchema).min(1),
});
export const etimsStockRouter = router({
    /**
     * Retrieve stock movement history.
     * POST /selectStockMoveList
     */
    getStockMovements: protectedProcedure
        .input(z.object({ lastReqDt: z.string().regex(/^\d{14}$/) }))
        .query(async ({ ctx, input }) => {
        assertRead(ctx.session?.user?.role);
        const { client, oscu } = await getEtimsContext();
        try {
            const result = await client.selectStockMoveList(oscu, input.lastReqDt);
            return { success: true, data: result };
        }
        catch (e) {
            const msg = e.message;
            console.warn("[eTIMS] getStockMovements failed:", msg);
            return { success: false, data: null, errorMessage: msg || "Failed to retrieve stock movements" };
        }
    }),
    /**
     * Record stock in/out transaction.
     * POST /insertStockIO
     */
    sendStockIO: protectedProcedure
        .input(z.object({ stockData: stockIOSchema }))
        .mutation(async ({ ctx, input }) => {
        assertWrite(ctx.session?.user?.role);
        const { client, oscu } = await getEtimsContext();
        try {
            const result = await client.insertStockIO(oscu, input.stockData);
            return { success: true, data: result };
        }
        catch (e) {
            const msg = e.message;
            console.warn("[eTIMS] sendStockIO failed:", msg);
            return { success: false, data: null, errorMessage: msg || "Failed to send stock IO" };
        }
    }),
    /**
     * Update the stock master record with current on-hand quantity.
     * POST /saveStockMaster
     */
    saveStockMaster: protectedProcedure
        .input(z.object({
        stockMaster: z.object({
            itemCd: z.string().max(20),
            rsdQty: z.number().min(0),
            regrId: z.string().max(20),
            regrNm: z.string().max(60),
            modrId: z.string().max(20),
            modrNm: z.string().max(60),
        }),
    }))
        .mutation(async ({ ctx, input }) => {
        assertWrite(ctx.session?.user?.role);
        const { client, oscu } = await getEtimsContext();
        try {
            const result = await client.saveStockMaster(oscu, input.stockMaster);
            return { success: true, data: result };
        }
        catch (e) {
            const msg = e.message;
            console.warn("[eTIMS] saveStockMaster failed:", msg);
            return { success: false, data: null, errorMessage: msg || "Failed to save stock master" };
        }
    }),
});
