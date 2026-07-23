/**
 * Nisc Payment Gateway - Credentials Management
 * 
 * Manage encrypted payment provider credentials
 */

import { z } from "zod";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";

import { protectedProcedure, router } from "../..";
import { db } from "@npanel/db";
import { env } from "@npanel/env/server";
import {
  niscPaymentGatewayMerchantCredentials,
  niscPaymentGatewayMerchant,
} from "@npanel/db/schema/nisc-payment-gateway";
import {
  encryptCredentials,
  decryptCredentials,
  validateCredentials,
} from "../../lib/nisc-payment-gateway-encryption";
import {
  assertGatewayMutationAccess,
  assertGatewayReadAccess,
} from "../../lib/nisc-payment-gateway-access";

// =============================================================================
// SCHEMAS
// =============================================================================

const addCredentialsSchema = z.object({
  merchantId: z.string(),
  provider: z.enum(["MPESA", "STRIPE", "PAYPAL", "FLUTTERWAVE"]),
  environment: z.enum(["SANDBOX", "PRODUCTION"]),
  credentials: z.any(),
});

const updateCredentialsSchema = z.object({
  id: z.string(),
  environment: z.enum(["SANDBOX", "PRODUCTION"]).optional(),
  credentials: z.any(),
});

const credentialsIdSchema = z.object({
  id: z.string(),
});

const merchantCredentialsSchema = z.object({
  merchantId: z.string(),
  provider: z.enum(["MPESA", "STRIPE", "PAYPAL", "FLUTTERWAVE"]).optional(),
});

