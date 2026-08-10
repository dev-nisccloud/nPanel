import { TRPCError } from "@trpc/server";
import * as crypto from "crypto";
import { z } from "zod";
import { and, count, desc, eq, ilike, inArray, max, or, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { user } from "@npanel/db/schema/auth";
import { quotation, quotationActivityLog, quotationCounter, quotationLineItem, } from "@npanel/db/schema/quotations";
import { protectedProcedure, router } from "../../trpc";
import { quotationActivityLogSchema, quotationCreateInputSchema, quotationCustomerSummarySchema, quotationCustomersSummaryFiltersSchema, quotationCustomersSummaryResponseSchema, quotationDetailSchema, quotationLineItemOutputSchema, quotationListFiltersSchema, quotationListResponseSchema, quotationStatusSchema, quotationSummarySchema, quotationUpdateInputSchema, nextQuotationNumberSchema, sendQuotationEmailSchema, } from "./schemas";
const isAgencyUser = (role) => ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role);
const isAgencySuperAdmin = (role) => role === "AGENCY_SUPER_ADMIN";
/** Prefer email, else normalized name, else unassigned  groups similar customers. */
function customerGroupKeySql() {
    return sql `CASE
		WHEN nullif(trim(lower(${quotation.customerEmail})), '') IS NOT NULL
			THEN 'email:' || trim(lower(${quotation.customerEmail}))
		WHEN nullif(trim(lower(${quotation.customerName})), '') IS NOT NULL
			THEN 'name:' || trim(lower(regexp_replace(${quotation.customerName}, '\\s+', ' ', 'g')))
		ELSE 'unassigned'
	END`;
}
function customerGroupKeyCondition(customerGroupKey) {
    if (customerGroupKey === "unassigned") {
        return and(or(sql `nullif(trim(${quotation.customerEmail}), '') IS NULL`, sql `${quotation.customerEmail} IS NULL`), or(sql `nullif(trim(${quotation.customerName}), '') IS NULL`, sql `${quotation.customerName} IS NULL`));
    }
    if (customerGroupKey.startsWith("email:")) {
        const email = customerGroupKey.slice("email:".length);
        return sql `trim(lower(${quotation.customerEmail})) = ${email}`;
    }
    if (customerGroupKey.startsWith("name:")) {
        const name = customerGroupKey.slice("name:".length);
        return and(or(sql `nullif(trim(${quotation.customerEmail}), '') IS NULL`, sql `${quotation.customerEmail} IS NULL`), sql `trim(lower(regexp_replace(coalesce(${quotation.customerName}, ''), '\\s+', ' ', 'g'))) = ${name}`);
    }
    return sql `false`;
}
function parseDate(value) {
    if (!value)
        return null;
    if (value instanceof Date)
        return value;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}
