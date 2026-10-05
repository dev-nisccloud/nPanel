import * as crypto from "node:crypto";
import { z } from "zod";
import { router } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@npanel/db";
import { eTimsItem } from "@npanel/db/schema/etims";
import { getEtimsContext, buildClientConfigFromEnv } from "../../lib/etims-config";
import { createEtimsClient, type EtimsOscuClient, type EtimsOscuHeaders } from "../../lib/etims-client";
import { etimsProcedure, skipEtimsAuthChecks } from "./_procedure";

const isAgencyUser = (r: string | null | undefined) =>
    ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(r ?? "");
const isSuperAdmin = (r: string | null | undefined) => r === "AGENCY_SUPER_ADMIN";

function assertRead(role: string | null | undefined) {
    if (skipEtimsAuthChecks()) return;
    if (!isAgencyUser(role)) throw new TRPCError({ code: "FORBIDDEN", message: "Only agency users can access eTIMS item data." });
}
function assertWrite(role: string | null | undefined) {
    if (skipEtimsAuthChecks()) return;
    if (!isSuperAdmin(role)) throw new TRPCError({ code: "FORBIDDEN", message: "Only agency super admins can modify eTIMS item data." });
}

const CLASSIC_SANDBOX_BASE = "https://etims-api-sbx.kra.go.ke/etims-api";
const CLASSIC_PROD_BASE = "https://etims-api.kra.go.ke/etims-api";

function isOpaqueKraError(message: string) {
    return /TestSessionApiLog|getApiNo/i.test(message)
        || /HTTP 400:\s*Error:?\s*$/i.test(message)
        || /HTTP 400:\s*Error:\s*—/i.test(message);
}

function twoCharUnit(value: string, fallback: string) {
    const unit = value.trim().toUpperCase();
    if (unit.length >= 2) return unit.slice(0, 5);
    if (unit.length === 1) return fallback;
    return fallback;
}

function sanitizeSaveItem(item: Record<string, unknown> & {
    itemCd: string;
    itemClsCd: string;
    itemTyCd: string;
    itemNm: string;
    pkgUnitCd: string;
    qtyUnitCd: string;
    orgnNatCd: string;
    itemStdNm?: string | null;
    sftyQty?: number | null;
    grpPrcL5?: number | null;
}) {
    const pkgUnitCd = twoCharUnit(item.pkgUnitCd, "OU");
    const qtyUnitCd = twoCharUnit(item.qtyUnitCd, "NO");
    const orgnNatCd = item.orgnNatCd.trim().toUpperCase().slice(0, 2) || "KE";
    const itemTyCd = String(item.itemTyCd).trim().slice(0, 1) || "3";
    const seq = /^\d{7}$/.test(item.itemCd.slice(-7)) ? item.itemCd.slice(-7) : "0000001";
    const itemNm = item.itemNm.trim();
    return {
        ...item,
        orgnNatCd,
        itemTyCd,
        pkgUnitCd,
        qtyUnitCd,
        itemNm,
        itemStdNm: (item.itemStdNm && String(item.itemStdNm).trim()) || itemNm,
        itemClsCd: item.itemClsCd.trim(),
        itemCd: `${orgnNatCd}${itemTyCd}${pkgUnitCd}${qtyUnitCd}${seq}`,
        sftyQty: item.sftyQty ?? 0,
        grpPrcL5: item.grpPrcL5 ?? 0,
    };
}

async function saveItemOnKra(
    client: EtimsOscuClient,
    oscu: EtimsOscuHeaders,
    isSandbox: boolean,
    item: Record<string, unknown>,
) {
    try {
        return await client.saveItem(oscu, item);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        if (!isOpaqueKraError(message)) throw error;

        const classic = createEtimsClient({
            ...buildClientConfigFromEnv(isSandbox),
            baseUrl: isSandbox ? CLASSIC_SANDBOX_BASE : CLASSIC_PROD_BASE,
            memoryTokenOnly: true,
        });
        console.warn("[eTIMS] saveItem Gava 400, retrying classic OSCU");
        return await classic.saveItem(oscu, item);
    }
}

