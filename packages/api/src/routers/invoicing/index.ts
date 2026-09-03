import { TRPCError } from "@trpc/server";
import * as crypto from "crypto";
import { z } from "zod";
import { and, count, desc, eq, ilike, inArray, isNull, max, or, sql } from "@npanel/db";

import { db } from "@npanel/db";
import { user } from "@npanel/db/schema/auth";
import {
	creditNote,
	creditNoteActivityLog,
	creditNoteCounter,
	invoice,
	invoiceActivityLog,
	invoiceCounter,
	invoiceLineItem,
	invoiceTransaction,
	invoiceTransactionActivityLog,
} from "@npanel/db/schema/invoicing";
import { order } from "@npanel/db/schema/orders";
import { niscOrder } from "@npanel/db/schema/nisc-orders";
import { cronWorkflowRunInvoice } from "@npanel/db/schema/cron-workflow-runs";
import { team, teamMember } from "@npanel/db/schema/teams";
import { protectedProcedure, router, type Context } from "../../trpc";
import { resolveInvoicePaymentMethod } from "../../lib/invoice-payment-method";
import {
	buildInvoiceKraInsertFields,
	buildInvoiceKraUpdateFields,
	mapInvoiceKraDetailFields,
} from "../../lib/invoice-kra-db-fields";
import { scheduleInvoiceKraSyncAfterCreate } from "../../lib/qstash/invoice-kra-sync-worker";
import {
	prepareInvoiceEmailDelivery,
	sendInvoiceReminderEmail,
} from "../../lib/invoice-email-delivery";
import {
	processInvoiceKraSync,
	type InvoiceKraSyncResult,
} from "../../lib/invoice-kra-sync";
import {
	isInvoiceKraSynced,
	kraStatusLabel,
} from "../../lib/invoice-kra-status";
import { sanitizeInvoiceDetailForCustomer } from "../../lib/invoice-customer-view";
import {
	sanitizeCreditNoteDetailForCustomer,
} from "../../lib/credit-note-customer-view";
import {
	buildCreditNoteKraInsertFields,
	mapCreditNoteKraDetailFields,
} from "../../lib/credit-note-kra-db-fields";
import {
	processCreditNoteKraSync,
	type CreditNoteKraSyncResult,
} from "../../lib/credit-note-kra-sync";
import { COMPANY_LOGO_URL } from "../../lib/company-branding";
import {
	activityLogSchema,
	creditNoteInputSchema,
	creditNoteOutputSchema,
	creditNoteDetailSchema,
	creditNoteListFiltersSchema,
	creditNoteListResponseSchema,
	creditNoteSummarySchema,
	issueCreditNoteInputSchema,
	invoiceCreateInputSchema,
	invoiceDetailSchema,
	invoiceLineItemOutputSchema,
	invoiceListFiltersSchema,
	invoiceListResponseSchema,
	invoicePaymentStatusSchema,
	invoiceStatusSchema,
	invoiceSummarySchema,
	invoiceTeamsSummaryFiltersSchema,
	invoiceTeamsSummaryResponseSchema,
	invoiceTeamSummarySchema,
	invoiceTransactionInputSchema,
	invoiceTransactionOutputSchema,
	invoiceUpdateInputSchema,
	nextInvoiceNumberSchema,
	nullableStringSchema,
	submitInvoiceSchema,
	updatePaymentInputSchema,
} from "./schemas";
import type { CreditNoteDetail, InvoiceDetail } from "./schemas";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbLike = typeof db | DbTransaction;

const isAgencyUser = (role: string) =>
	["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role);
const isAgencySuperAdmin = (role: string) => role === "AGENCY_SUPER_ADMIN";
// // Unused function commented out
// const isCustomer = (role: string) => role === "CUSTOMER"; // Unused, commented out

function parseDate(value: unknown) {
	if (!value) {
		return null;
	}
	if (value instanceof Date) {
		return value;
	}
	const parsed = new Date(value as string);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function stringOrNull(value: unknown) {
	if (value === null || value === undefined) {
		return null;
	}
	if (typeof value === "string") {
		return value;
	}
	return String(value);
}

async function getAuthenticatedUser(ctx: Context) {
	const sessionUser = ctx.session?.user;
	if (!sessionUser?.id) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You must be logged in.",
		});
	}

	const sessionRole = (sessionUser as { role?: string })?.role;

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

	return { id: dbUser.id, role: dbUser.role as string };
}



async function ensureTeamAccess(_db: DbLike, userId: string, role: string, teamId: string | null | undefined) {
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

	const { assertTeamPermission } = await import("../../lib/team-permissions/assert");
	await assertTeamPermission({
		teamId,
		userId,
		userRole: role,
		key: "billing.invoices_view",
		access: "read",
	});
}

