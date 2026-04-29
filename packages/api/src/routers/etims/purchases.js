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
            message: "Only agency users can access eTIMS purchase data.",
        });
    }
}
function assertAgencyMutationAccess(role) {
    if (!isAgencySuperAdminRole(role)) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only agency super admins can modify eTIMS purchase data.",
        });
    }
}
export const etimsPurchasesRouter = router({
    /**
     * Retrieve purchase transactions made from suppliers
     */
    getPurchaseTransactions: protectedProcedure
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
        const client = new ETimsClient(clientConfig);
        try {
            const result = await client.getPurchaseTransactionInfo({
                tin: config.kraPin,
                bhfId: input.bhfId ?? config.branchId,
                cmcKey: config.cmcKey,
                accessToken: undefined
            }, input.lastReqDt);
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            console.warn("[eTIMS Get Purchase Transactions Error]", error?.message ?? error);
            return {
                success: false,
                data: null,
                errorMessage: error?.message || "Failed to retrieve eTIMS purchase transactions",
            };
        }
    }),
    /**
     * Confirm purchase transactions for stock adjustment
     */
    sendPurchaseTransaction: protectedProcedure
        .input(z.object({
        purchase: z.any(),
        bhfId: z.string().optional(),
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
        const client = new ETimsClient(clientConfig);
        try {
            const result = await client.sendPurchaseTransactionInfo({
                tin: config.kraPin,
                bhfId: input.bhfId ?? config.branchId,
                cmcKey: config.cmcKey,
                accessToken: undefined
            }, input.purchase);
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            console.warn("[eTIMS Send Purchase Transaction Error]", error?.message ?? error);
            return {
                success: false,
                data: null,
                errorMessage: error?.message || "Failed to send eTIMS purchase transaction",
            };
        }
    }),
});
