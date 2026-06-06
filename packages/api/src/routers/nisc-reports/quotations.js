import { z } from "zod";
import { and, count, desc, eq, gte, inArray, lte } from "@npanel/db";
import { db } from "@npanel/db";
import { quotation } from "@npanel/db/schema/quotations";
import { protectedProcedure, router } from "../../trpc";
import { normalizeQuotationStatus, quotationReportAmount, reportFiltersSchema } from "./filters";
import { differenceInDays } from "date-fns";
import { resolveReportReadScope } from "./access";
export const niscQuotationsRouter = router({
    // ─── Q-01 Pipeline Overview ────────────────────────────────────────────────
    pipeline: protectedProcedure
        .input(reportFiltersSchema)
        .output(z.object({
        inPreparation: z.number(), // DRAFT value
        activePipeline: z.number(), // SENT value
        wonValue: z.number(), // ACCEPTED
        lostValue: z.number(), // DECLINED
        expiredValue: z.number(), // EXPIRED
        winRate: z.number(),
        avgQuoteValue: z.number(),
        avgTimeToDecision: z.number(),
        avgTimeToSend: z.number(),
        byStatus: z.array(z.object({ status: z.string(), count: z.number(), amount: z.number() })),
    }))
        .query(async ({ input, ctx }) => {
        const { from, to, quotationStatuses } = input;
        const scope = await resolveReportReadScope({
            userId: ctx.session.user.id,
            role: ctx.session.user.role,
        });
        const rows = await db
            .select({
            status: quotation.status,
            amount: quotation.amount,
            subtotal: quotation.subtotal,
            createdAt: quotation.createdAt,
            updatedAt: quotation.updatedAt,
            issueDate: quotation.issueDate,
        })
            .from(quotation)
            .where(and(gte(quotation.createdAt, from), lte(quotation.createdAt, to), quotationStatuses?.length ? inArray(quotation.status, quotationStatuses) : undefined));
        const byStatusMap = new Map();
        let wonValue = 0, lostValue = 0, expiredValue = 0, activePipeline = 0, inPreparation = 0;
        const decisionDays = [];
        const acceptedAmounts = [];
        for (const q of rows) {
            const amt = quotationReportAmount(q);
            const status = normalizeQuotationStatus(q.status);
            const e = byStatusMap.get(status) ?? { count: 0, amount: 0 };
            e.count += 1;
            e.amount += amt;
            byStatusMap.set(status, e);
            if (status === "DRAFT")
                inPreparation += amt;
            else if (status === "SENT")
                activePipeline += amt;
            else if (status === "ACCEPTED") {
                wonValue += amt;
                acceptedAmounts.push(amt);
                const ref = q.issueDate ?? q.createdAt;
                decisionDays.push(differenceInDays(q.updatedAt, ref));
            }
            else if (status === "DECLINED") {
                lostValue += amt;
                const ref = q.issueDate ?? q.createdAt;
                decisionDays.push(differenceInDays(q.updatedAt, ref));
            }
            else if (status === "EXPIRED") {
                expiredValue += amt;
            }
        }
        const decisions = (byStatusMap.get("ACCEPTED")?.count ?? 0) +
            (byStatusMap.get("DECLINED")?.count ?? 0) +
            (byStatusMap.get("EXPIRED")?.count ?? 0);
        const accepted = byStatusMap.get("ACCEPTED")?.count ?? 0;
        const winRate = decisions > 0 ? (accepted / decisions) * 100 : 0;
        const avgDecision = decisionDays.length > 0 ? decisionDays.reduce((a, b) => a + b, 0) / decisionDays.length : 0;
        const avgAccepted = acceptedAmounts.length > 0 ? acceptedAmounts.reduce((a, b) => a + b, 0) / acceptedAmounts.length : 0;
        const allStatuses = ["DRAFT", "SENT", "ACCEPTED", "DECLINED", "EXPIRED", "CANCELLED"];
        const byStatus = allStatuses.map(s => ({
            status: s,
            count: byStatusMap.get(s)?.count ?? 0,
            amount: byStatusMap.get(s)?.amount ?? 0,
        }));
        return {
            inPreparation,
            activePipeline,
            wonValue,
            lostValue,
            expiredValue,
            winRate,
            avgQuoteValue: avgAccepted,
            avgTimeToDecision: Math.round(avgDecision * 10) / 10,
            avgTimeToSend: 0, // quotation schema has no sentAt field
            byStatus,
        };
    }),
    // ─── Q-02 Conversion Funnel ────────────────────────────────────────────────
    conversionFunnel: protectedProcedure
        .input(reportFiltersSchema)
        .output(z.array(z.object({
        stage: z.string(),
        count: z.number(),
        amount: z.number(),
        dropOffPct: z.number(),
    })))
        .query(async ({ input, ctx }) => {
        const { from, to } = input;
        const scope = await resolveReportReadScope({
            userId: ctx.session.user.id,
            role: ctx.session.user.role,
        });
        const rows = await db
            .select({ status: quotation.status, amount: quotation.amount, subtotal: quotation.subtotal })
            .from(quotation)
            .where(and(gte(quotation.createdAt, from), lte(quotation.createdAt, to)));
        const stages = {
            DRAFT: { count: 0, amount: 0 },
            SENT: { count: 0, amount: 0 },
            ACCEPTED: { count: 0, amount: 0 },
            DECLINED: { count: 0, amount: 0 },
            EXPIRED: { count: 0, amount: 0 },
            CANCELLED: { count: 0, amount: 0 },
        };
        for (const q of rows) {
            const status = normalizeQuotationStatus(q.status);
            const s = stages[status];
            if (s) {
                s.count += 1;
                s.amount += quotationReportAmount(q);
            }
        }
        const total = Object.values(stages).reduce((s, v) => s + v.count, 0);
        return Object.entries(stages).map(([stage, v]) => ({
            stage,
            count: v.count,
            amount: v.amount,
            dropOffPct: total > 0 ? ((total - v.count) / total) * 100 : 0,
        }));
    }),
    // ─── Q-03 Quotation List ───────────────────────────────────────────────────
    list: protectedProcedure
        .input(reportFiltersSchema)
        .output(z.object({
        rows: z.array(z.object({
            id: z.string(),
            quotationNumber: z.string().nullable(),
            customerName: z.string().nullable(),
            customerEmail: z.string().nullable(),
            amount: z.number(),
            currency: z.string(),
            status: z.string(),
            issueDate: z.date().nullable(),
            createdBy: z.string(),
            createdAt: z.date(),
        })),
        total: z.number(),
    }))
        .query(async ({ input, ctx }) => {
        const { from, to, quotationStatuses, page, pageSize } = input;
        const scope = await resolveReportReadScope({
            userId: ctx.session.user.id,
            role: ctx.session.user.role,
        });
        const offset = (page - 1) * pageSize;
        const rows = await db.query.quotation.findMany({
            where: and(gte(quotation.createdAt, from), lte(quotation.createdAt, to), quotationStatuses?.length ? inArray(quotation.status, quotationStatuses) : undefined),
            columns: {
                id: true, quotationNumber: true, customerName: true, customerEmail: true,
                amount: true, subtotal: true, currency: true, status: true, issueDate: true,
                createdBy: true, createdAt: true,
            },
            orderBy: [desc(quotation.createdAt)],
            limit: pageSize,
            offset,
        });
        const [cntRow] = await db
            .select({ c: count() })
            .from(quotation)
            .where(and(gte(quotation.createdAt, from), lte(quotation.createdAt, to), quotationStatuses?.length ? inArray(quotation.status, quotationStatuses) : undefined));
        return {
            rows: rows.map(r => ({
                ...r,
                status: normalizeQuotationStatus(r.status),
                amount: quotationReportAmount(r),
            })),
            total: Number(cntRow?.c ?? 0),
        };
    }),
});
