import { TRPCError } from "@trpc/server";
import prisma from "@nPanel/db";
import * as crypto from "crypto";
import { z } from "zod";
import { protectedProcedure, router, type Context } from "../../trpc";
import {
	activityLogSchema,
	creditNoteInputSchema,
	creditNoteOutputSchema,
	invoiceCreateInputSchema,
	invoiceDetailSchema,
	invoiceLineItemOutputSchema,
	invoiceListFiltersSchema,
	invoiceListResponseSchema,
	invoicePaymentStatusSchema,
	invoiceStatusSchema,
	invoiceSummarySchema,
	invoiceTransactionInputSchema,
	invoiceTransactionOutputSchema,
	invoiceUpdateInputSchema,
	nextInvoiceNumberSchema,
	nullableStringSchema,
	submitInvoiceSchema,
	updatePaymentInputSchema,
} from "./schemas";
import type { InvoiceDetail } from "./schemas";

// Type that accepts both PrismaClient instance and transaction client
// Uses typeof to avoid importing Prisma types directly - maintains API layer independence
type DbClient = typeof prisma | Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;

const isAgencyUser = (role: string) =>
	["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role);
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
	const user = ctx.session?.user;
	if (!user?.id) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You must be logged in.",
		});
	}

	// Optimize: Use role from session if available (set by auth hooks)
	// This avoids an unnecessary database query
	const sessionRole = (user as { role?: string })?.role;
	
	if (sessionRole) {
		// Role is in session, no need to query database
		return { id: user.id, role: sessionRole };
	}

	// Fallback: Query database if role not in session (shouldn't happen with proper auth hooks)
	const dbUser = await prisma.user.findUnique({
		where: { id: user.id },
		select: { id: true, role: true },
	});

	if (!dbUser) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "User not found.",
		});
	}

	return { id: dbUser.id, role: dbUser.role as string };
}

async function ensureTeamAccess(db: DbClient, userId: string, role: string, teamId: string | null | undefined) {
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

	const membership = await db.teamMember.findFirst({
		where: {
			teamId,
			userId,
		},
		select: { id: true },
	});

	if (!membership) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have access to this team.",
		});
	}
}

async function ensureInvoiceAccess(db: DbClient, userId: string, role: string, invoiceId: string) {
	const invoice = await db.invoice.findUnique({
		where: { id: invoiceId },
		select: { teamId: true, createdBy: true },
	});
	if (!invoice) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Invoice not found.",
		});
	}

	if (isAgencyUser(role)) {
		return invoice;
	}

	// Batch: Check team access if invoice has teamId, otherwise check createdBy
	// This reduces connection usage by combining the access check
	if (invoice.teamId) {
		// ensureTeamAccess will throw if access denied
		await ensureTeamAccess(db, userId, role, invoice.teamId);
		return invoice;
	}

	if (invoice.createdBy !== userId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have access to this invoice.",
		});
	}

	return invoice;
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

async function fetchInvoiceDetail(db: DbClient, invoiceId: string) {
	const invoice = await db.invoice.findUnique({
		where: { id: invoiceId },
		include: {
			lineItems: {
				orderBy: { position: "asc" },
			},
			transactions: {
				orderBy: { createdAt: "desc" },
				include: {
					activityLogs: {
						orderBy: { createdAt: "desc" },
					},
				},
			},
			creditNote: {
				include: {
					activityLogs: {
						orderBy: { createdAt: "desc" },
					},
				},
			},
			activityLogs: {
				orderBy: { createdAt: "desc" },
			},
		},
	});

	if (!invoice) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Invoice not found.",
		});
	}

	return invoice;
}

async function logInvoiceActivity(
	db: DbClient,
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
	
	await db.invoiceActivityLog.create({
		data: logData as any, // Type assertion for JsonValue compatibility
	});
}

async function logTransactionActivity(
	db: DbClient,
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
	
	await db.invoiceTransactionActivityLog.create({
		data: logData as any, // Type assertion for JsonValue compatibility
	});
}

