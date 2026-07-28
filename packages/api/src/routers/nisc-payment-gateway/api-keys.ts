/**
 * Nisc Payment Gateway - API Keys Management
 * 
 * Create and manage API keys for external access
 */

import { z } from "zod";
import { nanoid } from "nanoid";
import { eq, and, desc } from "@npanel/db";

import { protectedProcedure, router } from "../..";
import { db } from "@npanel/db";
import {
  niscPaymentGatewayApiKey,
  niscPaymentGatewayMerchant,
} from "@npanel/db/schema/nisc-payment-gateway";
import {
  generateApiKey,
  DEFAULT_PERMISSIONS,
  ALL_PERMISSIONS,
  getKeyPrefix,
  maskApiKeyPartial,
} from "../../lib/nisc-payment-gateway-api-key";
import {
  assertGatewayMutationAccess,
  assertGatewayReadAccess,
} from "../../lib/nisc-payment-gateway-access";

// =============================================================================
// SCHEMAS
// =============================================================================

/** Normalize UI aliases (SANDBOX/PRODUCTION) to stored key env (test/live). */
const apiKeyEnvironmentSchema = z
  .enum(["test", "live", "SANDBOX", "PRODUCTION"])
  .transform((value): "test" | "live" =>
    value === "test" || value === "SANDBOX" ? "test" : "live"
  );

const createApiKeySchema = z.object({
  merchantId: z.string(),
  name: z.string().min(1, "Key name is required"),
  environment: apiKeyEnvironmentSchema,
  permissions: z.array(z.enum(ALL_PERMISSIONS as any)).default(DEFAULT_PERMISSIONS as any),
  rateLimit: z.number().min(10).max(1000).default(100),
  allowedIps: z.array(z.string()).optional(),
  expiresAt: z.date().optional(),
});

const listApiKeysSchema = z.object({
  merchantId: z.string(),
  environment: apiKeyEnvironmentSchema.optional(),
  isActive: z.boolean().optional(),
});

const revokeApiKeySchema = z.object({
  id: z.string(),
});

// =============================================================================
// ROUTER
// =============================================================================

export const apiKeysRouter = router({
  /**
   * Create new API key for merchant
   */
  create: protectedProcedure
    .input(createApiKeySchema)
    .mutation(async ({ ctx, input }) => {
      // Verify merchant ownership
      const merchant = await db
        .select()
        .from(niscPaymentGatewayMerchant)
        .where(eq(niscPaymentGatewayMerchant.id, input.merchantId))
        .limit(1);

      if (!merchant[0]) {
        throw new Error("Merchant not found");
      }

      // Access control: Owner or agency super admin
      assertGatewayMutationAccess({
        actorUserId: ctx.session.user.id,
        role: ctx.session.user.role,
        ownerUserId: merchant[0].userId,
      });

      // Generate API key
      const { key, keyPrefix, keyHash, environment } = await generateApiKey(input.environment);

      // Store in database
      const apiKeyId = `key_${nanoid()}`;
      const stored = await db.insert(niscPaymentGatewayApiKey).values({
        id: apiKeyId,
        merchantId: input.merchantId,
        name: input.name,
        keyPrefix,
        keyHash,
        permissions: input.permissions,
        environment,
        rateLimit: input.rateLimit,
        allowedIps: input.allowedIps || null,
        isActive: true,
        expiresAt: input.expiresAt || null,
        createdById: ctx.session.user.id,
        createdAt: new Date(),
      }).returning();

      return {
        success: true,
        apiKey: stored[0],
        key, // IMPORTANT: Show key ONCE, never retrievable
      };
    }),

  /**
   * List API keys for merchant
   */
  list: protectedProcedure
    .input(listApiKeysSchema)
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

      // Access control: Owner or agency super admin
      assertGatewayMutationAccess({
        actorUserId: ctx.session.user.id,
        role: ctx.session.user.role,
        ownerUserId: merchant[0].userId,
      });

      const conditions = [eq(niscPaymentGatewayApiKey.merchantId, input.merchantId)];

      if (input.environment) {
        conditions.push(eq(niscPaymentGatewayApiKey.environment, input.environment));
      }

      if (input.isActive !== undefined) {
        conditions.push(eq(niscPaymentGatewayApiKey.isActive, input.isActive));
      }

      const apiKeys = await db
        .select({
          id: niscPaymentGatewayApiKey.id,
          name: niscPaymentGatewayApiKey.name,
          keyPrefix: niscPaymentGatewayApiKey.keyPrefix,
          permissions: niscPaymentGatewayApiKey.permissions,
          environment: niscPaymentGatewayApiKey.environment,
          rateLimit: niscPaymentGatewayApiKey.rateLimit,
          allowedIps: niscPaymentGatewayApiKey.allowedIps,
          isActive: niscPaymentGatewayApiKey.isActive,
          expiresAt: niscPaymentGatewayApiKey.expiresAt,
          lastUsedAt: niscPaymentGatewayApiKey.lastUsedAt,
          createdAt: niscPaymentGatewayApiKey.createdAt,
        })
        .from(niscPaymentGatewayApiKey)
        .where(and(...conditions))
        .orderBy(desc(niscPaymentGatewayApiKey.createdAt));

      return {
        apiKeys,
      };
    }),

  /**
   * Revoke API key
   */
  revoke: protectedProcedure
    .input(revokeApiKeySchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await db
        .select()
        .from(niscPaymentGatewayApiKey)
        .where(eq(niscPaymentGatewayApiKey.id, input.id))
        .limit(1);

      if (!existing[0]) {
        throw new Error("API key not found");
      }

      // Verify merchant ownership
      const merchant = await db
        .select()
        .from(niscPaymentGatewayMerchant)
        .where(eq(niscPaymentGatewayMerchant.id, existing[0].merchantId))
        .limit(1);

      if (!merchant[0]) {
        throw new Error("Merchant not found");
      }

      // Access control: Owner or agency super admin
      assertGatewayMutationAccess({
        actorUserId: ctx.session.user.id,
        role: ctx.session.user.role,
        ownerUserId: merchant[0].userId,
      });

      await db
        .update(niscPaymentGatewayApiKey)
        .set({
          isActive: false,
          revokedAt: new Date(),
          revokedById: ctx.session.user.id,
        })
        .where(eq(niscPaymentGatewayApiKey.id, input.id));

      return {
        success: true,
      };
    }),
});
