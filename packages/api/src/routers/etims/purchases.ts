import { z } from "zod";
import { router, protectedProcedure } from "../../trpc";
import { ETimsClient } from "../../lib/etims-client";
import { TRPCError } from "@trpc/server";

export const etimsPurchasesRouter = router({
    /**
     * Retrieve purchase transactions made from suppliers
     */
    getPurchaseTransactions: protectedProcedure
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
                const result = await client.getPurchaseTransactionInfo(
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
                console.error("[eTIMS Get Purchase Transactions Error]", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error.message || "Failed to retrieve eTIMS purchase transactions",
                });
            }
        }),

    /**
     * Confirm purchase transactions for stock adjustment
     */
    sendPurchaseTransaction: protectedProcedure
        .input(z.object({
            tin: z.string(),
            bhfId: z.string(),
            accessToken: z.string().optional(),
            cmcKey: z.string().optional(),
            purchase: z.any()
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
                const result = await client.sendPurchaseTransactionInfo(
                    {
                        tin: input.tin,
                        bhfId: input.bhfId,
                        cmcKey: input.cmcKey,
                        accessToken: input.accessToken
                    },
                    input.purchase
                );

                return {
                    success: true,
                    data: result,
                };
            } catch (error: any) {
                console.error("[eTIMS Send Purchase Transaction Error]", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error.message || "Failed to send eTIMS purchase transaction",
                });
            }
        }),
});
