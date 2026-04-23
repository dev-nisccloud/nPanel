import * as crypto from "node:crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq } from "@npanel/db";
import { protectedProcedure, router } from "../trpc";
import { db } from "@npanel/db";
import {
  niscClientSubscription,
  niscClientSubscriptionUsage,
  niscClientSubscriptionUsageActivityLog,
} from "@npanel/db/schema/products";

// ============================================================================
// ZOD SCHEMAS   independent from the database schema layer
// ============================================================================

const subscriptionUsageOutputSchema = z.object({
  id: z.string(),
  subscriptionId: z.string(),
  usageKind: z.string(),
  credits: z.string(),
  metadata: z.unknown().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const getOrCreateUsageInputSchema = z.object({
  subscriptionId: z.string(),
  usageKind: z.string().min(1).max(100),
  initialCredits: z.string().optional(), // used only when creating
});

const listForSubscriptionInputSchema = z.object({
  subscriptionId: z.string(),
});

const setCreditsInputSchema = z.object({
  subscriptionUsageId: z.string(),
  credits: z.string(),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const creditActionSchema = z.enum(["CREDIT_USE", "CREDIT_ADD", "CREDIT_RESET", "CREDIT_ADJUST"]);

const addCreditsInputSchema = z.object({
  subscriptionUsageId: z.string(),
  delta: z.string(), // positive to add, negative to subtract (e.g. "-1" for one use)
  action: creditActionSchema,
  description: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const listActivityLogsInputSchema = z.object({
  subscriptionUsageId: z.string(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});

const activityLogOutputSchema = z.object({
  id: z.string(),
  subscriptionUsageId: z.string(),
  userId: z.string(),
  action: z.string(),
  description: z.string().nullable(),
  metadata: z.unknown().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.coerce.date(),
});

// ============================================================================
// HELPERS
// ============================================================================

function mapSubscriptionUsage(row: {
  id: string;
  subscriptionId: string;
  usageKind: string;
  credits: string;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): z.infer<typeof subscriptionUsageOutputSchema> {
  return {
    id: row.id,
    subscriptionId: row.subscriptionId,
    usageKind: row.usageKind,
    credits: row.credits,
    metadata: row.metadata ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapActivityLog(row: {
  id: string;
  subscriptionUsageId: string;
  userId: string;
  action: string;
  description: string | null;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}): z.infer<typeof activityLogOutputSchema> {
  return {
    id: row.id,
    subscriptionUsageId: row.subscriptionUsageId,
    userId: row.userId,
    action: row.action,
    description: row.description ?? null,
    metadata: row.metadata ?? null,
    ipAddress: row.ipAddress ?? null,
    userAgent: row.userAgent ?? null,
    createdAt: row.createdAt,
  };
}

/** Parse credits as number for comparison; "unlimited" or invalid => null (no cap). */
function parseCreditsAsNumber(value: string): number | null {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "unlimited" || trimmed === "") return null;
  const n = Number.parseFloat(trimmed);
  return Number.isFinite(n) ? n : null;
}

// ============================================================================
// ROUTER
// ============================================================================

export const subscriptionUsageRouter = router({
  /** Get existing usage row or create one for (subscriptionId, usageKind). Optionally set initialCredits on create. */
  getOrCreateUsage: protectedProcedure
    .input(getOrCreateUsageInputSchema)
    .output(subscriptionUsageOutputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
      }
      const [existing] = await db
        .select()
        .from(niscClientSubscriptionUsage)
        .where(
          and(
            eq(niscClientSubscriptionUsage.subscriptionId, input.subscriptionId),
            eq(niscClientSubscriptionUsage.usageKind, input.usageKind),
          ),
        )
        .limit(1);
      if (existing) return mapSubscriptionUsage(existing);

      const [subscription] = await db
        .select({ id: niscClientSubscription.id })
        .from(niscClientSubscription)
        .where(eq(niscClientSubscription.id, input.subscriptionId))
        .limit(1);
      if (!subscription) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found" });
      }

      const [created] = await db
        .insert(niscClientSubscriptionUsage)
        .values({
          id: crypto.randomUUID(),
          subscriptionId: input.subscriptionId,
          usageKind: input.usageKind,
          credits: input.initialCredits ?? "0",
        })
        .returning();
      if (!created) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create usage row" });
      }
      return mapSubscriptionUsage(created);
    }),

  /** Get a single usage row by id. */
  getUsageById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(subscriptionUsageOutputSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
      }
      const [row] = await db
        .select()
        .from(niscClientSubscriptionUsage)
        .where(eq(niscClientSubscriptionUsage.id, input.id))
        .limit(1);
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Subscription usage not found" });
      }
      return mapSubscriptionUsage(row);
    }),

  /** List all usage rows for a subscription. */
  listForSubscription: protectedProcedure
    .input(listForSubscriptionInputSchema)
    .output(z.array(subscriptionUsageOutputSchema))
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
      }
      const rows = await db
        .select()
        .from(niscClientSubscriptionUsage)
        .where(eq(niscClientSubscriptionUsage.subscriptionId, input.subscriptionId))
        .orderBy(asc(niscClientSubscriptionUsage.usageKind));
      return rows.map(mapSubscriptionUsage);
    }),

  /** Set credits to an absolute value and log the change. */
  setCredits: protectedProcedure
    .input(setCreditsInputSchema)
    .output(subscriptionUsageOutputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
      }
      const [usage] = await db
        .select()
        .from(niscClientSubscriptionUsage)
        .where(eq(niscClientSubscriptionUsage.id, input.subscriptionUsageId))
        .limit(1);
      if (!usage) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Subscription usage not found" });
      }
      const previousCredits = usage.credits;
      const [updated] = await db
        .update(niscClientSubscriptionUsage)
        .set({
          credits: input.credits,
          ...(input.metadata != null ? { metadata: input.metadata } : {}),
        })
        .where(eq(niscClientSubscriptionUsage.id, input.subscriptionUsageId))
        .returning();
      if (!updated) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update usage" });
      }
      await db.insert(niscClientSubscriptionUsageActivityLog).values({
        id: crypto.randomUUID(),
        subscriptionUsageId: input.subscriptionUsageId,
        userId: ctx.session.user.id,
        action: "CREDIT_ADJUST",
        description: input.description ?? `Credits set to ${input.credits}`,
        metadata:
          input.metadata != null
            ? { ...input.metadata, previousCredits, newCredits: input.credits }
            : { previousCredits, newCredits: input.credits },
        ipAddress: null,
        userAgent: null,
      });
      return mapSubscriptionUsage(updated);
    }),

  /** Add or subtract credits (delta: positive = add, negative = consume) and log. Returns updated usage. */
  addCredits: protectedProcedure
    .input(addCreditsInputSchema)
    .output(
      z.object({
        usage: subscriptionUsageOutputSchema,
        previousCredits: z.string(),
        newCredits: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
      }
      const [usage] = await db
        .select()
        .from(niscClientSubscriptionUsage)
        .where(eq(niscClientSubscriptionUsage.id, input.subscriptionUsageId))
        .limit(1);
      if (!usage) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Subscription usage not found" });
      }
      const current = parseCreditsAsNumber(usage.credits);
      const delta = Number.parseFloat(input.delta);
      if (!Number.isFinite(delta)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid delta" });
      }
      const previousCredits = usage.credits;
      let newValue: number;
      if (current === null) {
        newValue = delta;
      } else {
        newValue = Math.max(0, current + delta);
      }
      const newCredits = String(newValue);
      const [updated] = await db
        .update(niscClientSubscriptionUsage)
        .set({ credits: newCredits })
        .where(eq(niscClientSubscriptionUsage.id, input.subscriptionUsageId))
        .returning();
      if (!updated) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update usage" });
      }
      await db.insert(niscClientSubscriptionUsageActivityLog).values({
        id: crypto.randomUUID(),
        subscriptionUsageId: input.subscriptionUsageId,
        userId: ctx.session.user.id,
        action: input.action,
        description: input.description ?? null,
        metadata:
          input.metadata != null
            ? { ...input.metadata, amount: input.delta, previousCredits, newCredits }
            : { amount: input.delta, previousCredits, newCredits },
        ipAddress: null,
        userAgent: null,
      });
      return {
        usage: mapSubscriptionUsage(updated),
        previousCredits,
        newCredits,
      };
    }),

  /** List activity logs for a subscription usage row. */
  listActivityLogs: protectedProcedure
    .input(listActivityLogsInputSchema)
    .output(
      z.object({
        items: z.array(activityLogOutputSchema),
        total: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
      }
      const whereUsage = eq(
        niscClientSubscriptionUsageActivityLog.subscriptionUsageId,
        input.subscriptionUsageId,
      );
      const [items, totalRow] = await Promise.all([
        db
          .select()
          .from(niscClientSubscriptionUsageActivityLog)
          .where(whereUsage)
          .orderBy(desc(niscClientSubscriptionUsageActivityLog.createdAt))
          .limit(input.limit)
          .offset(input.offset),
        db
          .select({ value: count(niscClientSubscriptionUsageActivityLog.id) })
          .from(niscClientSubscriptionUsageActivityLog)
          .where(whereUsage),
      ]);
      return {
        items: items.map(mapActivityLog),
        total: Number(totalRow[0]?.value ?? 0),
      };
    }),
});
