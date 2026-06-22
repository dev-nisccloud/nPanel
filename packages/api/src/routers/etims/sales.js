import { z } from "zod";
import { router, protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { getEtimsContext } from "../../lib/etims-config";
const isAgencyUser = (r) => ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(r ?? "");
const isSuperAdmin = (r) => r === "AGENCY_SUPER_ADMIN";
function assertRead(role) {
    if (!isAgencyUser(role))
        throw new TRPCError({ code: "FORBIDDEN", message: "Only agency users can access eTIMS sales data." });
}
function assertWrite(role) {
    if (!isSuperAdmin(role))
        throw new TRPCError({ code: "FORBIDDEN", message: "Only agency super admins can submit eTIMS sales." });
}
// ── Zod schema matching KRA saveTrnsSalesOsdc spec ──────────────────────────
const salesItemSchema = z.object({
    itemSeq: z.number().int().min(1),
    itemCd: z.string().max(20),
    itemClsCd: z.string().max(10).nullable().optional(),
    itemNm: z.string().max(200),
    bcd: z.string().max(20).nullable().optional(),
    pkgUnitCd: z.string().max(5),
    pkg: z.number(),
    qtyUnitCd: z.string().max(5),
    qty: z.number(),
    prc: z.number(),
    splyAmt: z.number(),
    dcRt: z.number(),
    dcAmt: z.number(),
    isrccCd: z.string().max(10).nullable().optional(),
    isrccNm: z.string().max(100).nullable().optional(),
    isrcRt: z.number().nullable().optional(),
    isrcAmt: z.number().nullable().optional(),
    taxTyCd: z.enum(["A", "B", "C", "D", "E"]),
    taxblAmt: z.number(),
    taxAmt: z.number(),
    totAmt: z.number(),
});
const salesTransactionSchema = z.object({
    trdInvcNo: z.union([z.string().max(50), z.number()]),
    invcNo: z.number().int().min(0),
    orgInvcNo: z.number().int().min(0),
    custTin: z.string().nullable().optional(),
    custNm: z.string().max(60).nullable().optional(),
    salesTyCd: z.string().max(5),
    rcptTyCd: z.string().max(5),
    pmtTyCd: z.string().max(5).nullable().optional(),
    salesSttsCd: z.string().max(5),
    cfmDt: z.string().regex(/^\d{14}$/),
    salesDt: z.string().regex(/^\d{8}$/),
    stockRlsDt: z.string().nullable().optional(),
    cnclReqDt: z.string().nullable().optional(),
    cnclDt: z.string().nullable().optional(),
    rfdDt: z.string().nullable().optional(),
    rfdRsnCd: z.string().max(5).nullable().optional(),
    totItemCnt: z.number().int().min(1),
    taxblAmtA: z.number(), taxblAmtB: z.number(), taxblAmtC: z.number(), taxblAmtD: z.number(), taxblAmtE: z.number(),
    taxRtA: z.number(), taxRtB: z.number(), taxRtC: z.number(), taxRtD: z.number(), taxRtE: z.number(),
    taxAmtA: z.number(), taxAmtB: z.number(), taxAmtC: z.number(), taxAmtD: z.number(), taxAmtE: z.number(),
    totTaxblAmt: z.number(),
    totTaxAmt: z.number(),
    totAmt: z.number(),
    prchrAcptcYn: z.enum(["Y", "N"]),
    remark: z.string().max(400).nullable().optional(),
    regrId: z.string().max(20),
    regrNm: z.string().max(60),
    modrId: z.string().max(20),
    modrNm: z.string().max(60),
    receipt: z.object({
        custTin: z.string().nullable().optional(),
        custMblNo: z.string().max(20).nullable().optional(),
        rcptPbctDt: z.string().regex(/^\d{14}$/),
        trdeNm: z.string().max(20).nullable().optional(),
        adrs: z.string().max(200).nullable().optional(),
        topMsg: z.string().max(20).nullable().optional(),
        btmMsg: z.string().max(20).nullable().optional(),
        prchrAcptcYn: z.enum(["Y", "N"]),
    }),
    itemList: z.array(salesItemSchema).min(1),
});
/** Credit notes use the same KRA endpoint with rcptTyCd=R and orgInvcNo set. */
const creditNoteTransactionSchema = salesTransactionSchema.extend({
    rcptTyCd: z.literal("R"),
    orgInvcNo: z.number().int().min(1, "Original invoice number is required"),
    rfdDt: z.string().regex(/^\d{14}$/),
    rfdRsnCd: z.enum(["01", "02", "03", "04", "05", "06"]),
});
export const etimsSalesRouter = router({
    /**
     * Submit a sales transaction to KRA and generate a tax invoice.
     * POST /saveTrnsSalesOsdc
     */
    sendSalesTransaction: protectedProcedure
        .input(z.object({ transaction: salesTransactionSchema }))
        .mutation(async ({ ctx, input }) => {
        assertWrite(ctx.session?.user?.role);
        const { client, oscu } = await getEtimsContext();
        try {
            const result = await client.saveTrnsSalesOsdc(oscu, input.transaction);
            return { success: true, data: result };
        }
        catch (e) {
            const msg = e.message ?? "";
            console.warn("[eTIMS] sendSalesTransaction failed:", msg);
            return { success: false, data: null, errorMessage: msg || "Failed to send sales transaction" };
        }
    }),
    /**
     * Issue a credit note against a prior sale.
     * POST /saveTrnsSalesOsdc (rcptTyCd=R, orgInvcNo=original invoice)
     */
    sendCreditNote: protectedProcedure
        .input(z.object({ transaction: creditNoteTransactionSchema }))
        .mutation(async ({ ctx, input }) => {
        assertWrite(ctx.session?.user?.role);
        const { client, oscu } = await getEtimsContext();
        try {
            const result = await client.saveTrnsSalesOsdc(oscu, input.transaction);
            const body = result;
            if (body?.resultCd && body.resultCd !== "000") {
                return { success: false, data: null, errorMessage: body.resultMsg ?? "Failed to send credit note" };
            }
            return { success: true, data: result };
        }
        catch (e) {
            const msg = e.message ?? "";
            console.warn("[eTIMS] sendCreditNote failed:", msg);
            return { success: false, data: null, errorMessage: msg || "Failed to send credit note" };
        }
    }),
    /**
     * POST /selectTrnsSalesList
     */
    getSalesTransactions: protectedProcedure
        .input(z.object({ lastReqDt: z.string().regex(/^\d{14}$/) }))
        .query(async ({ ctx, input }) => {
        assertRead(ctx.session?.user?.role);
        const { client, oscu } = await getEtimsContext();
        try {
            const result = await client.selectTrnsSalesList(oscu, input.lastReqDt);
            return { success: true, data: result };
        }
        catch (e) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: e.message || "Failed to retrieve sales transactions" });
        }
    }),
});
