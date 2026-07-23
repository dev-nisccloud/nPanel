/**
 * Nisc Payment Gateway - Access Logs (Analytics & Billing)
 * 
 * Query aggregated access logs for analytics and billing
 */

import { z } from "zod";
import { eq } from "@npanel/db";

import { protectedProcedure, router } from "../..";
import { db } from "@npanel/db";
import { niscPaymentGatewayMerchant } from "@npanel/db/schema/nisc-payment-gateway";
import {
  getMonthlyStats,
  getCurrentMonthStats,
  getDailyStats,
  getBillingSummary,
} from "../../lib/nisc-payment-gateway-access-log";
import {
  assertGatewayReadAccess,
} from "../../lib/nisc-payment-gateway-access";

const monthlyStatsSchema = z.object({
  merchantId: z.string(),
  year: z.number(),
  month: z.number().min(1).max(12),
});

const currentMonthStatsSchema = z.object({
  merchantId: z.string(),
});

const dailyStatsSchema = z.object({
  merchantId: z.string(),
  year: z.number(),
  month: z.number().min(1).max(12),
  day: z.number().min(1).max(31),
});

const billingSummarySchema = z.object({
  merchantId: z.string(),
  year: z.number(),
  month: z.number().min(1).max(12),
  pricePerRequest: z.number().default(10), // cents
});

export const accessLogsRouter = router({
  /**
   * Get monthly statistics
   */
  getMonthlyStats: protectedProcedure
    .input(monthlyStatsSchema)
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

      const stats = await getMonthlyStats(db, input.merchantId, input.year, input.month);

      return {
        merchantId: input.merchantId,
        year: input.year,
        month: input.month,
        stats,
      };
    }),

  /**
   * Get current month statistics
   */
  getCurrentMonthStats: protectedProcedure
    .input(currentMonthStatsSchema)
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

      const stats = await getCurrentMonthStats(db, input.merchantId);
      const now = new Date();

      return {
        merchantId: input.merchantId,
        year: now.getUTCFullYear(),
        month: now.getUTCMonth() + 1,
        stats,
      };
    }),

  /**
   * Get daily statistics
   */
  getDailyStats: protectedProcedure
    .input(dailyStatsSchema)
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

      const stats = await getDailyStats(db, input.merchantId, input.year, input.month, input.day);

      return {
        merchantId: input.merchantId,
        year: input.year,
        month: input.month,
        day: input.day,
        stats,
      };
    }),

  /**
   * Get billing summary (for future billing system)
   */
  getBillingSummary: protectedProcedure
    .input(billingSummarySchema)
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

      const summary = await getBillingSummary(
        db,
        input.merchantId,
        input.year,
        input.month,
        input.pricePerRequest
      );

      return summary;
    }),
});
