import { z } from "zod";
import { router, protectedProcedure } from "../../trpc";
import { ETimsClient } from "../../lib/etims-client";
import { TRPCError } from "@trpc/server";
import prisma from "@nPanel/db";

export const etimsSalesRouter = router({
    /**
     * Submit sales transaction and generate tax invoice
     */
    sendSalesTransaction: protectedProcedure
        .input(z.object({
            teamId: z.string(),
            transaction: z.any() // Using any for large complex object, ideally should be strictly typed
        }))
        .mutation(async ({ input }) => {
            const config = await prisma.eTimsConfiguration.findUnique({
                where: { teamId: input.teamId },
            });

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
                const result = await client.sendSalesTransaction(
                    {
                        tin: config.kraPin,
                        bhfId: config.branchId,
                        cmcKey: config.cmcKey,
                        accessToken: undefined
                    },
                    input.transaction
                );

                return {
                    success: true,
                    data: result,
                };
            } catch (error: any) {
                console.error("[eTIMS Send Sales Transaction Error]", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error.message || "Failed to send eTIMS sales transaction",
                });
            }
        }),

    /**
     * Retrieve sales transaction history
     */
    getSalesTransactions: protectedProcedure
        .input(z.object({
            teamId: z.string(),
            lastReqDt: z.string().regex(/^\d{14}$/, "Date must be in YYYYMMDDHHmmss format"),
        }))
        .query(async ({ input }) => {
            const config = await prisma.eTimsConfiguration.findUnique({
                where: { teamId: input.teamId },
            });

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
                const result = await client.selectSalesTransactions(
                    {
                        tin: config.kraPin,
                        bhfId: config.branchId,
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
                console.error("[eTIMS Get Sales Transactions Error]", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error.message || "Failed to retrieve eTIMS sales transactions",
                });
            }
        }),

    /**
     * Get detailed invoice information by invoice number
     */
    getInvoiceDetail: protectedProcedure
        .input(z.object({
            teamId: z.string(),
            invcNo: z.string(),
        }))
        .query(async ({ input }) => {
            const config = await prisma.eTimsConfiguration.findUnique({
                where: { teamId: input.teamId },
            });

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
                const result = await client.selectInvoiceDetail(
                    {
                        tin: config.kraPin,
                        bhfId: config.branchId,
                        cmcKey: config.cmcKey,
                        accessToken: undefined
                    },
                    input.invcNo
                );

                return {
                    success: true,
                    data: result,
                };
            } catch (error: any) {
                console.error("[eTIMS Get Invoice Detail Error]", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error.message || "Failed to retrieve eTIMS invoice details",
                });
            }
        }),
});
