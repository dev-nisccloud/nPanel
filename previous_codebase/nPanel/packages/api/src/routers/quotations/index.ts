import { TRPCError } from "@trpc/server";
import * as crypto from "crypto";
import { z } from "zod";
import prisma from "@npanel/db";
import { protectedProcedure, router, type Context } from "../../trpc";
import {
	quotationActivityLogSchema,
	quotationCreateInputSchema,
	quotationDetailSchema,
	quotationLineItemOutputSchema,
	quotationListFiltersSchema,
	quotationListResponseSchema,
	quotationStatusSchema,
	quotationSummarySchema,
	quotationUpdateInputSchema,
	nextQuotationNumberSchema,
	sendQuotationEmailSchema,
} from "./schemas";
import type { QuotationDetail } from "./schemas";

type DbClient = typeof prisma | Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;

const isAgencyUser = (role: string) =>
	["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role);

function parseDate(value: unknown): Date | null {
	if (!value) return null;
	if (value instanceof Date) return value;
	const parsed = new Date(value as string);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function stringOrNull(value: unknown): string | null {
	if (value === null || value === undefined) return null;
	if (typeof value === "string") return value;
	return String(value);
}

async function getAuthenticatedUser(ctx: Context) {
	const user = ctx.session?.user;
	if (!user?.id) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in." });
	}
	const sessionRole = (user as { role?: string })?.role;
	if (sessionRole) return { id: user.id, role: sessionRole };
	const dbUser = await prisma.user.findUnique({
		where: { id: user.id },
		select: { id: true, role: true },
	});
	if (!dbUser) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found." });
	}
	return { id: dbUser.id, role: dbUser.role as string };
}

async function ensureQuotationAccess(db: DbClient, userId: string, role: string, quotationId: string) {
	const quotation = await db.quotation.findUnique({
		where: { id: quotationId },
		select: { createdBy: true },
	});
	if (!quotation) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Quotation not found." });
	}
	if (isAgencyUser(role)) return quotation;
	if (quotation.createdBy !== userId) {
		throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this quotation." });
	}
	return quotation;
}