async function ensureTeamMutationAccess(
	_db: DbLike,
	userId: string,
	role: string,
	teamId: string | null | undefined,
) {
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
	const { assertTeamPermission } = await import("../../lib/team-permissions/assert");
	await assertTeamPermission({
		teamId,
		userId,
		userRole: role,
		key: "billing.invoices_create",
		access: "write",
	});
}

async function ensureInvoiceAccess(_db: DbLike, userId: string, role: string, invoiceId: string) {
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

async function ensureCreditNoteAccess(
	_db: DbLike,
	userId: string,
	role: string,
	creditNoteId: string,
) {
	const row = await db.query.creditNote.findFirst({
		where: eq(creditNote.id, creditNoteId),
		columns: { teamId: true, invoiceId: true, createdBy: true },
	});
	if (!row) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Credit note not found.",
		});
	}

	if (isAgencyUser(role)) {
		return row;
	}

	if (row.teamId) {
		await ensureTeamAccess(db, userId, role, row.teamId);
		return row;
	}

	await ensureInvoiceAccess(db, userId, role, row.invoiceId);
	return row;
}

async function ensureInvoiceMutationAccess(
	_db: DbLike,
	userId: string,
	role: string,
	invoiceId: string,
) {
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

async function deleteInvoices(tx: DbLike, invoiceIds: string[]) {
	if (invoiceIds.length === 0) return;

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

function buildInvoiceData(input: z.infer<typeof invoiceCreateInputSchema>) {
	const data: any = {
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

	Object.assign(data, buildInvoiceKraInsertFields(input));

	return data;
}

function buildInvoiceUpdateData(
	input: z.infer<typeof invoiceUpdateInputSchema>,
	userId: string,
) {
	const data: Record<string, unknown> = {
		updatedBy: userId,
		updatedAt: new Date(),
	};

	const assignWhenProvided = <Key extends keyof z.infer<typeof invoiceUpdateInputSchema>>(
		key: Key,
		value: z.infer<typeof invoiceUpdateInputSchema>[Key],
	) => {
		if (Object.prototype.hasOwnProperty.call(input, key)) {
			data[key as string] = value;
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

	Object.assign(data, buildInvoiceKraUpdateFields(input));

	return data;
}

function mapInvoiceDetail(invoice: any): InvoiceDetail {
	const lineItems = invoice.lineItems.map((item: any) =>
		invoiceLineItemOutputSchema.parse({
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
		}),
	);

	const transactions = invoice.transactions.map((transaction: any) =>
		invoiceTransactionOutputSchema.parse({
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
			activityLogs: (transaction.activityLogs ?? []).map((log: any) =>
				activityLogSchema.parse({
					id: log.id,
					userId: log.userId,
					action: log.action,
					description: log.description ?? null,
					...(log.metadata !== undefined && { metadata: log.metadata }),
					ipAddress: log.ipAddress ?? null,
					userAgent: log.userAgent ?? null,
					createdAt: log.createdAt,
				}),
			),
		}),
	);

	const creditNote = invoice.creditNote
		? creditNoteOutputSchema.parse({
			...invoice.creditNote,
			activityLogs: (invoice.creditNote.activityLogs ?? []).map((log: any) =>
				activityLogSchema.parse({
					id: log.id,
					userId: log.userId,
					action: log.action,
					description: log.description ?? null,
					...(log.metadata !== undefined && { metadata: log.metadata }),
					ipAddress: log.ipAddress ?? null,
					userAgent: log.userAgent ?? null,
					createdAt: log.createdAt,
				}),
			),
		})
		: null;

	const activityLogs = (invoice.activityLogs ?? []).map((log: any) =>
		activityLogSchema.parse({
			id: log.id,
			userId: log.userId,
			action: log.action,
			description: log.description ?? null,
			...(log.metadata !== undefined && { metadata: log.metadata }),
			ipAddress: log.ipAddress ?? null,
			userAgent: log.userAgent ?? null,
			createdAt: log.createdAt,
		}),
	);

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
		teamName: invoice.teamName ?? null,
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
		...mapInvoiceKraDetailFields(invoice),
	});
}

async function fetchInvoiceDetail(tx: DbLike, invoiceId: string) {
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

async function logInvoiceActivity(
	tx: DbLike,
	params: {
		invoiceId: string;
		userId: string;
		action: string;
		description?: string | null;
		metadata?: unknown;
	},
) {
	const logData: {
		id: string;
		invoiceId: string;
		userId: string;
		action: string;
		description: string | null;
		metadata?: unknown;
		createdAt: Date;
	} = {
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
			? { metadata: params.metadata as object }
			: {}),
	});
}

async function logTransactionActivity(
	tx: DbLike,
	params: {
		transactionId: string;
		userId: string;
		action: string;
		description?: string | null;
		metadata?: unknown;
	},
) {
	const logData: {
		id: string;
		invoiceTransactionId: string;
		userId: string;
		action: string;
		description: string | null;
		metadata?: unknown;
		createdAt: Date;
	} = {
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
			? { metadata: params.metadata as object }
			: {}),
	});
}