function stringOrNull(value) {
    if (value === null || value === undefined)
        return null;
    if (typeof value === "string")
        return value;
    return String(value);
}
async function getAuthenticatedUser(ctx) {
    const sessionUser = ctx.session?.user;
    if (!sessionUser?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in." });
    }
    const sessionRole = sessionUser?.role;
    if (sessionRole)
        return { id: sessionUser.id, role: sessionRole };
    const dbUserRows = await db
        .select({ id: user.id, role: user.role })
        .from(user)
        .where(eq(user.id, sessionUser.id))
        .limit(1);
    const dbUser = dbUserRows[0];
    if (!dbUser) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found." });
    }
    return { id: dbUser.id, role: dbUser.role };
}
async function ensureQuotationAccess(_db, userId, role, quotationId) {
    const rows = await _db
        .select({ createdBy: quotation.createdBy })
        .from(quotation)
        .where(eq(quotation.id, quotationId))
        .limit(1);
    const qRow = rows[0];
    if (!qRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Quotation not found." });
    }
    if (isAgencyUser(role))
        return qRow;
    if (qRow.createdBy !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this quotation." });
    }
    return qRow;
}
async function ensureQuotationMutationAccess(_db, userId, role, quotationId) {
    const rows = await _db
        .select({ createdBy: quotation.createdBy })
        .from(quotation)
        .where(eq(quotation.id, quotationId))
        .limit(1);
    const qRow = rows[0];
    if (!qRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Quotation not found." });
    }
    if (!isAgencySuperAdmin(role) && qRow.createdBy !== userId) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the quotation creator can modify it.",
        });
    }
    return qRow;
}
function buildQuotationData(input) {
    const data = {
        customerName: stringOrNull(input.customerName),
        customerEmail: stringOrNull(input.customerEmail),
        linkedUserId: input.linkedUserId ?? null,
        quotationNumber: stringOrNull(input.quotationNumber),
        token: input.token ?? crypto.randomUUID(),
        status: input.status ?? "DRAFT",
        amount: stringOrNull(input.amount),
        subtotal: stringOrNull(input.subtotal),
        tax: stringOrNull(input.tax),
        taxPercentage: input.taxPercentage ?? null,
        vat: stringOrNull(input.vat),
        discount: stringOrNull(input.discount),
        currency: input.currency ?? "KES",
        issueDate: parseDate(input.issueDate),
        note: stringOrNull(input.note),
        internalNote: stringOrNull(input.internalNote),
        createdBy: input.createdBy,
        updatedBy: input.updatedBy ?? input.createdBy,
    };
    if (input.metadata != null)
        data.metadata = input.metadata;
    if (input.fromDetails != null)
        data.fromDetails = input.fromDetails;
    if (input.customerDetails != null)
        data.customerDetails = input.customerDetails;
    if (input.noteDetails != null)
        data.noteDetails = input.noteDetails;
    if (input.template != null)
        data.template = input.template;
    if (input.topBlock != null)
        data.topBlock = input.topBlock;
    if (input.bottomBlock != null)
        data.bottomBlock = input.bottomBlock;
    return data;
}
function buildQuotationUpdateData(input, userId) {
    const data = { updatedBy: userId, updatedAt: new Date() };
    const set = (key, value) => {
        if (Object.prototype.hasOwnProperty.call(input, key))
            data[key] = value;
    };
    set("customerName", stringOrNull(input.customerName));
    set("customerEmail", stringOrNull(input.customerEmail));
    set("linkedUserId", input.linkedUserId ?? null);
    set("quotationNumber", stringOrNull(input.quotationNumber));
    set("status", input.status);
    set("amount", stringOrNull(input.amount));
    set("subtotal", stringOrNull(input.subtotal));
    set("tax", stringOrNull(input.tax));
    set("taxPercentage", input.taxPercentage ?? null);
    set("vat", stringOrNull(input.vat));
    set("discount", stringOrNull(input.discount));
    set("currency", input.currency);
    set("issueDate", parseDate(input.issueDate));
    set("note", stringOrNull(input.note));
    set("internalNote", stringOrNull(input.internalNote));
    if (Object.prototype.hasOwnProperty.call(input, "metadata"))
        data.metadata = input.metadata;
    if (Object.prototype.hasOwnProperty.call(input, "fromDetails"))
        data.fromDetails = input.fromDetails;
    if (Object.prototype.hasOwnProperty.call(input, "customerDetails"))
        data.customerDetails = input.customerDetails;
    if (Object.prototype.hasOwnProperty.call(input, "noteDetails"))
        data.noteDetails = input.noteDetails;
    if (Object.prototype.hasOwnProperty.call(input, "template"))
        data.template = input.template;
    if (Object.prototype.hasOwnProperty.call(input, "topBlock"))
        data.topBlock = input.topBlock;
    if (Object.prototype.hasOwnProperty.call(input, "bottomBlock"))
        data.bottomBlock = input.bottomBlock;
    return data;
}
function mapQuotationDetail(row) {
    const lineItems = row.lineItems.map((item) => quotationLineItemOutputSchema.parse({
        id: item.id,
        position: item.position,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        discount: item.discount,
        total: item.total,
        ...(item.metadata != null && { metadata: item.metadata }),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
    }));
    const activityLogs = (row.activityLogs ?? []).map((log) => quotationActivityLogSchema.parse({
        id: log.id,
        userId: log.userId,
        action: log.action,
        description: log.description ?? null,
        ...(log.metadata != null && { metadata: log.metadata }),
        ipAddress: log.ipAddress ?? null,
        userAgent: log.userAgent ?? null,
        createdAt: log.createdAt,
    }));
    return quotationDetailSchema.parse({
        id: row.id,
        quotationNumber: row.quotationNumber,
        customerName: row.customerName,
        customerEmail: row.customerEmail,
        linkedUserId: row.linkedUserId ?? null,
        status: row.status,
        amount: row.amount,
        currency: row.currency,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        subtotal: row.subtotal,
        tax: row.tax,
        taxPercentage: row.taxPercentage ?? null,
        vat: row.vat,
        discount: row.discount,
        issueDate: row.issueDate,
        note: row.note,
        internalNote: row.internalNote,
        ...(row.metadata != null && { metadata: row.metadata }),
        lineItems,
        activityLogs,
        ...(row.fromDetails != null && { fromDetails: row.fromDetails }),
        ...(row.customerDetails != null && { customerDetails: row.customerDetails }),
        ...(row.noteDetails != null && { noteDetails: row.noteDetails }),
        ...(row.template != null && { template: row.template }),
        ...(row.topBlock != null && { topBlock: row.topBlock }),
        ...(row.bottomBlock != null && { bottomBlock: row.bottomBlock }),
    });
}
async function fetchQuotationDetail(_db, quotationId) {
    const q = await _db.query.quotation.findFirst({
        where: eq(quotation.id, quotationId),
        with: {
            lineItems: {
                orderBy: (li, { asc: a }) => [a(li.position)],
            },
            activityLogs: {
                orderBy: (al, { desc: d }) => [d(al.createdAt)],
            },
        },
    });
    if (!q) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Quotation not found." });
    }
    return q;
}
async function logQuotationActivity(tx, params) {
    await tx.insert(quotationActivityLog).values({
        id: crypto.randomUUID(),
        quotationId: params.quotationId,
        userId: params.userId,
        action: params.action,
        description: params.description ?? null,
        ...(params.metadata != null && { metadata: params.metadata }),
        createdAt: new Date(),
    });
}
function parseQuotationNumber(quotationNumber) {
    const match = quotationNumber.match(/^QUOT-(\d+)$/i);
    if (!match)
        return null;
    const num = Number.parseInt(match[1] ?? "", 10);
    return Number.isNaN(num) ? null : num;
}
async function updateQuotationCounter(tx, quotationNumber) {
    const parsed = parseQuotationNumber(quotationNumber);
    if (!parsed || parsed < 1)
        return;
    await tx
        .insert(quotationCounter)
        .values({
        id: "quotation-counter",
        lastNumber: parsed,
        updatedAt: new Date(),
    })
        .onConflictDoUpdate({
        target: quotationCounter.id,
        set: { lastNumber: parsed, updatedAt: new Date() },
    });
}
async function generateNextQuotationNumber(tx) {
    const now = new Date();
    const rows = await tx
        .insert(quotationCounter)
        .values({
        id: "quotation-counter",
        lastNumber: 1,
        updatedAt: now,
    })
        .onConflictDoUpdate({
        target: quotationCounter.id,
        set: {
            lastNumber: sql `${quotationCounter.lastNumber} + 1`,
            updatedAt: now,
        },
    })
        .returning({ lastNumber: quotationCounter.lastNumber });
    const lastNumber = rows[0]?.lastNumber ?? 1;
    return `QUOT-${lastNumber.toString().padStart(4, "0")}`;
}
export const quotationsRouter = router({
    list: protectedProcedure
        .input(quotationListFiltersSchema)
        .output(quotationListResponseSchema)
        .query(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        const conditions = [];
        if (!isAgencyUser(user.role)) {
            conditions.push(eq(quotation.createdBy, user.id));
        }
        if (input.customerGroupKey?.trim()) {
            conditions.push(customerGroupKeyCondition(input.customerGroupKey.trim()));
        }
        if (input.status) {
            conditions.push(eq(quotation.status, input.status));
        }
        if (input.search?.trim()) {
            const q = `%${input.search.trim()}%`;
            conditions.push(or(ilike(quotation.quotationNumber, q), ilike(quotation.customerName, q), ilike(quotation.customerEmail, q), ilike(quotation.status, q)));
        }
        const whereClause = conditions.length ? and(...conditions) : undefined;
        const [quotations, totalRow] = await Promise.all([
            db
                .select({
                id: quotation.id,
                quotationNumber: quotation.quotationNumber,
                customerName: quotation.customerName,
                customerEmail: quotation.customerEmail,
                status: quotation.status,
                amount: quotation.amount,
                subtotal: quotation.subtotal,
                currency: quotation.currency,
                createdAt: quotation.createdAt,
                updatedAt: quotation.updatedAt,
            })
                .from(quotation)
                .where(whereClause ?? sql `true`)
                .orderBy(desc(quotation.createdAt))
                .limit(input.limit)
                .offset(input.offset),
            db
                .select({ c: count() })
                .from(quotation)
                .where(whereClause ?? sql `true`),
        ]);
        const total = Number(totalRow[0]?.c ?? 0);
        return quotationListResponseSchema.parse({
            quotations: quotations.map((q) => quotationSummarySchema.parse({
                ...q,
                amount: q.amount != null ? String(q.amount) : null,
                subtotal: q.subtotal != null ? String(q.subtotal) : null,
            })),
            total,
        });
    }),
    listCustomersSummary: protectedProcedure
        .input(quotationCustomersSummaryFiltersSchema)
        .output(quotationCustomersSummaryResponseSchema)
        .query(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        const conditions = [];
        if (!isAgencyUser(user.role)) {
            conditions.push(eq(quotation.createdBy, user.id));
        }
        if (input.search?.trim()) {
            const q = `%${input.search.trim()}%`;
            conditions.push(or(ilike(quotation.customerName, q), ilike(quotation.customerEmail, q)));
        }
        const whereClause = conditions.length ? and(...conditions) : undefined;
        const groupKey = customerGroupKeySql();
        const rows = await db
            .select({
            customerGroupKey: groupKey,
            customerName: max(quotation.customerName),
            customerEmail: max(quotation.customerEmail),
            quotationCount: count(),
            openCount: sql `count(*) filter (where ${quotation.status} in ('DRAFT', 'SENT'))`.mapWith(Number),
            lastQuotationAt: max(quotation.createdAt),
        })
            .from(quotation)
            .where(whereClause ?? sql `true`)
            .groupBy(groupKey)
            .orderBy(sql `max(${quotation.customerName}) asc nulls last`);
        return quotationCustomersSummaryResponseSchema.parse({
            customers: rows.map((row) => quotationCustomerSummarySchema.parse({
                customerGroupKey: row.customerGroupKey,
                customerName: row.customerGroupKey === "unassigned"
                    ? "Unassigned"
                    : row.customerName ?? null,
                customerEmail: row.customerGroupKey === "unassigned" ? null : row.customerEmail ?? null,
                quotationCount: Number(row.quotationCount),
                openCount: Number(row.openCount ?? 0),
                lastQuotationAt: row.lastQuotationAt ?? null,
            })),
        });
    }),
    getById: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .output(quotationDetailSchema)
        .query(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        await ensureQuotationAccess(db, user.id, user.role, input.id);
        const quotationDetail = await fetchQuotationDetail(db, input.id);
        return mapQuotationDetail(quotationDetail);
    }),
    getNextQuotationNumber: protectedProcedure
        .output(nextQuotationNumberSchema)
        .query(async () => {
        const counterRows = await db
            .select({ lastNumber: quotationCounter.lastNumber })
            .from(quotationCounter)
            .where(eq(quotationCounter.id, "quotation-counter"))
            .limit(1);
        const counter = counterRows[0];
        const nextNumber = (counter?.lastNumber ?? 0) + 1;
        return {
            quotationNumber: `QUOT-${nextNumber.toString().padStart(4, "0")}`,
            nextNumber,
        };
    }),
    create: protectedProcedure
        .input(quotationCreateInputSchema)
        .output(quotationDetailSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        if (!isAgencySuperAdmin(user.role) && input.createdBy && input.createdBy !== user.id) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Only agency super admin can create quotations for other users.",
            });
        }
        const quotationId = input.id ?? crypto.randomUUID();
        const token = input.token ?? crypto.randomUUID();
        await db.transaction(async (tx) => {
            let quotationNumber = input.quotationNumber;
            if (!quotationNumber) {
                quotationNumber = await generateNextQuotationNumber(tx);
            }
            else {
                const existingRows = await tx
                    .select({ id: quotation.id })
                    .from(quotation)
                    .where(eq(quotation.quotationNumber, quotationNumber))
                    .limit(1);
                const existing = existingRows[0];
                if (existing) {
                    throw new TRPCError({
                        code: "CONFLICT",
                        message: `Quotation number ${quotationNumber} already exists.`,
                    });
                }
                await updateQuotationCounter(tx, quotationNumber);
            }
            const data = buildQuotationData({
                ...input,
                quotationNumber,
                id: quotationId,
                token,
                createdBy: input.createdBy ?? user.id,
                updatedBy: user.id,
            });
            await tx.insert(quotation).values({
                ...data,
                id: quotationId,
                token,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            if (input.lineItems?.length) {
                for (const [index, item] of input.lineItems.entries()) {
                    const lineId = item.id ?? crypto.randomUUID();
                    const lineData = {
                        id: lineId,
                        quotationId,
                        position: item.position ?? index,
                        name: stringOrNull(item.name),
                        description: stringOrNull(item.description),
                        quantity: item.quantity ?? null,
                        unit: stringOrNull(item.unit),
                        price: stringOrNull(item.price),
                        discount: stringOrNull(item.discount),
                        total: stringOrNull(item.total),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                    if (item.metadata != null)
                        lineData.metadata = item.metadata;
                    await tx.insert(quotationLineItem).values(lineData);
                }
            }
            await logQuotationActivity(tx, {
                quotationId,
                userId: user.id,
                action: "CREATE",
                description: "Created quotation",
                metadata: { quotationNumber },
            });
        });
        const quotationDetail = await fetchQuotationDetail(db, quotationId);
        return mapQuotationDetail(quotationDetail);
    }),
    update: protectedProcedure
        .input(quotationUpdateInputSchema)
        .output(quotationDetailSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        await ensureQuotationMutationAccess(db, user.id, user.role, input.id);
        await db.transaction(async (tx) => {
            const data = buildQuotationUpdateData(input, user.id);
            await tx
                .update(quotation)
                .set(data)
                .where(eq(quotation.id, input.id));
            if (input.lineItems) {
                const existing = await tx
                    .select({ id: quotationLineItem.id })
                    .from(quotationLineItem)
                    .where(eq(quotationLineItem.quotationId, input.id));
                const incomingIds = new Set(input.lineItems.filter((item) => item.id).map((item) => item.id));
                const toDelete = existing.filter((item) => !incomingIds.has(item.id)).map((item) => item.id);
                if (toDelete.length > 0) {
                    await tx.delete(quotationLineItem).where(inArray(quotationLineItem.id, toDelete));
                }
                for (const [index, item] of input.lineItems.entries()) {
                    const updateData = {
                        position: item.position ?? index,
                        name: stringOrNull(item.name),
                        description: stringOrNull(item.description),
                        quantity: item.quantity ?? null,
                        unit: stringOrNull(item.unit),
                        price: stringOrNull(item.price),
                        discount: stringOrNull(item.discount),
                        total: stringOrNull(item.total),
                        ...(item.metadata != null && { metadata: item.metadata }),
                        updatedAt: new Date(),
                    };
                    if (item.id) {
                        await tx
                            .update(quotationLineItem)
                            .set(updateData)
                            .where(eq(quotationLineItem.id, item.id));
                    }
                    else {
                        await tx.insert(quotationLineItem).values({
                            id: crypto.randomUUID(),
                            quotationId: input.id,
                            ...updateData,
                            createdAt: new Date(),
                        });
                    }
                }
            }
            await logQuotationActivity(tx, {
                quotationId: input.id,
                userId: user.id,
                action: "UPDATE",
                description: "Updated quotation",
            });
        });
        const quotationDetail = await fetchQuotationDetail(db, input.id);
        return mapQuotationDetail(quotationDetail);
    }),
    updateStatus: protectedProcedure
        .input(z.object({
        id: z.string().uuid(),
        status: quotationStatusSchema,
        note: z.string().optional(),
    }))
        .output(quotationDetailSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        await ensureQuotationMutationAccess(db, user.id, user.role, input.id);
        await db.transaction(async (tx) => {
            await tx
                .update(quotation)
                .set({
                status: input.status,
                updatedBy: user.id,
                updatedAt: new Date(),
            })
                .where(eq(quotation.id, input.id));
            await logQuotationActivity(tx, {
                quotationId: input.id,
                userId: user.id,
                action: "STATUS_CHANGE",
                description: `Changed status to ${input.status}`,
                metadata: input.note ? { note: input.note } : undefined,
            });
        });
        const quotationDetail = await fetchQuotationDetail(db, input.id);
        return mapQuotationDetail(quotationDetail);
    }),
    deleteQuotation: protectedProcedure
        .input(z.object({ quotationId: z.string().uuid() }))
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        await ensureQuotationMutationAccess(db, user.id, user.role, input.quotationId);
        await db.transaction(async (tx) => {
            const qRows = await tx
                .select({ id: quotation.id, quotationNumber: quotation.quotationNumber })
                .from(quotation)
                .where(eq(quotation.id, input.quotationId))
                .limit(1);
            const qDel = qRows[0];
            if (!qDel) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Quotation not found." });
            }
            await logQuotationActivity(tx, {
                quotationId: input.quotationId,
                userId: user.id,
                action: "DELETE",
                description: `Quotation ${qDel.quotationNumber ?? input.quotationId} deleted`,
                metadata: { quotationNumber: qDel.quotationNumber },
            });
            await tx
                .delete(quotationActivityLog)
                .where(eq(quotationActivityLog.quotationId, input.quotationId));
            await tx
                .delete(quotationLineItem)
                .where(eq(quotationLineItem.quotationId, input.quotationId));
            await tx.delete(quotation).where(eq(quotation.id, input.quotationId));
        });
        return { success: true };
    }),
    sendQuotationEmail: protectedProcedure
        .input(sendQuotationEmailSchema)
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        await ensureQuotationMutationAccess(db, user.id, user.role, input.quotationId);
        const quotationDetail = await fetchQuotationDetail(db, input.quotationId);
        const { sendEmail } = await import("../../lib/email");
        const { renderQuotationDeliveryEmail } = await import("../../lib/email-templates");
        const formatDate = (date) => {
            if (!date)
                return "N/A";
            return new Date(date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        };
        const services = quotationDetail.lineItems.map((item) => ({
            name: item.name || "Item",
            description: item.description ?? undefined,
            quantity: item.quantity ?? undefined,
            price: item.price ? `${quotationDetail.currency} ${item.price}` : undefined,
        }));
        const emailHtml = await renderQuotationDeliveryEmail({
            customerName: quotationDetail.customerName ?? "Valued Customer",
            quotationNumber: quotationDetail.quotationNumber ?? "N/A",
            issueDate: formatDate(quotationDetail.issueDate),
            totalAmount: quotationDetail.amount ?? "0.00",
            currency: quotationDetail.currency ?? "KES",
            services,
            supportEmail: "billing@nisccloud.com",
            supportPhone: "+254 748 777 666",
        });
        const filename = quotationDetail.quotationNumber
            ? `${String(quotationDetail.quotationNumber).replace(/[^a-zA-Z0-9._-]/g, "_")}.pdf`
            : "Quotation.pdf";
        await sendEmail({
            to: input.toEmail,
            subject: `Quotation ${quotationDetail.quotationNumber ?? ""} from Nisc Cloud®`,
            html: emailHtml,
            attachments: [
                {
                    filename,
                    content: Buffer.from(input.pdfBase64, "base64"),
                    contentType: "application/pdf",
                },
            ],
        });
        await logQuotationActivity(db, {
            quotationId: input.quotationId,
            userId: user.id,
            action: "EMAIL_SENT",
            description: `Quotation sent to ${input.toEmail}`,
            metadata: { toEmail: input.toEmail },
        });
        return { success: true };
    }),
    /**
     * Get quotations summary statistics
     */
    getSummary: protectedProcedure.query(async ({ ctx }) => {
        const actor = await getAuthenticatedUser(ctx);
        const isAgency = isAgencyUser(actor.role);
        try {
            let whereConditions;
            if (!isAgency) {
                // Regular users can only see their own quotations
                whereConditions = eq(quotation.createdBy, actor.id);
            }
            // Get total count
            const totalResult = await db
                .select({ count: count() })
                .from(quotation)
                .where(whereConditions);
            const total = totalResult[0]?.count || 0;
            // Get count by status
            const draftCount = await db
                .select({ count: count() })
                .from(quotation)
                .where(whereConditions
                ? and(whereConditions, eq(quotation.status, "DRAFT"))
                : eq(quotation.status, "DRAFT"));
            const sentCount = await db
                .select({ count: count() })
                .from(quotation)
                .where(whereConditions
                ? and(whereConditions, eq(quotation.status, "SENT"))
                : eq(quotation.status, "SENT"));
            const acceptedCount = await db
                .select({ count: count() })
                .from(quotation)
                .where(whereConditions
                ? and(whereConditions, eq(quotation.status, "ACCEPTED"))
                : eq(quotation.status, "ACCEPTED"));
            const rejectedCount = await db
                .select({ count: count() })
                .from(quotation)
                .where(whereConditions
                ? and(whereConditions, eq(quotation.status, "REJECTED"))
                : eq(quotation.status, "REJECTED"));
            const expiredCount = await db
                .select({ count: count() })
                .from(quotation)
                .where(whereConditions
                ? and(whereConditions, eq(quotation.status, "EXPIRED"))
                : eq(quotation.status, "EXPIRED"));
            return {
                total,
                draft: draftCount[0]?.count || 0,
                sent: sentCount[0]?.count || 0,
                accepted: acceptedCount[0]?.count || 0,
                rejected: rejectedCount[0]?.count || 0,
                expired: expiredCount[0]?.count || 0,
                // Computed aggregates
                pending: (draftCount[0]?.count || 0) + (sentCount[0]?.count || 0),
                closed: (acceptedCount[0]?.count || 0) + (rejectedCount[0]?.count || 0) + (expiredCount[0]?.count || 0),
            };
        }
        catch (error) {
            console.error("Error getting quotations summary:", error);
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to get quotations summary",
            });
        }
    }),
});