function buildQuotationData(input: z.infer<typeof quotationCreateInputSchema>) {
	const data: Record<string, unknown> = {
		customerName: stringOrNull(input.customerName),
		customerEmail: stringOrNull(input.customerEmail),
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
	if (input.metadata != null) data.metadata = input.metadata;
	if (input.fromDetails != null) data.fromDetails = input.fromDetails;
	if (input.customerDetails != null) data.customerDetails = input.customerDetails;
	if (input.noteDetails != null) data.noteDetails = input.noteDetails;
	if (input.template != null) data.template = input.template;
	if (input.topBlock != null) data.topBlock = input.topBlock;
	if (input.bottomBlock != null) data.bottomBlock = input.bottomBlock;
	return data;
}

function buildQuotationUpdateData(
	input: z.infer<typeof quotationUpdateInputSchema>,
	userId: string,
) {
	const data: Record<string, unknown> = { updatedBy: userId, updatedAt: new Date() };
	const set = (key: string, value: unknown) => {
		if (Object.prototype.hasOwnProperty.call(input, key)) data[key] = value;
	};
	set("customerName", stringOrNull(input.customerName));
	set("customerEmail", stringOrNull(input.customerEmail));
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
	if (Object.prototype.hasOwnProperty.call(input, "metadata")) data.metadata = input.metadata;
	if (Object.prototype.hasOwnProperty.call(input, "fromDetails")) data.fromDetails = input.fromDetails;
	if (Object.prototype.hasOwnProperty.call(input, "customerDetails")) data.customerDetails = input.customerDetails;
	if (Object.prototype.hasOwnProperty.call(input, "noteDetails")) data.noteDetails = input.noteDetails;
	if (Object.prototype.hasOwnProperty.call(input, "template")) data.template = input.template;
	if (Object.prototype.hasOwnProperty.call(input, "topBlock")) data.topBlock = input.topBlock;
	if (Object.prototype.hasOwnProperty.call(input, "bottomBlock")) data.bottomBlock = input.bottomBlock;
	return data;
}

function mapQuotationDetail(row: {
	id: string;
	quotationNumber: string | null;
	customerName: string | null;
	customerEmail: string | null;
	status: string;
	amount: string | null;
	currency: string;
	subtotal: string | null;
	tax: string | null;
	taxPercentage: number | null;
	vat: string | null;
	discount: string | null;
	issueDate: Date | null;
	note: string | null;
	internalNote: string | null;
	metadata: unknown;
	fromDetails: unknown;
	customerDetails: unknown;
	noteDetails: unknown;
	template: unknown;
	topBlock: unknown;
	bottomBlock: unknown;
	createdAt: Date;
	updatedAt: Date;
	lineItems: Array<{
		id: string;
		position: number;
		name: string | null;
		description: string | null;
		quantity: number | null;
		unit: string | null;
		price: string | null;
		discount: string | null;
		total: string | null;
		metadata: unknown;
		createdAt: Date;
		updatedAt: Date;
	}>;
	activityLogs: Array<{
		id: string;
		userId: string;
		action: string;
		description: string | null;
		metadata: unknown;
		ipAddress: string | null;
		userAgent: string | null;
		createdAt: Date;
	}>;
}): QuotationDetail {
	const lineItems = row.lineItems.map((item) =>
		quotationLineItemOutputSchema.parse({
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
		}),
	);
	const activityLogs = (row.activityLogs ?? []).map((log) =>
		quotationActivityLogSchema.parse({
			id: log.id,
			userId: log.userId,
			action: log.action,
			description: log.description ?? null,
			...(log.metadata != null && { metadata: log.metadata }),
			ipAddress: log.ipAddress ?? null,
			userAgent: log.userAgent ?? null,
			createdAt: log.createdAt,
		}),
	);
	return quotationDetailSchema.parse({
		id: row.id,
		quotationNumber: row.quotationNumber,
		customerName: row.customerName,
		customerEmail: row.customerEmail,
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

async function fetchQuotationDetail(db: DbClient, quotationId: string) {
	const quotation = await db.quotation.findUnique({
		where: { id: quotationId },
		include: {
			lineItems: { orderBy: { position: "asc" } },
			activityLogs: { orderBy: { createdAt: "desc" } },
		},
	});
	if (!quotation) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Quotation not found." });
	}
	return quotation;
}

async function logQuotationActivity(
	db: DbClient,
	params: { quotationId: string; userId: string; action: string; description?: string | null; metadata?: unknown },
) {
	const logData: {
		id: string;
		quotationId: string;
		userId: string;
		action: string;
		description: string | null;
		metadata?: unknown;
		createdAt: Date;
	} = {
		id: crypto.randomUUID(),
		quotationId: params.quotationId,
		userId: params.userId,
		action: params.action,
		description: params.description ?? null,
		createdAt: new Date(),
	};
	if (params.metadata != null) logData.metadata = params.metadata;
	await db.quotationActivityLog.create({ data: logData as Parameters<typeof db.quotationActivityLog.create>[0]["data"] });
}

function parseQuotationNumber(quotationNumber: string): number | null {
	const match = quotationNumber.match(/^QUOT-(\d+)$/i);
	if (!match) return null;
	const num = Number.parseInt(match[1] ?? "", 10);
	return Number.isNaN(num) ? null : num;
}

async function updateQuotationCounter(db: DbClient, quotationNumber: string): Promise<void> {
	const parsed = parseQuotationNumber(quotationNumber);
	if (!parsed || parsed < 1) return;
	await db.quotationCounter.upsert({
		where: { id: "quotation-counter" },
		create: { id: "quotation-counter", lastNumber: parsed },
		update: { lastNumber: parsed },
	});
}

async function generateNextQuotationNumber(tx: DbClient): Promise<string> {
	const counter = await tx.quotationCounter.upsert({
		where: { id: "quotation-counter" },
		create: { id: "quotation-counter", lastNumber: 1 },
		update: { lastNumber: { increment: 1 } },
		select: { lastNumber: true },
	});
	return `QUOT-${counter.lastNumber.toString().padStart(4, "0")}`;
}

export const quotationsRouter = router({
	list: protectedProcedure
		.input(quotationListFiltersSchema)
		.output(quotationListResponseSchema)
		.query(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);
			const filters: Record<string, unknown>[] = [];
			if (!isAgencyUser(user.role)) {
				filters.push({ createdBy: user.id });
			}
			if (input.status) filters.push({ status: input.status });
			if (input.search?.trim()) {
				const q = input.search.trim();
				filters.push({
					OR: [
						{ quotationNumber: { contains: q, mode: "insensitive" } },
						{ customerName: { contains: q, mode: "insensitive" } },
						{ customerEmail: { contains: q, mode: "insensitive" } },
						{ status: { equals: q, mode: "insensitive" } },
					],
				});
			}
			const where = filters.length > 0 ? { AND: filters } : undefined;
			const [quotations, total] = await prisma.$transaction([
				prisma.quotation.findMany({
					where,
					orderBy: { createdAt: "desc" },
					skip: input.offset,
					take: input.limit,
					select: {
						id: true,
						quotationNumber: true,
						customerName: true,
						customerEmail: true,
						status: true,
						amount: true,
						subtotal: true,
						currency: true,
						createdAt: true,
						updatedAt: true,
					},
				}),
				prisma.quotation.count({ where }),
			]);
			return quotationListResponseSchema.parse({
				quotations: quotations.map((q) =>
					quotationSummarySchema.parse({
						...q,
						amount: q.amount != null ? String(q.amount) : null,
						subtotal: q.subtotal != null ? String(q.subtotal) : null,
					}),
				),
				total,
			});
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.output(quotationDetailSchema)
		.query(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);
			await ensureQuotationAccess(prisma, user.id, user.role, input.id);
			const quotation = await fetchQuotationDetail(prisma, input.id);
			return mapQuotationDetail(quotation);
		}),

	getNextQuotationNumber: protectedProcedure
		.output(nextQuotationNumberSchema)
		.query(async () => {
			const counter = await prisma.quotationCounter.findUnique({
				where: { id: "quotation-counter" },
				select: { lastNumber: true },
			});
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
			const quotationId = input.id ?? crypto.randomUUID();
			const token = input.token ?? crypto.randomUUID();

			await prisma.$transaction(async (tx) => {
				let quotationNumber = input.quotationNumber;
				if (!quotationNumber) {
					quotationNumber = await generateNextQuotationNumber(tx);
				} else {
					const existing = await tx.quotation.findFirst({
						where: { quotationNumber },
						select: { id: true },
					});
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

				await tx.quotation.create({
					data: {
						...data,
						id: quotationId,
						token,
						createdAt: new Date(),
						updatedAt: new Date(),
					} as Parameters<typeof tx.quotation.create>[0]["data"],
				});

				if (input.lineItems?.length) {
					for (const [index, item] of input.lineItems.entries()) {
						const lineId = item.id ?? crypto.randomUUID();
						const lineData: Record<string, unknown> = {
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
						if (item.metadata != null) lineData.metadata = item.metadata;
						await tx.quotationLineItem.create({
							data: lineData as Parameters<typeof tx.quotationLineItem.create>[0]["data"],
						});
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

			const quotation = await fetchQuotationDetail(prisma, quotationId);
			return mapQuotationDetail(quotation);
		}),

	update: protectedProcedure
		.input(quotationUpdateInputSchema)
		.output(quotationDetailSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);
			await ensureQuotationAccess(prisma, user.id, user.role, input.id);

			await prisma.$transaction(async (tx) => {
				const data = buildQuotationUpdateData(input, user.id);
				await tx.quotation.update({
					where: { id: input.id },
					data: data as Parameters<typeof tx.quotation.update>[0]["data"],
				});

				if (input.lineItems) {
					const existing = await tx.quotationLineItem.findMany({
						where: { quotationId: input.id },
						select: { id: true },
					});
					const incomingIds = new Set(
						input.lineItems.filter((item) => item.id).map((item) => item.id as string),
					);
					const toDelete = existing.filter((item) => !incomingIds.has(item.id)).map((item) => item.id);
					if (toDelete.length > 0) {
						await tx.quotationLineItem.deleteMany({ where: { id: { in: toDelete } } });
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
							await tx.quotationLineItem.update({
								where: { id: item.id },
								data: updateData as Parameters<typeof tx.quotationLineItem.update>[0]["data"],
							});
						} else {
							await tx.quotationLineItem.create({
								data: {
									id: crypto.randomUUID(),
									quotationId: input.id,
									...updateData,
									createdAt: new Date(),
								} as Parameters<typeof tx.quotationLineItem.create>[0]["data"],
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

			const quotation = await fetchQuotationDetail(prisma, input.id);
			return mapQuotationDetail(quotation);
		}),

	updateStatus: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				status: quotationStatusSchema,
				note: z.string().optional(),
			}),
		)
		.output(quotationDetailSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);
			await ensureQuotationAccess(prisma, user.id, user.role, input.id);
			await prisma.$transaction(async (tx) => {
				await tx.quotation.update({
					where: { id: input.id },
					data: {
						status: input.status,
						updatedBy: user.id,
						updatedAt: new Date(),
					},
				});
				await logQuotationActivity(tx, {
					quotationId: input.id,
					userId: user.id,
					action: "STATUS_CHANGE",
					description: `Changed status to ${input.status}`,
					metadata: input.note ? { note: input.note } : undefined,
				});
			});
			const quotation = await fetchQuotationDetail(prisma, input.id);
			return mapQuotationDetail(quotation);
		}),

	deleteQuotation: protectedProcedure
		.input(z.object({ quotationId: z.string().uuid() }))
		.output(z.object({ success: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);
			await ensureQuotationAccess(prisma, user.id, user.role, input.quotationId);
			await prisma.$transaction(async (tx) => {
				const quotation = await tx.quotation.findUnique({
					where: { id: input.quotationId },
					select: { id: true, quotationNumber: true },
				});
				if (!quotation) {
					throw new TRPCError({ code: "NOT_FOUND", message: "Quotation not found." });
				}
				await logQuotationActivity(tx, {
					quotationId: input.quotationId,
					userId: user.id,
					action: "DELETE",
					description: `Quotation ${quotation.quotationNumber ?? input.quotationId} deleted`,
					metadata: { quotationNumber: quotation.quotationNumber },
				});
				await tx.quotationActivityLog.deleteMany({ where: { quotationId: input.quotationId } });
				await tx.quotationLineItem.deleteMany({ where: { quotationId: input.quotationId } });
				await tx.quotation.delete({ where: { id: input.quotationId } });
			});
			return { success: true };
		}),

	sendQuotationEmail: protectedProcedure
		.input(sendQuotationEmailSchema)
		.output(z.object({ success: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			const user = await getAuthenticatedUser(ctx);
			await ensureQuotationAccess(prisma, user.id, user.role, input.quotationId);
			const quotation = await fetchQuotationDetail(prisma, input.quotationId);
			const { sendEmail } = await import("../../lib/email");
			const { renderQuotationDeliveryEmail } = await import("../../lib/email-templates");

			const formatDate = (date: Date | null | undefined): string => {
				if (!date) return "N/A";
				return new Date(date).toLocaleDateString("en-US", {
					year: "numeric",
					month: "long",
					day: "numeric",
				});
			};

			const services = quotation.lineItems.map((item) => ({
				name: item.name || "Item",
				description: item.description ?? undefined,
				quantity: item.quantity ?? undefined,
				price: item.price ? `${quotation.currency} ${item.price}` : undefined,
			}));

			const emailHtml = await renderQuotationDeliveryEmail({
				customerName: quotation.customerName ?? "Valued Customer",
				quotationNumber: quotation.quotationNumber ?? "N/A",
				issueDate: formatDate(quotation.issueDate),
				totalAmount: quotation.amount ?? "0.00",
				currency: quotation.currency ?? "KES",
				services,
				supportEmail: "billing@nisccloud.com",
				supportPhone: "+254 748 777 666",
			});

			const filename = quotation.quotationNumber
				? `${String(quotation.quotationNumber).replace(/[^a-zA-Z0-9._-]/g, "_")}.pdf`
				: "Quotation.pdf";

			await sendEmail({
				to: input.toEmail,
				subject: `Quotation ${quotation.quotationNumber ?? ""} from Nisc Cloud®`,
				html: emailHtml,
				attachments: [
					{
						filename,
						content: Buffer.from(input.pdfBase64, "base64"),
						contentType: "application/pdf",
					},
				],
			});

			await logQuotationActivity(prisma, {
				quotationId: input.quotationId,
				userId: user.id,
				action: "EMAIL_SENT",
				description: `Quotation sent to ${input.toEmail}`,
				metadata: { toEmail: input.toEmail },
			});

			return { success: true };
		}),
});
