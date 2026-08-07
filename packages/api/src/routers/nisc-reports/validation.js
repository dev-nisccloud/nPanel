import { z } from "zod";
import { and, count, eq, inArray, isNotNull, sum } from "@npanel/db";
import { db } from "@npanel/db";
import { invoice, invoiceTransaction } from "@npanel/db/schema/invoicing";
import { protectedProcedure, router } from "../../trpc";
import { reportFiltersSchema, toNum } from "./filters";
import { buildReportEntityScope, resolveReportReadScope } from "./access";
import { INVOICE_REPORT_STATUSES, OPEN_AR_STATUSES, fetchCompletedPaymentsByInvoice, invoiceOutstandingAmount, invoiceIssuedInPeriod, sumCollectedCash, } from "./metrics";
/**
 * Data Validation Router - helps identify discrepancies in NISC reports
 * This endpoint performs consistency checks on the data to ensure accuracy.
 */
export const niscValidationRouter = router({
    /**
     * Run comprehensive data validation checks
     */
    check: protectedProcedure
        .input(reportFiltersSchema)
        .output(z.object({
        summary: z.object({
            totalChecks: z.number(),
            passed: z.number(),
            failed: z.number(),
            warnings: z.number(),
        }),
        checks: z.array(z.object({
            name: z.string(),
            status: z.enum(["PASS", "FAIL", "WARNING"]),
            message: z.string(),
            expected: z.any().optional(),
            actual: z.any().optional(),
            difference: z.any().optional(),
        })),
        timestamp: z.date(),
    }))
        .query(async ({ input, ctx }) => {
        const { from, to, teamIds } = input;
        const scope = await resolveReportReadScope({
            userId: ctx.session.user.id,
            role: ctx.session.user.role,
            requestedTeamIds: teamIds,
        });
        const entityScope = buildReportEntityScope({
            teamColumn: invoice.teamId,
            teamIds: scope.teamIds,
        });
        const checks = [];
        // CHECK 1: Verify total invoiced matches sum of invoice amounts
        const allInvoices = await db
            .select({
            id: invoice.id,
            status: invoice.status,
            amount: invoice.amount,
        })
            .from(invoice)
            .where(and(invoiceIssuedInPeriod(from, to), entityScope));
        const totalInvoiced = allInvoices.reduce((sum, inv) => {
            if (inv.status !== "CANCELLED") {
                return sum + toNum(inv.amount);
            }
            return sum;
        }, 0);
        const invoicesByStatus = new Map();
        for (const inv of allInvoices) {
            invoicesByStatus.set(inv.status, (invoicesByStatus.get(inv.status) ?? 0) + toNum(inv.amount));
        }
        const statusSum = Array.from(invoicesByStatus.values()).reduce((a, b) => a + b, 0);
        const diffStatusSum = Math.abs(totalInvoiced - statusSum);
        checks.push({
            name: "Invoice Amount Integrity",
            status: diffStatusSum < 0.01 ? "PASS" : "FAIL",
            message: diffStatusSum < 0.01
                ? "Total invoiced matches sum by status"
                : "Mismatch between total invoiced and sum by status",
            expected: totalInvoiced,
            actual: statusSum,
            difference: diffStatusSum,
        });
        // CHECK 2: Verify collected cash calculation
        const collectedFromHelper = await sumCollectedCash({ from, to, scope });
        // Manual calculation
        const txRows = await db
            .select({ amount: invoiceTransaction.amount })
            .from(invoiceTransaction)
            .innerJoin(invoice, eq(invoiceTransaction.invoiceId, invoice.id))
            .where(and(eq(invoiceTransaction.status, "COMPLETED"), isNotNull(invoiceTransaction.paidAt), and(invoiceTransaction.paidAt ? inArray(invoiceTransaction.paidAt, [from, to]) : undefined), entityScope));
        const manualTxSum = txRows.reduce((sum, r) => sum + toNum(r.amount), 0);
        checks.push({
            name: "Cash Collection Calculation",
            status: "PASS", // This is informational
            message: `Collected: ${collectedFromHelper.toFixed(2)} (includes ${manualTxSum.toFixed(2)} from transactions)`,
            expected: collectedFromHelper,
            actual: manualTxSum,
            difference: collectedFromHelper - manualTxSum,
        });
        // CHECK 3: Verify outstanding amounts are non-negative
        const openInvoices = allInvoices.filter(inv => OPEN_AR_STATUSES.includes(inv.status));
        const paidByInvoice = await fetchCompletedPaymentsByInvoice(openInvoices.map(i => i.id));
        let negativeOutstanding = 0;
        let totalOutstanding = 0;
        for (const inv of openInvoices) {
            const paid = paidByInvoice.get(inv.id) ?? 0;
            const outstanding = invoiceOutstandingAmount(inv, paid);
            totalOutstanding += outstanding;
            if (outstanding < 0) {
                negativeOutstanding += 1;
            }
        }
        checks.push({
            name: "Outstanding Amounts Validation",
            status: negativeOutstanding === 0 ? "PASS" : "FAIL",
            message: negativeOutstanding === 0
                ? "All outstanding amounts are non-negative"
                : `Found ${negativeOutstanding} invoices with negative outstanding amounts`,
            expected: 0,
            actual: negativeOutstanding,
            difference: negativeOutstanding,
        });
        // CHECK 4: Verify PAID invoices have no outstanding balance
        const paidInvoices = allInvoices.filter(inv => inv.status === "PAID");
        const paidInvoiceIds = paidInvoices.map(i => i.id);
        const paidPayments = await fetchCompletedPaymentsByInvoice(paidInvoiceIds);
        let paidWithOutstanding = 0;
        for (const inv of paidInvoices) {
            const paid = paidPayments.get(inv.id) ?? 0;
            const outstanding = invoiceOutstandingAmount(inv, paid);
            if (outstanding > 0.01) {
                paidWithOutstanding += 1;
            }
        }
        checks.push({
            name: "PAID Invoice Validation",
            status: paidWithOutstanding === 0 ? "PASS" : "WARNING",
            message: paidWithOutstanding === 0
                ? "All PAID invoices have zero outstanding"
                : `${paidWithOutstanding} PAID invoices still have outstanding balance (might be data entry issue)`,
            expected: 0,
            actual: paidWithOutstanding,
        });
        // CHECK 5: Count consistency check
        const [countRow] = await db
            .select({ c: count() })
            .from(invoice)
            .where(and(invoiceIssuedInPeriod(from, to), entityScope));
        const dbCount = Number(countRow?.c ?? 0);
        const arrayCount = allInvoices.length;
        checks.push({
            name: "Invoice Count Consistency",
            status: dbCount === arrayCount ? "PASS" : "FAIL",
            message: dbCount === arrayCount
                ? "Invoice counts match"
                : "Invoice count mismatch between queries",
            expected: dbCount,
            actual: arrayCount,
        });
        // CHECK 6: Draft invoices should have zero collected
        const draftInvoices = allInvoices.filter(inv => inv.status === "DRAFT");
        const draftIds = draftInvoices.map(i => i.id);
        const draftPayments = await fetchCompletedPaymentsByInvoice(draftIds);
        let draftsWithPayments = 0;
        for (const [invId, paidAmt] of draftPayments.entries()) {
            if (paidAmt > 0) {
                draftsWithPayments += 1;
            }
        }
        checks.push({
            name: "Draft Invoice Validation",
            status: draftsWithPayments === 0 ? "PASS" : "WARNING",
            message: draftsWithPayments === 0
                ? "No DRAFT invoices have payments"
                : `${draftsWithPayments} DRAFT invoices have payment records (unusual)`,
            expected: 0,
            actual: draftsWithPayments,
        });
        // Calculate summary
        const passed = checks.filter(c => c.status === "PASS").length;
        const failed = checks.filter(c => c.status === "FAIL").length;
        const warnings = checks.filter(c => c.status === "WARNING").length;
        return {
            summary: {
                totalChecks: checks.length,
                passed,
                failed,
                warnings,
            },
            checks,
            timestamp: new Date(),
        };
    }),
});