const testCredentialsSchema = z.object({
  provider: z.enum(["MPESA", "STRIPE", "PAYPAL", "FLUTTERWAVE"]),
  environment: z.enum(["SANDBOX", "PRODUCTION"]),
  credentials: z.any(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Test M-Pesa credentials by attempting to get an access token
 */
async function testMpesaCredentials(
  credentials: any,
  environment: "SANDBOX" | "PRODUCTION"
): Promise<{ success: boolean; message: string }> {
  try {
    // Get M-Pesa URLs based on environment
    const tokenUrl =
      environment === "PRODUCTION"
        ? env.NISC_GATEWAY_MPESA_PRODUCTION_TOKEN_URL
        : env.NISC_GATEWAY_MPESA_SANDBOX_TOKEN_URL;

    if (!tokenUrl) {
      return {
        success: false,
        message: "M-Pesa API URL not configured on server",
      };
    }

    // Validate required fields
    if (!credentials.consumerKey || !credentials.consumerSecret) {
      return {
        success: false,
        message: "Consumer Key and Consumer Secret are required",
      };
    }

    if (!credentials.shortCode) {
      return {
        success: false,
        message: "Business Short Code is required",
      };
    }

    if (!credentials.passkey) {
      return {
        success: false,
        message: "Passkey is required",
      };
    }

    // Attempt to get access token
    const auth = Buffer.from(
      `${credentials.consumerKey}:${credentials.consumerSecret}`
    ).toString("base64");

    const tokenResponse = await fetch(tokenUrl, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return {
        success: false,
        message: `Authentication failed: Invalid Consumer Key or Consumer Secret. ${errorText}`,
      };
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return {
        success: false,
        message: "Failed to retrieve access token from M-Pesa",
      };
    }

    // If we got here, credentials are valid
    return {
      success: true,
      message: `Credentials verified successfully! Connected to M-Pesa ${environment.toLowerCase()} environment.`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Connection error: ${error.message || "Unable to reach M-Pesa API"}`,
    };
  }
}

// =============================================================================
// ROUTER
// =============================================================================

export const credentialsRouter = router({
  /**
   * Add encrypted credentials for merchant
   */
  add: protectedProcedure
    .input(addCredentialsSchema)
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

      // Validate credentials structure
      validateCredentials(input.credentials, input.provider);

      // Encrypt credentials
      const { encrypted, version } = encryptCredentials(input.credentials);

      // Store in database
      const credentialsId = `cred_${nanoid()}`;
      const stored = await db.insert(niscPaymentGatewayMerchantCredentials).values({
        id: credentialsId,
        merchantId: input.merchantId,
        provider: input.provider,
        environment: input.environment,
        credentialsEncrypted: encrypted,
        encryptionVersion: version,
        encryptedById: ctx.session.user.id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      return {
        success: true,
        credentials: {
          id: stored[0].id,
          provider: stored[0].provider,
          environment: stored[0].environment,
          isActive: stored[0].isActive,
        },
      };
    }),

  /**
   * List credentials for merchant (encrypted fields hidden)
   */
  list: protectedProcedure
    .input(merchantCredentialsSchema)
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

      const conditions = [eq(niscPaymentGatewayMerchantCredentials.merchantId, input.merchantId)];

      if (input.provider) {
        conditions.push(eq(niscPaymentGatewayMerchantCredentials.provider, input.provider));
      }

      const credentials = await db
        .select({
          id: niscPaymentGatewayMerchantCredentials.id,
          provider: niscPaymentGatewayMerchantCredentials.provider,
          environment: niscPaymentGatewayMerchantCredentials.environment,
          isActive: niscPaymentGatewayMerchantCredentials.isActive,
          lastVerifiedAt: niscPaymentGatewayMerchantCredentials.lastVerifiedAt,
          verificationStatus: niscPaymentGatewayMerchantCredentials.verificationStatus,
          createdAt: niscPaymentGatewayMerchantCredentials.createdAt,
        })
        .from(niscPaymentGatewayMerchantCredentials)
        .where(and(...conditions));

      return {
        credentials,
      };
    }),

  /**
   * Get decrypted credentials (SECURITY SENSITIVE - use sparingly)
   */
  getDecrypted: protectedProcedure
    .input(credentialsIdSchema)
    .query(async ({ ctx, input }) => {
      const credentials = await db
        .select()
        .from(niscPaymentGatewayMerchantCredentials)
        .where(eq(niscPaymentGatewayMerchantCredentials.id, input.id))
        .limit(1);

      if (!credentials[0]) {
        throw new Error("Credentials not found");
      }

      // Verify merchant ownership
      const merchant = await db
        .select()
        .from(niscPaymentGatewayMerchant)
        .where(eq(niscPaymentGatewayMerchant.id, credentials[0].merchantId))
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

      // Decrypt
      const decrypted = decryptCredentials(
        credentials[0].credentialsEncrypted,
        credentials[0].encryptionVersion
      );

      return {
        credentials: decrypted,
        provider: credentials[0].provider,
        environment: credentials[0].environment,
      };
    }),

  /**
   * Update credentials
   */
  update: protectedProcedure
    .input(updateCredentialsSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await db
        .select()
        .from(niscPaymentGatewayMerchantCredentials)
        .where(eq(niscPaymentGatewayMerchantCredentials.id, input.id))
        .limit(1);

      if (!existing[0]) {
        throw new Error("Credentials not found");
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

      // Validate and encrypt
      validateCredentials(input.credentials, existing[0].provider as any);
      const { encrypted, version } = encryptCredentials(input.credentials);

      // Update
      const updateData: any = {
        credentialsEncrypted: encrypted,
        encryptionVersion: version,
        encryptedById: ctx.session.user.id,
        updatedAt: new Date(),
      };

      // Update environment if provided
      if (input.environment) {
        updateData.environment = input.environment;
      }

      await db
        .update(niscPaymentGatewayMerchantCredentials)
        .set(updateData)
        .where(eq(niscPaymentGatewayMerchantCredentials.id, input.id));

      return {
        success: true,
      };
    }),

  /**
   * Deactivate credentials
   */
  deactivate: protectedProcedure
    .input(credentialsIdSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await db
        .select()
        .from(niscPaymentGatewayMerchantCredentials)
        .where(eq(niscPaymentGatewayMerchantCredentials.id, input.id))
        .limit(1);

      if (!existing[0]) {
        throw new Error("Credentials not found");
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
        .update(niscPaymentGatewayMerchantCredentials)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(niscPaymentGatewayMerchantCredentials.id, input.id));

      return {
        success: true,
      };
    }),

  /**
   * Test credentials before saving
   * Validates that the provided credentials can authenticate with the payment provider
   */
  test: protectedProcedure
    .input(testCredentialsSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate credentials format
      try {
        validateCredentials(input.credentials, input.provider);
      } catch (error: any) {
        return {
          success: false,
          message: error.message || "Invalid credentials format",
        };
      }

      // Test based on provider
      if (input.provider === "MPESA") {
        return await testMpesaCredentials(input.credentials, input.environment);
      }

      // Other providers not yet implemented
      return {
        success: false,
        message: `Testing for ${input.provider} is not yet implemented`,
      };
    }),
});
