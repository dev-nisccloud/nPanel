import { z } from "zod";
import { router, protectedProcedure } from "../../trpc";
import { ETimsClient } from "../../lib/etims-client";
import { TRPCError } from "@trpc/server";

export const etimsImportsRouter = router({
    /**
     * Retrieve imported items from customs system
     */
    getImportedItems: protectedProcedure
        .input(z.object({
            tin: z.string(),
            bhfId: z.string(),
            lastReqDt: z.string().regex(/^\d{14}$/, "Date must be in YYYYMMDDHHmmss format"),
            accessToken: z.string().optional(),
            cmcKey: z.string().optional(),
        }))
        .query(async ({ input }) => {
            const config = {
                baseUrl: process.env.ETIMS_BASE_URL || "https://sbx.kra.go.ke/etims-oscu/api/v1",
                tokenUrl: process.env.ETIMS_TOKEN_URL || "https://sbx.kra.go.ke/v1/token/generate",
                consumerKey: process.env.ETIMS_CONSUMER_KEY || "",
                consumerSecret: process.env.ETIMS_CONSUMER_SECRET || "",
            };

            const client = new ETimsClient(config);

            try {
                const result = await client.selectImportedItemInfo(
                    {
                        tin: input.tin,
                        bhfId: input.bhfId,
                        cmcKey: input.cmcKey,
                        accessToken: input.accessToken
                    },
                    input.lastReqDt
                );

                return {
                    success: true,
                    data: result,
                };
            } catch (error: any) {
                console.error("[eTIMS Get Imported Items Error]", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error.message || "Failed to retrieve eTIMS imported items",
                });
            }
        }),

    /**
     * Confirm imported items and map to local item codes
     */
    confirmImportedItem: protectedProcedure
        .input(z.object({
            tin: z.string(),
            bhfId: z.string(),
            accessToken: z.string().optional(),
            cmcKey: z.string().optional(),
            conversion: z.object({
                taskCd: z.string(),
                dclDe: z.string().regex(/^\d{8}$/, "Declaration date must be 8 digits (DDMMYYYY or YYYYMMDD depending on API expectations)"),
                itemSeq: z.number(),
                hsCd: z.string(),
                itemClsCd: z.string(),
                itemCd: z.string(),
                imptItemSttsCd: z.string(),
                remark: z.string().nullable(),
                modrNm: z.string(),
                modrId: z.string()
            })
        }))
        .mutation(async ({ input }) => {
            const config = {
                baseUrl: process.env.ETIMS_BASE_URL || "https://sbx.kra.go.ke/etims-oscu/api/v1",
                tokenUrl: process.env.ETIMS_TOKEN_URL || "https://sbx.kra.go.ke/v1/token/generate",
                consumerKey: process.env.ETIMS_CONSUMER_KEY || "",
                consumerSecret: process.env.ETIMS_CONSUMER_SECRET || "",
            };

            const client = new ETimsClient(config);

            try {
                const result = await client.saveImportedItemConvertedInfo(
                    {
                        tin: input.tin,
                        bhfId: input.bhfId,
                        cmcKey: input.cmcKey,
                        accessToken: input.accessToken
                    },
                    input.conversion
                );

                return {
                    success: true,
                    data: result,
                };
            } catch (error: any) {
                console.error("[eTIMS Confirm Imported Item Error]", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error.message || "Failed to confirm eTIMS imported item mapping",
                });
            }
        }),
});
