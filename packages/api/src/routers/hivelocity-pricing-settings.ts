import { TRPCError } from "@trpc/server";
import * as crypto from "crypto";
import { and, count, desc, eq } from "@npanel/db";
import { db } from "@npanel/db";
import {
  hivelocityPricingSettings,
  hivelocityPricingSettingsActivityLog,
} from "@npanel/db/schema/hivelocity-pricing-settings";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";

const productTypeSchema = z.enum(["DEDICATED_SERVERS", "VPS", "VDS"]);
const marginTypeSchema = z.enum(["PERCENTAGE", "FIXED"]);

function refineMargin(
  data: { marginType?: "PERCENTAGE" | "FIXED" | null; percentageMargin?: string | null; fixedMargin?: string | null },
  ctx: z.RefinementCtx,
  pathPrefix: string[],
) {
  if (data.marginType === "PERCENTAGE" && !data.percentageMargin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Percentage margin is required when margin type is PERCENTAGE",
      path: [...pathPrefix, "percentageMargin"],
    });
  }
  if (data.marginType === "FIXED" && !data.fixedMargin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Fixed margin is required when margin type is FIXED",
      path: [...pathPrefix, "fixedMargin"],
    });
  }
}

const upsertSchema = z
  .object({
    productType: productTypeSchema,
    // Base plan margin
    marginType: marginTypeSchema.optional().nullable(),
    percentageMargin: z.string().optional().nullable(),
    fixedMargin: z.string().optional().nullable(),
    roundOff: z.string().optional().nullable(),

    // OS margin
    osMarginType: marginTypeSchema.optional().nullable(),
    osPercentageMargin: z.string().optional().nullable(),
    osFixedMargin: z.string().optional().nullable(),
    osRoundOff: z.string().optional().nullable(),

    // Add-ons margin
    addonsMarginType: marginTypeSchema.optional().nullable(),
    addonsPercentageMargin: z.string().optional().nullable(),
    addonsFixedMargin: z.string().optional().nullable(),
    addonsRoundOff: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    refineMargin(
      { marginType: data.marginType ?? null, percentageMargin: data.percentageMargin ?? null, fixedMargin: data.fixedMargin ?? null },
      ctx,
      [],
    );
    refineMargin(
      { marginType: data.osMarginType ?? null, percentageMargin: data.osPercentageMargin ?? null, fixedMargin: data.osFixedMargin ?? null },
      ctx,
      ["os"],
    );
    refineMargin(
      {
        marginType: data.addonsMarginType ?? null,
        percentageMargin: data.addonsPercentageMargin ?? null,
        fixedMargin: data.addonsFixedMargin ?? null,
      },
      ctx,
      ["addons"],
    );
  });

const getSchema = z.object({ productType: productTypeSchema });
const deleteSchema = z.object({ productType: productTypeSchema });

const settingsResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  productType: z.string(),
  marginType: z.string().nullable(),
  percentageMargin: z.string().nullable(),
  fixedMargin: z.string().nullable(),
  roundOff: z.string().nullable(),

  osMarginType: z.string().nullable(),
  osPercentageMargin: z.string().nullable(),
  osFixedMargin: z.string().nullable(),
  osRoundOff: z.string().nullable(),

  addonsMarginType: z.string().nullable(),
  addonsPercentageMargin: z.string().nullable(),
  addonsFixedMargin: z.string().nullable(),
  addonsRoundOff: z.string().nullable(),

  isDefault: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  _count: z.object({
    activityLogs: z.number(),
  }),
});

async function fetchByUserAndType(userId: string, productType: z.infer<typeof productTypeSchema>) {
  const [row] = await db
    .select()
    .from(hivelocityPricingSettings)
    .where(and(eq(hivelocityPricingSettings.userId, userId), eq(hivelocityPricingSettings.productType, productType)))
    .limit(1);

  if (!row) return null;

  const logsCountRes = await db
    .select({ value: count() })
    .from(hivelocityPricingSettingsActivityLog)
    .where(eq(hivelocityPricingSettingsActivityLog.hivelocityPricingSettingsId, row.id));

  return {
    ...row,
    _count: {
      activityLogs: Number(logsCountRes[0]?.value ?? 0),
    },
  };
}