async function logCreditNoteActivity(
	tx: DbLike,
	params: {
		creditNoteId: string;
		userId: string;
		action: string;
		description?: string | null;
		metadata?: unknown;
	},
) {
	const logData: {
		id: string;
		creditNoteId: string;
		userId: string;
		action: string;
		description: string | null;
		metadata?: unknown;
		createdAt: Date;
	} = {
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
			? { metadata: params.metadata as object }
			: {}),
	});
}

/**
 * Parses the numeric part from an invoice number string (e.g., "INV-0001" -> 1)
 * Returns null if the format is invalid
 */
function parseInvoiceNumber(invoiceNumber: string): number | null {
	const match = invoiceNumber.match(/^INV-(\d+)$/i);
	if (!match) return null;
	const num = Number.parseInt(match[1] || "", 10);
	return Number.isNaN(num) ? null : num;
}

/**
 * Updates the invoice counter to reflect the last used invoice number
 * This ensures the counter always tracks the highest invoice number used
 * Should be called within a transaction to ensure consistency
 */
async function updateInvoiceCounter(tx: DbLike, invoiceNumber: string): Promise<void> {
	const parsedNumber = parseInvoiceNumber(invoiceNumber);
	if (!parsedNumber || parsedNumber < 1) return;

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
async function generateNextInvoiceNumber(tx: DbLike): Promise<string> {
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
				lastNumber: sql`${invoiceCounter.lastNumber} + 1`,
				updatedAt: now,
			},
		})
		.returning({ lastNumber: invoiceCounter.lastNumber });
	const nextNumber = rows[0]?.lastNumber ?? 1;
	return `INV-${nextNumber.toString().padStart(4, "0")}`;
}

async function generateNextCreditNoteNumber(tx: DbLike): Promise<string> {
	const now = new Date();
	const rows = await tx
		.insert(creditNoteCounter)
		.values({
			id: "credit-note-counter",
			lastNumber: 1,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: creditNoteCounter.id,
			set: {
				lastNumber: sql`${creditNoteCounter.lastNumber} + 1`,
				updatedAt: now,
			},
		})
		.returning({ lastNumber: creditNoteCounter.lastNumber });
	const nextNumber = rows[0]?.lastNumber ?? 1;
	return `CN-${nextNumber.toString().padStart(4, "0")}`;
}

function mapCreditNoteDetail(raw: {
	creditNote: Record<string, unknown>;
	invoice: Record<string, unknown> | null | undefined;
}): CreditNoteDetail {
	const cn = raw.creditNote;
	const inv = raw.invoice ?? {};

	const lineItems = ((inv.lineItems as unknown[]) ?? []).map((item: unknown) => {
		const li = item as Record<string, unknown>;
		return invoiceLineItemOutputSchema.parse({
			id: li.id,
			position: li.position,
			name: li.name,
			description: li.description,
			quantity: li.quantity,
			unit: li.unit,
			price: li.price,
			discount: li.discount,
			total: li.total,
			...(li.metadata !== undefined && { metadata: li.metadata }),
			createdAt: li.createdAt,
			updatedAt: li.updatedAt,
		});
	});

	const activityLogs = ((cn.activityLogs as unknown[]) ?? []).map((log: unknown) => {
		const l = log as Record<string, unknown>;
		return activityLogSchema.parse({
			id: l.id,
			userId: l.userId,
			action: l.action,
			description: l.description ?? null,
			...(l.metadata !== undefined && { metadata: l.metadata }),
			ipAddress: l.ipAddress ?? null,
			userAgent: l.userAgent ?? null,
			createdAt: l.createdAt,
		});
	});

	return creditNoteDetailSchema.parse({
		id: cn.id,
		invoiceId: cn.invoiceId,
		teamId: cn.teamId,
		creditNumber: cn.creditNumber,
		status: cn.status,
		amount: cn.amount,
		currency: cn.currency,
		reason: cn.reason,
		note: cn.note ?? inv.note,
		...(cn.metadata !== undefined && { metadata: cn.metadata }),
		issuedAt: cn.issuedAt,
		appliedAt: cn.appliedAt,
		createdBy: cn.createdBy,
		updatedBy: cn.updatedBy,
		createdAt: cn.createdAt,
		updatedAt: cn.updatedAt,
		kraRefundReasonCode: cn.kraRefundReasonCode,
		originalInvoiceNumber: cn.originalInvoiceNumber,
		activityLogs,
		invoiceNumber: inv.invoiceNumber,
		customerName: inv.customerName,
		customerEmail: inv.customerEmail,
		fromDetails: inv.fromDetails,
		customerDetails: inv.customerDetails,
		paymentDetails: inv.paymentDetails,
		lineItems,
		subtotal: inv.subtotal,
		tax: inv.tax,
		taxPercentage: inv.taxPercentage ?? null,
		...mapCreditNoteKraDetailFields(cn as Parameters<typeof mapCreditNoteKraDetailFields>[0]),
	});
}

