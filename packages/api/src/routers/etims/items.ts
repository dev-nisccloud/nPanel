import { z } from "zod";
import { router, protectedProcedure } from "../../trpc";
import { ETimsClient } from "../../lib/etims-client";
import { TRPCError } from "@trpc/server";
import prisma from "@nPanel/db";

export const etimsItemsRouter = router({
    /**
     * Create or update item/product information
     */
    saveItem: protectedProcedure
        .input(z.object({
            item: z.object({
                // Reverting to previous schema but making sure we handle it.
                itemCd: z.string().optional(),
                itemClsCd: z.string(),
                itemTyCd: z.enum(["1", "2", "3"]), // 1=Raw, 2=Finished, 3=Service
                itemNm: z.string(),
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
                grpPrcL5: z.number().nullable().optional(),
                addInfo: z.string().nullable().optional(),
                sftyQty: z.number().nullable().optional(),
                isrcAplcbYn: z.enum(["Y", "N"]).default("N"),
                useYn: z.enum(["Y", "N"]).default("Y"),
                regrNm: z.string(),
                regrId: z.string(),
                modrNm: z.string(),
                modrId: z.string()
            })
        }))
        .mutation(async ({ input }) => {
            const config = await prisma.eTimsConfiguration.findFirst();

            if (!config || !config.cmcKey) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: "eTIMS Configuration not found or device not initialized.",
                });
            }

            const clientConfig = {
                baseUrl: config.isSandbox
                    ? (process.env.ETIMS_SANDBOX_BASE_URL || "https://sbx.kra.go.ke/etims-oscu/api/v1")
                    : (process.env.ETIMS_PRODUCTION_BASE_URL || "https://ra.kra.go.ke/etims-oscu/api/v1"),
                tokenUrl: config.isSandbox
                    ? (process.env.ETIMS_SANDBOX_TOKEN_URL || "https://sbx.kra.go.ke/v1/token/generate")
                    : (process.env.ETIMS_PRODUCTION_TOKEN_URL || "https://ra.kra.go.ke/v1/token/generate"),
                consumerKey: process.env.ETIMS_CONSUMER_KEY || "",
                consumerSecret: process.env.ETIMS_CONSUMER_SECRET || "",
            };

            const client = new ETimsClient(clientConfig);

            try {
                // KRA requires itemCd to be present for /saveItem in sandbox.
                if (!input.item.itemCd || !input.item.itemCd.trim()) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "itemCd is required for registering items in KRA eTIMS.",
                    });
                }
                // If itemCd is missing (new item), we might need to handle it.
                // But for now pass what we have.
                const { itemCd, ...restItem } = input.item;
                const itemPayload = {
                    ...restItem,
                    ...(itemCd ? { itemCd } : {}),
                    itemStdNm: input.item.itemStdNm || null,
                    btchNo: input.item.btchNo || null,
                    bcd: input.item.bcd || null,
                    grpPrcL5: input.item.grpPrcL5 || null,
                    addInfo: input.item.addInfo || null,
                    sftyQty: input.item.sftyQty || null,
                };

                const result = await client.saveItem(
                    {
                        tin: config.kraPin,
                        bhfId: config.branchId,
                        cmcKey: config.cmcKey,
                        accessToken: undefined
                    },
                    itemPayload
                );

                // Persist successful item to DB
                if (result.resultCd === "000") {
                    // Check if itemCd is returned in data, otherwise use input
                    // KRA typically returns the processed item info?
                    // Let's assume we trust the input itemCd or need to parse response?
                    // For now, upsert based on input.itemCd if available.
                    if (input.item.itemCd) {
                        await prisma.eTimsItem.upsert({
                            where: {
                                itemCd: input.item.itemCd
                            },
                            create: {
                                id: crypto.randomUUID(),
                                itemCd: input.item.itemCd,
                                itemClsCd: input.item.itemClsCd,
                                itemNm: input.item.itemNm,
                                taxTyCd: input.item.taxTyCd,
                                pkgUnitCd: input.item.pkgUnitCd,
                                unitPrice: input.item.dftPrc.toString(),
                                originCountryCd: input.item.orgnNatCd,
                                quantityUnit: input.item.qtyUnitCd,
                                packagingUnit: input.item.pkgUnitCd
                            },
                            update: {
                                itemClsCd: input.item.itemClsCd,
                                itemNm: input.item.itemNm,
                                taxTyCd: input.item.taxTyCd,
                                pkgUnitCd: input.item.pkgUnitCd,
                                unitPrice: input.item.dftPrc.toString(),
                                originCountryCd: input.item.orgnNatCd,
                                quantityUnit: input.item.qtyUnitCd,
                                packagingUnit: input.item.pkgUnitCd,
                                updatedAt: new Date()
                            }
                        });
                    }
                }

                return {
                    success: true,
                    data: result,
                };
            } catch (error: any) {
                // KRA sandbox can intermittently fail with internal "TestSessionApiLog" errors.
                // Don't break the UI with a 500: return a non-fatal response so user can retry.
                console.warn("[eTIMS Save Item Error]", error?.message ?? error);
                return {
                    success: false,
                    data: null,
                    errorMessage: error?.message || "Failed to save eTIMS item",
                };
            }
        }),

    /**
     * Retrieve saved items
     */
    getItemInfo: protectedProcedure
        .input(z.object({
            lastReqDt: z.string().regex(/^\d{14}$/, "Date must be in YYYYMMDDHHmmss format"),
            bhfId: z.string().optional(),
        }))
        .query(async ({ input }) => {
            const config = await prisma.eTimsConfiguration.findFirst();

            if (!config || !config.cmcKey) {
                // Fallback: If no config in DB, check if maybe we can't fetch.
                // But strictly we need config now.
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: "eTIMS Configuration not found or device not initialized.",
                });
            }

            const clientConfig = {
                baseUrl: config.isSandbox
                    ? (process.env.ETIMS_SANDBOX_BASE_URL || "https://sbx.kra.go.ke/etims-oscu/api/v1")
                    : (process.env.ETIMS_PRODUCTION_BASE_URL || "https://ra.kra.go.ke/etims-oscu/api/v1"),
                tokenUrl: config.isSandbox
                    ? (process.env.ETIMS_SANDBOX_TOKEN_URL || "https://sbx.kra.go.ke/v1/token/generate")
                    : (process.env.ETIMS_PRODUCTION_TOKEN_URL || "https://ra.kra.go.ke/v1/token/generate"),
                consumerKey: process.env.ETIMS_CONSUMER_KEY || "",
                consumerSecret: process.env.ETIMS_CONSUMER_SECRET || "",
            };

            const client = new ETimsClient(clientConfig);

            try {
                const result = await client.selectItemInfo(
                    {
                        tin: config.kraPin,
                        bhfId: input.bhfId ?? config.branchId,
                        cmcKey: config.cmcKey,
                        accessToken: undefined
                    },
                    input.lastReqDt
                );

                return {
                    success: true,
                    data: result,
                };
            } catch (error: any) {
                console.error("[eTIMS Get Item Info Error]", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error.message || "Failed to retrieve eTIMS item info",
                });
            }
        }),

    /**
     * Define composite items (items made from other items)
     */
    saveItemComposition: protectedProcedure
        .input(z.object({
            composition: z.object({
                itemCd: z.string(),
                cpstItemCd: z.string(),
                cpstQty: z.number().min(0),
                regrId: z.string(),
                regrNm: z.string()
            })
        }))
        .mutation(async ({ input }) => {
            const config = await prisma.eTimsConfiguration.findFirst();

            if (!config || !config.cmcKey) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: "eTIMS Configuration not found or device not initialized.",
                });
            }

            const clientConfig = {
                baseUrl: config.isSandbox
                    ? (process.env.ETIMS_SANDBOX_BASE_URL || "https://sbx.kra.go.ke/etims-oscu/api/v1")
                    : (process.env.ETIMS_PRODUCTION_BASE_URL || "https://ra.kra.go.ke/etims-oscu/api/v1"),
                tokenUrl: config.isSandbox
                    ? (process.env.ETIMS_SANDBOX_TOKEN_URL || "https://sbx.kra.go.ke/v1/token/generate")
                    : (process.env.ETIMS_PRODUCTION_TOKEN_URL || "https://ra.kra.go.ke/v1/token/generate"),
                consumerKey: process.env.ETIMS_CONSUMER_KEY || "",
                consumerSecret: process.env.ETIMS_CONSUMER_SECRET || "",
            };

            const client = new ETimsClient(clientConfig);

            try {
                const result = await client.saveItemComposition(
                    {
                        tin: config.kraPin,
                        bhfId: config.branchId,
                        cmcKey: config.cmcKey,
                        accessToken: undefined
                    },
                    input.composition
                );

                return {
                    success: true,
                    data: result,
                };
            } catch (error: any) {
                console.error("[eTIMS Save Item Composition Error]", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error.message || "Failed to save eTIMS item composition",
                });
            }
        }),
});
