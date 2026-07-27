import { z } from "zod";
import { and, eq, gte, inArray, isNotNull, lte, notInArray } from "@npanel/db";
import { db } from "@npanel/db";
import { invoice, invoiceTransaction } from "@npanel/db/schema/invoicing";
import { protectedProcedure, router } from "../../trpc";
import { reportFiltersSchema, toNum } from "./filters";
import { buildReportEntityScope, resolveReportReadScope } from "./access";
import { invoiceIssuedInPeriod, OPEN_AR_STATUSES } from "./metrics";

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

      // FIXED: Get invoices with PAID or PARTIALLY_PAID status and calculate proportional tax
      const paid = await db
        .select({
          id:            invoice.id,
          subtotal:      invoice.subtotal,
          amount:        invoice.amount,
          vat:           invoice.vat,
          tax:           invoice.tax,
          taxPercentage: invoice.taxPercentage,
          status:        invoice.status,
        })
        .from(invoice)
        .where(and(
          inArray(invoice.status, ["PAID", "PARTIALLY_PAID"]),
          isNotNull(invoice.paidAt),
          gte(invoice.paidAt, from),
          lte(invoice.paidAt, to),
          buildReportEntityScope({
            teamColumn: invoice.teamId,
            teamIds: scope.teamIds,
          }),
        ));

      // Get completed payments for proportional tax calculation
      const invoiceIds = paid.map(p => p.id);
      const paidAmounts = new Map<string, number>();
      
      if (invoiceIds.length > 0) {
        const txRows = await db
          .select({
            invoiceId: invoiceTransaction.invoiceId,
            amount: invoiceTransaction.amount,
          })
          .from(invoiceTransaction)
          .where(
            and(
              inArray(invoiceTransaction.invoiceId, invoiceIds),
              eq(invoiceTransaction.status, "COMPLETED"),
            ),
          );
        
        for (const tx of txRows) {
          const amt = toNum(tx.amount);
          paidAmounts.set(tx.invoiceId, (paidAmounts.get(tx.invoiceId) ?? 0) + amt);
        }
      }

      const pending = await db
        .select({ tax: invoice.tax, vat: invoice.vat })
        .from(invoice)
        .where(and(
          inArray(invoice.status, [...OPEN_AR_STATUSES, "DRAFT"]),
          invoiceIssuedInPeriod(from, to),
          buildReportEntityScope({
            teamColumn: invoice.teamId,
            teamIds: scope.teamIds,
          }),
        ));

      let taxableAmount = 0, vatCollected = 0, taxCollected = 0;
      const byRateMap = new Map<number, { count: number; taxableAmount: number; taxAmount: number }>();

      for (const r of paid) {
        const invAmount = toNum(r.amount);
        const invSubtotal = toNum(r.subtotal);
        const invVat = toNum(r.vat);
        const invTax = toNum(r.tax);
        
        // Calculate what's actually been paid
        let actualPaid = paidAmounts.get(r.id) ?? 0;
        if (r.status === "PAID" && actualPaid < invAmount) {
          actualPaid = invAmount; // Impute if transactions are incomplete
        }
        
        // Calculate proportional tax based on payment received
        const paymentRatio = invAmount > 0 ? Math.min(1, actualPaid / invAmount) : 0;
        
        const proportionalSubtotal = invSubtotal * paymentRatio;
        const proportionalVat = invVat * paymentRatio;
        const proportionalTax = invTax * paymentRatio;
        
        taxableAmount += proportionalSubtotal;
        vatCollected  += proportionalVat;
        taxCollected  += proportionalTax;
        
        const rate = r.taxPercentage ?? 0;
        const e = byRateMap.get(rate) ?? { count: 0, taxableAmount: 0, taxAmount: 0 };
        e.count += 1;
        e.taxableAmount += proportionalSubtotal;
        e.taxAmount     += proportionalTax;
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