async function fetchCreditNoteDetail(tx: DbLike, creditNoteId: string) {
	const cn = await tx.query.creditNote.findFirst({
		where: eq(creditNote.id, creditNoteId),
		with: {
			activityLogs: {
				orderBy: (log, { desc: d }) => [d(log.createdAt)],
			},
			invoice: {
				with: {
					lineItems: {
						orderBy: (li, { asc: a }) => [a(li.position)],
					},
				},
			},
		},
	});

	if (!cn) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Credit note not found.",
		});
	}

	return mapCreditNoteDetail({ creditNote: cn, invoice: cn.invoice });
}

export const invoicingRouter = router({

	list: protectedProcedure
		.input(invoiceListFiltersSchema)
		.output(invoiceListResponseSchema)
		.query(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);

			const conditions = [];

			if (input.unassignedOnly) {
				conditions.push(isNull(invoice.teamId));
				if (!isAgencyUser(user.role)) {
					conditions.push(eq(invoice.createdBy, user.id));
				}
			} else if (input.teamId) {
				await ensureTeamAccess(db, user.id, user.role, input.teamId);
				conditions.push(eq(invoice.teamId, input.teamId));
			} else if (!isAgencyUser(user.role)) {
				const memberships = await db
					.select({ teamId: teamMember.teamId })
					.from(teamMember)
					.where(eq(teamMember.userId, user.id));

				const accessibleTeams = memberships
					.map((m) => m.teamId)
					.filter((id): id is string => id != null);
				const orParts = [];
				if (accessibleTeams.length > 0) {
					orParts.push(inArray(invoice.teamId, accessibleTeams));
				}
				orParts.push(and(isNull(invoice.teamId), eq(invoice.createdBy, user.id)));
				conditions.push(or(...orParts)!);
			}

			if (input.status) {
				conditions.push(eq(invoice.status, input.status));
			}

			if (input.search?.trim()) {
				const q = `%${input.search.trim()}%`;
				conditions.push(
					or(
						ilike(invoice.invoiceNumber, q),
						ilike(invoice.customerName, q),
						ilike(invoice.customerEmail, q),
					)!,
				);
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
						kraStatus: invoice.kraStatus,
						createdAt: invoice.createdAt,
						updatedAt: invoice.updatedAt,
						teamId: invoice.teamId,
						teamName: team.name,
					})
					.from(invoice)
					.leftJoin(team, eq(invoice.teamId, team.id))
					.where(whereClause)
					.orderBy(desc(invoice.createdAt))
					.limit(input.limit)
					.offset(input.offset),
				db.select({ c: count() }).from(invoice).where(whereClause),
			]);

			const total = Number(totalRow[0]?.c ?? 0);

			const payload = {
				invoices: items.map((inv) =>
					invoiceSummarySchema.parse({
						...inv,
						teamName: inv.teamName ?? null,
					}),
				),
				total,
			};

			return invoiceListResponseSchema.parse(payload);
		}),

	listTeamsSummary: protectedProcedure
		.input(invoiceTeamsSummaryFiltersSchema)
		.output(invoiceTeamsSummaryResponseSchema)
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
					.filter((id): id is string => id != null);
				const orParts = [];
				if (accessibleTeams.length > 0) {
					orParts.push(inArray(invoice.teamId, accessibleTeams));
				}
				orParts.push(and(isNull(invoice.teamId), eq(invoice.createdBy, user.id)));
				conditions.push(or(...orParts)!);
			}

			if (input.search?.trim()) {
				const raw = input.search.trim();
				const q = `%${raw}%`;
				const matchesUnassigned = "unassigned".includes(raw.toLowerCase());
				const searchParts = [ilike(team.name, q)];
				if (matchesUnassigned) {
					searchParts.push(isNull(invoice.teamId));
				}
				conditions.push(or(...searchParts)!);
			}

			const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

			const rows = await db
				.select({
					teamId: invoice.teamId,
					teamName: team.name,
					invoiceCount: count(),
					unpaidCount: sql<number>`count(*) filter (where ${invoice.status} in ('SENT', 'PARTIALLY_PAID', 'OVERDUE'))`.mapWith(Number),
					lastInvoiceAt: max(invoice.createdAt),
				})
				.from(invoice)
				.leftJoin(team, eq(invoice.teamId, team.id))
				.where(whereClause)
				.groupBy(invoice.teamId, team.name)
				.orderBy(sql`${team.name} asc nulls last`);

			return invoiceTeamsSummaryResponseSchema.parse({
				teams: rows.map((row) =>
					invoiceTeamSummarySchema.parse({
						teamId: row.teamId,
						teamName: row.teamName ?? "Unassigned",
						invoiceCount: Number(row.invoiceCount),
						unpaidCount: Number(row.unpaidCount ?? 0),
						lastInvoiceAt: row.lastInvoiceAt ?? null,
					}),
				),
			});
		}),

	getById: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
			}),
		)
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

			return isAgencyUser(user.role)
				? mapped
				: sanitizeInvoiceDetailForCustomer(mapped);
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
				} else {
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
					description:
						input.type === "COMPLETE"
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
				} else {
					const teamCond =
						input.teamId == null
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
				} as typeof invoice.$inferInsert);

				if (input.lineItems && input.lineItems.length > 0) {
					for (const [index, item] of input.lineItems.entries()) {
						const lineItemData: Record<string, unknown> = {
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
						await tx.insert(invoiceLineItem).values(lineItemData as typeof invoiceLineItem.$inferInsert);
					}
				}

				if (input.transactions && input.transactions.length > 0) {
					for (const transaction of input.transactions) {
						const transactionId = transaction.id ?? crypto.randomUUID();
						const transactionData: Record<string, unknown> = {
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
						await tx.insert(invoiceTransaction).values(transactionData as typeof invoiceTransaction.$inferInsert);

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
					const creditNoteRow: Record<string, unknown> = {
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
					await tx.insert(creditNote).values(creditNoteRow as typeof creditNote.$inferInsert);

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

			void scheduleInvoiceKraSyncAfterCreate(invoiceId, {
				status: input.status ?? "SENT",
			});

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
					.set(data as Partial<typeof invoice.$inferInsert>)
					.where(eq(invoice.id, input.id));

				if (input.lineItems) {
					const existingItems = await tx
						.select({ id: invoiceLineItem.id })
						.from(invoiceLineItem)
						.where(eq(invoiceLineItem.invoiceId, input.id));

					const incomingIds = new Set(
						input.lineItems.filter((item) => item.id).map((item) => item.id as string),
					);

					const toDelete = existingItems
						.filter((item) => !incomingIds.has(item.id))
						.map((item) => item.id);

					if (toDelete.length > 0) {
						await tx.delete(invoiceLineItem).where(inArray(invoiceLineItem.id, toDelete));
					}

					const now = new Date();
					for (const [index, item] of input.lineItems.entries()) {
						const lineItemData: Record<string, unknown> = {
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
								.set(lineItemData as Partial<typeof invoiceLineItem.$inferInsert>)
								.where(eq(invoiceLineItem.id, item.id));
						} else {
							await tx.insert(invoiceLineItem).values({
								...lineItemData,
								id: crypto.randomUUID(),
								invoiceId: input.id,
								createdAt: now,
								updatedAt: now,
							} as typeof invoiceLineItem.$inferInsert);
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

			if (input.status === "SENT" || input.status === "PAID") {
				void scheduleInvoiceKraSyncAfterCreate(input.id, { status: input.status });
			}

			return mapInvoiceDetail(invoiceDetail);
		}),

	updateStatus: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				status: invoiceStatusSchema,
				note: nullableStringSchema.optional(),
			}),
		)
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

			if (input.status === "SENT" || input.status === "PAID") {
				void scheduleInvoiceKraSyncAfterCreate(input.id, { status: input.status });
			}

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
				const data: Record<string, unknown> = {
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
						.set(data as Partial<typeof invoiceTransaction.$inferInsert>)
						.where(eq(invoiceTransaction.id, input.id));

					await logTransactionActivity(tx, {
						transactionId,
						userId: user.id,
						action: "UPDATE_PAYMENT",
						description: "Updated invoice transaction",
					});
				} else {
					await tx.insert(invoiceTransaction).values({
						id: transactionId,
						createdAt: now,
						...data,
					} as typeof invoiceTransaction.$inferInsert);

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
		.input(
			invoiceTransactionInputSchema.pick({
				id: true,
				invoiceId: true,
			}),
		)
		.output(invoiceDetailSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);
			await ensureInvoiceMutationAccess(db, user.id, user.role, input.invoiceId);

			await db.transaction(async (tx) => {
				const transRows = await tx
					.select({ id: invoiceTransaction.id })
					.from(invoiceTransaction)
					.where(eq(invoiceTransaction.id, input.id!))
					.limit(1);
				const transaction = transRows[0];

				if (!transaction) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Transaction not found.",
					});
				}

				await logTransactionActivity(tx, {
					transactionId: input.id!,
					userId: user.id,
					action: "DELETE_PAYMENT",
					description: "Deleted invoice transaction",
				});

				await tx.delete(invoiceTransaction).where(eq(invoiceTransaction.id, input.id!));

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
				const data: Record<string, unknown> = {
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
						.set(data as Partial<typeof creditNote.$inferInsert>)
						.where(eq(creditNote.id, existing.id));

					await logCreditNoteActivity(tx, {
						creditNoteId: existing.id,
						userId: user.id,
						action: "UPDATE",
						description: "Updated credit note",
					});
				} else {
					await tx.insert(creditNote).values({
						id: creditNoteId,
						createdAt: now,
						...data,
					} as typeof creditNote.$inferInsert);

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
		.input(
			creditNoteInputSchema.pick({
				invoiceId: true,
			}),
		)
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

			let savedInvoice: any;
			let invoiceNumber: string;

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
					} else if (providedParsed !== null && generatedParsed !== null && providedParsed > generatedParsed) {
						const teamCond =
							input.teamId == null
								? isNull(invoice.teamId)
								: eq(invoice.teamId, input.teamId);
						const existingRows = await tx
							.select({ id: invoice.id })
							.from(invoice)
							.where(
								and(eq(invoice.invoiceNumber, input.invoiceNumber), teamCond),
							)
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
					} else {
						invoiceNumber = generatedNumber;
					}
				} else {
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
				} as typeof invoice.$inferInsert);

				if (input.lineItems && input.lineItems.length > 0) {
					for (const [index, item] of input.lineItems.entries()) {
						const lineItemData: Record<string, unknown> = {
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
						await tx.insert(invoiceLineItem).values(lineItemData as typeof invoiceLineItem.$inferInsert);
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
		.input(
			z.object({
				invoiceId: z.string().uuid(),
			}),
		)
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
		.input(
			z.object({
				invoiceIds: z.array(z.string().uuid()).min(1),
			}),
		)
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
		.input(
			z.object({
				invoiceId: z.string().uuid(),
				to: z.string().email().optional(),
				/** @deprecated Server generates PDF after KRA sync. */
				pdfBase64: z.string().optional(),
				cc: z.array(z.string().email()).optional(),
				bcc: z.array(z.string().email()).optional(),
			}),
		)
		.output(invoiceDetailSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);
			const { renderInvoiceDeliveryEmail } = await import("../../lib/email-templates");

			await ensureInvoiceMutationAccess(db, user.id, user.role, input.invoiceId);

			const prepared = await prepareInvoiceEmailDelivery(db, input.invoiceId);
			const invoiceDetail = prepared.invoiceDetail;

			const toEmail = input.to?.trim() || invoiceDetail.customerEmail?.trim();
			if (!toEmail) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No recipient email address provided.",
				});
			}

			const formatMoney = (currency: string, value: unknown): string => {
				const n = typeof value === "number" ? value : Number(value);
				const safe = Number.isFinite(n) ? n : 0;
				const formatted = new Intl.NumberFormat("en-US", {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				}).format(safe);
				return `${currency} ${formatted}`;
			};

			const formatDate = (date: Date | null | undefined): string => {
				if (!date) return "N/A";
				return new Date(date).toLocaleDateString("en-US", {
					year: "numeric",
					month: "long",
					day: "numeric",
				});
			};

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

			const fromName = process.env.NISC_TX_FROM_NAME?.trim() || "nPanel";

			try {
				await sendInvoiceReminderEmail({
					to: toEmail,
					cc: input.cc?.filter(Boolean),
					bcc: input.bcc?.filter(Boolean),
					subject: `Invoice Reminder: ${invoiceDetail.invoiceNumber || "Invoice"} from ${fromName}`,
					html: emailHtml,
					pdfBuffer: prepared.pdfBuffer,
					pdfFilename: prepared.pdfFilename,
				});

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
							sentTo: toEmail,
							cc: input.cc ?? [],
							bccCount: input.bcc?.length ?? 0,
							kraSynced: prepared.kraSynced,
						},
					});
				});
			} catch (emailError) {
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

	retryKraSync: protectedProcedure
		.input(z.object({ invoiceId: z.string().uuid() }))
		.output(
			z.object({
				success: z.boolean(),
				kraStatus: z.string().nullable(),
				kraError: z.string().nullable(),
				message: z.string(),
				invoice: invoiceDetailSchema,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);
			await ensureInvoiceMutationAccess(db, user.id, user.role, input.invoiceId);

			const before = await fetchInvoiceDetail(db, input.invoiceId);
			if (isInvoiceKraSynced(before.kraStatus)) {
				return {
					success: true,
					kraStatus: before.kraStatus,
					kraError: before.kraError ?? null,
					message: "Invoice is already synced to KRA eTIMS.",
					invoice: mapInvoiceDetail(before),
				};
			}

			const result: InvoiceKraSyncResult = await processInvoiceKraSync(input.invoiceId);
			const after = await fetchInvoiceDetail(db, input.invoiceId);
			const synced = isInvoiceKraSynced(after.kraStatus);

			let message: string;
			if (synced) {
				message = "Invoice synced to KRA eTIMS successfully.";
			} else if ("skipped" in result && result.skipped) {
				message = result.reason;
			} else if ("reason" in result) {
				message = result.reason;
			} else {
				message = `KRA sync ${kraStatusLabel(after.kraStatus)}.`;
			}

			await logInvoiceActivity(db, {
				invoiceId: input.invoiceId,
				userId: user.id,
				action: "UPDATE",
				description: synced ? "KRA eTIMS sync succeeded" : "KRA eTIMS sync attempted",
				metadata: {
					kraStatus: after.kraStatus,
					kraError: after.kraError,
					success: synced,
				},
			});

			return {
				success: synced,
				kraStatus: after.kraStatus ?? null,
				kraError: after.kraError ?? null,
				message,
				invoice: mapInvoiceDetail(after),
			};
		}),

	listCreditNotes: protectedProcedure
		.input(creditNoteListFiltersSchema)
		.output(creditNoteListResponseSchema)
		.query(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);
			const conditions = [];

			if (input.unassignedOnly) {
				conditions.push(isNull(creditNote.teamId));
				if (!isAgencyUser(user.role)) {
					conditions.push(eq(creditNote.createdBy, user.id));
				}
			} else if (input.teamId) {
				await ensureTeamAccess(db, user.id, user.role, input.teamId);
				conditions.push(eq(creditNote.teamId, input.teamId));
			} else if (!isAgencyUser(user.role)) {
				const memberships = await db
					.select({ teamId: teamMember.teamId })
					.from(teamMember)
					.where(eq(teamMember.userId, user.id));

				const accessibleTeams = memberships
					.map((m) => m.teamId)
					.filter((id): id is string => id != null);
				if (accessibleTeams.length > 0) {
					conditions.push(inArray(creditNote.teamId, accessibleTeams));
				} else {
					conditions.push(sql`false`);
				}
			}

			if (input.status) {
				conditions.push(eq(creditNote.status, input.status));
			}

			if (input.search?.trim()) {
				const q = `%${input.search.trim()}%`;
				conditions.push(
					or(
						ilike(creditNote.creditNumber, q),
						ilike(invoice.invoiceNumber, q),
						ilike(invoice.customerName, q),
						ilike(invoice.customerEmail, q),
					)!,
				);
			}

			const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
			const joinOn = eq(creditNote.invoiceId, invoice.id);

			const [items, totalRow] = await Promise.all([
				db
					.select({
						id: creditNote.id,
						creditNumber: creditNote.creditNumber,
						invoiceId: creditNote.invoiceId,
						invoiceNumber: invoice.invoiceNumber,
						customerName: invoice.customerName,
						customerEmail: invoice.customerEmail,
						status: creditNote.status,
						amount: creditNote.amount,
						currency: creditNote.currency,
						issuedAt: creditNote.issuedAt,
						kraStatus: creditNote.kraStatus,
						originalInvoiceNumber: creditNote.originalInvoiceNumber,
						teamId: creditNote.teamId,
						createdAt: creditNote.createdAt,
					})
					.from(creditNote)
					.innerJoin(invoice, joinOn)
					.where(whereClause ?? sql`true`)
					.orderBy(desc(creditNote.createdAt))
					.limit(input.limit)
					.offset(input.offset),
				db
					.select({ c: count() })
					.from(creditNote)
					.innerJoin(invoice, joinOn)
					.where(whereClause ?? sql`true`),
			]);

			const total = Number(totalRow[0]?.c ?? 0);

			return creditNoteListResponseSchema.parse({
				creditNotes: items.map((row) => creditNoteSummarySchema.parse(row)),
				total,
			});
		}),

	getCreditNoteById: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.output(creditNoteDetailSchema)
		.query(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);
			await ensureCreditNoteAccess(db, user.id, user.role, input.id);
			const detail = await fetchCreditNoteDetail(db, input.id);
			return isAgencyUser(user.role)
				? detail
				: sanitizeCreditNoteDetailForCustomer(detail);
		}),

	issueCreditNote: protectedProcedure
		.input(issueCreditNoteInputSchema)
		.output(creditNoteDetailSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);
			if (!isAgencyUser(user.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only agency users can issue credit notes.",
				});
			}

			await ensureInvoiceMutationAccess(db, user.id, user.role, input.invoiceId);

			const inv = await db.query.invoice.findFirst({
				where: eq(invoice.id, input.invoiceId),
				columns: {
					id: true,
					teamId: true,
					invoiceNumber: true,
					amount: true,
					currency: true,
					kraStatus: true,
				},
				with: { creditNote: { columns: { id: true } } },
			});

			if (!inv) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found." });
			}
			if (inv.creditNote) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "This invoice already has a credit note.",
				});
			}
			if (!isInvoiceKraSynced(inv.kraStatus)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Original invoice must be synced to KRA before issuing a credit note.",
				});
			}
			if (!inv.amount) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invoice amount is required to issue a credit note.",
				});
			}

			const creditNoteId = crypto.randomUUID();
			const now = new Date();

			await db.transaction(async (tx) => {
				const creditNumber = await generateNextCreditNoteNumber(tx);

				await tx.insert(creditNote).values({
					id: creditNoteId,
					invoiceId: input.invoiceId,
					teamId: inv.teamId,
					creditNumber,
					status: "ISSUED",
					amount: inv.amount,
					currency: inv.currency ?? "KES",
					reason: stringOrNull(input.reason),
					note: stringOrNull(input.note),
					issuedAt: now,
					kraRefundReasonCode: input.rfdRsnCd,
					originalInvoiceNumber: inv.invoiceNumber,
					createdBy: user.id,
					updatedBy: user.id,
					createdAt: now,
					updatedAt: now,
					...buildCreditNoteKraInsertFields(),
				});

				await tx
					.update(invoice)
					.set({
						creditedAmount: inv.amount,
						updatedAt: now,
					})
					.where(eq(invoice.id, input.invoiceId));

				await logCreditNoteActivity(tx, {
					creditNoteId,
					userId: user.id,
					action: "CREATE",
					description: `Issued credit note ${creditNumber}`,
					metadata: { rfdRsnCd: input.rfdRsnCd, invoiceId: input.invoiceId },
				});

				await logInvoiceActivity(tx, {
					invoiceId: input.invoiceId,
					userId: user.id,
					action: "CREDIT_NOTE_ISSUED",
					description: `Credit note ${creditNumber} issued`,
					metadata: { creditNoteId, creditNumber },
				});
			});

			const kraResult: CreditNoteKraSyncResult = await processCreditNoteKraSync(creditNoteId);

			if (!kraResult.ok && !("skipped" in kraResult && kraResult.skipped)) {
				await logCreditNoteActivity(db, {
					creditNoteId,
					userId: user.id,
					action: "KRA_SYNC",
					description: "KRA credit note sync failed",
					metadata: {
						reason: "reason" in kraResult ? kraResult.reason : "Unknown error",
					},
				});
			}

			return fetchCreditNoteDetail(db, creditNoteId);
		}),

	retryCreditNoteKraSync: protectedProcedure
		.input(z.object({ creditNoteId: z.string().uuid() }))
		.output(
			z.object({
				success: z.boolean(),
				kraStatus: z.string().nullable(),
				kraError: z.string().nullable(),
				message: z.string(),
				creditNote: creditNoteDetailSchema,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);
			if (!isAgencyUser(user.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only agency users can retry KRA sync.",
				});
			}

			await ensureCreditNoteAccess(db, user.id, user.role, input.creditNoteId);

			const before = await fetchCreditNoteDetail(db, input.creditNoteId);
			if (isInvoiceKraSynced(before.kraStatus)) {
				return {
					success: true,
					kraStatus: before.kraStatus ?? null,
					kraError: before.kraError ?? null,
					message: "Credit note is already synced to KRA eTIMS.",
					creditNote: before,
				};
			}

			const result: CreditNoteKraSyncResult = await processCreditNoteKraSync(input.creditNoteId);
			const after = await fetchCreditNoteDetail(db, input.creditNoteId);
			const synced = isInvoiceKraSynced(after.kraStatus);

			let message: string;
			if (synced) {
				message = "Credit note synced to KRA eTIMS successfully.";
			} else if ("skipped" in result && result.skipped) {
				message = result.reason;
			} else if ("reason" in result) {
				message = result.reason;
			} else {
				message = `KRA sync ${kraStatusLabel(after.kraStatus)}.`;
			}

			await logCreditNoteActivity(db, {
				creditNoteId: input.creditNoteId,
				userId: user.id,
				action: "KRA_SYNC",
				description: synced ? "KRA eTIMS sync succeeded" : "KRA eTIMS sync attempted",
				metadata: {
					kraStatus: after.kraStatus,
					kraError: after.kraError,
					success: synced,
				},
			});

			return {
				success: synced,
				kraStatus: after.kraStatus ?? null,
				kraError: after.kraError ?? null,
				message,
				creditNote: after,
			};
		}),

	listTransactions: protectedProcedure
		.input(
			z.object({
				limit: z.number().int().min(1).max(100).optional().default(50),
				offset: z.number().int().min(0).optional().default(0),
				status: invoicePaymentStatusSchema.optional(),
			}),
		)
		.output(
			z.object({
				transactions: z.array(
					invoiceTransactionOutputSchema.extend({
						invoiceNumber: nullableStringSchema,
					}),
				),
				total: z.number().int().nonnegative(),
			}),
		)
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
					.filter((id): id is string => id != null);
				const orParts = [];
				if (accessibleTeams.length > 0) {
					orParts.push(inArray(invoice.teamId, accessibleTeams));
				}
				orParts.push(and(isNull(invoice.teamId), eq(invoice.createdBy, user.id)));
				conditions.push(or(...orParts)!);
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
					.where(whereClause ?? sql`true`)
					.orderBy(desc(invoiceTransaction.createdAt))
					.limit(input.limit)
					.offset(input.offset),
				db
					.select({ c: count() })
					.from(invoiceTransaction)
					.innerJoin(invoice, joinOn)
					.where(whereClause ?? sql`true`),
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
export { fetchInvoiceDetail, mapInvoiceDetail, fetchCreditNoteDetail, mapCreditNoteDetail };
