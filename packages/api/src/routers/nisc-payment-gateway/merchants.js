/**
 * Nisc Payment Gateway - Merchants Management
 *
 * CRUD operations for merchant accounts
 */
import { z } from "zod";
import { nanoid } from "nanoid";
import { eq, and, or, desc, sql } from "@npanel/db";
import { protectedProcedure, router } from "../..";
import { db } from "@npanel/db";
import { niscPaymentGatewayMerchant, niscPaymentGatewayApiKey, niscPaymentGatewayTransaction, } from "@npanel/db/schema/nisc-payment-gateway";
import { resolveGatewayReadScope, buildGatewayAccessFilter, assertGatewayMutationAccess, assertGatewayReadAccess, } from "../../lib/nisc-payment-gateway-access";
// =============================================================================
// SCHEMAS
// =============================================================================
const createMerchantSchema = z.object({
    merchantName: z.string().min(1, "Merchant name is required"),
    merchantEmail: z.string().email("Valid email is required"),
    merchantPhone: z.string().optional(),
    merchantWebsite: z.string().url().optional().or(z.literal("")),
    businessType: z.enum(["INDIVIDUAL", "BUSINESS", "NGO"]).default("BUSINESS"),
    businessName: z.string().optional(),
    businessRegistration: z.string().optional(),
    teamId: z.string().optional(),
    settings: z.object({
        webhookUrl: z.string().url().optional(),
        webhookSecret: z.string().optional(),
        allowedOrigins: z.array(z.string()).optional(),
        notificationEmails: z.array(z.string().email()).optional(),
        ipWhitelist: z.array(z.string()).optional(),
    }).optional(),
    notes: z.string().optional(),
});
const updateMerchantSchema = z.object({
    id: z.string(),
    merchantName: z.string().min(1).optional(),
    merchantEmail: z.string().email().optional(),
    merchantPhone: z.string().optional(),
    merchantWebsite: z.string().url().optional().or(z.literal("")),
    businessType: z.enum(["INDIVIDUAL", "BUSINESS", "NGO"]).optional(),
    businessName: z.string().optional(),
    businessRegistration: z.string().optional(),
    settings: z.object({
        webhookUrl: z.string().url().optional(),
        webhookSecret: z.string().optional(),
        allowedOrigins: z.array(z.string()).optional(),
        notificationEmails: z.array(z.string().email()).optional(),
        ipWhitelist: z.array(z.string()).optional(),
    }).optional(),
    notes: z.string().optional(),
});
const merchantIdSchema = z.object({
    id: z.string(),
});
const merchantStatusSchema = z.object({
    id: z.string(),
    status: z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]),
    reason: z.string().optional(),
});
const listMerchantsSchema = z.object({
    status: z.enum(["PENDING", "ACTIVE", "SUSPENDED", "CLOSED"]).optional(),
    teamIds: z.array(z.string()).optional(),
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0),
});
// =============================================================================
// ROUTER
// =============================================================================
export const merchantsRouter = router({
    /**
     * Create a new merchant account
     */
    create: protectedProcedure
        .input(createMerchantSchema)
        .mutation(async ({ ctx, input }) => {
        const merchantId = `mch_${nanoid()}`;
        const merchant = await db.insert(niscPaymentGatewayMerchant).values({
            id: merchantId,
            userId: ctx.session.user.id,
            teamId: input.teamId || null,
            merchantName: input.merchantName,
            merchantEmail: input.merchantEmail,
            merchantPhone: input.merchantPhone || null,
            merchantWebsite: input.merchantWebsite || null,
            businessType: input.businessType,
            businessName: input.businessName || null,
            businessRegistration: input.businessRegistration || null,
            status: "PENDING", // Requires approval
            settings: input.settings || {},
            notes: input.notes || null,
            createdById: ctx.session.user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();
        return {
            success: true,
            merchant: merchant[0],
        };
    }),
    /**
     * List merchants (filtered by user/team based on role)
     */
    list: protectedProcedure
        .input(listMerchantsSchema)
        .query(async ({ ctx, input }) => {
        // Resolve access scope based on user role
        const scope = await resolveGatewayReadScope({
            userId: ctx.session.user.id,
            role: ctx.session.user.role,
            requestedTeamIds: input.teamIds,
        });
        // Build where conditions
        const conditions = [];
        // Filter by status
        if (input.status) {
            conditions.push(eq(niscPaymentGatewayMerchant.status, input.status));
        }
        // Apply access control filter
        const accessFilter = buildGatewayAccessFilter({
            userIdColumn: niscPaymentGatewayMerchant.userId,
            teamIdColumn: niscPaymentGatewayMerchant.teamId,
            scope,
        });
        if (accessFilter) {
            conditions.push(accessFilter);
        }
        const merchants = await db
            .select()
            .from(niscPaymentGatewayMerchant)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(niscPaymentGatewayMerchant.createdAt))
            .limit(input.limit)
            .offset(input.offset);
        return {
            merchants,
            pagination: {
                limit: input.limit,
                offset: input.offset,
                hasMore: merchants.length === input.limit,
            },
        };
    }),
    /**
     * Get merchant details by ID
     */
    getById: protectedProcedure
        .input(merchantIdSchema)
        .query(async ({ ctx, input }) => {
        const merchant = await db
            .select()
            .from(niscPaymentGatewayMerchant)
            .where(eq(niscPaymentGatewayMerchant.id, input.id))
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
            merchant: merchant[0],
        };
    }),
    /**
     * Update merchant details
     */
    update: protectedProcedure
        .input(updateMerchantSchema)
        .mutation(async ({ ctx, input }) => {
        // Check ownership
        const existing = await db
            .select()
            .from(niscPaymentGatewayMerchant)
            .where(eq(niscPaymentGatewayMerchant.id, input.id))
            .limit(1);
        if (!existing[0]) {
            throw new Error("Merchant not found");
        }
        // Access control: Owner or agency super admin
        assertGatewayMutationAccess({
            actorUserId: ctx.session.user.id,
            role: ctx.session.user.role,
            ownerUserId: existing[0].userId,
        });
        // Update
        const updated = await db
            .update(niscPaymentGatewayMerchant)
            .set({
            ...input,
            updatedAt: new Date(),
        })
            .where(eq(niscPaymentGatewayMerchant.id, input.id))
            .returning();
        return {
            success: true,
            merchant: updated[0],
        };
    }),
    /**
     * Update merchant status (activate, suspend, close)
     */
    updateStatus: protectedProcedure
        .input(merchantStatusSchema)
        .mutation(async ({ ctx, input }) => {
        // Check ownership
        const existing = await db
            .select()
            .from(niscPaymentGatewayMerchant)
            .where(eq(niscPaymentGatewayMerchant.id, input.id))
            .limit(1);
        if (!existing[0]) {
            throw new Error("Merchant not found");
        }
        // Access control: Owner or agency super admin
        assertGatewayMutationAccess({
            actorUserId: ctx.session.user.id,
            role: ctx.session.user.role,
            ownerUserId: existing[0].userId,
        });
        // Update status
        const updates = {
            status: input.status,
            updatedAt: new Date(),
        };
        if (input.status === "SUSPENDED") {
            updates.suspendedAt = new Date();
        }
        if (input.status === "CLOSED") {
            updates.closedAt = new Date();
        }
        if (input.reason) {
            updates.notes = `[Status Change] ${input.reason}\n\n${existing[0].notes || ""}`;
        }
        const updated = await db
            .update(niscPaymentGatewayMerchant)
            .set(updates)
            .where(eq(niscPaymentGatewayMerchant.id, input.id))
            .returning();
        return {
            success: true,
            merchant: updated[0],
        };
    }),
    /**
     * Get stats for all merchants based on user's access level
     */
    getStats: protectedProcedure
        .input(z.object({
        teamIds: z.array(z.string()).optional(),
    }).optional())
        .query(async ({ ctx, input }) => {
        // Resolve access scope based on user role
        const scope = await resolveGatewayReadScope({
            userId: ctx.session.user.id,
            role: ctx.session.user.role,
            requestedTeamIds: input?.teamIds,
        });
        // Build access filter
        const accessFilter = buildGatewayAccessFilter({
            userIdColumn: niscPaymentGatewayMerchant.userId,
            teamIdColumn: niscPaymentGatewayMerchant.teamId,
            scope,
        });
        // Get all merchant IDs based on access level
        const userMerchantsQuery = db
            .select({ id: niscPaymentGatewayMerchant.id })
            .from(niscPaymentGatewayMerchant);
        if (accessFilter) {
            userMerchantsQuery.where(accessFilter);
        }
        const userMerchants = await userMerchantsQuery;
        const merchantIds = userMerchants.map(m => m.id);
        if (merchantIds.length === 0) {
            return {
                totalApiKeys: 0,
                activeApiKeys: 0,
                totalTransactions: 0,
                successfulTransactions: 0,
            };
        }
        // Count API keys
        const apiKeyStats = await db
            .select({
            total: sql `count(*)`,
            active: sql `count(*) filter (where ${niscPaymentGatewayApiKey.isActive} = true)`,
        })
            .from(niscPaymentGatewayApiKey)
            .where(sql `${niscPaymentGatewayApiKey.merchantId} IN (${sql.join(merchantIds.map(id => sql `${id}`), sql `, `)})`);
        // Count transactions
        const transactionStats = await db
            .select({
            total: sql `count(*)`,
            successful: sql `count(*) filter (where ${niscPaymentGatewayTransaction.status} = 'COMPLETED')`,
        })
            .from(niscPaymentGatewayTransaction)
            .where(sql `${niscPaymentGatewayTransaction.merchantId} IN (${sql.join(merchantIds.map(id => sql `${id}`), sql `, `)})`);
        return {
            totalApiKeys: Number(apiKeyStats[0]?.total || 0),
            activeApiKeys: Number(apiKeyStats[0]?.active || 0),
            totalTransactions: Number(transactionStats[0]?.total || 0),
            successfulTransactions: Number(transactionStats[0]?.successful || 0),
        };
    }),
});
