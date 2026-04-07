import { z } from "zod";
import { router, protectedProcedure } from "../../trpc";
import { ETimsClient } from "../../lib/etims-client";
import { TRPCError } from "@trpc/server";
import { db } from "@npanel/db";
import { eTimsConfiguration } from "@npanel/db/schema/etims";
export const etimsStockRouter = router({
    /**
     * Retrieve stock movement requests between branches
     */
    getStockMovements: protectedProcedure
        .input(z.object({
        lastReqDt: z.string().regex(/^\d{14}$/, "Date must be in YYYYMMDDHHmmss format"),
    }))
        .query(async ({ input }) => {
        const [config] = await db
            .select()
            .from(eTimsConfiguration)
            .limit(1);
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
            const result = await client.selectStockMoveList({
                tin: config.kraPin,
                bhfId: config.branchId,
                cmcKey: config.cmcKey,
                accessToken: undefined
            }, input.lastReqDt);
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            console.warn("[eTIMS Get Stock Movements Error]", error?.message ?? error);
            return {
                success: false,
                data: null,
                errorMessage: error?.message || "Failed to retrieve eTIMS stock movements",
            };
        }
    }),
    /**
     * Record stock in/out transactions
     */
    sendStockIO: protectedProcedure
        .input(z.object({
        stockData: z.any()
    }))
        .mutation(async ({ input }) => {
        const [config] = await db
            .select()
            .from(eTimsConfiguration)
            .limit(1);
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
            const result = await client.insertStockIO({
                tin: config.kraPin,
                bhfId: config.branchId,
                cmcKey: config.cmcKey,
                accessToken: undefined
            }, input.stockData);
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            console.warn("[eTIMS Send Stock IO Error]", error?.message ?? error);
            return {
                success: false,
                data: null,
                errorMessage: error?.message || "Failed to send eTIMS stock in/out data",
            };
        }
    }),
    /**
     * Update stock master with current quantities
     */
    saveStockMaster: protectedProcedure
        .input(z.object({
        stockMaster: z.object({
            itemCd: z.string(),
            rsdQty: z.number(),
            regrId: z.string(),
            regrNm: z.string(),
            modrNm: z.string(),
            modrId: z.string()
        })
    }))
        .mutation(async ({ input }) => {
        const [config] = await db
            .select()
            .from(eTimsConfiguration)
            .limit(1);
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
            const result = await client.saveStockMaster({
                tin: config.kraPin,
                bhfId: config.branchId,
                cmcKey: config.cmcKey,
                accessToken: undefined
            }, input.stockMaster);
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            console.warn("[eTIMS Save Stock Master Error]", error?.message ?? error);
            return {
                success: false,
                data: null,
                errorMessage: error?.message || "Failed to save eTIMS stock master",
            };
        }
    }),
});
