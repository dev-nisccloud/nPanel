import { TRPCError } from "@trpc/server";
import * as crypto from "crypto";
import { z } from "zod";
import { and, count, desc, eq, ilike, inArray, isNull, or, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { user } from "@npanel/db/schema/auth";
import { creditNote, creditNoteActivityLog, invoice, invoiceActivityLog, invoiceCounter, invoiceLineItem, invoiceTransaction, invoiceTransactionActivityLog, } from "@npanel/db/schema/invoicing";
import { order } from "@npanel/db/schema/orders";
import { niscOrder } from "@npanel/db/schema/nisc-orders";
import { cronWorkflowRunInvoice } from "@npanel/db/schema/cron-workflow-runs";
import { teamMember } from "@npanel/db/schema/teams";
import { protectedProcedure, router } from "../../trpc";
import { resolveInvoicePaymentMethod } from "../../lib/invoice-payment-method";
import { COMPANY_LOGO_URL } from "../../lib/company-branding.js";
import { activityLogSchema, creditNoteInputSchema, creditNoteOutputSchema, invoiceCreateInputSchema, invoiceDetailSchema, invoiceLineItemOutputSchema, invoiceListFiltersSchema, invoiceListResponseSchema, invoicePaymentStatusSchema, invoiceStatusSchema, invoiceSummarySchema, invoiceTransactionInputSchema, invoiceTransactionOutputSchema, invoiceUpdateInputSchema, nextInvoiceNumberSchema, nullableStringSchema, submitInvoiceSchema, updatePaymentInputSchema, } from "./schemas";
const isAgencyUser = (role) => ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role);
const isAgencySuperAdmin = (role) => role === "AGENCY_SUPER_ADMIN";
// // Unused function commented out
// const isCustomer = (role: string) => role === "CUSTOMER"; // Unused, commented out
function parseDate(value) {
    if (!value) {
        return null;
    }
    if (value instanceof Date) {
        return value;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}
function stringOrNull(value) {
    if (value === null || value === undefined) {
        return null;
    }
    if (typeof value === "string") {
        return value;
    }
    return String(value);
}
async function getAuthenticatedUser(ctx) {
    const sessionUser = ctx.session?.user;
    if (!sessionUser?.id) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in.",
        });
    }
    const sessionRole = sessionUser?.role;
    if (sessionRole) {
        return { id: sessionUser.id, role: sessionRole };
    }
    const dbUserRows = await db
        .select({ id: user.id, role: user.role })
        .from(user)
        .where(eq(user.id, sessionUser.id))
        .limit(1);
    const dbUser = dbUserRows[0];
    if (!dbUser) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not found.",
        });
    }
    return { id: dbUser.id, role: dbUser.role };
}
async function ensureTeamAccess(_db, userId, role, teamId) {
    if (!teamId) {
        if (isAgencyUser(role)) {
            return;
        }
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Invoice is not associated with any team.",
        });
    }
    if (isAgencyUser(role)) {
        // Agency users can access any team for now.
        return;
    }
    const membership = await db.query.teamMember.findFirst({
        where: and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)),
        columns: { id: true },
    });
    if (!membership) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this team.",
        });
    }
}
async function ensureTeamMutationAccess(_db, userId, role, teamId) {
    if (isAgencySuperAdmin(role)) {
        return;
    }
    if (!teamId) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Invoice is not associated with any team.",
        });
    }
    const [teamRow] = await db
        .select({ createdById: team.createdById })
        .from(team)
        .where(eq(team.id, teamId))
        .limit(1);
    if (!teamRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Team not found." });
    }
    if (teamRow.createdById !== userId) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the team owner can modify team invoices.",
        });
    }
}
async function ensureInvoiceAccess(_db, userId, role, invoiceId) {
    const invAcc = await db.query.invoice.findFirst({
        where: eq(invoice.id, invoiceId),
        columns: { teamId: true, createdBy: true },
    });
    if (!invAcc) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invoice not found.",
        });
    }
    if (isAgencyUser(role)) {
        return invAcc;
    }
    // Batch: Check team access if invoice has teamId, otherwise check createdBy
    // This reduces connection usage by combining the access check
    if (invAcc.teamId) {
        // ensureTeamAccess will throw if access denied
        await ensureTeamAccess(db, userId, role, invAcc.teamId);
        return invAcc;
    }
    if (invAcc.createdBy !== userId) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this invoice.",
        });
    }
    return invAcc;
}
async function ensureInvoiceMutationAccess(_db, userId, role, invoiceId) {
    const invAcc = await db.query.invoice.findFirst({
        where: eq(invoice.id, invoiceId),
        columns: { teamId: true, createdBy: true },
    });
    if (!invAcc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found." });
    }
    if (!isAgencySuperAdmin(role) && invAcc.createdBy !== userId) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the invoice creator can modify it.",
        });
    }
    return invAcc;
}
async function deleteInvoices(tx, invoiceIds) {
    if (invoiceIds.length === 0)
        return;
    // Remove or detach external references that may be RESTRICTed.
    await tx.delete(cronWorkflowRunInvoice).where(inArray(cronWorkflowRunInvoice.invoiceId, invoiceIds));
    // These should be SET NULL in DB, but we null them explicitly for safety.
    await tx.update(order).set({ invoiceId: null }).where(inArray(order.invoiceId, invoiceIds));
    await tx.update(niscOrder).set({ invoiceId: null }).where(inArray(niscOrder.invoiceId, invoiceIds));
    // Delete children explicitly (some DBs/migrations may not have cascades applied).
    const transactionIds = await tx
        .select({ id: invoiceTransaction.id })
        .from(invoiceTransaction)
        .where(inArray(invoiceTransaction.invoiceId, invoiceIds));
    const transactionIdList = transactionIds.map((t) => t.id);
    if (transactionIdList.length > 0) {
        await tx
            .delete(invoiceTransactionActivityLog)
            .where(inArray(invoiceTransactionActivityLog.invoiceTransactionId, transactionIdList));
    }
    const creditNoteIds = await tx
        .select({ id: creditNote.id })
        .from(creditNote)
        .where(inArray(creditNote.invoiceId, invoiceIds));
    const creditNoteIdList = creditNoteIds.map((c) => c.id);
    if (creditNoteIdList.length > 0) {
        await tx
            .delete(creditNoteActivityLog)
            .where(inArray(creditNoteActivityLog.creditNoteId, creditNoteIdList));
    }
    await tx.delete(invoiceLineItem).where(inArray(invoiceLineItem.invoiceId, invoiceIds));
    await tx.delete(invoiceTransaction).where(inArray(invoiceTransaction.invoiceId, invoiceIds));
    await tx.delete(invoiceActivityLog).where(inArray(invoiceActivityLog.invoiceId, invoiceIds));
    await tx.delete(creditNote).where(inArray(creditNote.invoiceId, invoiceIds));
    await tx.delete(invoice).where(inArray(invoice.id, invoiceIds));
}
function buildInvoiceData(input) {
    const data = {
        teamId: input.teamId ?? null,
        customerId: input.customerId ?? null,
        customerName: stringOrNull(input.customerName),
        customerEmail: stringOrNull(input.customerEmail),
        invoiceNumber: stringOrNull(input.invoiceNumber),
        token: input.token ?? crypto.randomUUID(), // Token is required, generate if not provided
        status: input.status ?? "SENT", // Default to issued invoice when adding to DB
        amount: stringOrNull(input.amount),
        subtotal: stringOrNull(input.subtotal),
        tax: stringOrNull(input.tax),
        taxPercentage: input.taxPercentage ?? null,
        vat: stringOrNull(input.vat),
        discount: stringOrNull(input.discount),
        currency: input.currency ?? "KES",
        creditedAmount: stringOrNull(input.creditedAmount),
        creditBalance: stringOrNull(input.creditBalance),
        issueDate: parseDate(input.issueDate),
        dueDate: parseDate(input.dueDate),
        paidAt: parseDate(input.paidAt),
        sentAt: parseDate(input.sentAt),
        reminderSentAt: parseDate(input.reminderSentAt),
        viewedAt: parseDate(input.viewedAt),
        note: stringOrNull(input.note),
        internalNote: stringOrNull(input.internalNote),
        createdBy: input.createdBy,
        updatedBy: input.updatedBy ?? input.createdBy,
    };
    // Only include Json fields if they are defined and not null
    if (input.metadata !== undefined && input.metadata !== null) {
        data.metadata = input.metadata;
    }
    if (input.fromDetails !== undefined && input.fromDetails !== null) {
        data.fromDetails = input.fromDetails;
    }
    if (input.customerDetails !== undefined && input.customerDetails !== null) {
        data.customerDetails = input.customerDetails;
    }
    if (input.paymentDetails !== undefined && input.paymentDetails !== null) {
        data.paymentDetails = input.paymentDetails;
    }
    if (input.noteDetails !== undefined && input.noteDetails !== null) {
        data.noteDetails = input.noteDetails;
    }
    if (input.template !== undefined && input.template !== null) {
        data.template = input.template;
    }
    if (input.topBlock !== undefined && input.topBlock !== null) {
        data.topBlock = input.topBlock;
    }
    if (input.bottomBlock !== undefined && input.bottomBlock !== null) {
        data.bottomBlock = input.bottomBlock;
    }
    return data;
}
function buildInvoiceUpdateData(input, userId) {
    const data = {
        updatedBy: userId,
        updatedAt: new Date(),
    };
    const assignWhenProvided = (key, value) => {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
            data[key] = value;
        }
    };
    assignWhenProvided("teamId", input.teamId ?? null);
    assignWhenProvided("customerId", input.customerId ?? null);
    assignWhenProvided("customerName", stringOrNull(input.customerName));
    assignWhenProvided("customerEmail", stringOrNull(input.customerEmail));
    assignWhenProvided("invoiceNumber", stringOrNull(input.invoiceNumber));
    assignWhenProvided("status", input.status);
    assignWhenProvided("amount", stringOrNull(input.amount));
    assignWhenProvided("subtotal", stringOrNull(input.subtotal));
    assignWhenProvided("tax", stringOrNull(input.tax));
    assignWhenProvided("taxPercentage", input.taxPercentage ?? null);
    assignWhenProvided("vat", stringOrNull(input.vat));
    assignWhenProvided("discount", stringOrNull(input.discount));
    assignWhenProvided("currency", input.currency);
    assignWhenProvided("creditedAmount", stringOrNull(input.creditedAmount));
    assignWhenProvided("creditBalance", stringOrNull(input.creditBalance));
    assignWhenProvided("issueDate", parseDate(input.issueDate));
    assignWhenProvided("dueDate", parseDate(input.dueDate));
    assignWhenProvided("paidAt", parseDate(input.paidAt));
    assignWhenProvided("sentAt", parseDate(input.sentAt));
    assignWhenProvided("reminderSentAt", parseDate(input.reminderSentAt));
    assignWhenProvided("viewedAt", parseDate(input.viewedAt));
    assignWhenProvided("note", stringOrNull(input.note));
    assignWhenProvided("internalNote", stringOrNull(input.internalNote));
    if (Object.prototype.hasOwnProperty.call(input, "metadata")) {
        data.metadata = input.metadata !== undefined ? input.metadata : undefined;
    }
    if (Object.prototype.hasOwnProperty.call(input, "fromDetails")) {
        data.fromDetails = input.fromDetails !== undefined ? input.fromDetails : undefined;
    }
    if (Object.prototype.hasOwnProperty.call(input, "customerDetails")) {
        data.customerDetails = input.customerDetails !== undefined ? input.customerDetails : undefined;
    }
    if (Object.prototype.hasOwnProperty.call(input, "paymentDetails")) {
        data.paymentDetails = input.paymentDetails !== undefined ? input.paymentDetails : undefined;
    }
    if (Object.prototype.hasOwnProperty.call(input, "noteDetails")) {
        data.noteDetails = input.noteDetails !== undefined ? input.noteDetails : undefined;
    }
    if (Object.prototype.hasOwnProperty.call(input, "template")) {
        data.template = input.template !== undefined ? input.template : undefined;
    }
    if (Object.prototype.hasOwnProperty.call(input, "topBlock")) {
        data.topBlock = input.topBlock !== undefined ? input.topBlock : undefined;
    }
    if (Object.prototype.hasOwnProperty.call(input, "bottomBlock")) {
        data.bottomBlock = input.bottomBlock !== undefined ? input.bottomBlock : undefined;
    }
    return data;
}
function mapInvoiceDetail(invoice) {
    const lineItems = invoice.lineItems.map((item) => invoiceLineItemOutputSchema.parse({
        id: item.id,
        position: item.position,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        discount: item.discount,
        total: item.total,
        ...(item.metadata !== undefined && { metadata: item.metadata }),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
    }));
    const transactions = invoice.transactions.map((transaction) => invoiceTransactionOutputSchema.parse({
        id: transaction.id,
        invoiceId: transaction.invoiceId,
        reference: transaction.reference,
        providerReference: transaction.providerReference,
        status: transaction.status,
        method: transaction.method,
        amount: transaction.amount,
        currency: transaction.currency,
        paidAt: transaction.paidAt,
        notes: transaction.notes,
        ...(transaction.metadata !== undefined && { metadata: transaction.metadata }),
        balanceBefore: transaction.balanceBefore,
        balanceAfter: transaction.balanceAfter,
        recordedBy: transaction.recordedBy,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
        activityLogs: (transaction.activityLogs ?? []).map((log) => activityLogSchema.parse({
            id: log.id,
            userId: log.userId,
            action: log.action,
            description: log.description ?? null,
            ...(log.metadata !== undefined && { metadata: log.metadata }),
            ipAddress: log.ipAddress ?? null,
            userAgent: log.userAgent ?? null,
            createdAt: log.createdAt,
        })),
    }));
    const creditNote = invoice.creditNote
        ? creditNoteOutputSchema.parse({
            ...invoice.creditNote,
            activityLogs: (invoice.creditNote.activityLogs ?? []).map((log) => activityLogSchema.parse({
                id: log.id,
                userId: log.userId,
                action: log.action,
                description: log.description ?? null,
                ...(log.metadata !== undefined && { metadata: log.metadata }),
                ipAddress: log.ipAddress ?? null,
                userAgent: log.userAgent ?? null,
                createdAt: log.createdAt,
            })),
        })
        : null;
    const activityLogs = (invoice.activityLogs ?? []).map((log) => activityLogSchema.parse({
        id: log.id,
        userId: log.userId,
        action: log.action,
        description: log.description ?? null,
        ...(log.metadata !== undefined && { metadata: log.metadata }),
        ipAddress: log.ipAddress ?? null,
        userAgent: log.userAgent ?? null,
        createdAt: log.createdAt,
    }));
    return invoiceDetailSchema.parse({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail,
        status: invoice.status,
        amount: invoice.amount,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
        teamId: invoice.teamId,
        customerId: invoice.customerId,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        taxPercentage: invoice.taxPercentage ?? null,
        vat: invoice.vat,
        discount: invoice.discount,
        creditedAmount: invoice.creditedAmount,
        creditBalance: invoice.creditBalance,
        issueDate: invoice.issueDate,
        paidAt: invoice.paidAt,
        sentAt: invoice.sentAt,
        reminderSentAt: invoice.reminderSentAt,
        viewedAt: invoice.viewedAt,
        note: invoice.note,
        internalNote: invoice.internalNote,
        ...(invoice.metadata !== undefined && { metadata: invoice.metadata }),
        lineItems,
        transactions,
        creditNote,
        activityLogs,
        ...(invoice.fromDetails !== undefined && { fromDetails: invoice.fromDetails }),
        ...(invoice.customerDetails !== undefined && { customerDetails: invoice.customerDetails }),
        ...(invoice.paymentDetails !== undefined && { paymentDetails: invoice.paymentDetails }),
        ...(invoice.noteDetails !== undefined && { noteDetails: invoice.noteDetails }),
        ...(invoice.template !== undefined && { template: invoice.template }),
        ...(invoice.topBlock !== undefined && { topBlock: invoice.topBlock }),
        ...(invoice.bottomBlock !== undefined && { bottomBlock: invoice.bottomBlock }),
    });
}
async function fetchInvoiceDetail(tx, invoiceId) {
    const inv = await tx.query.invoice.findFirst({
        where: eq(invoice.id, invoiceId),
        with: {
            lineItems: {
                orderBy: (li, { asc: a }) => [a(li.position)],
            },
            transactions: {
                orderBy: (t, { desc: d }) => [d(t.createdAt)],
                with: {
                    activityLogs: {
                        orderBy: (log, { desc: d }) => [d(log.createdAt)],
                    },
                },
            },
            creditNote: {
                with: {
                    activityLogs: {
                        orderBy: (log, { desc: d }) => [d(log.createdAt)],
                    },
                },
            },
            activityLogs: {
                orderBy: (log, { desc: d }) => [d(log.createdAt)],
            },
        },
    });
    if (!inv) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invoice not found.",
        });
    }
    return inv;
}
async function logInvoiceActivity(tx, params) {
    const logData = {
        id: crypto.randomUUID(),
        invoiceId: params.invoiceId,
        userId: params.userId,
        action: params.action,
        description: params.description ?? null,
        createdAt: new Date(),
    };
    if (params.metadata !== undefined && params.metadata !== null) {
        logData.metadata = params.metadata;
    }
    await tx.insert(invoiceActivityLog).values({
        id: logData.id,
        invoiceId: logData.invoiceId,
        userId: logData.userId,
        action: logData.action,
        description: logData.description,
        createdAt: logData.createdAt,
        ...(params.metadata !== undefined && params.metadata !== null
            ? { metadata: params.metadata }
            : {}),
    });
}
async function logTransactionActivity(tx, params) {
    const logData = {
        id: crypto.randomUUID(),
        invoiceTransactionId: params.transactionId,
        userId: params.userId,
        action: params.action,
        description: params.description ?? null,
        createdAt: new Date(),
    };
    if (params.metadata !== undefined && params.metadata !== null) {
        logData.metadata = params.metadata;
    }
    await tx.insert(invoiceTransactionActivityLog).values({
        id: logData.id,
        invoiceTransactionId: logData.invoiceTransactionId,
        userId: logData.userId,
        action: logData.action,
        description: logData.description,
        createdAt: logData.createdAt,
        ...(params.metadata !== undefined && params.metadata !== null
            ? { metadata: params.metadata }
            : {}),
    });
}
async function logCreditNoteActivity(tx, params) {
    const logData = {
        id: crypto.randomUUID(),
        creditNoteId: params.creditNoteId,
        userId: params.userId,
        action: params.action,
        description: params.description ?? null,
        createdAt: new Date(),
    };
    if (params.metadata !== undefined && params.metadata !== null) {
        logData.metadata = params.metadata;
    }
    await tx.insert(creditNoteActivityLog).values({
        id: logData.id,
        creditNoteId: logData.creditNoteId,
        userId: logData.userId,
        action: logData.action,
        description: logData.description,
        createdAt: logData.createdAt,
        ...(params.metadata !== undefined && params.metadata !== null
            ? { metadata: params.metadata }
            : {}),
    });
}
/**
 * Parses the numeric part from an invoice number string (e.g., "INV-0001" -> 1)
 * Returns null if the format is invalid
 */