async function logCreditNoteActivity(
	db: DbClient,
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
	
	await db.creditNoteActivityLog.create({
		data: logData as any, // Type assertion for JsonValue compatibility
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
async function updateInvoiceCounter(db: DbClient, invoiceNumber: string): Promise<void> {
	const parsedNumber = parseInvoiceNumber(invoiceNumber);
	if (!parsedNumber || parsedNumber < 1) return;

	// Always update the counter to the provided number (if it's valid)
	// This ensures the counter reflects the actual last used number
	await db.invoiceCounter.upsert({
		where: { id: "invoice-counter" },
		create: {
			id: "invoice-counter",
			lastNumber: parsedNumber,
		},
		update: {
			lastNumber: parsedNumber,
		},
	});
}

/**
 * Generates the next sequential invoice number in the format INV-{number}
 * Should be called within a transaction context (tx) to ensure thread-safety
 * Uses upsert with increment to atomically get and increment the counter
 */
async function generateNextInvoiceNumber(tx: DbClient): Promise<string> {
	// Use upsert to atomically get and increment the counter
	// This ensures thread-safety by using database-level locking
	const counter = await tx.invoiceCounter.upsert({
		where: { id: "invoice-counter" },
		create: {
			id: "invoice-counter",
			lastNumber: 1, // Start at 1 for the first invoice
		},
		update: {
			lastNumber: {
				increment: 1,
			},
		},
		select: {
			lastNumber: true,
		},
	});

	// The counter.lastNumber contains the next number to use
	// If created: lastNumber = 1 (first invoice)
	// If updated: lastNumber = previous + 1 (next invoice)
	const nextNumber = counter.lastNumber;

	// Return formatted invoice number with 4-digit zero-padding (e.g., INV-0001)
	return `INV-${nextNumber.toString().padStart(4, "0")}`;
}

export const invoicingRouter = router({
	list: protectedProcedure
		.input(invoiceListFiltersSchema)
		.output(invoiceListResponseSchema)
		.query(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);

			const filters: Record<string, unknown>[] = [];

			if (input.teamId) {
				await ensureTeamAccess(prisma, user.id, user.role, input.teamId);
				filters.push({ teamId: input.teamId });
			} else if (!isAgencyUser(user.role)) {
				const memberships = await prisma.teamMember.findMany({
					where: { userId: user.id },
					select: { teamId: true },
				});

				const accessibleTeams = memberships.map((membership) => membership.teamId);
				const accessConditions: Record<string, unknown>[] = [];

				if (accessibleTeams.length > 0) {
					accessConditions.push({ teamId: { in: accessibleTeams } });
				}

				accessConditions.push({
					AND: [{ teamId: null }, { createdBy: user.id }],
				});

				filters.push({ OR: accessConditions });
			}

			if (input.status) {
				filters.push({ status: input.status });
			}

			if (input.search) {
				const searchQuery = input.search.trim();
				if (searchQuery) {
					filters.push({
						OR: [
							{ invoiceNumber: { contains: searchQuery, mode: "insensitive" } },
							{ customerName: { contains: searchQuery, mode: "insensitive" } },
							{ customerEmail: { contains: searchQuery, mode: "insensitive" } },
						],
					});
				}
			}

			const where = filters.length > 0 ? { AND: filters } : undefined;

			const [invoices, total] = await prisma.$transaction([
				prisma.invoice.findMany({
					where,
					orderBy: { createdAt: "desc" },
					skip: input.offset,
					take: input.limit,
					select: {
						id: true,
						invoiceNumber: true,
						customerName: true,
						customerEmail: true,
						status: true,
						amount: true,
						currency: true,
						dueDate: true,
						createdAt: true,
						updatedAt: true,
					},
				}),
				prisma.invoice.count({ where }),
			]);

			const payload = {
				invoices: invoices.map((invoice) =>
					invoiceSummarySchema.parse({
						...invoice,
					}),
				),
				total,
			};

			return invoiceListResponseSchema.parse(payload);
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
			await ensureInvoiceAccess(prisma, user.id, user.role, input.id);
			const invoice = await fetchInvoiceDetail(prisma, input.id);

			const mapped = mapInvoiceDetail({
				...invoice,
				lineItems: invoice.lineItems.map((item) => ({
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
				transactions: invoice.transactions.map((transaction) => ({
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
				creditNote: invoice.creditNote
					? creditNoteOutputSchema.parse({
							...invoice.creditNote,
							activityLogs: invoice.creditNote.activityLogs,
						})
					: null,
				activityLogs: invoice.activityLogs,
			});

			return mapped;
		}),

	updatePayment: protectedProcedure
		.input(updatePaymentInputSchema)
		.output(invoiceDetailSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);
			await ensureInvoiceAccess(prisma, user.id, user.role, input.invoiceId);

			const invoice = await prisma.invoice.findUnique({
				where: { id: input.invoiceId },
				select: { id: true, status: true, amount: true, currency: true },
			});
			if (!invoice) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found." });
			}
			if (invoice.status === "PAID") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invoice is already fully paid.",
				});
			}

			const totalAmount = invoice.amount ?? "0";
			const amountToRecord = input.type === "COMPLETE" ? totalAmount : (input.amountPaid ?? "0").trim();

			await prisma.$transaction(async (tx) => {
				if (input.type === "COMPLETE") {
					await tx.invoice.update({
						where: { id: input.invoiceId },
						data: {
							status: "PAID",
							paidAt: new Date(),
							updatedAt: new Date(),
						},
					});
				} else {
					await tx.invoice.update({
						where: { id: input.invoiceId },
						data: {
							status: "PARTIALLY_PAID",
							updatedAt: new Date(),
						},
					});
				}

				const transactionId = crypto.randomUUID();
				await tx.invoiceTransaction.create({
					data: {
						id: transactionId,
						invoiceId: input.invoiceId,
						status: "COMPLETED",
						method: "OTHER",
						amount: amountToRecord,
						currency: invoice.currency ?? "KES",
						paidAt: new Date(),
						recordedBy: user.id,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				await logInvoiceActivity(tx, {
					invoiceId: input.invoiceId,
					userId: user.id,
					action: input.type === "COMPLETE" ? "PAYMENT_COMPLETE" : "PAYMENT_PARTIAL",
					description:
						input.type === "COMPLETE"
							? `Full payment recorded: ${invoice.currency ?? "KES"} ${amountToRecord}`
							: `Partial payment recorded: ${invoice.currency ?? "KES"} ${amountToRecord}`,
					metadata: { type: input.type, amount: amountToRecord },
				});
			});

			const updated = await fetchInvoiceDetail(prisma, input.invoiceId);
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
		const counter = await prisma.invoiceCounter.findUnique({
			where: { id: "invoice-counter" },
			select: { lastNumber: true },
		});

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
				await ensureTeamAccess(prisma, user.id, user.role, input.teamId);
			}

			const invoiceId = input.id ?? crypto.randomUUID();
			const token = input.token ?? crypto.randomUUID();

			await prisma.$transaction(async (tx) => {
				// Auto-generate invoice number if not provided
				let invoiceNumber = input.invoiceNumber;
				if (!invoiceNumber) {
					invoiceNumber = await generateNextInvoiceNumber(tx);
				} else {
					// Validate uniqueness if manually provided
					const existing = await tx.invoice.findFirst({
						where: {
							invoiceNumber,
							teamId: input.teamId ?? null,
						},
						select: { id: true },
					});

					if (existing) {
						throw new TRPCError({
							code: "CONFLICT",
							message: `Invoice number ${invoiceNumber} already exists${input.teamId ? " for this team" : ""}.`,
						});
					}

					// Update counter to reflect the manually provided invoice number
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

				await tx.invoice.create({
					data: {
						...invoiceData,
						id: invoiceId,
						createdAt: new Date(),
						updatedAt: new Date(),
					} as any, // Type assertion for JsonValue compatibility
				});

				if (input.lineItems && input.lineItems.length > 0) {
					for (const [index, item] of input.lineItems.entries()) {
						const lineItemData: any = {
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
							createdAt: new Date(),
							updatedAt: new Date(),
						};
						if (item.metadata !== undefined && item.metadata !== null) {
							lineItemData.metadata = item.metadata;
						}
						await tx.invoiceLineItem.create({
							data: lineItemData,
						});
					}
				}

				if (input.transactions && input.transactions.length > 0) {
					for (const transaction of input.transactions) {
						const transactionId = transaction.id ?? crypto.randomUUID();
						const transactionData: any = {
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
							createdAt: new Date(),
							updatedAt: new Date(),
						};
						if (transaction.metadata !== undefined && transaction.metadata !== null) {
							transactionData.metadata = transaction.metadata;
						}
						await tx.invoiceTransaction.create({
							data: transactionData,
						});

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
					const creditNoteData: any = {
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
						createdAt: new Date(),
						updatedAt: new Date(),
					};
					if (input.creditNote.metadata !== undefined && input.creditNote.metadata !== null) {
						creditNoteData.metadata = input.creditNote.metadata;
					}
					await tx.creditNote.create({
						data: creditNoteData,
					});

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

			const invoice = await fetchInvoiceDetail(prisma, invoiceId);

			return mapInvoiceDetail({
				...invoice,
				transactions: invoice.transactions,
				creditNote: invoice.creditNote,
			});
		}),

	update: protectedProcedure
		.input(invoiceUpdateInputSchema)
		.output(invoiceDetailSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);
			const invoiceRecord = await ensureInvoiceAccess(prisma, user.id, user.role, input.id);

			await prisma.$transaction(async (tx) => {
				if (input.teamId && input.teamId !== invoiceRecord.teamId) {
					await ensureTeamAccess(tx, user.id, user.role, input.teamId);
				}

				const data = buildInvoiceUpdateData(input, user.id);

				await tx.invoice.update({
					where: { id: input.id },
					data,
				});

				if (input.lineItems) {
					const existingItems = await tx.invoiceLineItem.findMany({
						where: { invoiceId: input.id },
						select: { id: true },
					});

					const incomingIds = new Set(
						input.lineItems.filter((item) => item.id).map((item) => item.id as string),
					);

					const toDelete = existingItems
						.filter((item) => !incomingIds.has(item.id))
						.map((item) => item.id);

					if (toDelete.length > 0) {
						await tx.invoiceLineItem.deleteMany({
							where: { id: { in: toDelete } },
						});
					}

					for (const [index, item] of input.lineItems.entries()) {
						const lineItemData: any = {
							position: item.position ?? index,
							name: stringOrNull(item.name),
							description: stringOrNull(item.description),
							quantity: item.quantity ?? null,
							unit: stringOrNull(item.unit),
							price: stringOrNull(item.price),
							discount: stringOrNull(item.discount),
							total: stringOrNull(item.total),
							updatedAt: new Date(),
						};
						if (item.metadata !== undefined && item.metadata !== null) {
							lineItemData.metadata = item.metadata;
						}
						
						if (item.id) {
							await tx.invoiceLineItem.update({
								where: { id: item.id },
								data: lineItemData,
							});
						} else {
							const createData = {
								...lineItemData,
								id: crypto.randomUUID(),
								invoiceId: input.id,
								createdAt: new Date(),
							};
							await tx.invoiceLineItem.create({
								data: createData,
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

			const invoice = await fetchInvoiceDetail(prisma, input.id);

			return mapInvoiceDetail(invoice);
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
			await ensureInvoiceAccess(prisma, user.id, user.role, input.id);

			await prisma.$transaction(async (tx) => {
				await tx.invoice.update({
					where: { id: input.id },
					data: {
						status: input.status,
						updatedBy: user.id,
						updatedAt: new Date(),
					},
				});

				await logInvoiceActivity(tx, {
					invoiceId: input.id,
					userId: user.id,
					action: "STATUS_CHANGE",
					description: `Changed status to ${input.status}`,
					metadata: input.note ? { note: input.note } : undefined,
				});
			});

			const invoice = await fetchInvoiceDetail(prisma, input.id);
			return mapInvoiceDetail(invoice);
		}),

	recordTransaction: protectedProcedure
		.input(invoiceTransactionInputSchema)
		.output(invoiceDetailSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);
			await ensureInvoiceAccess(prisma, user.id, user.role, input.invoiceId);

			const transactionId = input.id ?? crypto.randomUUID();

			await prisma.$transaction(async (tx) => {
				const data: any = {
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
					updatedAt: new Date(),
				};
				if (input.metadata !== undefined && input.metadata !== null) {
					data.metadata = input.metadata;
				}

				if (input.id) {
					await tx.invoiceTransaction.update({
						where: { id: input.id },
						data,
					});

					await logTransactionActivity(tx, {
						transactionId,
						userId: user.id,
						action: "UPDATE_PAYMENT",
						description: "Updated invoice transaction",
					});
				} else {
					await tx.invoiceTransaction.create({
						data: {
							id: transactionId,
							createdAt: new Date(),
							...data,
						},
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

			const invoice = await fetchInvoiceDetail(prisma, input.invoiceId);

			return mapInvoiceDetail(invoice);
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
			await ensureInvoiceAccess(prisma, user.id, user.role, input.invoiceId);

			await prisma.$transaction(async (tx) => {
				const transaction = await tx.invoiceTransaction.findUnique({
					where: { id: input.id },
					select: { id: true },
				});

				if (!transaction) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Transaction not found.",
					});
				}

				await tx.invoiceTransaction.delete({
					where: { id: input.id },
				});

				await logTransactionActivity(tx, {
					transactionId: input.id!,
					userId: user.id,
					action: "DELETE_PAYMENT",
					description: "Deleted invoice transaction",
				});

				await logInvoiceActivity(tx, {
					invoiceId: input.invoiceId,
					userId: user.id,
					action: "PAYMENT_ACTIVITY",
					description: "Deleted payment transaction",
					metadata: { transactionId: input.id },
				});
			});

			const invoice = await fetchInvoiceDetail(prisma, input.invoiceId);
			return mapInvoiceDetail(invoice);
		}),

	upsertCreditNote: protectedProcedure
		.input(creditNoteInputSchema)
		.output(invoiceDetailSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);
			await ensureInvoiceAccess(prisma, user.id, user.role, input.invoiceId);

			const creditNoteId = input.id ?? crypto.randomUUID();

			await prisma.$transaction(async (tx) => {
				const data: any = {
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
					updatedAt: new Date(),
				};
				if (input.metadata !== undefined && input.metadata !== null) {
					data.metadata = input.metadata;
				}

				const existing = await tx.creditNote.findUnique({
					where: { invoiceId: input.invoiceId },
					select: { id: true },
				});

				if (existing) {
					await tx.creditNote.update({
						where: { id: existing.id },
						data: data as any, // Type assertion for JsonValue compatibility
					});

					await logCreditNoteActivity(tx, {
						creditNoteId: existing.id,
						userId: user.id,
						action: "UPDATE",
						description: "Updated credit note",
					});
				} else {
					await tx.creditNote.create({
						data: {
							id: creditNoteId,
							createdAt: new Date(),
							...data,
						} as any, // Type assertion for JsonValue compatibility
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

			const invoice = await fetchInvoiceDetail(prisma, input.invoiceId);
			return mapInvoiceDetail(invoice);
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
			await ensureInvoiceAccess(prisma, user.id, user.role, input.invoiceId);

			await prisma.$transaction(async (tx) => {
				const existing = await tx.creditNote.findUnique({
					where: { invoiceId: input.invoiceId },
					select: { id: true },
				});

				if (!existing) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Credit note not found.",
					});
				}

				await tx.creditNote.delete({
					where: { id: existing.id },
				});

				await logCreditNoteActivity(tx, {
					creditNoteId: existing.id,
					userId: user.id,
					action: "DELETE",
					description: "Deleted credit note",
				});

				await logInvoiceActivity(tx, {
					invoiceId: input.invoiceId,
					userId: user.id,
					action: "CREDIT_NOTE_ACTIVITY",
					description: "Deleted credit note",
				});
			});

			const invoice = await fetchInvoiceDetail(prisma, input.invoiceId);
			return mapInvoiceDetail(invoice);
		}),

	submitInvoice: protectedProcedure
		.input(submitInvoiceSchema)
		.output(invoiceDetailSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);
			const { sendEmail } = await import("../../lib/email");
			const { renderInvoiceDeliveryEmail } = await import("../../lib/email-templates");

			if (input.teamId) {
				await ensureTeamAccess(prisma, user.id, user.role, input.teamId);
			}

			const invoiceId = input.id ?? crypto.randomUUID();
			const token = input.token ?? crypto.randomUUID();

			let savedInvoice: any;
			let invoiceNumber: string;

			await prisma.$transaction(async (tx) => {
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
						// Provided number is higher - validate uniqueness and use it
						const existing = await tx.invoice.findFirst({
							where: {
								invoiceNumber: input.invoiceNumber,
								teamId: input.teamId ?? null,
							},
							select: { id: true },
						});

						if (existing) {
							throw new TRPCError({
								code: "CONFLICT",
								message: `Invoice number ${input.invoiceNumber} already exists${input.teamId ? " for this team" : ""}.`,
							});
						}
						
						// Use provided number and update counter to reflect it
						invoiceNumber = input.invoiceNumber;
						await updateInvoiceCounter(tx, invoiceNumber);
					} else {
						// Provided number is invalid or lower - use generated
						invoiceNumber = generatedNumber;
					}
				} else {
					// No invoice number provided - use generated
					invoiceNumber = generatedNumber;
				}

				// Use hardcoded company logo URL
				const companyLogoUrl = "https://1ris7itpac.ufs.sh/f/Djp547U8wumpWQzBihElLmSnxiqhFZB2ajbeTk0Y6XofJ4Mp";

				// Build invoice data with company logo in template
				const templateData = input.template ? {
					...input.template,
					logoUrl: companyLogoUrl,
				} : {
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
					status: "SENT", // Mark as sent since we're emailing it
				});

				await tx.invoice.create({
					data: {
						...invoiceData,
						id: invoiceId,
						sentAt: new Date(),
						createdAt: new Date(),
						updatedAt: new Date(),
					} as any, // Type assertion for JsonValue compatibility
				});

				if (input.lineItems && input.lineItems.length > 0) {
					for (const [index, item] of input.lineItems.entries()) {
						const lineItemData: any = {
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
							createdAt: new Date(),
							updatedAt: new Date(),
						};
						if (item.metadata !== undefined && item.metadata !== null) {
							lineItemData.metadata = item.metadata;
						}
						await tx.invoiceLineItem.create({
							data: lineItemData,
						});
					}
				}

				await logInvoiceActivity(tx, {
					invoiceId,
					userId: user.id,
					action: "CREATE",
					description: "Created and sent invoice",
					metadata: {
						invoiceNumber,
						sentTo: input.billingEmail,
					},
				});

				// Fetch the saved invoice for email
				savedInvoice = await fetchInvoiceDetail(tx, invoiceId);
			});

			// Generate PDF filename from invoice number (use saved invoice's invoice number)
			// Sanitize filename to remove invalid characters
			const savedInvoiceNumber = savedInvoice.invoiceNumber;
			const sanitizeFilename = (name: string): string => {
				return name.replace(/[^a-zA-Z0-9._-]/g, "_");
			};
			const pdfFilename = savedInvoiceNumber 
				? `${sanitizeFilename(savedInvoiceNumber)}.pdf` 
				: "Invoice.pdf";

			// Prepare services list for email
			const services = savedInvoice.lineItems.map((item: any) => ({
				name: item.name || "Service",
				description: item.description || undefined,
				quantity: item.quantity || undefined,
				price: item.price ? `${savedInvoice.currency} ${item.price}` : undefined,
			}));

			// Format dates for email
			const formatDate = (date: Date | null | undefined): string => {
				if (!date) return "N/A";
				return new Date(date).toLocaleDateString("en-US", {
					year: "numeric",
					month: "long",
					day: "numeric",
				});
			};

			// Render email template
			const emailHtml = await renderInvoiceDeliveryEmail({
				customerName: savedInvoice.customerName || "Valued Customer",
				invoiceNumber: savedInvoice.invoiceNumber || "N/A",
				issueDate: formatDate(savedInvoice.issueDate),
				dueDate: formatDate(savedInvoice.dueDate),
				totalAmount: savedInvoice.amount || "0.00",
				currency: savedInvoice.currency || "KES",
				services,
				supportEmail: "billing@nisccloud.com",
				supportPhone: "+254 748 777 666",
			});

			// Prepare PDF attachment if provided
			const attachments = input.pdfBase64 ? [{
				filename: pdfFilename,
				content: Buffer.from(input.pdfBase64, "base64"),
				contentType: "application/pdf",
			}] : undefined;

			// Send email
			try {
				await sendEmail({
					to: input.billingEmail,
					subject: `Invoice ${savedInvoice.invoiceNumber || "Invoice"} from Nisc Cloud Limited`,
					html: emailHtml,
					attachments,
				});

				// Batch: Update sentAt timestamp and log activity in a transaction
				// This reduces connection usage from 2 sequential queries to 1 transaction
				await prisma.$transaction(async (tx) => {
					// Update sentAt timestamp if email was sent successfully
					await tx.invoice.update({
						where: { id: invoiceId },
						data: { sentAt: new Date() },
					});

					// Log activity
					await logInvoiceActivity(tx, {
						invoiceId,
						userId: user.id,
						action: "EMAIL_SENT",
						description: "Invoice email sent successfully",
						metadata: {
							sentTo: input.billingEmail,
						},
					});
				});
			} catch (emailError) {
				// Log email error but don't fail the invoice creation
				console.error("Failed to send invoice email:", emailError);
				await logInvoiceActivity(prisma, {
					invoiceId,
					userId: user.id,
					action: "EMAIL_ERROR",
					description: "Failed to send invoice email",
					metadata: {
						error: emailError instanceof Error ? emailError.message : "Unknown error",
					},
				});
				// Still return the invoice even if email fails
			}

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
			await ensureInvoiceAccess(prisma, user.id, user.role, input.invoiceId);

			await prisma.$transaction(async (tx) => {
				const invoice = await tx.invoice.findUnique({
					where: { id: input.invoiceId },
					select: { id: true, invoiceNumber: true },
				});

				if (!invoice) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Invoice not found.",
					});
				}

				// Log activity BEFORE deleting (so we have a record of the deletion)
				await logInvoiceActivity(tx, {
					invoiceId: input.invoiceId,
					userId: user.id,
					action: "DELETE",
					description: `Invoice ${invoice.invoiceNumber || input.invoiceId} deleted`,
					metadata: {
						invoiceNumber: invoice.invoiceNumber,
					},
				});

				// Delete related records (cascade will handle line items, but we need to handle others)
				await tx.invoiceTransaction.deleteMany({
					where: { invoiceId: input.invoiceId },
				});

				await tx.invoiceActivityLog.deleteMany({
					where: { invoiceId: input.invoiceId },
				});

				await tx.creditNote.deleteMany({
					where: { invoiceId: input.invoiceId },
				});

				// Delete the invoice (line items will be deleted via cascade)
				await tx.invoice.delete({
					where: { id: input.invoiceId },
				});
			});

			return { success: true };
		}),

	resendEmailReminder: protectedProcedure
		.input(
			z.object({
				invoiceId: z.string().uuid(),
				pdfBase64: z.string(), // Base64 encoded PDF blob
			}),
		)
		.output(invoiceDetailSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);
			const { sendEmail } = await import("../../lib/email");
			const { renderInvoiceDeliveryEmail } = await import("../../lib/email-templates");

			await ensureInvoiceAccess(prisma, user.id, user.role, input.invoiceId);

			const invoice = await fetchInvoiceDetail(prisma, input.invoiceId);

			if (!invoice.customerEmail) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invoice does not have a customer email address.",
				});
			}

			// Prepare services list for email
			const services = invoice.lineItems.map((item: any) => ({
				name: item.name || "Service",
				description: item.description || undefined,
				quantity: item.quantity || undefined,
				price: item.price ? `${invoice.currency} ${item.price}` : undefined,
			}));

			// Format dates for email
			const formatDate = (date: Date | null | undefined): string => {
				if (!date) return "N/A";
				return new Date(date).toLocaleDateString("en-US", {
					year: "numeric",
					month: "long",
					day: "numeric",
				});
			};

			// Render email template
			const emailHtml = await renderInvoiceDeliveryEmail({
				customerName: invoice.customerName || "Valued Customer",
				invoiceNumber: invoice.invoiceNumber || "N/A",
				issueDate: formatDate(invoice.issueDate),
				dueDate: formatDate(invoice.dueDate),
				totalAmount: invoice.amount || "0.00",
				currency: invoice.currency || "KES",
				services,
				supportEmail: "billing@nisccloud.com",
				supportPhone: "+254 748 777 666",
			});

			// Generate PDF filename from invoice number
			const sanitizeFilename = (name: string): string => {
				return name.replace(/[^a-zA-Z0-9._-]/g, "_");
			};
			const pdfFilename = invoice.invoiceNumber 
				? `${sanitizeFilename(invoice.invoiceNumber)}.pdf` 
				: "Invoice.pdf";

			// Prepare PDF attachment
			const attachments = [{
				filename: pdfFilename,
				content: Buffer.from(input.pdfBase64, "base64"),
				contentType: "application/pdf",
			}];

			// Send email with PDF attachment
			try {
				await sendEmail({
					to: invoice.customerEmail,
					subject: `Invoice Reminder: ${invoice.invoiceNumber || "Invoice"} from Nisc Cloud Limited`,
					html: emailHtml,
					attachments,
				});

				// Batch: Update reminderSentAt timestamp and log activity in a transaction
				// This reduces connection usage from 2 sequential queries to 1 transaction
				await prisma.$transaction(async (tx) => {
					// Update reminderSentAt timestamp
					await tx.invoice.update({
						where: { id: input.invoiceId },
						data: { reminderSentAt: new Date() },
					});

					// Log activity
					await logInvoiceActivity(tx, {
						invoiceId: input.invoiceId,
						userId: user.id,
						action: "REMINDER_SENT",
						description: "Email reminder sent",
						metadata: {
							sentTo: invoice.customerEmail,
						},
					});
				});
			} catch (emailError) {
				console.error("Failed to send invoice reminder email:", emailError);
				await logInvoiceActivity(prisma, {
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

			const updatedInvoice = await fetchInvoiceDetail(prisma, input.invoiceId);
			return mapInvoiceDetail(updatedInvoice);
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

			const filters: Record<string, unknown>[] = [];

			// For agency users, show all transactions
			// For customers, filter by their accessible invoices
			if (!isAgencyUser(user.role)) {
				const memberships = await prisma.teamMember.findMany({
					where: { userId: user.id },
					select: { teamId: true },
				});

				const accessibleTeams = memberships.map((membership) => membership.teamId);
				const accessConditions: Record<string, unknown>[] = [];

				if (accessibleTeams.length > 0) {
					accessConditions.push({
						invoice: {
							teamId: { in: accessibleTeams },
						},
					});
				}

				accessConditions.push({
					invoice: {
						AND: [{ teamId: null }, { createdBy: user.id }],
					},
				});

				filters.push({ OR: accessConditions });
			}

			if (input.status) {
				filters.push({ status: input.status });
			}

			const where = filters.length > 0 ? { AND: filters } : undefined;

			const [transactions, total] = await prisma.$transaction([
				prisma.invoiceTransaction.findMany({
					where,
					include: {
						invoice: {
							select: {
								invoiceNumber: true,
							},
						},
					},
					orderBy: { createdAt: "desc" },
					skip: input.offset,
					take: input.limit,
				}),
				prisma.invoiceTransaction.count({ where }),
			]);

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
					invoiceNumber: t.invoice.invoiceNumber,
				})),
				total,
			};
		}),
});

