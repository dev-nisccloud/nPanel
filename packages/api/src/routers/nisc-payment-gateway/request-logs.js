/**
 * Nisc Payment Gateway - Request Logs
 *
 * Query detailed request logs
 */
import { z } from "zod";
import { eq, and, desc, gte, lte } from "@npanel/db";
import { protectedProcedure, router } from "../..";
import { db } from "@npanel/db";
import { niscPaymentGatewayRequestLog, niscPaymentGatewayMerchant, } from "@npanel/db/schema/nisc-payment-gateway";
import { assertGatewayReadAccess, } from "../../lib/nisc-payment-gateway-access";
const listRequestLogsSchema = z.object({
    merchantId: z.string(),
    apiKeyId: z.string().optional(),
    endpoint: z.string().optional(),
    statusCode: z.number().optional(),
    success: z.boolean().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0),
});
const requestLogIdSchema = z.object({
    id: z.string(),
});
export const requestLogsRouter = router({
    /**
     * List request logs for merchant
     */
    list: protectedProcedure
        .input(listRequestLogsSchema)
        .query(async ({ ctx, input }) => {
        // Verify merchant ownership
        const merchant = await db
            .select()
            .from(niscPaymentGatewayMerchant)
            .where(eq(niscPaymentGatewayMerchant.id, input.merchantId))
            .limit(1);
        if (!merchant[0]) {
            throw new Error("Merchant not found");
        }
        // Access control based on role
        assertGatewayReadAccess({
            actorUserId: ctx.session.user.id,
            role: ctx.session.user.role,
            ownerUserId: merchant[0].userId,
            teamId: merchant[0].teamId,
        });
        const conditions = [eq(niscPaymentGatewayRequestLog.merchantId, input.merchantId)];
        if (input.apiKeyId) {
            conditions.push(eq(niscPaymentGatewayRequestLog.apiKeyId, input.apiKeyId));
        }
        if (input.endpoint) {
            conditions.push(eq(niscPaymentGatewayRequestLog.endpoint, input.endpoint));
        }
        if (input.statusCode) {
            conditions.push(eq(niscPaymentGatewayRequestLog.statusCode, input.statusCode));
        }
        if (input.success !== undefined) {
            conditions.push(eq(niscPaymentGatewayRequestLog.success, input.success));
        }
        if (input.startDate) {
            conditions.push(gte(niscPaymentGatewayRequestLog.timestamp, input.startDate));
        }
        if (input.endDate) {
            conditions.push(lte(niscPaymentGatewayRequestLog.timestamp, input.endDate));
        }
        const logs = await db
            .select({
            id: niscPaymentGatewayRequestLog.id,
            endpoint: niscPaymentGatewayRequestLog.endpoint,
            method: niscPaymentGatewayRequestLog.method,
            statusCode: niscPaymentGatewayRequestLog.statusCode,
            success: niscPaymentGatewayRequestLog.success,
            ipAddress: niscPaymentGatewayRequestLog.ipAddress,
            timestamp: niscPaymentGatewayRequestLog.timestamp,
            durationMs: niscPaymentGatewayRequestLog.durationMs,
        })
            .from(niscPaymentGatewayRequestLog)
            .where(and(...conditions))
            .orderBy(desc(niscPaymentGatewayRequestLog.timestamp))
            .limit(input.limit)
            .offset(input.offset);
        return {
            logs,
            pagination: {
                limit: input.limit,
                offset: input.offset,
                hasMore: logs.length === input.limit,
            },
        };
    }),
    /**
     * Get detailed request log
     */
    getById: protectedProcedure
        .input(requestLogIdSchema)
        .query(async ({ ctx, input }) => {
        const log = await db
            .select()
            .from(niscPaymentGatewayRequestLog)
            .where(eq(niscPaymentGatewayRequestLog.id, input.id))
            .limit(1);
        if (!log[0]) {
            throw new Error("Request log not found");
        }
        // Verify merchant ownership
        const merchant = await db
            .select()
            .from(niscPaymentGatewayMerchant)
            .where(eq(niscPaymentGatewayMerchant.id, log[0].merchantId))
            .limit(1);
        if (!merchant[0]) {
            throw new Error("Merchant not found");
        }
        // Access control based on role
        assertGatewayReadAccess({
            actorUserId: ctx.session.user.id,
            role: ctx.session.user.role,
            ownerUserId: merchant[0].userId,
            teamId: merchant[0].teamId,
        });
        return {
            log: log[0],
        };
    }),
});