function parseInvoiceNumber(invoiceNumber) {
    const match = invoiceNumber.match(/^INV-(\d+)$/i);
    if (!match)
        return null;
    const num = Number.parseInt(match[1] || "", 10);
    return Number.isNaN(num) ? null : num;
}
/**
 * Updates the invoice counter to reflect the last used invoice number
 * This ensures the counter always tracks the highest invoice number used
 * Should be called within a transaction to ensure consistency
 */
async function updateInvoiceCounter(tx, invoiceNumber) {
    const parsedNumber = parseInvoiceNumber(invoiceNumber);
    if (!parsedNumber || parsedNumber < 1)
        return;
    const now = new Date();
    await tx
        .insert(invoiceCounter)
        .values({
        id: "invoice-counter",
        lastNumber: parsedNumber,
        updatedAt: now,
    })
        .onConflictDoUpdate({
        target: invoiceCounter.id,
        set: { lastNumber: parsedNumber, updatedAt: now },
    });
}
/**
 * Generates the next sequential invoice number in the format INV-{number}
 * Should be called within a transaction context (tx) to ensure thread-safety
 * Uses upsert with increment to atomically get and increment the counter
 */
async function generateNextInvoiceNumber(tx) {
    const now = new Date();
    const rows = await tx
        .insert(invoiceCounter)
        .values({
        id: "invoice-counter",
        lastNumber: 1,
        updatedAt: now,
    })
        .onConflictDoUpdate({
        target: invoiceCounter.id,
        set: {
            lastNumber: sql `${invoiceCounter.lastNumber} + 1`,
            updatedAt: now,
        },
    })
        .returning({ lastNumber: invoiceCounter.lastNumber });
    const nextNumber = rows[0]?.lastNumber ?? 1;
    return `INV-${nextNumber.toString().padStart(4, "0")}`;
}
export const invoicingRouter = router({
    list: protectedProcedure
        .input(invoiceListFiltersSchema)
        .output(invoiceListResponseSchema)
        .query(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        const conditions = [];
        if (input.teamId) {
            await ensureTeamAccess(db, user.id, user.role, input.teamId);
            conditions.push(eq(invoice.teamId, input.teamId));
        }
        else if (!isAgencyUser(user.role)) {
            const memberships = await db
                .select({ teamId: teamMember.teamId })
                .from(teamMember)
                .where(eq(teamMember.userId, user.id));
            const accessibleTeams = memberships
                .map((m) => m.teamId)
                .filter((id) => id != null);
            const orParts = [];
            if (accessibleTeams.length > 0) {
                orParts.push(inArray(invoice.teamId, accessibleTeams));
            }
            orParts.push(and(isNull(invoice.teamId), eq(invoice.createdBy, user.id)));
            conditions.push(or(...orParts));
        }
        if (input.status) {
            conditions.push(eq(invoice.status, input.status));
        }
        if (input.search?.trim()) {
            const q = `%${input.search.trim()}%`;
            conditions.push(or(ilike(invoice.invoiceNumber, q), ilike(invoice.customerName, q), ilike(invoice.customerEmail, q)));
        }
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const [items, totalRow] = await Promise.all([
            db
                .select({
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                customerName: invoice.customerName,
                customerEmail: invoice.customerEmail,
                status: invoice.status,
                amount: invoice.amount,
                currency: invoice.currency,
                dueDate: invoice.dueDate,
                createdAt: invoice.createdAt,
                updatedAt: invoice.updatedAt,
            })
                .from(invoice)
                .where(whereClause)
                .orderBy(desc(invoice.createdAt))
                .limit(input.limit)
                .offset(input.offset),
            db.select({ c: count() }).from(invoice).where(whereClause),
        ]);
        const total = Number(totalRow[0]?.c ?? 0);
        const payload = {
            invoices: items.map((inv) => invoiceSummarySchema.parse({
                ...inv,
            })),
            total,
        };
        return invoiceListResponseSchema.parse(payload);
    }),
    getById: protectedProcedure
        .input(z.object({
        id: z.string().uuid(),
    }))
        .output(invoiceDetailSchema)
        .query(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        await ensureInvoiceAccess(db, user.id, user.role, input.id);
        const invoiceDetail = await fetchInvoiceDetail(db, input.id);
        const mapped = mapInvoiceDetail({
            ...invoiceDetail,
            lineItems: invoiceDetail.lineItems.map((item) => ({
                id: item.id,
                invoiceId: item.invoiceId,
                position: item.position,
                name: item.name,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                price: item.price,
                discount: item.discount,
                total: item.total,
                ...(item.metadata !== undefined && { metadata: item.metadata }),
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            })),
            transactions: invoiceDetail.transactions.map((transaction) => ({
                id: transaction.id,
                invoiceId: transaction.invoiceId,
                reference: transaction.reference,
                providerReference: transaction.providerReference,
                status: transaction.status,
                method: transaction.method,
                amount: transaction.amount,
                currency: transaction.currency,
                paidAt: transaction.paidAt,
                notes: transaction.notes,
                metadata: transaction.metadata,
                balanceBefore: transaction.balanceBefore,
                balanceAfter: transaction.balanceAfter,
                recordedBy: transaction.recordedBy,
                createdAt: transaction.createdAt,
                updatedAt: transaction.updatedAt,
                activityLogs: transaction.activityLogs,
            })),
            creditNote: invoiceDetail.creditNote
                ? creditNoteOutputSchema.parse({
                    ...invoiceDetail.creditNote,
                    activityLogs: invoiceDetail.creditNote.activityLogs,
                })
                : null,
            activityLogs: invoiceDetail.activityLogs,
        });
        return mapped;
    }),
    updatePayment: protectedProcedure
        .input(updatePaymentInputSchema)
        .output(invoiceDetailSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        await ensureInvoiceMutationAccess(db, user.id, user.role, input.invoiceId);
        const invRows = await db
            .select({
            id: invoice.id,
            status: invoice.status,
            amount: invoice.amount,
            currency: invoice.currency,
            paymentDetails: invoice.paymentDetails,
        })
            .from(invoice)
            .where(eq(invoice.id, input.invoiceId))
            .limit(1);
        const inv = invRows[0];
        if (!inv) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found." });
        }
        if (inv.status === "PAID") {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Invoice is already fully paid.",
            });
        }
        const totalAmount = inv.amount ?? "0";
        const amountToRecord = input.type === "COMPLETE" ? totalAmount : (input.amountPaid ?? "0").trim();
        await db.transaction(async (tx) => {
            const now = new Date();
            if (input.type === "COMPLETE") {
                await tx
                    .update(invoice)
                    .set({
                    status: "PAID",
                    paidAt: now,
                    updatedAt: now,
                })
                    .where(eq(invoice.id, input.invoiceId));
            }
            else {
                await tx
                    .update(invoice)
                    .set({
                    status: "PARTIALLY_PAID",
                    updatedAt: now,
                })
                    .where(eq(invoice.id, input.invoiceId));
            }
            const transactionId = crypto.randomUUID();
            const paymentMethod = resolveInvoicePaymentMethod(null, inv.paymentDetails);
            await tx.insert(invoiceTransaction).values({
                id: transactionId,
                invoiceId: input.invoiceId,
                status: "COMPLETED",
                method: paymentMethod,
                amount: amountToRecord,
                currency: inv.currency ?? "KES",
                paidAt: now,
                recordedBy: user.id,
                createdAt: now,
                updatedAt: now,
            });
            await logInvoiceActivity(tx, {
                invoiceId: input.invoiceId,
                userId: user.id,
                action: input.type === "COMPLETE" ? "PAYMENT_COMPLETE" : "PAYMENT_PARTIAL",
                description: input.type === "COMPLETE"
                    ? `Full payment recorded: ${inv.currency ?? "KES"} ${amountToRecord}`
                    : `Partial payment recorded: ${inv.currency ?? "KES"} ${amountToRecord}`,
                metadata: { type: input.type, amount: amountToRecord },
            });
        });
        const updated = await fetchInvoiceDetail(db, input.invoiceId);
        return mapInvoiceDetail({
            ...updated,
            lineItems: updated.lineItems.map((item) => ({
                id: item.id,
                invoiceId: item.invoiceId,
                position: item.position,
                name: item.name,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                price: item.price,
                discount: item.discount,
                total: item.total,
                ...(item.metadata !== undefined && { metadata: item.metadata }),
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            })),
            transactions: updated.transactions.map((transaction) => ({
                id: transaction.id,
                invoiceId: transaction.invoiceId,
                reference: transaction.reference,
                providerReference: transaction.providerReference,
                status: transaction.status,
                method: transaction.method,
                amount: transaction.amount,
                currency: transaction.currency,
                paidAt: transaction.paidAt,
                notes: transaction.notes,
                metadata: transaction.metadata,
                balanceBefore: transaction.balanceBefore,
                balanceAfter: transaction.balanceAfter,
                recordedBy: transaction.recordedBy,
                createdAt: transaction.createdAt,
                updatedAt: transaction.updatedAt,
                activityLogs: transaction.activityLogs,
            })),
            creditNote: updated.creditNote
                ? creditNoteOutputSchema.parse({
                    ...updated.creditNote,
                    activityLogs: updated.creditNote.activityLogs,
                })
                : null,
            activityLogs: updated.activityLogs,
        });
    }),
    getNextInvoiceNumber: protectedProcedure
        .output(nextInvoiceNumberSchema)
        .query(async () => {
        // Peek at the next invoice number without incrementing
        // This allows the frontend to preview the number before creating
        const counterRows = await db
            .select({ lastNumber: invoiceCounter.lastNumber })
            .from(invoiceCounter)
            .where(eq(invoiceCounter.id, "invoice-counter"))
            .limit(1);
        const counter = counterRows[0];
        const nextNumber = (counter?.lastNumber ?? 0) + 1;
        // Format with 4-digit zero-padding (e.g., INV-0001)
        const invoiceNumber = `INV-${nextNumber.toString().padStart(4, "0")}`;
        return {
            invoiceNumber,
            nextNumber,
        };
    }),
    create: protectedProcedure
        .input(invoiceCreateInputSchema)
        .output(invoiceDetailSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        if (input.teamId) {
            await ensureTeamMutationAccess(db, user.id, user.role, input.teamId);
        }
        const invoiceId = input.id ?? crypto.randomUUID();
        const token = input.token ?? crypto.randomUUID();
        await db.transaction(async (tx) => {
            // Auto-generate invoice number if not provided
            let invoiceNumber = input.invoiceNumber;
            if (!invoiceNumber) {
                invoiceNumber = await generateNextInvoiceNumber(tx);
            }
            else {
                const teamCond = input.teamId == null
                    ? isNull(invoice.teamId)
                    : eq(invoice.teamId, input.teamId);
                const existingRows = await tx
                    .select({ id: invoice.id })
                    .from(invoice)
                    .where(and(eq(invoice.invoiceNumber, invoiceNumber), teamCond))
                    .limit(1);
                const existing = existingRows[0];
                if (existing) {
                    throw new TRPCError({
                        code: "CONFLICT",
                        message: `Invoice number ${invoiceNumber} already exists${input.teamId ? " for this team" : ""}.`,
                    });
                }
                await updateInvoiceCounter(tx, invoiceNumber);
            }
            const invoiceData = buildInvoiceData({
                ...input,
                invoiceNumber,
                id: invoiceId,
                token,
                createdBy: user.id,
                updatedBy: user.id,
            });
            const now = new Date();
            await tx.insert(invoice).values({
                ...invoiceData,
                id: invoiceId,
                createdAt: now,
                updatedAt: now,
            });
            if (input.lineItems && input.lineItems.length > 0) {
                for (const [index, item] of input.lineItems.entries()) {
                    const lineItemData = {
                        id: item.id ?? crypto.randomUUID(),
                        invoiceId,
                        position: item.position ?? index,
                        name: stringOrNull(item.name),
                        description: stringOrNull(item.description),
                        quantity: item.quantity ?? null,
                        unit: stringOrNull(item.unit),
                        price: stringOrNull(item.price),
                        discount: stringOrNull(item.discount),
                        total: stringOrNull(item.total),
                        createdAt: now,
                        updatedAt: now,
                    };
                    if (item.metadata !== undefined && item.metadata !== null) {
                        lineItemData.metadata = item.metadata;
                    }
                    await tx.insert(invoiceLineItem).values(lineItemData);
                }
            }
            if (input.transactions && input.transactions.length > 0) {
                for (const transaction of input.transactions) {
                    const transactionId = transaction.id ?? crypto.randomUUID();
                    const transactionData = {
                        id: transactionId,
                        invoiceId,
                        reference: stringOrNull(transaction.reference),
                        providerReference: stringOrNull(transaction.providerReference),
                        status: transaction.status ?? "PENDING",
                        method: transaction.method,
                        amount: transaction.amount,
                        currency: transaction.currency ?? "KES",
                        paidAt: parseDate(transaction.paidAt),
                        notes: stringOrNull(transaction.notes),
                        balanceBefore: stringOrNull(transaction.balanceBefore),
                        balanceAfter: stringOrNull(transaction.balanceAfter),
                        recordedBy: stringOrNull(transaction.recordedBy) ?? user.id,
                        createdAt: now,
                        updatedAt: now,
                    };
                    if (transaction.metadata !== undefined && transaction.metadata !== null) {
                        transactionData.metadata = transaction.metadata;
                    }
                    await tx.insert(invoiceTransaction).values(transactionData);
                    await logTransactionActivity(tx, {
                        transactionId,
                        userId: user.id,
                        action: "RECORD_PAYMENT",
                        description: "Recorded payment during invoice creation",
                    });
                }
            }
            if (input.creditNote) {
                const creditNoteId = input.creditNote.id ?? crypto.randomUUID();
                const creditNoteRow = {
                    id: creditNoteId,
                    invoiceId,
                    teamId: input.creditNote.teamId ?? input.teamId ?? null,
                    creditNumber: stringOrNull(input.creditNote.creditNumber),
                    status: input.creditNote.status ?? "DRAFT",
                    amount: input.creditNote.amount,
                    currency: input.creditNote.currency ?? "KES",
                    reason: stringOrNull(input.creditNote.reason),
                    note: stringOrNull(input.creditNote.note),
                    issuedAt: parseDate(input.creditNote.issuedAt),
                    appliedAt: parseDate(input.creditNote.appliedAt),
                    createdBy: input.creditNote.createdBy ?? user.id,
                    updatedBy: input.creditNote.updatedBy ?? user.id,
                    createdAt: now,
                    updatedAt: now,
                };
                if (input.creditNote.metadata !== undefined && input.creditNote.metadata !== null) {
                    creditNoteRow.metadata = input.creditNote.metadata;
                }
                await tx.insert(creditNote).values(creditNoteRow);
                await logCreditNoteActivity(tx, {
                    creditNoteId,
                    userId: user.id,
                    action: "CREATE",
                    description: "Created credit note during invoice creation",
                });
            }
            await logInvoiceActivity(tx, {
                invoiceId,
                userId: user.id,
                action: "CREATE",
                description: "Created invoice",
                metadata: {
                    invoiceNumber: input.invoiceNumber,
                },
            });
        });
        const invoiceDetail = await fetchInvoiceDetail(db, invoiceId);
        return mapInvoiceDetail({
            ...invoiceDetail,
            transactions: invoiceDetail.transactions,
            creditNote: invoiceDetail.creditNote,
        });
    }),
    update: protectedProcedure
        .input(invoiceUpdateInputSchema)
        .output(invoiceDetailSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        const invoiceRecord = await ensureInvoiceMutationAccess(db, user.id, user.role, input.id);
        await db.transaction(async (tx) => {
            if (input.teamId && input.teamId !== invoiceRecord.teamId) {
                await ensureTeamMutationAccess(tx, user.id, user.role, input.teamId);
            }
            const data = buildInvoiceUpdateData(input, user.id);
            await tx
                .update(invoice)
                .set(data)
                .where(eq(invoice.id, input.id));
            if (input.lineItems) {
                const existingItems = await tx
                    .select({ id: invoiceLineItem.id })
                    .from(invoiceLineItem)
                    .where(eq(invoiceLineItem.invoiceId, input.id));
                const incomingIds = new Set(input.lineItems.filter((item) => item.id).map((item) => item.id));
                const toDelete = existingItems
                    .filter((item) => !incomingIds.has(item.id))
                    .map((item) => item.id);
                if (toDelete.length > 0) {
                    await tx.delete(invoiceLineItem).where(inArray(invoiceLineItem.id, toDelete));
                }
                const now = new Date();
                for (const [index, item] of input.lineItems.entries()) {
                    const lineItemData = {
                        position: item.position ?? index,
                        name: stringOrNull(item.name),
                        description: stringOrNull(item.description),
                        quantity: item.quantity ?? null,
                        unit: stringOrNull(item.unit),
                        price: stringOrNull(item.price),
                        discount: stringOrNull(item.discount),
                        total: stringOrNull(item.total),
                        updatedAt: now,
                    };
                    if (item.metadata !== undefined && item.metadata !== null) {
                        lineItemData.metadata = item.metadata;
                    }
                    if (item.id) {
                        await tx
                            .update(invoiceLineItem)
                            .set(lineItemData)
                            .where(eq(invoiceLineItem.id, item.id));
                    }
                    else {
                        await tx.insert(invoiceLineItem).values({
                            ...lineItemData,
                            id: crypto.randomUUID(),
                            invoiceId: input.id,
                            createdAt: now,
                            updatedAt: now,
                        });
                    }
                }
            }
            await logInvoiceActivity(tx, {
                invoiceId: input.id,
                userId: user.id,
                action: "UPDATE",
                description: "Updated invoice details",
            });
        });
        const invoiceDetail = await fetchInvoiceDetail(db, input.id);
        return mapInvoiceDetail(invoiceDetail);
    }),
    updateStatus: protectedProcedure
        .input(z.object({
        id: z.string().uuid(),
        status: invoiceStatusSchema,
        note: nullableStringSchema.optional(),
    }))
        .output(invoiceDetailSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        await ensureInvoiceMutationAccess(db, user.id, user.role, input.id);
        await db.transaction(async (tx) => {
            const now = new Date();
            await tx
                .update(invoice)
                .set({
                status: input.status,
                updatedBy: user.id,
                updatedAt: now,
            })
                .where(eq(invoice.id, input.id));
            await logInvoiceActivity(tx, {
                invoiceId: input.id,
                userId: user.id,
                action: "STATUS_CHANGE",
                description: `Changed status to ${input.status}`,
                metadata: input.note ? { note: input.note } : undefined,
            });
        });
        const invoiceDetail = await fetchInvoiceDetail(db, input.id);
        return mapInvoiceDetail(invoiceDetail);
    }),
    recordTransaction: protectedProcedure
        .input(invoiceTransactionInputSchema)
        .output(invoiceDetailSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        await ensureInvoiceMutationAccess(db, user.id, user.role, input.invoiceId);
        const transactionId = input.id ?? crypto.randomUUID();
        await db.transaction(async (tx) => {
            const now = new Date();
            const data = {
                invoiceId: input.invoiceId,
                reference: stringOrNull(input.reference),
                providerReference: stringOrNull(input.providerReference),
                status: input.status ?? "PENDING",
                method: input.method,
                amount: input.amount,
                currency: input.currency ?? "KES",
                paidAt: parseDate(input.paidAt),
                notes: stringOrNull(input.notes),
                balanceBefore: stringOrNull(input.balanceBefore),
                balanceAfter: stringOrNull(input.balanceAfter),
                recordedBy: stringOrNull(input.recordedBy) ?? user.id,
                updatedAt: now,
            };
            if (input.metadata !== undefined && input.metadata !== null) {
                data.metadata = input.metadata;
            }
            if (input.id) {
                await tx
                    .update(invoiceTransaction)
                    .set(data)
                    .where(eq(invoiceTransaction.id, input.id));
                await logTransactionActivity(tx, {
                    transactionId,
                    userId: user.id,
                    action: "UPDATE_PAYMENT",
                    description: "Updated invoice transaction",
                });
            }
            else {
                await tx.insert(invoiceTransaction).values({
                    id: transactionId,
                    createdAt: now,
                    ...data,
                });
                await logTransactionActivity(tx, {
                    transactionId,
                    userId: user.id,
                    action: "RECORD_PAYMENT",
                    description: "Recorded invoice transaction",
                });
            }
            await logInvoiceActivity(tx, {
                invoiceId: input.invoiceId,
                userId: user.id,
                action: "PAYMENT_ACTIVITY",
                description: input.id ? "Updated payment transaction" : "Recorded payment transaction",
                metadata: {
                    transactionId,
                    amount: input.amount,
                    method: input.method,
                    status: input.status ?? "PENDING",
                },
            });
        });
        const invoiceDetail = await fetchInvoiceDetail(db, input.invoiceId);
        return mapInvoiceDetail(invoiceDetail);
    }),
    deleteTransaction: protectedProcedure
        .input(invoiceTransactionInputSchema.pick({
        id: true,
        invoiceId: true,
    }))
        .output(invoiceDetailSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        await ensureInvoiceMutationAccess(db, user.id, user.role, input.invoiceId);
        await db.transaction(async (tx) => {
            const transRows = await tx
                .select({ id: invoiceTransaction.id })
                .from(invoiceTransaction)
                .where(eq(invoiceTransaction.id, input.id))
                .limit(1);
            const transaction = transRows[0];
            if (!transaction) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Transaction not found.",
                });
            }
            await logTransactionActivity(tx, {
                transactionId: input.id,
                userId: user.id,
                action: "DELETE_PAYMENT",
                description: "Deleted invoice transaction",
            });
            await tx.delete(invoiceTransaction).where(eq(invoiceTransaction.id, input.id));
            await logInvoiceActivity(tx, {
                invoiceId: input.invoiceId,
                userId: user.id,
                action: "PAYMENT_ACTIVITY",
                description: "Deleted payment transaction",
                metadata: { transactionId: input.id },
            });
        });
        const invoiceDetail = await fetchInvoiceDetail(db, input.invoiceId);
        return mapInvoiceDetail(invoiceDetail);
    }),
    upsertCreditNote: protectedProcedure
        .input(creditNoteInputSchema)
        .output(invoiceDetailSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        await ensureInvoiceMutationAccess(db, user.id, user.role, input.invoiceId);
        const creditNoteId = input.id ?? crypto.randomUUID();
        await db.transaction(async (tx) => {
            const now = new Date();
            const data = {
                invoiceId: input.invoiceId,
                teamId: input.teamId ?? null,
                creditNumber: stringOrNull(input.creditNumber),
                status: input.status ?? "DRAFT",
                amount: input.amount,
                currency: input.currency ?? "KES",
                reason: stringOrNull(input.reason),
                note: stringOrNull(input.note),
                issuedAt: parseDate(input.issuedAt),
                appliedAt: parseDate(input.appliedAt),
                createdBy: input.createdBy,
                updatedBy: input.updatedBy ?? user.id,
                updatedAt: now,
            };
            if (input.metadata !== undefined && input.metadata !== null) {
                data.metadata = input.metadata;
            }
            const existingRows = await tx
                .select({ id: creditNote.id })
                .from(creditNote)
                .where(eq(creditNote.invoiceId, input.invoiceId))
                .limit(1);
            const existing = existingRows[0];
            if (existing) {
                await tx
                    .update(creditNote)
                    .set(data)
                    .where(eq(creditNote.id, existing.id));
                await logCreditNoteActivity(tx, {
                    creditNoteId: existing.id,
                    userId: user.id,
                    action: "UPDATE",
                    description: "Updated credit note",
                });
            }
            else {
                await tx.insert(creditNote).values({
                    id: creditNoteId,
                    createdAt: now,
                    ...data,
                });
                await logCreditNoteActivity(tx, {
                    creditNoteId,
                    userId: user.id,
                    action: "CREATE",
                    description: "Created credit note",
                });
            }
            await logInvoiceActivity(tx, {
                invoiceId: input.invoiceId,
                userId: user.id,
                action: "CREDIT_NOTE_ACTIVITY",
                description: existing ? "Updated credit note" : "Created credit note",
                metadata: {
                    creditNoteId: existing?.id ?? creditNoteId,
                    status: input.status ?? "DRAFT",
                },
            });
        });
        const invoiceDetail = await fetchInvoiceDetail(db, input.invoiceId);
        return mapInvoiceDetail(invoiceDetail);
    }),
    deleteCreditNote: protectedProcedure
        .input(creditNoteInputSchema.pick({
        invoiceId: true,
    }))
        .output(invoiceDetailSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        await ensureInvoiceMutationAccess(db, user.id, user.role, input.invoiceId);
        await db.transaction(async (tx) => {
            const existingRows = await tx
                .select({ id: creditNote.id })
                .from(creditNote)
                .where(eq(creditNote.invoiceId, input.invoiceId))
                .limit(1);
            const existing = existingRows[0];
            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Credit note not found.",
                });
            }
            await logCreditNoteActivity(tx, {
                creditNoteId: existing.id,
                userId: user.id,
                action: "DELETE",
                description: "Deleted credit note",
            });
            await tx.delete(creditNote).where(eq(creditNote.id, existing.id));
            await logInvoiceActivity(tx, {
                invoiceId: input.invoiceId,
                userId: user.id,
                action: "CREDIT_NOTE_ACTIVITY",
                description: "Deleted credit note",
            });
        });
        const invoiceDetail = await fetchInvoiceDetail(db, input.invoiceId);
        return mapInvoiceDetail(invoiceDetail);
    }),
    submitInvoice: protectedProcedure
        .input(submitInvoiceSchema)
        .output(invoiceDetailSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        if (input.teamId) {
            await ensureTeamMutationAccess(db, user.id, user.role, input.teamId);
        }
        const invoiceId = input.id ?? crypto.randomUUID();
        const token = input.token ?? crypto.randomUUID();
        let savedInvoice;
        let invoiceNumber;
        await db.transaction(async (tx) => {
            // Always generate the next invoice number FIRST to ensure counter is incremented atomically
            // This ensures thread-safety and prevents counter from getting out of sync
            const generatedNumber = await generateNextInvoiceNumber(tx);
            // Use provided invoice number if valid and matches generated, otherwise use generated
            if (input.invoiceNumber && input.invoiceNumber.trim() !== "") {
                const providedParsed = parseInvoiceNumber(input.invoiceNumber);
                const generatedParsed = parseInvoiceNumber(generatedNumber);
                // If provided number matches what we generated, use it (counter already updated)
                if (providedParsed !== null && generatedParsed !== null && providedParsed === generatedParsed) {
                    invoiceNumber = input.invoiceNumber;
                }
                else if (providedParsed !== null && generatedParsed !== null && providedParsed > generatedParsed) {
                    const teamCond = input.teamId == null
                        ? isNull(invoice.teamId)
                        : eq(invoice.teamId, input.teamId);
                    const existingRows = await tx
                        .select({ id: invoice.id })
                        .from(invoice)
                        .where(and(eq(invoice.invoiceNumber, input.invoiceNumber), teamCond))
                        .limit(1);
                    const existing = existingRows[0];
                    if (existing) {
                        throw new TRPCError({
                            code: "CONFLICT",
                            message: `Invoice number ${input.invoiceNumber} already exists${input.teamId ? " for this team" : ""}.`,
                        });
                    }
                    invoiceNumber = input.invoiceNumber;
                    await updateInvoiceCounter(tx, invoiceNumber);
                }
                else {
                    invoiceNumber = generatedNumber;
                }
            }
            else {
                invoiceNumber = generatedNumber;
            }
            const companyLogoUrl = COMPANY_LOGO_URL;
            const templateData = input.template
                ? {
                    ...input.template,
                    logoUrl: companyLogoUrl,
                }
                : {
                    logoUrl: companyLogoUrl,
                };
            const invoiceData = buildInvoiceData({
                ...input,
                invoiceNumber,
                template: templateData,
                id: invoiceId,
                token,
                createdBy: user.id,
                updatedBy: user.id,
                status: "DRAFT", // Saved only; send from invoice details when verified
            });
            const now = new Date();
            await tx.insert(invoice).values({
                ...invoiceData,
                id: invoiceId,
                createdAt: now,
                updatedAt: now,
            });
            if (input.lineItems && input.lineItems.length > 0) {
                for (const [index, item] of input.lineItems.entries()) {
                    const lineItemData = {
                        id: item.id ?? crypto.randomUUID(),
                        invoiceId,
                        position: item.position ?? index,
                        name: stringOrNull(item.name),
                        description: stringOrNull(item.description),
                        quantity: item.quantity ?? null,
                        unit: stringOrNull(item.unit),
                        price: stringOrNull(item.price),
                        discount: stringOrNull(item.discount),
                        total: stringOrNull(item.total),
                        createdAt: now,
                        updatedAt: now,
                    };
                    if (item.metadata !== undefined && item.metadata !== null) {
                        lineItemData.metadata = item.metadata;
                    }
                    await tx.insert(invoiceLineItem).values(lineItemData);
                }
            }
            await logInvoiceActivity(tx, {
                invoiceId,
                userId: user.id,
                action: "CREATE",
                description: "Created invoice",
                metadata: {
                    invoiceNumber,
                    billingEmail: input.billingEmail,
                },
            });
            savedInvoice = await fetchInvoiceDetail(tx, invoiceId);
        });
        return mapInvoiceDetail(savedInvoice);
    }),
    deleteInvoice: protectedProcedure
        .input(z.object({
        invoiceId: z.string().uuid(),
    }))
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        await ensureInvoiceMutationAccess(db, user.id, user.role, input.invoiceId);
        await db.transaction(async (tx) => {
            const invRows = await tx
                .select({ id: invoice.id, invoiceNumber: invoice.invoiceNumber })
                .from(invoice)
                .where(eq(invoice.id, input.invoiceId))
                .limit(1);
            const inv = invRows[0];
            if (!inv) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Invoice not found.",
                });
            }
            await logInvoiceActivity(tx, {
                invoiceId: input.invoiceId,
                userId: user.id,
                action: "DELETE",
                description: `Invoice ${inv.invoiceNumber || input.invoiceId} deleted`,
                metadata: {
                    invoiceNumber: inv.invoiceNumber,
                },
            });
            await deleteInvoices(tx, [input.invoiceId]);
        });
        return { success: true };
    }),
    bulkDeleteInvoices: protectedProcedure
        .input(z.object({
        invoiceIds: z.array(z.string().uuid()).min(1),
    }))
        .output(z.object({ success: z.boolean(), deletedCount: z.number().int().nonnegative() }))
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        // Enforce access per-invoice (agency users can delete any; others must have access).
        for (const invoiceId of input.invoiceIds) {
            await ensureInvoiceMutationAccess(db, user.id, user.role, invoiceId);
        }
        await db.transaction(async (tx) => {
            await deleteInvoices(tx, input.invoiceIds);
        });
        return { success: true, deletedCount: input.invoiceIds.length };
    }),
    resendEmailReminder: protectedProcedure
        .input(z.object({
        invoiceId: z.string().uuid(),
        to: z.string().email().optional(),
        pdfBase64: z.string(), // Base64 encoded PDF blob
        cc: z.array(z.string().email()).optional(),
        bcc: z.array(z.string().email()).optional(),
    }))
        .output(invoiceDetailSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        const { renderInvoiceDeliveryEmail } = await import("../../lib/email-templates");
        const { getSesClient, sendSesRawEmail } = await import("../../lib/ses-client");
        await ensureInvoiceMutationAccess(db, user.id, user.role, input.invoiceId);
        const invoiceDetail = await fetchInvoiceDetail(db, input.invoiceId);
        const toEmail = input.to?.trim() || invoiceDetail.customerEmail?.trim();
        if (!toEmail) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "No recipient email address provided.",
            });
        }
        const formatMoney = (currency, value) => {
            const n = typeof value === "number" ? value : Number(value);
            const safe = Number.isFinite(n) ? n : 0;
            const formatted = new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(safe);
            return `${currency} ${formatted}`;
        };
        // Format dates for email
        const formatDate = (date) => {
            if (!date)
                return "N/A";
            return new Date(date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        };
        // Render email template
        const emailHtml = await renderInvoiceDeliveryEmail({
            customerName: invoiceDetail.customerName || "Valued Customer",
            invoiceNumber: invoiceDetail.invoiceNumber || "N/A",
            issueDate: formatDate(invoiceDetail.issueDate),
            dueDate: formatDate(invoiceDetail.dueDate),
            totalAmount: formatMoney(invoiceDetail.currency || "KES", invoiceDetail.amount),
            currency: invoiceDetail.currency || "KES",
            supportEmail: "billing@nisccloud.com",
            supportPhone: "+254 748 777 666",
        });
        // Generate PDF filename from invoice number
        const sanitizeFilename = (name) => {
            return name.replace(/[^a-zA-Z0-9._-]/g, "_");
        };
        const pdfFilename = invoiceDetail.invoiceNumber
            ? `${sanitizeFilename(invoiceDetail.invoiceNumber)}.pdf`
            : "Invoice.pdf";
        // Prepare PDF attachment
        const pdfBuffer = Buffer.from(input.pdfBase64, "base64");
        const stripHeaderUnsafe = (value) => value.replace(/[\r\n]+/g, " ").trim();
        const toRfc2047Utf8 = (value) => {
            if (/^[\x00-\x7F]*$/.test(value))
                return value;
            const buf = Buffer.from(value, "utf8");
            return `=?UTF-8?B?${buf.toString("base64")}?=`;
        };
        const parseDisplayEmail = (value) => {
            const v = stripHeaderUnsafe(value);
            const m = v.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
            if (m)
                return { name: m[1]?.trim() || null, email: m[2].trim() };
            return { name: null, email: v };
        };
        const buildFromHeader = (fromName, fromEmail) => {
            const parsed = parseDisplayEmail(fromEmail);
            const name = stripHeaderUnsafe(fromName ?? parsed.name ?? "");
            const email = stripHeaderUnsafe(parsed.email);
            return name ? `${toRfc2047Utf8(name)} <${email}>` : email;
        };
        const buildRawMimeWithPdf = (params) => {
            const boundaryMixed = `npanel-mixed-${crypto.randomUUID()}`;
            const boundaryAlt = `npanel-alt-${crypto.randomUUID()}`;
            const lines = [];
            lines.push(`From: ${params.from}`);
            lines.push(`To: ${params.to}`);
            if (params.cc && params.cc.length > 0) {
                lines.push(`Cc: ${params.cc.join(", ")}`);
            }
            lines.push(`Subject: ${toRfc2047Utf8(params.subject)}`);
            if (params.replyTo)
                lines.push(`Reply-To: ${params.replyTo}`);
            lines.push("MIME-Version: 1.0");
            lines.push(`Content-Type: multipart/mixed; boundary="${boundaryMixed}"`);
            lines.push("");
            // alternative part
            lines.push(`--${boundaryMixed}`);
            lines.push(`Content-Type: multipart/alternative; boundary="${boundaryAlt}"`);
            lines.push("");
            lines.push(`--${boundaryAlt}`);
            lines.push('Content-Type: text/html; charset="UTF-8"');
            lines.push("Content-Transfer-Encoding: 7bit");
            lines.push("");
            lines.push(params.html);
            lines.push("");
            lines.push(`--${boundaryAlt}--`);
            lines.push("");
            // attachment part
            lines.push(`--${boundaryMixed}`);
            lines.push(`Content-Type: application/pdf; name="${params.attachmentFilename}"`);
            lines.push("Content-Transfer-Encoding: base64");
            lines.push(`Content-Disposition: attachment; filename="${params.attachmentFilename}"`);
            lines.push("");
            lines.push(params.attachment.toString("base64"));
            lines.push("");
            lines.push(`--${boundaryMixed}--`);
            lines.push("");
            return Buffer.from(lines.join("\r\n"), "utf8");
        };
        // Send email with PDF attachment
        try {
            const fromDomainRaw = process.env.NISC_TX_EMAIL_DOMAIN?.trim();
            const fromDomain = fromDomainRaw && !fromDomainRaw.includes("@") ? fromDomainRaw : undefined;
            const fromEmail = (process.env.NISC_TX_FROM_EMAIL?.trim() ||
                (fromDomain ? `noreply@${fromDomain}` : "noreply@npanel.com"));
            const fromName = process.env.NISC_TX_FROM_NAME?.trim() || "nPanel";
            const replyTo = process.env.NISC_TX_REPLY_TO?.trim() || undefined;
            const to = toEmail;
            const cc = input.cc?.filter(Boolean);
            const bcc = input.bcc?.filter(Boolean);
            const destinations = [to, ...(cc ?? []), ...(bcc ?? [])];
            const raw = buildRawMimeWithPdf({
                from: buildFromHeader(fromName, fromEmail),
                to,
                cc,
                subject: stripHeaderUnsafe(`Invoice Reminder: ${invoiceDetail.invoiceNumber || "Invoice"} from ${fromName}`),
                replyTo: replyTo ? stripHeaderUnsafe(replyTo) : null,
                html: emailHtml,
                attachmentFilename: pdfFilename,
                attachment: pdfBuffer,
            });
            const ses = getSesClient();
            await sendSesRawEmail(ses, {
                RawMessage: { Data: raw },
                Destinations: destinations,
            });
            // Batch: Update reminderSentAt timestamp and log activity in a transaction
            // This reduces connection usage from 2 sequential queries to 1 transaction
            await db.transaction(async (tx) => {
                await tx
                    .update(invoice)
                    .set({ reminderSentAt: new Date() })
                    .where(eq(invoice.id, input.invoiceId));
                await logInvoiceActivity(tx, {
                    invoiceId: input.invoiceId,
                    userId: user.id,
                    action: "REMINDER_SENT",
                    description: "Email reminder sent",
                    metadata: {
                        sentTo: to,
                        cc: cc ?? [],
                        bccCount: bcc?.length ?? 0,
                    },
                });
            });
        }
        catch (emailError) {
            console.error("Failed to send invoice reminder email:", emailError);
            await logInvoiceActivity(db, {
                invoiceId: input.invoiceId,
                userId: user.id,
                action: "EMAIL_ERROR",
                description: "Failed to send invoice reminder email",
                metadata: {
                    error: emailError instanceof Error ? emailError.message : "Unknown error",
                },
            });
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to send email reminder",
            });
        }
        const updatedInvoiceDetail = await fetchInvoiceDetail(db, input.invoiceId);
        return mapInvoiceDetail(updatedInvoiceDetail);
    }),
    listTransactions: protectedProcedure
        .input(z.object({
        limit: z.number().int().min(1).max(100).optional().default(50),
        offset: z.number().int().min(0).optional().default(0),
        status: invoicePaymentStatusSchema.optional(),
    }))
        .output(z.object({
        transactions: z.array(invoiceTransactionOutputSchema.extend({
            invoiceNumber: nullableStringSchema,
        })),
        total: z.number().int().nonnegative(),
    }))
        .query(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        const conditions = [];
        if (!isAgencyUser(user.role)) {
            const memberships = await db
                .select({ teamId: teamMember.teamId })
                .from(teamMember)
                .where(eq(teamMember.userId, user.id));
            const accessibleTeams = memberships
                .map((m) => m.teamId)
                .filter((id) => id != null);
            const orParts = [];
            if (accessibleTeams.length > 0) {
                orParts.push(inArray(invoice.teamId, accessibleTeams));
            }
            orParts.push(and(isNull(invoice.teamId), eq(invoice.createdBy, user.id)));
            conditions.push(or(...orParts));
        }
        if (input.status) {
            conditions.push(eq(invoiceTransaction.status, input.status));
        }
        const joinOn = eq(invoiceTransaction.invoiceId, invoice.id);
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const [transactions, totalRow] = await Promise.all([
            db
                .select({
                id: invoiceTransaction.id,
                invoiceId: invoiceTransaction.invoiceId,
                reference: invoiceTransaction.reference,
                providerReference: invoiceTransaction.providerReference,
                status: invoiceTransaction.status,
                method: invoiceTransaction.method,
                amount: invoiceTransaction.amount,
                currency: invoiceTransaction.currency,
                paidAt: invoiceTransaction.paidAt,
                notes: invoiceTransaction.notes,
                metadata: invoiceTransaction.metadata,
                balanceBefore: invoiceTransaction.balanceBefore,
                balanceAfter: invoiceTransaction.balanceAfter,
                recordedBy: invoiceTransaction.recordedBy,
                createdAt: invoiceTransaction.createdAt,
                updatedAt: invoiceTransaction.updatedAt,
                invoiceNumber: invoice.invoiceNumber,
            })
                .from(invoiceTransaction)
                .innerJoin(invoice, joinOn)
                .where(whereClause ?? sql `true`)
                .orderBy(desc(invoiceTransaction.createdAt))
                .limit(input.limit)
                .offset(input.offset),
            db
                .select({ c: count() })
                .from(invoiceTransaction)
                .innerJoin(invoice, joinOn)
                .where(whereClause ?? sql `true`),
        ]);
        const total = Number(totalRow[0]?.c ?? 0);
        return {
            transactions: transactions.map((t) => ({
                ...invoiceTransactionOutputSchema.parse({
                    id: t.id,
                    invoiceId: t.invoiceId,
                    reference: t.reference,
                    providerReference: t.providerReference,
                    status: t.status,
                    method: t.method,
                    amount: t.amount,
                    currency: t.currency,
                    paidAt: t.paidAt,
                    notes: t.notes,
                    metadata: t.metadata,
                    balanceBefore: t.balanceBefore,
                    balanceAfter: t.balanceAfter,
                    recordedBy: t.recordedBy,
                    createdAt: t.createdAt,
                    updatedAt: t.updatedAt,
                }),
                invoiceNumber: t.invoiceNumber,
            })),
            total,
        };
    }),
});
/** For server-side PDF generation (e.g. Nisc auto-invoice email). Skips auth. */
export { fetchInvoiceDetail, mapInvoiceDetail };
