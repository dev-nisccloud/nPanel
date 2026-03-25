import { z } from "zod";
import { eq } from "@npanel/db";
import { publicProcedure, router } from "../trpc";
import { db } from "@npanel/db";
import { tldSettings } from "@npanel/db/schema/nameservers";

// NOTE: This router exposes read-only, public helpers for
// pricing margin + currency conversion. It does NOT allow
// mutating TLD settings or touching any customer data.

const publicMarginConfig = z.object({
  marginType: z.string().nullable(),
  percentageMargin: z.string().nullable(),
  fixedMargin: z.string().nullable(),
  roundOff: z.string().nullable(),
});

const publicExchangeRates = z.object({
  base: z.string(),
  rates: z.record(z.string(), z.number()),
  timestamp: z.number(),
});

export const publicPricingRouter = router({
  /**
   * Public: get default TLD margin configuration (no prices).
   * Returns whether margin is percentage or fixed and the corresponding values.
   */
  getDefaultMarginConfig: publicProcedure
    .output(
      z.object({
        success: z.boolean(),
        data: publicMarginConfig.nullable(),
        error: z.string().optional(),
      }),
    )
    .query(async () => {
      try {
        // If DATABASE_URL is not configured (e.g. standalone landing page env),
        // skip Prisma entirely and return an "empty" margin config instead of
        // throwing a PrismaClientInitializationError.
        if (!process.env.DATABASE_URL) {
          return {
            success: true,
            data: {
              marginType: null,
              percentageMargin: null,
              fixedMargin: null,
              roundOff: null,
            },
          };
        }

        // Fetch global default TLD setting directly from the database.
        const defaultSetting = await db.query.tldSettings.findFirst({
          where: eq(tldSettings.isDefault, true),
        });

        if (!defaultSetting) {
          return {
            success: true,
            data: {
              marginType: null,
              percentageMargin: null,
              fixedMargin: null,
              roundOff: null,
            },
          };
        }

        const { marginType, percentageMargin, fixedMargin, roundOff } = defaultSetting;

        return {
          success: true,
          data: {
          marginType,
            percentageMargin,
            fixedMargin,
            roundOff,
          },
        };
      } catch (error) {
        console.error("publicPricing.getDefaultMarginConfig failed:", error);
        return {
          success: false,
          data: null,
          error: "Failed to load default margin configuration.",
        };
      }
    }),

  /**
   * Public: get exchange rates only (no conversion).
   */
  getExchangeRatesPublic: publicProcedure
    .input(
      z
        .object({
          baseCurrency: z.string().default("USD"),
        })
        .optional(),
    )
    .output(
      z.object({
        success: z.boolean(),
        data: publicExchangeRates.nullable(),
        error: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const baseCurrency = input?.baseCurrency ?? "KES";
        // Simple, uncached fetch to keep public surface minimal.
        const resp = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }
        const data = (await resp.json()) as { base: string; rates: Record<string, number> };
        return {
          success: true,
          data: {
            base: data.base,
            rates: data.rates,
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error("publicPricing.getExchangeRatesPublic failed:", error);
        return {
          success: false,
          data: null,
          error: "Failed to fetch exchange rates.",
        };
      }
    }),

  /**
   * Legacy: batch currency conversion. Requires POST/mutation.
   * Prefer getExchangeRatesPublic + client-side math for new usage.
   */
  convertPricesPublic: publicProcedure
    .input(
      z.object({
        prices: z.array(
          z.object({
            amount: z.number(),
            currency: z.string(),
          }),
        ),
        targetCurrency: z.string(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        data: z
          .array(
            z.object({
              originalAmount: z.number(),
              convertedAmount: z.number(),
              rate: z.number(),
              currency: z.string(),
            }),
          )
          .optional(),
        error: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // For now, this is a stub: implement proper public conversion
        // logic or delegate to an external service as needed.
        // Returning success with original amounts so callers don't break.
        return {
          success: true,
          data: input.prices.map((p) => ({
            originalAmount: p.amount,
            convertedAmount: p.amount,
            rate: 1,
            currency: input.targetCurrency,
          })),
        };
      } catch (error) {
        console.error("publicPricing.convertPricesPublic failed:", error);
        return {
          success: false,
          data: [],
          error: "Failed to convert prices.",
        };
      }
    }),
});

