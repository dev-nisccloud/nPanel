import * as crypto from "node:crypto";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { router } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@npanel/db";
import { eTimsItem, eTimsStockMovement } from "@npanel/db/schema/etims";
import { createClassicOscuClient, getEtimsContext, withClassicOscuFallback } from "../../lib/etims-config";
import type { EtimsOscuClient, EtimsOscuHeaders } from "../../lib/etims-client";
import { etimsProcedure, skipEtimsAuthChecks } from "./_procedure";

const isAgencyUser = (r: string | null | undefined) =>
    ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(r ?? "");
const isSuperAdmin = (r: string | null | undefined) => r === "AGENCY_SUPER_ADMIN";

function assertRead(role: string | null | undefined) {
    if (skipEtimsAuthChecks()) return;
    if (!isAgencyUser(role)) throw new TRPCError({ code: "FORBIDDEN", message: "Only agency users can access eTIMS stock data." });
}
function assertWrite(role: string | null | undefined) {
    if (skipEtimsAuthChecks()) return;
    if (!isSuperAdmin(role)) throw new TRPCError({ code: "FORBIDDEN", message: "Only agency super admins can modify eTIMS stock data." });
}

const stockItemSchema = z.object({
    itemSeq: z.number().int().min(1),
    itemCd: z.string().max(20),
    itemClsCd: z.string().max(20),
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

type StockIoInput = z.infer<typeof stockIOSchema>;
type StockIoLine = z.infer<typeof stockItemSchema>;

type SavedItem = {
    itemCd: string;
    itemClsCd: string;
    itemNm: string;
    pkgUnitCd: string;
    qtyUnitCd: string;
    taxTyCd: string;
    itemTyCd: string | null;
    dftPrc: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
}

function nairobiYmd(d = new Date()): string {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Nairobi",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(d);
    const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
    return `${pick("year")}${pick("month")}${pick("day")}`;
}

function parseExpectedCounter(message: string): number | null {
    const m =
        message.match(/Expected:\s*(\d+)\s+but\s+found/i) ??
        message.match(/expected:\s*(\d+)\s+but\s+found/i);
    return m ? Number(m[1]) : null;
}

function errMsg(e: unknown): string {
    return e instanceof Error ? e.message : String(e);
}

function isPlaceholderCls(cd: string): boolean {
    return !/^\d{8,10}$/.test(cd.trim()) || /PUT_|HERE|CLS_/i.test(cd);
}

function extractItemList(result: unknown): Record<string, unknown>[] {
    const root = asRecord(result);
    const data = asRecord(root?.data) ?? root;
    const list = data?.itemList;
    if (!Array.isArray(list)) return [];
    return list.filter((row): row is Record<string, unknown> => !!asRecord(row));
}

function rowToSavedItem(row: Record<string, unknown>): SavedItem | null {
    const itemCd = String(row.itemCd ?? "").trim();
    if (!itemCd) return null;
    const dftPrc = Number(row.dftPrc ?? row.unitPrice ?? 0);
    return {
        itemCd,
        itemClsCd: String(row.itemClsCd ?? "").trim(),
        itemNm: String(row.itemNm ?? "").trim(),
        pkgUnitCd: String(row.pkgUnitCd ?? row.packagingUnit ?? "NT").trim() || "NT",
        qtyUnitCd: String(row.qtyUnitCd ?? row.quantityUnit ?? "BA").trim() || "BA",
        taxTyCd: String(row.taxTyCd ?? "B").trim() || "B",
        itemTyCd: row.itemTyCd != null ? String(row.itemTyCd) : null,
        dftPrc: Number.isFinite(dftPrc) ? dftPrc : 0,
    };
}

async function mergeItemList(result: unknown, byCd: Map<string, SavedItem>) {
    for (const row of extractItemList(result)) {
        const mapped = rowToSavedItem(row);
        if (!mapped) continue;
        const prev = byCd.get(mapped.itemCd);
        byCd.set(mapped.itemCd, {
            ...prev,
            ...mapped,
            itemTyCd: mapped.itemTyCd ?? prev?.itemTyCd ?? null,
        });
    }
}

async function lookupSavedItems(
    client: EtimsOscuClient,
    oscu: EtimsOscuHeaders,
    isSandbox: boolean,
): Promise<Map<string, SavedItem>> {
    const byCd = new Map<string, SavedItem>();

    try {
        const local = await db.select().from(eTimsItem);
        for (const row of local) {
            const mapped = rowToSavedItem({
                itemCd: row.itemCd,
                itemClsCd: row.itemClsCd,
                itemNm: row.itemNm,
                pkgUnitCd: row.pkgUnitCd,
                qtyUnitCd: row.quantityUnit,
                taxTyCd: row.taxTyCd,
                dftPrc: row.unitPrice,
            });
            if (mapped) byCd.set(mapped.itemCd, mapped);
        }
    } catch (e) {
        console.warn("[eTIMS] local item lookup failed:", errMsg(e));
    }

    try {
        await mergeItemList(await client.selectItemList(oscu, "20180101000000"), byCd);
    } catch (e) {
        console.warn("[eTIMS] KRA item list lookup failed:", errMsg(e));
    }

    try {
        await mergeItemList(
            await createClassicOscuClient(isSandbox).selectItemList(oscu, "20180101000000"),
            byCd,
        );
    } catch (e) {
        console.warn("[eTIMS] classic item list lookup failed:", errMsg(e));
    }

    return byCd;
}

function overlayStockLine(line: StockIoLine, saved?: SavedItem): StockIoLine {
    if (!saved) return line;
    return {
        ...line,
        itemClsCd: isPlaceholderCls(line.itemClsCd) && saved.itemClsCd ? saved.itemClsCd : line.itemClsCd,
        itemNm: saved.itemNm || line.itemNm,
        pkgUnitCd: saved.pkgUnitCd || line.pkgUnitCd,
        qtyUnitCd: saved.qtyUnitCd || line.qtyUnitCd,
        taxTyCd: saved.taxTyCd || line.taxTyCd,
    };
}

function serviceItemError(itemCd: string): string {
    return `Cannot record stock for ${itemCd}: it is a service (itemTyCd 3). Re-save the item as itemTyCd "1" (raw material) or "2" (finished good), then retry stock I/O.`;
}

function taxRate(taxTyCd: string): number {
    if (taxTyCd === "B") return 16;
    if (taxTyCd === "E") return 8;
    return 0;
}

function roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
}

function buildAdjustmentIo(
    item: SavedItem,
    qty: number,
    audit: { regrId: string; regrNm: string; modrId: string; modrNm: string },
    sarNo = 1,
): StockIoInput {
    const unitTaxbl = item.dftPrc > 0 ? item.dftPrc : 0;
    const taxbl = roundMoney(unitTaxbl * qty);
    const tax = roundMoney((taxbl * taxRate(item.taxTyCd)) / 100);
    const tot = roundMoney(taxbl + tax);
    const unitTot = qty > 0 ? roundMoney(tot / qty) : tot;
    return {
        sarNo,
        orgSarNo: 0,
        regTyCd: "M",
        sarTyCd: "06",
        ocrnDt: nairobiYmd(),
        totItemCnt: 1,
        totTaxblAmt: taxbl,
        totTaxAmt: tax,
        totAmt: tot,
        remark: "nPanel stock in (required before stock master)",
        regrId: audit.regrId,
        regrNm: audit.regrNm,
        modrId: audit.modrId,
        modrNm: audit.modrNm,
        itemList: [{
            itemSeq: 1,
            itemCd: item.itemCd,
            itemClsCd: item.itemClsCd,
            itemNm: item.itemNm,
            pkgUnitCd: item.pkgUnitCd,
            pkg: 1,
            qtyUnitCd: item.qtyUnitCd,
            qty,
            prc: unitTot,
            splyAmt: tot,
            totDcAmt: 0,
            taxblAmt: taxbl,
            taxTyCd: item.taxTyCd,
            taxAmt: tax,
            totAmt: tot,
        }],
    };
}

async function recordLocalStockIo(stockData: StockIoInput) {
    const now = new Date();
    if (stockData.itemList.length === 0) return;
    await db.insert(eTimsStockMovement).values(
        stockData.itemList.map((line) => ({
            id: crypto.randomUUID(),
            itemCd: line.itemCd,
            itemNm: line.itemNm,
            sarTyCd: stockData.sarTyCd,
            sarNo: stockData.sarNo,
            qty: String(line.qty),
            ocrnDt: stockData.ocrnDt,
            remark: stockData.remark ?? null,
            createdAt: now,
        })),
    );
}

async function recordLocalStockMaster(itemCd: string, rsdQty: number, line?: StockIoLine) {
    const now = new Date();
    const qty = String(rsdQty);
    const updated = await db.update(eTimsItem)
        .set({ rsdQty: qty, updatedAt: now })
        .where(eq(eTimsItem.itemCd, itemCd))
        .returning({ itemCd: eTimsItem.itemCd });
    if (updated.length || !line) return;
    await db.insert(eTimsItem).values({
        id: crypto.randomUUID(),
        localItemId: null,
        itemCd: line.itemCd,
        itemClsCd: line.itemClsCd,
        itemNm: line.itemNm,
        taxTyCd: line.taxTyCd,
        pkgUnitCd: line.pkgUnitCd,
        quantityUnit: line.qtyUnitCd,
        packagingUnit: line.pkgUnitCd,
        rsdQty: qty,
        createdAt: now,
        updatedAt: now,
    }).onConflictDoUpdate({
        target: eTimsItem.itemCd,
        set: { rsdQty: qty, updatedAt: now },
    });
}

function stockIoSign(sarTyCd: string): 1 | -1 | 0 {
    if (/^0\d$/.test(sarTyCd)) return 1;
    if (/^1\d$/.test(sarTyCd)) return -1;
    return 0;
}

async function currentOnHand(itemCd: string): Promise<number> {
    const [row] = await db
        .select({ rsdQty: eTimsItem.rsdQty })
        .from(eTimsItem)
        .where(eq(eTimsItem.itemCd, itemCd))
        .limit(1);
    const qty = Number(row?.rsdQty ?? 0);
    return Number.isFinite(qty) ? qty : 0;
}

/** After insertStockIO, remaining qty on KRA is still whatever last saveStockMaster sent. */
async function applyMovementToOnHand(
    client: EtimsOscuClient,
    oscu: EtimsOscuHeaders,
    isSandbox: boolean,
    stockData: StockIoInput,
) {
    const sign = stockIoSign(stockData.sarTyCd);
    if (sign === 0) return;
    const totals = new Map<string, { line: StockIoLine; delta: number }>();
    for (const line of stockData.itemList) {
        const qty = Number(line.qty) || 0;
        const prev = totals.get(line.itemCd);
        if (prev) {
            prev.delta = roundMoney(prev.delta + sign * qty);
            continue;
        }
        totals.set(line.itemCd, { line, delta: roundMoney(sign * qty) });
    }
    for (const [itemCd, { line, delta }] of totals) {
        const rsdQty = Math.max(0, roundMoney(await currentOnHand(itemCd) + delta));
        try {
            await recordLocalStockMaster(itemCd, rsdQty, line);
        } catch (persistErr) {
            console.warn("[eTIMS] local on-hand persist failed:", errMsg(persistErr));
        }
        try {
            await withClassicOscuFallback(
                client,
                isSandbox,
                (c) => c.saveStockMaster(oscu, {
                    itemCd,
                    rsdQty,
                    regrId: stockData.regrId,
                    regrNm: stockData.regrNm,
                    modrId: stockData.modrId,
                    modrNm: stockData.modrNm,
                }),
                "saveStockMaster",
            );
        } catch (masterErr) {
            console.warn("[eTIMS] saveStockMaster after movement failed:", errMsg(masterErr));
        }
    }
}

function needsStockIoSeed(message: string) {
    return /stock io is empty/i.test(message)
        || /does not exist in your inventory/i.test(message)
        || /item management package/i.test(message);
}

async function insertStockIoWithRetry(
    client: EtimsOscuClient,
    oscu: EtimsOscuHeaders,
    isSandbox: boolean,
    stockData: StockIoInput,
): Promise<unknown> {
    let body: Record<string, unknown> = {
        ...stockData,
        totItemCnt: stockData.itemList.length,
        ocrnDt: stockData.ocrnDt,
    };
    let triedToday = body.ocrnDt === nairobiYmd();
    let triedOrgSar = body.orgSarNo !== 0;
    let lastMsg = "";

    for (let attempt = 0; attempt < 6; attempt++) {
        try {
            const result = await withClassicOscuFallback(
                client,
                isSandbox,
                (c) => c.insertStockIO(oscu, body),
                "insertStockIO",
            );
            try {
                await recordLocalStockIo(stockData);
            } catch (persistErr) {
                console.warn("[eTIMS] local stock I/O persist failed:", errMsg(persistErr));
            }
            return result;
        } catch (e: unknown) {
            lastMsg = errMsg(e);
            const expected = parseExpectedCounter(lastMsg);
            if (expected != null && expected !== body.sarNo) {
                console.warn(`[eTIMS] insertStockIO sarNo ${String(body.sarNo)} rejected → retrying as ${expected}`);
                body = { ...body, sarNo: expected };
                continue;
            }
            const today = nairobiYmd();
            if (/validation failed|date|ocrnDt/i.test(lastMsg) && !triedToday && body.ocrnDt !== today) {
                console.warn(`[eTIMS] insertStockIO ocrnDt ${String(body.ocrnDt)} rejected → retrying as ${today}`);
                triedToday = true;
                body = { ...body, ocrnDt: today };
                continue;
            }
            if (/validation failed/i.test(lastMsg) && !triedOrgSar && Number(body.orgSarNo) === 0 && Number(body.sarNo) > 0) {
                console.warn(`[eTIMS] insertStockIO orgSarNo 0 rejected → retrying as sarNo ${String(body.sarNo)}`);
                triedOrgSar = true;
                body = { ...body, orgSarNo: body.sarNo };
                continue;
            }
            throw e;
        }
    }
    throw new Error(lastMsg || "Failed to send stock IO");
}

export const etimsStockRouter = router({
    /**
     * Retrieve stock movement history.
     * POST /selectStockMoveList
     */
    getStockMovements: etimsProcedure
        .input(z.object({ lastReqDt: z.string().regex(/^\d{14}$/) }))
        .query(async ({ ctx, input }) => {
            assertRead(ctx.session?.user?.role);
            const { client, oscu, isSandbox } = await getEtimsContext();
            const localMoves = await db.select().from(eTimsStockMovement).orderBy(desc(eTimsStockMovement.createdAt));
            const onHand = await db.select({
                itemCd: eTimsItem.itemCd,
                itemNm: eTimsItem.itemNm,
                rsdQty: eTimsItem.rsdQty,
                updatedAt: eTimsItem.updatedAt,
            }).from(eTimsItem);
            const itemList = localMoves.map((row) => ({
                itemCd: row.itemCd,
                itemNm: row.itemNm,
                sarTyCd: row.sarTyCd,
                sarNo: row.sarNo,
                qty: row.qty,
                ocrnDt: row.ocrnDt,
                remark: row.remark,
                createdAt: row.createdAt.toISOString(),
            }));
            const stockList = onHand
                .filter((row) => row.rsdQty != null && row.rsdQty !== "")
                .map((row) => ({
                    itemCd: row.itemCd,
                    itemNm: row.itemNm,
                    rsdQty: row.rsdQty,
                    updatedAt: row.updatedAt.toISOString(),
                }));
            try {
                const result = await withClassicOscuFallback(
                    client,
                    isSandbox,
                    (c) => c.selectStockMoveList(oscu, input.lastReqDt),
                    "selectStockMoveList",
                );
                return { success: true, data: { itemList, stockList, kra: result } };
            } catch (e: unknown) {
                const msg = errMsg(e);
                console.warn("[eTIMS] getStockMovements KRA list failed:", msg);
                return { success: true, data: { itemList, stockList } };
            }
        }),

    /**
     * Record stock in/out transaction.
     * POST /insertStockIO
     *
     * Must succeed before saveStockMaster. KRA: "Stock IO is empty, consider adding items to the stock IO first."
     */
    sendStockIO: etimsProcedure
        .input(z.object({ stockData: stockIOSchema }))
        .mutation(async ({ ctx, input }) => {
            assertWrite(ctx.session?.user?.role);
            const { client, oscu, isSandbox } = await getEtimsContext();
            try {
                const saved = await lookupSavedItems(client, oscu, isSandbox);
                const itemList = input.stockData.itemList.map((line) => overlayStockLine(line, saved.get(line.itemCd)));
                for (const line of itemList) {
                    const item = saved.get(line.itemCd);
                    if (item?.itemTyCd === "3") {
                        return { success: false, data: null, errorMessage: serviceItemError(line.itemCd) };
                    }
                    if (isPlaceholderCls(line.itemClsCd)) {
                        return {
                            success: false,
                            data: null,
                            errorMessage: `itemClsCd "${line.itemClsCd}" is not a KRA classification code. Copy a 10-digit leaf code from etims.items.getItemList / getItemClassList, save the item, then retry stock I/O.`,
                        };
                    }
                }
                const stockData = { ...input.stockData, itemList };
                const result = await insertStockIoWithRetry(client, oscu, isSandbox, stockData);
                await applyMovementToOnHand(client, oscu, isSandbox, stockData);
                return { success: true, data: result };
            } catch (e: unknown) {
                const msg = errMsg(e);
                console.warn("[eTIMS] sendStockIO failed:", msg);
                return { success: false, data: null, errorMessage: msg || "Failed to send stock IO" };
            }
        }),

    /**
     * Update the stock master record with current on-hand quantity.
     * POST /saveStockMaster
     *
     * KRA requires a stock I/O row first. If master is called first (Gava dashboard order),
     * seed an adjustment-in I/O for that item, then retry master.
     */
    saveStockMaster: etimsProcedure
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
            const { client, oscu, isSandbox } = await getEtimsContext();
            const saveMaster = (c: typeof client) =>
                c.saveStockMaster(oscu, input.stockMaster as Record<string, unknown>);
            try {
                const result = await withClassicOscuFallback(client, isSandbox, saveMaster, "saveStockMaster");
                try {
                    await recordLocalStockMaster(input.stockMaster.itemCd, input.stockMaster.rsdQty);
                } catch (persistErr) {
                    console.warn("[eTIMS] local stock master persist failed:", errMsg(persistErr));
                }
                return { success: true, data: result };
            } catch (e: unknown) {
                const msg = errMsg(e);
                if (!needsStockIoSeed(msg)) {
                    console.warn("[eTIMS] saveStockMaster failed:", msg);
                    return { success: false, data: null, errorMessage: msg || "Failed to save stock master" };
                }

                const saved = (await lookupSavedItems(client, oscu, isSandbox)).get(input.stockMaster.itemCd);
                if (!saved) {
                    return {
                        success: false,
                        data: null,
                        errorMessage: `${msg} Call etims.stock.sendStockIO first with a saved goods itemCd (itemTyCd 1 or 2), then retry saveStockMaster. ${input.stockMaster.itemCd} was not found in the item list.`,
                    };
                }
                if (saved.itemTyCd === "3") {
                    return { success: false, data: null, errorMessage: serviceItemError(saved.itemCd) };
                }
                if (isPlaceholderCls(saved.itemClsCd)) {
                    return {
                        success: false,
                        data: null,
                        errorMessage: `${msg} Saved item ${saved.itemCd} has an invalid itemClsCd. Re-save the item with a 10-digit classification, then send stock I/O.`,
                    };
                }

                const qty = Math.max(input.stockMaster.rsdQty, 1);
                try {
                    console.warn(`[eTIMS] saveStockMaster: seeding insertStockIO for ${saved.itemCd} qty ${qty}`);
                    await insertStockIoWithRetry(
                        client,
                        oscu,
                        isSandbox,
                        buildAdjustmentIo(saved, qty, input.stockMaster),
                    );
                    const retry = await withClassicOscuFallback(client, isSandbox, saveMaster, "saveStockMaster");
                    try {
                        await recordLocalStockMaster(input.stockMaster.itemCd, input.stockMaster.rsdQty);
                    } catch (persistErr) {
                        console.warn("[eTIMS] local stock master persist failed:", errMsg(persistErr));
                    }
                    return { success: true, data: retry };
                } catch (seedErr: unknown) {
                    const seedMsg = errMsg(seedErr);
                    console.warn("[eTIMS] saveStockMaster seed I/O failed:", seedMsg);
                    return {
                        success: false,
                        data: null,
                        errorMessage: `${msg} Auto stock I/O also failed: ${seedMsg}`,
                    };
                }
            }
        }),
});