export const etimsItemsRouter = router({
    getItemList: etimsProcedure
        .input(z.object({ lastReqDt: z.string().regex(/^\d{14}$/) }))
        .query(async ({ ctx, input }) => {
            assertRead(ctx.session?.user?.role);
            const { client, oscu } = await getEtimsContext();
            try {
                const result = await client.selectItemList(oscu, input.lastReqDt);
                return { success: true, data: result };
            } catch (e: unknown) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: (e as Error).message || "Failed to retrieve item list" });
            }
        }),

    saveItem: etimsProcedure
        .input(z.object({
            item: z.object({
                itemCd: z.string().min(1, "itemCd is required"),
                itemClsCd: z.string().min(1),
                itemTyCd: z.enum(["1", "2", "3"]),
                itemNm: z.string().min(1),
                itemStdNm: z.string().nullable().optional(),
                orgnNatCd: z.string().length(2).default("KE"),
                pkgUnitCd: z.string().default("OU"),
                qtyUnitCd: z.string().default("OU"),
                taxTyCd: z.enum(["A", "B", "C", "D", "E"]),
                btchNo: z.string().nullable().optional(),
                bcd: z.string().nullable().optional(),
                dftPrc: z.number().min(0),
                grpPrcL1: z.number().min(0).default(0),
                grpPrcL2: z.number().min(0).default(0),
                grpPrcL3: z.number().min(0).default(0),
                grpPrcL4: z.number().min(0).default(0),
                grpPrcL5: z.number().min(0).default(0),
                addInfo: z.string().nullable().optional(),
                sftyQty: z.number().nullable().optional(),
                isrcAplcbYn: z.enum(["Y", "N"]).default("N"),
                useYn: z.enum(["Y", "N"]).default("Y"),
                regrId: z.string().min(1),
                regrNm: z.string().min(1),
                modrId: z.string().min(1),
                modrNm: z.string().min(1),
            }),
        }))
        .mutation(async ({ ctx, input }) => {
            assertWrite(ctx.session?.user?.role);
            const { client, oscu, isSandbox } = await getEtimsContext();
            const item = sanitizeSaveItem(input.item);
            try {
                const result = await saveItemOnKra(client, oscu, isSandbox, item);
                const data = result as { resultCd?: string };
                if (data.resultCd === "000" || data.resultCd === "001") {
                    const now = new Date();
                    await db.insert(eTimsItem).values({
                        id: crypto.randomUUID(),
                        localItemId: null,
                        itemCd: item.itemCd,
                        itemClsCd: item.itemClsCd,
                        itemNm: item.itemNm,
                        taxTyCd: item.taxTyCd,
                        pkgUnitCd: item.pkgUnitCd,
                        unitPrice: item.dftPrc.toString(),
                        originCountryCd: item.orgnNatCd,
                        quantityUnit: item.qtyUnitCd,
                        packagingUnit: item.pkgUnitCd,
                        createdAt: now,
                        updatedAt: now,
                    }).onConflictDoUpdate({
                        target: eTimsItem.itemCd,
                        set: { itemClsCd: item.itemClsCd, itemNm: item.itemNm, taxTyCd: item.taxTyCd, pkgUnitCd: item.pkgUnitCd, unitPrice: item.dftPrc.toString(), originCountryCd: item.orgnNatCd, quantityUnit: item.qtyUnitCd, packagingUnit: item.pkgUnitCd, updatedAt: now },
                    });
                }
                return { success: true, data: result };
            } catch (e: unknown) {
                const msg = (e as Error).message ?? "";
                console.warn("[eTIMS] saveItem failed:", msg);
                if (msg.includes("TestSessionApiLog")) {
                    return { success: false, data: null, requiresReinitialization: true, errorMessage: "KRA sandbox session expired. Re-initialize the device in Settings." };
                }
                return { success: false, data: null, requiresReinitialization: false, errorMessage: msg || "Failed to save item" };
            }
        }),

    saveItemComposition: etimsProcedure
        .input(z.object({
            composition: z.object({
                itemCd: z.string().min(1),
                cpstItemCd: z.string().min(1),
                cpstQty: z.number().min(0),
                regrId: z.string().min(1),
                regrNm: z.string().min(1),
                modrId: z.string().optional(),
                modrNm: z.string().optional(),
            }),
        }))
        .mutation(async ({ ctx, input }) => {
            assertWrite(ctx.session?.user?.role);
            const { client, oscu } = await getEtimsContext();
            try {
                const result = await client.saveItemComposition(oscu, input.composition as Record<string, unknown>);
                return { success: true, data: result };
            } catch (e: unknown) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: (e as Error).message || "Failed to save item composition" });
            }
        }),
});
