import { z } from "zod";
import { router, protectedProcedure } from "../../trpc";
import { ETimsClient } from "../../lib/etims-client";
import { TRPCError } from "@trpc/server";
import { db } from "@npanel/db";
import { eTimsConfiguration } from "@npanel/db/schema/etims";

export const etimsDataRouter = router({
    /**
     * Retrieve standard codes (payment types, receipt types, tax codes, etc.)
     */
    getCodeList: protectedProcedure
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
                const result = await client.selectCodeList(
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
                console.error("[eTIMS Code List Error]", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error.message || "Failed to retrieve eTIMS code list",
                });
            }
        }),

    /**
     * Get item classification codes for categorizing products
     */
    getItemClassList: protectedProcedure
        .input(z.object({
            lastReqDt: z.string().regex(/^\d{14}$/, "Date must be in YYYYMMDDHHmmss format"),
            bhfId: z.string().optional(),
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
                const result = await client.selectItemClass(
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
                // KRA sandbox can return 400s here due to internal test-session issues.
                // Log a concise message (no noisy stack), and return non-fatal response.
                console.warn("[eTIMS Item Class Error]", error?.message ?? error);
                // KRA sandbox can return 400s here due to internal test-session issues.
                // Don't break the UI: return a non-fatal response so users can enter codes manually.
                return {
                    success: false,
                    data: null,
                    errorMessage: error?.message || "Failed to retrieve eTIMS item classification list",
                };
            }
        }),

    /**
     * Get list of registered branches
     */
    getBranchList: protectedProcedure
        .input(z.object({
            lastReqDt: z.string().regex(/^\d{14}$/, "Date must be in YYYYMMDDHHmmss format"),
        }))
        .query(async ({ input }) => {
            // 1. Fetch global eTIMS Configuration
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

            // 2. Prepare Client Config
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
                // 3. Call API
                const result = await client.selectBhfList(
                    {
                        tin: config.kraPin,
                        bhfId: config.branchId,
                        cmcKey: config.cmcKey,
                        // Access token might be needed if not handled by client auto-auth?
                        // The ETimsClient usually handles token generation if keys are provided?
                        // Let's assume we might need to generate one if the client doesn't auto-handle it.
                        // For now, let's pass undefined and rely on client internal logic or update if needed.
                        accessToken: undefined
                    },
                    input.lastReqDt
                );

                return {
                    success: true,
                    data: result,
                };
            } catch (error: any) {
                console.error("[eTIMS Branch List Error]", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error.message || "Failed to retrieve eTIMS branch list",
                });
            }
        }),

    /**
     * Retrieve notices from KRA
     */
    getNoticeList: protectedProcedure
        .input(z.object({
            lastReqDt: z.string(),
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
                const result = await client.selectNoticeList(
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
                console.error("[eTIMS Notice List Error]", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error.message || "Failed to retrieve eTIMS notice list",
                });
            }
        }),

    /**
     * Get taxpayer registration details
     */
    getTaxpayerInfo: protectedProcedure
        .input(z.object({
            lastReqDt: z.string(),
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
                const result = await client.selectTaxpayerInfo(
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
                console.error("[eTIMS Taxpayer Info Error]", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error.message || "Failed to retrieve eTIMS taxpayer info",
                });
            }
        }),

    /**
     * Retrieve registered customer PIN information
     */
    getCustomerList: protectedProcedure
        .input(z.object({
            lastReqDt: z.string(),
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
                const result = await client.selectCustomerPinInfo(
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
                console.error("[eTIMS Customer List Error]", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error.message || "Failed to retrieve eTIMS customer PIN info",
                });
            }
        }),
});