async function fetchDefaultByType(productType: z.infer<typeof productTypeSchema>) {
  const [row] = await db
    .select()
    .from(hivelocityPricingSettings)
    .where(and(eq(hivelocityPricingSettings.productType, productType), eq(hivelocityPricingSettings.isDefault, true)))
    .orderBy(desc(hivelocityPricingSettings.updatedAt))
    .limit(1);

  if (!row) return null;

  const logsCountRes = await db
    .select({ value: count() })
    .from(hivelocityPricingSettingsActivityLog)
    .where(eq(hivelocityPricingSettingsActivityLog.hivelocityPricingSettingsId, row.id));

  return {
    ...row,
    _count: {
      activityLogs: Number(logsCountRes[0]?.value ?? 0),
    },
  };
}

function isAgencySuperAdminRole(role: string | null | undefined) {
  return role === "AGENCY_SUPER_ADMIN";
}

function assertOwnerOrSuperAdmin(
  ownerUserId: string,
  actorUserId: string,
  actorRole: string | null | undefined,
) {
  if (ownerUserId !== actorUserId && !isAgencySuperAdminRole(actorRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only the pricing owner or an agency super admin can modify pricing settings.",
    });
  }
}

export const hivelocityPricingSettingsRouter = router({
  get: publicProcedure
    .input(getSchema)
    .output(z.object({ success: z.boolean(), data: settingsResponseSchema.nullable() }))
    .query(async ({ input }) => {
      const data = await fetchDefaultByType(input.productType);
      return { success: true, data };
    }),

  upsert: protectedProcedure
    .input(upsertSchema)
    .output(z.object({ success: z.boolean(), data: settingsResponseSchema }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user!.id;
      const userRole = ctx.session?.user?.role;
      const now = new Date();

      try {
        const existing = await fetchDefaultByType(input.productType);
        if (existing) {
          assertOwnerOrSuperAdmin(existing.userId, userId, userRole);
        }

        const createdOrUpdatedId = await db.transaction(async (tx) => {
          if (!existing) {
            const id = crypto.randomUUID();
            await tx.insert(hivelocityPricingSettings).values({
              id,
              userId,
              productType: input.productType,
              marginType: input.marginType ?? null,
              percentageMargin: input.marginType === "PERCENTAGE" ? input.percentageMargin ?? null : null,
              fixedMargin: input.marginType === "FIXED" ? input.fixedMargin ?? null : null,
              roundOff: input.roundOff ?? null,

              osMarginType: input.osMarginType ?? null,
              osPercentageMargin: input.osMarginType === "PERCENTAGE" ? input.osPercentageMargin ?? null : null,
              osFixedMargin: input.osMarginType === "FIXED" ? input.osFixedMargin ?? null : null,
              osRoundOff: input.osRoundOff ?? null,

              addonsMarginType: input.addonsMarginType ?? null,
              addonsPercentageMargin: input.addonsMarginType === "PERCENTAGE" ? input.addonsPercentageMargin ?? null : null,
              addonsFixedMargin: input.addonsMarginType === "FIXED" ? input.addonsFixedMargin ?? null : null,
              addonsRoundOff: input.addonsRoundOff ?? null,
              isDefault: true,
              createdAt: now,
              updatedAt: now,
            });

            await tx.insert(hivelocityPricingSettingsActivityLog).values({
              id: crypto.randomUUID(),
              userId,
              hivelocityPricingSettingsId: id,
              action: "CREATE",
              description: `Created pricing margin settings for ${input.productType}`,
              metadata: null,
              ipAddress: null,
              userAgent: null,
              createdAt: now,
            });

            return id;
          }

          await tx
            .update(hivelocityPricingSettings)
            .set({
              marginType: input.marginType ?? null,
              percentageMargin: input.marginType === "PERCENTAGE" ? input.percentageMargin ?? null : null,
              fixedMargin: input.marginType === "FIXED" ? input.fixedMargin ?? null : null,
              roundOff: input.roundOff ?? null,

              osMarginType: input.osMarginType ?? null,
              osPercentageMargin: input.osMarginType === "PERCENTAGE" ? input.osPercentageMargin ?? null : null,
              osFixedMargin: input.osMarginType === "FIXED" ? input.osFixedMargin ?? null : null,
              osRoundOff: input.osRoundOff ?? null,

              addonsMarginType: input.addonsMarginType ?? null,
              addonsPercentageMargin: input.addonsMarginType === "PERCENTAGE" ? input.addonsPercentageMargin ?? null : null,
              addonsFixedMargin: input.addonsMarginType === "FIXED" ? input.addonsFixedMargin ?? null : null,
              addonsRoundOff: input.addonsRoundOff ?? null,
              updatedAt: now,
            })
            .where(eq(hivelocityPricingSettings.id, existing.id));

          await tx.insert(hivelocityPricingSettingsActivityLog).values({
            id: crypto.randomUUID(),
            userId,
            hivelocityPricingSettingsId: existing.id,
            action: "UPDATE",
            description: `Updated pricing margin settings for ${input.productType}`,
            metadata: null,
            ipAddress: null,
            userAgent: null,
            createdAt: now,
          });

          return existing.id;
        });

        const data = await fetchDefaultByType(input.productType);
        if (!data || data.id !== createdOrUpdatedId) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Pricing settings could not be fetched after upsert",
          });
        }

        return { success: true, data };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to upsert hivelocity pricing settings:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save pricing settings",
        });
      }
    }),

  delete: protectedProcedure
    .input(deleteSchema)
    .output(z.object({ success: z.boolean(), message: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user!.id;
      const userRole = ctx.session?.user?.role;
      const existing = await fetchDefaultByType(input.productType);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pricing settings not found" });
      }
      assertOwnerOrSuperAdmin(existing.userId, userId, userRole);

      const now = new Date();

      await db.transaction(async (tx) => {
        await tx.insert(hivelocityPricingSettingsActivityLog).values({
          id: crypto.randomUUID(),
          userId,
          hivelocityPricingSettingsId: existing.id,
          action: "DELETE",
          description: `Deleted pricing margin settings for ${input.productType}`,
          metadata: null,
          ipAddress: null,
          userAgent: null,
          createdAt: now,
        });

        await tx
          .delete(hivelocityPricingSettings)
          .where(eq(hivelocityPricingSettings.id, existing.id));
      });

      return { success: true, message: "Pricing settings deleted" };
    }),

  getActivityLogs: protectedProcedure
    .input(z.object({ productType: productTypeSchema, limit: z.number().min(1).max(100).default(50), offset: z.number().min(0).default(0) }))
    .output(
      z.object({
        success: z.boolean(),
        data: z.array(
          z.object({
            id: z.string(),
            userId: z.string(),
            hivelocityPricingSettingsId: z.string(),
            action: z.string(),
            description: z.string().nullable(),
            metadata: z.any().nullable(),
            ipAddress: z.string().nullable(),
            userAgent: z.string().nullable(),
            createdAt: z.date(),
          }),
        ),
        pagination: z.object({
          total: z.number(),
          limit: z.number(),
          offset: z.number(),
          hasMore: z.boolean(),
        }),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session!.user!.id;
      const userRole = ctx.session?.user?.role;
      const settings = await fetchDefaultByType(input.productType);
      if (!settings) {
        return {
          success: true,
          data: [],
          pagination: { total: 0, limit: input.limit, offset: input.offset, hasMore: false },
        };
      }
      assertOwnerOrSuperAdmin(settings.userId, userId, userRole);

      const [rows, totalRes] = await Promise.all([
        db
          .select()
          .from(hivelocityPricingSettingsActivityLog)
          .where(eq(hivelocityPricingSettingsActivityLog.hivelocityPricingSettingsId, settings.id))
          .orderBy(desc(hivelocityPricingSettingsActivityLog.createdAt))
          .limit(input.limit)
          .offset(input.offset),
        db
          .select({ value: count() })
          .from(hivelocityPricingSettingsActivityLog)
          .where(eq(hivelocityPricingSettingsActivityLog.hivelocityPricingSettingsId, settings.id)),
      ]);

      const total = Number(totalRes[0]?.value ?? 0);
      return {
        success: true,
        data: rows,
        pagination: {
          total,
          limit: input.limit,
          offset: input.offset,
          hasMore: input.offset + input.limit < total,
        },
      };
    }),
});

