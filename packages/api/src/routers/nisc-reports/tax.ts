import { z } from "zod";
import { and, eq, gte, inArray, lte, notInArray } from "@npanel/db";
import { db } from "@npanel/db";
import { invoice } from "@npanel/db/schema/invoicing";
import { protectedProcedure, router } from "../../trpc";
import { reportFiltersSchema, toNum } from "./filters";
import { buildReportEntityScope, resolveReportReadScope } from "./access";
import { OPEN_AR_STATUSES } from "./metrics";

export const niscTaxRouter = router({
  // ─── T-01 Tax Summary ─────────────────────────────────────────────────────
  summary: protectedProcedure
    .input(reportFiltersSchema)
    .output(z.object({
      taxableAmount:       z.number(),
      vatCollected:        z.number(),
      taxCollected:        z.number(),
      pendingTaxAmount:    z.number(),
      pendingVatAmount:    z.number(),
      byTaxRate:           z.array(z.object({
        taxPercentage:   z.number(),
        count:           z.number(),
        taxableAmount:   z.number(),
        taxAmount:       z.number(),
      })),
      currency:            z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const { from, to, teamIds } = input;
      const scope = await resolveReportReadScope({
        userId: ctx.session.user.id,
        role: ctx.session.user.role,
        requestedTeamIds: teamIds,
      });

      const paid = await db
        .select({
          subtotal:      invoice.subtotal,
          vat:           invoice.vat,
          tax:           invoice.tax,
          taxPercentage: invoice.taxPercentage,
        })
        .from(invoice)
        .where(and(
          eq(invoice.status, "PAID"),
          gte(invoice.paidAt, from),
          lte(invoice.paidAt, to),
          buildReportEntityScope({
            teamColumn: invoice.teamId,
            teamIds: scope.teamIds,
          }),
        ));

      const pending = await db
        .select({ tax: invoice.tax, vat: invoice.vat })
        .from(invoice)
        .where(and(
          inArray(invoice.status, [...OPEN_AR_STATUSES, "DRAFT"]),
          buildReportEntityScope({
            teamColumn: invoice.teamId,
            teamIds: scope.teamIds,
          }),
        ));

      let taxableAmount = 0, vatCollected = 0, taxCollected = 0;
      const byRateMap = new Map<number, { count: number; taxableAmount: number; taxAmount: number }>();

      for (const r of paid) {
        taxableAmount += toNum(r.subtotal);
        vatCollected  += toNum(r.vat);
        taxCollected  += toNum(r.tax);
        const rate = r.taxPercentage ?? 0;
        const e = byRateMap.get(rate) ?? { count: 0, taxableAmount: 0, taxAmount: 0 };
        e.count += 1;
        e.taxableAmount += toNum(r.subtotal);
        e.taxAmount     += toNum(r.tax);
        byRateMap.set(rate, e);
      }

      let pendingTaxAmount = 0, pendingVatAmount = 0;
      for (const r of pending) {
        pendingTaxAmount += toNum(r.tax);
        pendingVatAmount += toNum(r.vat);
      }

      return {
        taxableAmount,
        vatCollected,
        taxCollected,
        pendingTaxAmount,
        pendingVatAmount,
        byTaxRate: Array.from(byRateMap.entries())
          .map(([taxPercentage, v]) => ({ taxPercentage, ...v }))
          .sort((a, b) => b.taxPercentage - a.taxPercentage),
        currency: "KES",
      };
    }),
});
