import * as crypto from "node:crypto";
import { z } from "zod";
import { router, protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@npanel/db";
import { eTimsItem } from "@npanel/db/schema/etims";
import { getEtimsContext } from "../../lib/etims-config";

const isAgencyUser = (r: string | null | undefined) =>
    ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(r ?? "");
const isSuperAdmin = (r: string | null | undefined) => r === "AGENCY_SUPER_ADMIN";

function assertRead(role: string | null | undefined) {
    if (!isAgencyUser(role)) throw new TRPCError({ code: "FORBIDDEN", message: "Only agency users can access eTIMS item data." });
}
function assertWrite(role: string | null | undefined) {
    if (!isSuperAdmin(role)) throw new TRPCError({ code: "FORBIDDEN", message: "Only agency super admins can modify eTIMS item data." });
}

export const etimsItemsRouter = router({
    getItemList: protectedProcedure
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

    saveItem: protectedProcedure
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
            const { client, oscu } = await getEtimsContext();
            try {
                const result = await client.saveItem(oscu, input.item as Record<string, unknown>);
                const data = result as { resultCd?: string };
                if (data.resultCd === "000" || data.resultCd === "001") {
                    const now = new Date();
                    await db.insert(eTimsItem).values({
                        id: crypto.randomUUID(),
                        localItemId: null,
                        itemCd: input.item.itemCd,
                        itemClsCd: input.item.itemClsCd,
                        itemNm: input.item.itemNm,
                        taxTyCd: input.item.taxTyCd,
                        pkgUnitCd: input.item.pkgUnitCd,
                        unitPrice: input.item.dftPrc.toString(),
                        originCountryCd: input.item.orgnNatCd,
                        quantityUnit: input.item.qtyUnitCd,
                        packagingUnit: input.item.pkgUnitCd,
                        createdAt: now,
                        updatedAt: now,
                    }).onConflictDoUpdate({
                        target: eTimsItem.itemCd,
                        set: { itemClsCd: input.item.itemClsCd, itemNm: input.item.itemNm, taxTyCd: input.item.taxTyCd, pkgUnitCd: input.item.pkgUnitCd, unitPrice: input.item.dftPrc.toString(), originCountryCd: input.item.orgnNatCd, quantityUnit: input.item.qtyUnitCd, packagingUnit: input.item.pkgUnitCd, updatedAt: now },
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

    saveItemComposition: protectedProcedure
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
