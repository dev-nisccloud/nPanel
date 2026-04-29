import { z } from "zod";
import { router, protectedProcedure } from "../../trpc";
import { ETimsClient } from "../../lib/etims-client";
import { TRPCError } from "@trpc/server";
import { db } from "@npanel/db";
import { eTimsConfiguration } from "@npanel/db/schema/etims";
const isAgencyUserRole = (role) => ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");
const isAgencySuperAdminRole = (role) => role === "AGENCY_SUPER_ADMIN";
function assertAgencyReadAccess(role) {
    if (!isAgencyUserRole(role)) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only agency users can access eTIMS sales data.",
        });
    }
}
function assertAgencyMutationAccess(role) {
    if (!isAgencySuperAdminRole(role)) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only agency super admins can modify eTIMS sales data.",
        });
    }
}
export const etimsSalesRouter = router({
    /**
     * Submit sales transaction and generate tax invoice
     */
    sendSalesTransaction: protectedProcedure
        .input(z.object({
        transaction: z.any() // Using any for large complex object, ideally should be strictly typed
    }))
        .mutation(async ({ ctx, input }) => {
        assertAgencyMutationAccess(ctx.session?.user?.role);
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
        if (!clientConfig.consumerKey || !clientConfig.consumerSecret) {
            throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message: "System configuration error: eTIMS Consumer Key/Secret missing.",
            });
        }
        const client = new ETimsClient(clientConfig);
        try {
            const result = await client.sendSalesTransaction({
                tin: config.kraPin,
                bhfId: config.branchId,
                cmcKey: config.cmcKey,
            }, input.transaction);
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            console.warn("[eTIMS Send Sales Transaction Error]", error?.message ?? error);
            return {
                success: false,
                data: null,
                errorMessage: error?.message || "Failed to send eTIMS sales transaction",
            };
        }
    }),
    /**
     * Retrieve sales transaction history
     */
    getSalesTransactions: protectedProcedure
        .input(z.object({
        lastReqDt: z.string().regex(/^\d{14}$/, "Date must be in YYYYMMDDHHmmss format"),
        bhfId: z.string().optional(),
    }))
        .query(async ({ ctx, input }) => {
        assertAgencyReadAccess(ctx.session?.user?.role);
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
        if (!clientConfig.consumerKey || !clientConfig.consumerSecret) {
            throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message: "System configuration error: eTIMS Consumer Key/Secret missing.",
            });
        }
        const client = new ETimsClient(clientConfig);
        try {
            const token = await client.generateToken();
            const result = await client.selectSalesTransactions({
                tin: config.kraPin,
                bhfId: input.bhfId ?? config.branchId,
                cmcKey: config.cmcKey,
                accessToken: token.access_token
            }, input.lastReqDt);
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
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
        invcNo: z.string(),
    }))
        .query(async ({ ctx, input }) => {
        assertAgencyReadAccess(ctx.session?.user?.role);
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
        if (!clientConfig.consumerKey || !clientConfig.consumerSecret) {
            throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message: "System configuration error: eTIMS Consumer Key/Secret missing.",
            });
        }
        const client = new ETimsClient(clientConfig);
        try {
            const token = await client.generateToken();
            const result = await client.selectInvoiceDetail({
                tin: config.kraPin,
                bhfId: config.branchId,
                cmcKey: config.cmcKey,
                accessToken: token.access_token
            }, input.invcNo);
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            console.error("[eTIMS Get Invoice Detail Error]", error);
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: error.message || "Failed to retrieve eTIMS invoice details",
            });
        }
    }),
});
