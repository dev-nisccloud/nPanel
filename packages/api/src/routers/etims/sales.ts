import * as crypto from "node:crypto";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { router } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@npanel/db";
import { eTimsPartialOrder } from "@npanel/db/schema/etims";
import { getEtimsContext, saveTrnsSalesOnKra } from "../../lib/etims-config";
import { etimsProcedure, skipEtimsAuthChecks } from "./_procedure";

const isAgencyUser = (r: string | null | undefined) =>
    ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(r ?? "");
const isSuperAdmin = (r: string | null | undefined) => r === "AGENCY_SUPER_ADMIN";

function assertRead(role: string | null | undefined) {
    if (skipEtimsAuthChecks()) return;
    if (!isAgencyUser(role)) throw new TRPCError({ code: "FORBIDDEN", message: "Only agency users can access eTIMS sales data." });
}
function assertWrite(role: string | null | undefined) {
    if (skipEtimsAuthChecks()) return;
    if (!isSuperAdmin(role)) throw new TRPCError({ code: "FORBIDDEN", message: "Only agency super admins can submit eTIMS sales." });
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

function roundKra2(n: unknown) {
    return Math.round((Number(n) || 0) * 100) / 100;
}

/** KRA NUMBER(18,2) rejects float leftovers such as 862.0689655172414. */
function roundTransactionMoney(transaction: Record<string, unknown>) {
    const moneyKeys = [
        "taxblAmtA", "taxblAmtB", "taxblAmtC", "taxblAmtD", "taxblAmtE",
        "taxAmtA", "taxAmtB", "taxAmtC", "taxAmtD", "taxAmtE",
        "totTaxblAmt", "totTaxAmt", "totAmt",
    ] as const;
    const out: Record<string, unknown> = { ...transaction };
    for (const key of moneyKeys) {
        if (key in out) out[key] = roundKra2(out[key]);
    }
    if (Array.isArray(out.itemList)) {
        out.itemList = (out.itemList as Record<string, unknown>[]).map((line) => {
            const next = { ...line };
            for (const key of ["prc", "splyAmt", "dcRt", "dcAmt", "taxblAmt", "taxAmt", "totAmt", "qty", "pkg"]) {
                if (key in next) next[key] = roundKra2(next[key]);
            }
            return next;
        });
    }
    return out;
}

/** Gava: orgInvcNo must be 0 on every sale (rcptTyCd=S), including copies. Only credit notes keep the original. */
function withKraOrgInvcNo(transaction: Record<string, unknown>): Record<string, unknown> {
    const rcpt = String(transaction.rcptTyCd ?? "S").trim().toUpperCase();
    if (rcpt === "R") return transaction;
    return { ...transaction, orgInvcNo: 0 };
}

/** Credit notes use the same KRA endpoint with rcptTyCd=R and orgInvcNo set. */
const creditNoteTransactionSchema = salesTransactionSchema.extend({
    rcptTyCd: z.literal("R"),
    orgInvcNo: z.number().int().min(1, "Original invoice number is required"),
    rfdDt: z.string().regex(/^\d{14}$/),
    rfdRsnCd: z.enum(["01", "02", "03", "04", "05", "06"]),
});

const copyReceiptTransactionSchema = salesTransactionSchema.extend({
    salesTyCd: z.literal("C"),
    stockRlsDt: z.null().optional(),
});

const partialLineSchema = z.object({
    itemCd: z.string().min(1).max(20),
    itemNm: z.string().min(1).max(200),
    itemClsCd: z.string().max(10).nullable().optional(),
    pkgUnitCd: z.string().max(5).nullable().optional(),
    qtyUnitCd: z.string().max(5).nullable().optional(),
    taxTyCd: z.string().max(5).nullable().optional(),
    inclusivePrc: z.number(),
    dcRt: z.number().optional(),
    orderedQty: z.number().positive(),
    invoicedQty: z.number().min(0),
});

function qtyNum(value: string | number | null | undefined) {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
}

export const etimsSalesRouter = router({
    /**
     * Submit a sales transaction to KRA and generate a tax invoice.
     * POST /saveTrnsSalesOsdc
     */
    sendSalesTransaction: etimsProcedure
        .input(z.object({ transaction: salesTransactionSchema }))
        .mutation(async ({ ctx, input }) => {
            assertWrite(ctx.session?.user?.role);
            const { client, oscu, isSandbox } = await getEtimsContext();
            try {
                const result = await saveTrnsSalesOnKra(
                    client,
                    oscu,
                    isSandbox,
                    withKraOrgInvcNo(roundTransactionMoney(input.transaction as Record<string, unknown>)),
                );
                return { success: true, data: result };
            } catch (e: unknown) {
                const msg = (e as Error).message ?? "";
                console.warn("[eTIMS] sendSalesTransaction failed:", msg);
                return { success: false, data: null, errorMessage: msg || "Failed to send sales transaction" };
            }
        }),

    /**
     * Issue a credit note against a prior sale.
     * POST /saveTrnsSalesOsdc (rcptTyCd=R, orgInvcNo=original invoice)
     */
    sendCreditNote: etimsProcedure
        .input(z.object({ transaction: creditNoteTransactionSchema }))
        .mutation(async ({ ctx, input }) => {
            assertWrite(ctx.session?.user?.role);
            const { client, oscu, isSandbox } = await getEtimsContext();
            try {
                const result = await saveTrnsSalesOnKra(
                    client,
                    oscu,
                    isSandbox,
                    roundTransactionMoney(input.transaction as Record<string, unknown>),
                );
                const body = result as { resultCd?: string; resultMsg?: string };
                if (body?.resultCd && body.resultCd !== "000") {
                    return { success: false, data: null, errorMessage: body.resultMsg ?? "Failed to send credit note" };
                }
                return { success: true, data: result };
            } catch (e: unknown) {
                const msg = (e as Error).message ?? "";
                console.warn("[eTIMS] sendCreditNote failed:", msg);
                return { success: false, data: null, errorMessage: msg || "Failed to send credit note" };
            }
        }),

    /**
     * POST /selectTrnsSalesList
     */
    getSalesTransactions: etimsProcedure
        .input(z.object({ lastReqDt: z.string().regex(/^\d{14}$/) }))
        .query(async ({ ctx, input }) => {
            assertRead(ctx.session?.user?.role);
            const { client, oscu } = await getEtimsContext();
            try {
                const result = await client.selectTrnsSalesList(oscu, input.lastReqDt);
                return { success: true, data: result };
            } catch (e: unknown) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: (e as Error).message || "Failed to retrieve sales transactions" });
            }
        }),

    /** POST /selectInvoiceDetails */
    getInvoiceDetails: etimsProcedure
        .input(z.object({ invcNo: z.number().int().min(0) }))
        .query(async ({ ctx, input }) => {
            assertRead(ctx.session?.user?.role);
            const { client, oscu } = await getEtimsContext();
            try {
                const result = await client.selectInvoiceDetails(oscu, input.invcNo);
                return { success: true, data: result };
            } catch (e: unknown) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: (e as Error).message || "Failed to retrieve invoice details" });
            }
        }),

    /**
     * Reprint as a KRA COPY receipt (CS/CC).
     * POST /saveTrnsSalesOsdc with salesTyCd=C, orgInvcNo=0 for sales copies, no stock release.
     */
    sendCopyReceipt: etimsProcedure
        .input(z.object({ transaction: copyReceiptTransactionSchema }))
        .mutation(async ({ ctx, input }) => {
            assertWrite(ctx.session?.user?.role);
            const { client, oscu, isSandbox } = await getEtimsContext();
            try {
                const result = await saveTrnsSalesOnKra(
                    client,
                    oscu,
                    isSandbox,
                    withKraOrgInvcNo(
                        roundTransactionMoney({
                            ...input.transaction,
                            salesTyCd: "C",
                            stockRlsDt: null,
                        } as Record<string, unknown>),
                    ),
                );
                const body = result as { resultCd?: string; resultMsg?: string };
                if (body?.resultCd && body.resultCd !== "000") {
                    return { success: false, data: null, errorMessage: body.resultMsg ?? "Failed to send copy receipt" };
                }
                return { success: true, data: result };
            } catch (e: unknown) {
                const msg = (e as Error).message ?? "";
                console.warn("[eTIMS] sendCopyReceipt failed:", msg);
                return { success: false, data: null, errorMessage: msg || "Failed to send copy receipt" };
            }
        }),

    listOpenPartials: etimsProcedure.query(async ({ ctx }) => {
        assertRead(ctx.session?.user?.role);
        const rows = await db.select().from(eTimsPartialOrder);
        const bySeed = new Map<number, { seedInvcNo: number; hasRemaining: boolean }>();
        for (const row of rows) {
            const remaining = Math.max(0, qtyNum(row.orderedQty) - qtyNum(row.invoicedQty));
            const current = bySeed.get(row.seedInvcNo) ?? { seedInvcNo: row.seedInvcNo, hasRemaining: false };
            current.hasRemaining = current.hasRemaining || remaining > 0;
            bySeed.set(row.seedInvcNo, current);
        }
        return { seeds: [...bySeed.values()].filter((row) => row.hasRemaining) };
    }),

    getPartialRemaining: etimsProcedure
        .input(z.object({ seedInvcNo: z.number().int().min(1) }))
        .query(async ({ ctx, input }) => {
            assertRead(ctx.session?.user?.role);
            const rows = await db
                .select()
                .from(eTimsPartialOrder)
                .where(eq(eTimsPartialOrder.seedInvcNo, input.seedInvcNo));
            const lines = rows.map((row) => {
                const orderedQty = qtyNum(row.orderedQty);
                const invoicedQty = qtyNum(row.invoicedQty);
                return {
                    ...row,
                    orderedQty,
                    invoicedQty,
                    remainingQty: Math.max(0, Math.round((orderedQty - invoicedQty) * 100) / 100),
                    inclusivePrc: qtyNum(row.inclusivePrc),
                    dcRt: qtyNum(row.dcRt),
                };
            });
            return {
                seedInvcNo: input.seedInvcNo,
                trdInvcNo: rows[0]?.trdInvcNo ?? null,
                custTin: rows[0]?.custTin ?? null,
                custNm: rows[0]?.custNm ?? null,
                pmtTyCd: rows[0]?.pmtTyCd ?? null,
                lines,
                hasRemaining: lines.some((line) => line.remainingQty > 0),
            };
        }),

    savePartialOrder: etimsProcedure
        .input(z.object({
            seedInvcNo: z.number().int().min(1),
            trdInvcNo: z.string().max(50).nullable().optional(),
            custTin: z.string().nullable().optional(),
            custNm: z.string().nullable().optional(),
            pmtTyCd: z.string().nullable().optional(),
            lines: z.array(partialLineSchema).min(1),
        }))
        .mutation(async ({ ctx, input }) => {
            assertWrite(ctx.session?.user?.role);
            const now = new Date();
            for (const line of input.lines) {
                const existing = await db
                    .select()
                    .from(eTimsPartialOrder)
                    .where(eq(eTimsPartialOrder.seedInvcNo, input.seedInvcNo));
                const match = existing.find((row) => row.itemCd === line.itemCd);
                if (match) {
                    await db
                        .update(eTimsPartialOrder)
                        .set({
                            itemNm: line.itemNm,
                            itemClsCd: line.itemClsCd ?? match.itemClsCd,
                            pkgUnitCd: line.pkgUnitCd ?? match.pkgUnitCd,
                            qtyUnitCd: line.qtyUnitCd ?? match.qtyUnitCd,
                            taxTyCd: line.taxTyCd ?? match.taxTyCd,
                            inclusivePrc: String(line.inclusivePrc),
                            dcRt: String(line.dcRt ?? 0),
                            orderedQty: String(line.orderedQty),
                            invoicedQty: String(line.invoicedQty),
                            trdInvcNo: input.trdInvcNo ?? match.trdInvcNo,
                            custTin: input.custTin ?? match.custTin,
                            custNm: input.custNm ?? match.custNm,
                            pmtTyCd: input.pmtTyCd ?? match.pmtTyCd,
                            updatedAt: now,
                        })
                        .where(eq(eTimsPartialOrder.id, match.id));
                    continue;
                }
                await db.insert(eTimsPartialOrder).values({
                    id: crypto.randomUUID(),
                    seedInvcNo: input.seedInvcNo,
                    trdInvcNo: input.trdInvcNo ?? null,
                    itemCd: line.itemCd,
                    itemNm: line.itemNm,
                    itemClsCd: line.itemClsCd ?? null,
                    pkgUnitCd: line.pkgUnitCd ?? null,
                    qtyUnitCd: line.qtyUnitCd ?? null,
                    taxTyCd: line.taxTyCd ?? null,
                    inclusivePrc: String(line.inclusivePrc),
                    dcRt: String(line.dcRt ?? 0),
                    orderedQty: String(line.orderedQty),
                    invoicedQty: String(line.invoicedQty),
                    custTin: input.custTin ?? null,
                    custNm: input.custNm ?? null,
                    pmtTyCd: input.pmtTyCd ?? null,
                    createdAt: now,
                    updatedAt: now,
                });
            }
            return { success: true };
        }),

    applyPartialInvoice: etimsProcedure
        .input(z.object({
            seedInvcNo: z.number().int().min(1),
            lines: z.array(z.object({
                itemCd: z.string().min(1),
                invoicedQty: z.number().positive(),
            })).min(1),
        }))
        .mutation(async ({ ctx, input }) => {
            assertWrite(ctx.session?.user?.role);
            const rows = await db
                .select()
                .from(eTimsPartialOrder)
                .where(eq(eTimsPartialOrder.seedInvcNo, input.seedInvcNo));
            for (const line of input.lines) {
                const match = rows.find((row) => row.itemCd === line.itemCd);
                if (!match) continue;
                const nextQty = Math.round((qtyNum(match.invoicedQty) + line.invoicedQty) * 100) / 100;
                await db
                    .update(eTimsPartialOrder)
                    .set({ invoicedQty: String(nextQty), updatedAt: new Date() })
                    .where(eq(eTimsPartialOrder.id, match.id));
            }
            return { success: true };
        }),
});
