import { TRPCError } from "@trpc/server";
import * as crypto from "crypto";
import { z } from "zod";
import { and, count, desc, eq, ilike, inArray, max, or, sql } from "@npanel/db";

import { db } from "@npanel/db";
import { user } from "@npanel/db/schema/auth";
import {
	salesServiceOrder,
	salesServiceOrderActivityLog,
	salesServiceOrderCounter,
	salesServiceOrderLineItem,
} from "@npanel/db/schema/sales-service-order";
import { protectedProcedure, router, type Context } from "../../trpc";
import {
	nextServiceOrderNumberSchema,
	sendServiceOrderEmailSchema,
	serviceOrderCreateInputSchema,
	serviceOrderCustomersSummaryFiltersSchema,
	serviceOrderCustomersSummaryResponseSchema,
	serviceOrderCustomerSummarySchema,
	serviceOrderDetailSchema,
	serviceOrderLineOutputSchema,
	serviceOrderActivityLogSchema,
	serviceOrderListFiltersSchema,
	serviceOrderListResponseSchema,
	serviceOrderStatusSchema,
	serviceOrderSummarySchema,
	serviceOrderUpdateInputSchema,
	type ServiceOrderCreateInput,
	type ServiceOrderDetail,
	type ServiceOrderUpdateInput,
} from "./schemas";

type DbLike = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

const isAgencyUser = (role: string) =>
	["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role);
const isAgencySuperAdmin = (role: string) => role === "AGENCY_SUPER_ADMIN";

function customerGroupKeySql() {
	return sql<string>`CASE
		WHEN nullif(trim(lower(${salesServiceOrder.customerEmail})), '') IS NOT NULL
			THEN 'email:' || trim(lower(${salesServiceOrder.customerEmail}))
		WHEN nullif(trim(lower(${salesServiceOrder.customerName})), '') IS NOT NULL
			THEN 'name:' || trim(lower(regexp_replace(${salesServiceOrder.customerName}, '\\s+', ' ', 'g')))
		ELSE 'unassigned'
	END`;
}

function customerGroupKeyCondition(customerGroupKey: string) {
	if (customerGroupKey === "unassigned") {
		return and(
			or(
				sql`nullif(trim(${salesServiceOrder.customerEmail}), '') IS NULL`,
				sql`${salesServiceOrder.customerEmail} IS NULL`,
			)!,
			or(
				sql`nullif(trim(${salesServiceOrder.customerName}), '') IS NULL`,
				sql`${salesServiceOrder.customerName} IS NULL`,
			)!,
		)!;
	}
	if (customerGroupKey.startsWith("email:")) {
		const email = customerGroupKey.slice("email:".length);
		return sql`trim(lower(${salesServiceOrder.customerEmail})) = ${email}`;
	}
	if (customerGroupKey.startsWith("name:")) {
		const name = customerGroupKey.slice("name:".length);
		return and(
			or(
				sql`nullif(trim(${salesServiceOrder.customerEmail}), '') IS NULL`,
				sql`${salesServiceOrder.customerEmail} IS NULL`,
			)!,
			sql`trim(lower(regexp_replace(coalesce(${salesServiceOrder.customerName}, ''), '\\s+', ' ', 'g'))) = ${name}`,
		)!;
	}
	return sql`false`;
}

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
	const sessionUser = ctx.session?.user;
	if (!sessionUser?.id) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in." });
	}
	const sessionRole = (sessionUser as { role?: string })?.role;
	if (sessionRole) return { id: sessionUser.id, role: sessionRole };
	const dbUserRows = await db
		.select({ id: user.id, role: user.role })
		.from(user)
		.where(eq(user.id, sessionUser.id))
		.limit(1);
	const dbUser = dbUserRows[0];
	if (!dbUser) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found." });
	}
	return { id: dbUser.id, role: dbUser.role as string };
}

async function ensureAccess(userId: string, role: string, serviceOrderId: string) {
	const rows = await db
		.select({ createdBy: salesServiceOrder.createdBy })
		.from(salesServiceOrder)
		.where(eq(salesServiceOrder.id, serviceOrderId))
		.limit(1);
	const row = rows[0];
	if (!row) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Service order not found." });
	}
	if (isAgencyUser(role)) return row;
	if (row.createdBy !== userId) {
		throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this service order." });
	}
	return row;
}

async function ensureMutationAccess(userId: string, role: string, serviceOrderId: string) {
	const row = await ensureAccess(userId, role, serviceOrderId);
	if (!isAgencySuperAdmin(role) && row.createdBy !== userId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Only the service order creator can modify it.",
		});
	}
	return row;
}

function headerValues(input: ServiceOrderCreateInput | ServiceOrderUpdateInput) {
	return {
		customerName: stringOrNull(input.customerName),
		customerEmail: stringOrNull(input.customerEmail),
		billingEmail: stringOrNull(input.billingEmail),
		phone: stringOrNull(input.phone),
		contactPerson: stringOrNull(input.contactPerson),
		linkedUserId: input.linkedUserId ?? null,
		orderNumber: stringOrNull(input.orderNumber),
		amount: stringOrNull(input.amount),
		subtotal: stringOrNull(input.subtotal),
		tax: stringOrNull(input.tax),
		taxPercentage: input.taxPercentage ?? null,
		vat: stringOrNull(input.vat),
		discount: stringOrNull(input.discount),
		currency: input.currency ?? "KES",
		issueDate: parseDate(input.issueDate),
		validUntil: parseDate(input.validUntil),
		paymentTerms: stringOrNull(input.paymentTerms),
		preparedBy: stringOrNull(input.preparedBy),
		note: stringOrNull(input.note),
		fromDetails: input.fromDetails ?? null,
		customerDetails: input.customerDetails ?? null,
		authorization: input.authorization ?? null,
		metadata: input.metadata ?? null,
		...(input.status ? { status: input.status } : {}),
	};
}

function mapDetail(row: {
	id: string;
	orderNumber: string | null;
	customerName: string | null;
	customerEmail: string | null;
	billingEmail: string | null;
	phone: string | null;
	contactPerson: string | null;
	linkedUserId: string | null;
	status: string;
	amount: string | null;
	subtotal: string | null;
	tax: string | null;
	taxPercentage: number | null;
	vat: string | null;
	discount: string | null;
	currency: string;
	issueDate: Date | null;
	validUntil: Date | null;
	paymentTerms: string | null;
	preparedBy: string | null;
	note: string | null;
	fromDetails: unknown;
	customerDetails: unknown;
	authorization: unknown;
	metadata: unknown;
	createdAt: Date;
	updatedAt: Date;
	lineItems: Array<{
		id: string;
		position: number;
		category: string | null;
		name: string | null;
		primaryDomain: string | null;
		quantity: number | null;
		billingCycle: string | null;
		price: string | null;
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
		createdAt: Date;
	}>;
}): ServiceOrderDetail {
	return serviceOrderDetailSchema.parse({
		id: row.id,
		orderNumber: row.orderNumber,
		customerName: row.customerName,
		customerEmail: row.customerEmail,
		billingEmail: row.billingEmail,
		phone: row.phone,
		contactPerson: row.contactPerson,
		linkedUserId: row.linkedUserId,
		status: row.status,
		amount: row.amount,
		subtotal: row.subtotal,
		tax: row.tax,
		taxPercentage: row.taxPercentage,
		vat: row.vat,
		discount: row.discount,
		currency: row.currency,
		issueDate: row.issueDate,
		validUntil: row.validUntil,
		paymentTerms: row.paymentTerms,
		preparedBy: row.preparedBy,
		note: row.note,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		...(row.fromDetails != null && { fromDetails: row.fromDetails }),
		...(row.customerDetails != null && { customerDetails: row.customerDetails }),
		...(row.authorization != null && { authorization: row.authorization }),
		...(row.metadata != null && { metadata: row.metadata }),
		lineItems: row.lineItems.map((item) =>
			serviceOrderLineOutputSchema.parse({
				id: item.id,
				position: item.position,
				category: item.category,
				name: item.name,
				primaryDomain: item.primaryDomain,
				quantity: item.quantity,
				billingCycle: item.billingCycle,
				price: item.price,
				total: item.total,
				...(item.metadata != null && { metadata: item.metadata }),
				createdAt: item.createdAt,
				updatedAt: item.updatedAt,
			}),
		),
		activityLogs: row.activityLogs.map((log) =>
			serviceOrderActivityLogSchema.parse({
				id: log.id,
				userId: log.userId,
				action: log.action,
				description: log.description,
				...(log.metadata != null && { metadata: log.metadata }),
				createdAt: log.createdAt,
			}),
		),
	});
}

async function fetchDetail(serviceOrderId: string) {
	const row = await db.query.salesServiceOrder.findFirst({
		where: eq(salesServiceOrder.id, serviceOrderId),
		with: {
			lineItems: { orderBy: (li, { asc }) => [asc(li.position)] },
			activityLogs: { orderBy: (log, { desc: d }) => [d(log.createdAt)] },
		},
	});
	if (!row) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Service order not found." });
	}
	return row;
}

async function logActivity(
	tx: DbLike,
	params: { serviceOrderId: string; userId: string; action: string; description?: string | null; metadata?: unknown },
) {
	await tx.insert(salesServiceOrderActivityLog).values({
		id: crypto.randomUUID(),
		serviceOrderId: params.serviceOrderId,
		userId: params.userId,
		action: params.action,
		description: params.description ?? null,
		...(params.metadata != null && { metadata: params.metadata as object }),
		createdAt: new Date(),
	});
}

function parseOrderNumber(orderNumber: string): number | null {
	const match = orderNumber.match(/^SO-(\d+)$/i);
	if (!match) return null;
	const num = Number.parseInt(match[1] ?? "", 10);
	return Number.isNaN(num) ? null : num;
}

async function rememberOrderNumber(tx: DbLike, orderNumber: string) {
	const parsed = parseOrderNumber(orderNumber);
	if (!parsed || parsed < 1) return;
	await tx
		.insert(salesServiceOrderCounter)
		.values({ id: "sales-service-order-counter", lastNumber: parsed, updatedAt: new Date() })
		.onConflictDoUpdate({
			target: salesServiceOrderCounter.id,
			set: { lastNumber: parsed, updatedAt: new Date() },
		});
}

async function generateNextOrderNumber(tx: DbLike): Promise<string> {
	const now = new Date();
	const rows = await tx
		.insert(salesServiceOrderCounter)
		.values({ id: "sales-service-order-counter", lastNumber: 1, updatedAt: now })
		.onConflictDoUpdate({
			target: salesServiceOrderCounter.id,
			set: {
				lastNumber: sql`${salesServiceOrderCounter.lastNumber} + 1`,
				updatedAt: now,
			},
		})
		.returning({ lastNumber: salesServiceOrderCounter.lastNumber });
	const lastNumber = rows[0]?.lastNumber ?? 1;
	return `SO-${lastNumber.toString().padStart(4, "0")}`;
}

const summaryColumns = {
	id: salesServiceOrder.id,
	orderNumber: salesServiceOrder.orderNumber,
	customerName: salesServiceOrder.customerName,
	customerEmail: salesServiceOrder.customerEmail,
	status: salesServiceOrder.status,
	amount: salesServiceOrder.amount,
	subtotal: salesServiceOrder.subtotal,
	currency: salesServiceOrder.currency,
	createdAt: salesServiceOrder.createdAt,
	updatedAt: salesServiceOrder.updatedAt,
};

export const salesServiceOrdersRouter = router({
	list: protectedProcedure
		.input(serviceOrderListFiltersSchema)
		.output(serviceOrderListResponseSchema)
		.query(async ({ ctx, input }) => {
			const actor = await getAuthenticatedUser(ctx);
			const conditions = [];
			if (!isAgencyUser(actor.role)) {
				conditions.push(eq(salesServiceOrder.createdBy, actor.id));
			}
			if (input.customerGroupKey?.trim()) {
				conditions.push(customerGroupKeyCondition(input.customerGroupKey.trim()));
			}
			if (input.status) conditions.push(eq(salesServiceOrder.status, input.status));
			if (input.search?.trim()) {
				const q = `%${input.search.trim()}%`;
				conditions.push(
					or(
						ilike(salesServiceOrder.orderNumber, q),
						ilike(salesServiceOrder.customerName, q),
						ilike(salesServiceOrder.customerEmail, q),
						ilike(salesServiceOrder.billingEmail, q),
					),
				);
			}
			const whereClause = conditions.length ? and(...conditions) : undefined;
			const [orders, totalRow] = await Promise.all([
				db
					.select(summaryColumns)
					.from(salesServiceOrder)
					.where(whereClause ?? sql`true`)
					.orderBy(desc(salesServiceOrder.createdAt))
					.limit(input.limit)
					.offset(input.offset),
				db.select({ c: count() }).from(salesServiceOrder).where(whereClause ?? sql`true`),
			]);
			return serviceOrderListResponseSchema.parse({
				orders: orders.map((order) =>
					serviceOrderSummarySchema.parse({
						...order,
						amount: order.amount != null ? String(order.amount) : null,
						subtotal: order.subtotal != null ? String(order.subtotal) : null,
					}),
				),
				total: Number(totalRow[0]?.c ?? 0),
			});
		}),

	listCustomersSummary: protectedProcedure
		.input(serviceOrderCustomersSummaryFiltersSchema)
		.output(serviceOrderCustomersSummaryResponseSchema)
		.query(async ({ ctx, input }) => {
			const actor = await getAuthenticatedUser(ctx);
			const conditions = [];
			if (!isAgencyUser(actor.role)) {
				conditions.push(eq(salesServiceOrder.createdBy, actor.id));
			}
			if (input.search?.trim()) {
				const q = `%${input.search.trim()}%`;
				conditions.push(
					or(
						ilike(salesServiceOrder.customerName, q),
						ilike(salesServiceOrder.customerEmail, q),
						ilike(salesServiceOrder.billingEmail, q),
					)!,
				);
			}
			const whereClause = conditions.length ? and(...conditions) : undefined;
			const groupKey = customerGroupKeySql();
			const rows = await db
				.select({
					customerGroupKey: groupKey,
					customerName: max(salesServiceOrder.customerName),
					customerEmail: max(salesServiceOrder.customerEmail),
					orderCount: count(),
					openCount: sql<number>`count(*) filter (where ${salesServiceOrder.status} in ('DRAFT', 'SENT'))`.mapWith(Number),
					lastOrderAt: max(salesServiceOrder.createdAt),
				})
				.from(salesServiceOrder)
				.where(whereClause ?? sql`true`)
				.groupBy(groupKey)
				.orderBy(sql`max(${salesServiceOrder.customerName}) asc nulls last`);

			return serviceOrderCustomersSummaryResponseSchema.parse({
				customers: rows.map((row) =>
					serviceOrderCustomerSummarySchema.parse({
						customerGroupKey: row.customerGroupKey,
						customerName: row.customerGroupKey === "unassigned" ? "Unassigned" : row.customerName ?? null,
						customerEmail: row.customerGroupKey === "unassigned" ? null : row.customerEmail ?? null,
						orderCount: Number(row.orderCount),
						openCount: Number(row.openCount ?? 0),
						lastOrderAt: row.lastOrderAt ?? null,
					}),
				),
			});
		}),

	getById: protectedProcedure
		.input(zId())
		.output(serviceOrderDetailSchema)
		.query(async ({ ctx, input }) => {
			const actor = await getAuthenticatedUser(ctx);
			await ensureAccess(actor.id, actor.role, input.id);
			return mapDetail(await fetchDetail(input.id));
		}),

	getNextOrderNumber: protectedProcedure.output(nextServiceOrderNumberSchema).query(async () => {
		const counterRows = await db
			.select({ lastNumber: salesServiceOrderCounter.lastNumber })
			.from(salesServiceOrderCounter)
			.where(eq(salesServiceOrderCounter.id, "sales-service-order-counter"))
			.limit(1);
		const nextNumber = (counterRows[0]?.lastNumber ?? 0) + 1;
		return {
			orderNumber: `SO-${nextNumber.toString().padStart(4, "0")}`,
			nextNumber,
		};
	}),

	create: protectedProcedure
		.input(serviceOrderCreateInputSchema)
		.output(serviceOrderDetailSchema)
		.mutation(async ({ ctx, input }) => {
			const actor = await getAuthenticatedUser(ctx);
			const serviceOrderId = crypto.randomUUID();
			const token = input.token ?? crypto.randomUUID();

			await db.transaction(async (tx) => {
				let orderNumber = input.orderNumber ?? null;
				if (!orderNumber) {
					orderNumber = await generateNextOrderNumber(tx);
				} else {
					const existing = await tx
						.select({ id: salesServiceOrder.id })
						.from(salesServiceOrder)
						.where(eq(salesServiceOrder.orderNumber, orderNumber))
						.limit(1);
					if (existing[0]) {
						throw new TRPCError({
							code: "CONFLICT",
							message: `Service order ${orderNumber} already exists.`,
						});
					}
					await rememberOrderNumber(tx, orderNumber);
				}

				const now = new Date();
				await tx.insert(salesServiceOrder).values({
					...headerValues({ ...input, orderNumber, status: input.status ?? "DRAFT" }),
					status: input.status ?? "DRAFT",
					id: serviceOrderId,
					token,
					createdBy: actor.id,
					updatedBy: actor.id,
					createdAt: now,
					updatedAt: now,
				});

				for (const [index, item] of (input.lineItems ?? []).entries()) {
					await tx.insert(salesServiceOrderLineItem).values({
						id: item.id ?? crypto.randomUUID(),
						serviceOrderId,
						position: item.position ?? index,
						category: stringOrNull(item.category),
						name: stringOrNull(item.name),
						primaryDomain: stringOrNull(item.primaryDomain),
						quantity: item.quantity ?? null,
						billingCycle: stringOrNull(item.billingCycle),
						price: stringOrNull(item.price),
						total: stringOrNull(item.total),
						...(item.metadata != null && { metadata: item.metadata }),
						createdAt: now,
						updatedAt: now,
					});
				}

				await logActivity(tx, {
					serviceOrderId,
					userId: actor.id,
					action: "CREATE",
					description: "Created service order",
					metadata: { orderNumber },
				});
			});

			return mapDetail(await fetchDetail(serviceOrderId));
		}),

	update: protectedProcedure
		.input(serviceOrderUpdateInputSchema)
		.output(serviceOrderDetailSchema)
		.mutation(async ({ ctx, input }) => {
			const actor = await getAuthenticatedUser(ctx);
			await ensureMutationAccess(actor.id, actor.role, input.id);
			const now = new Date();

			await db.transaction(async (tx) => {
				const { orderNumber: _orderNumber, ...header } = headerValues(input);
				await tx
					.update(salesServiceOrder)
					.set({
						...header,
						updatedBy: actor.id,
						updatedAt: now,
					})
					.where(eq(salesServiceOrder.id, input.id));

				if (input.lineItems) {
					const existing = await tx
						.select({ id: salesServiceOrderLineItem.id })
						.from(salesServiceOrderLineItem)
						.where(eq(salesServiceOrderLineItem.serviceOrderId, input.id));
					const incomingIds = new Set(
						input.lineItems.filter((item) => item.id).map((item) => item.id as string),
					);
					const toDelete = existing.filter((item) => !incomingIds.has(item.id)).map((item) => item.id);
					if (toDelete.length > 0) {
						await tx.delete(salesServiceOrderLineItem).where(inArray(salesServiceOrderLineItem.id, toDelete));
					}
					for (const [index, item] of input.lineItems.entries()) {
						const values = {
							position: item.position ?? index,
							category: stringOrNull(item.category),
							name: stringOrNull(item.name),
							primaryDomain: stringOrNull(item.primaryDomain),
							quantity: item.quantity ?? null,
							billingCycle: stringOrNull(item.billingCycle),
							price: stringOrNull(item.price),
							total: stringOrNull(item.total),
							metadata: item.metadata ?? null,
							updatedAt: now,
						};
						if (item.id) {
							await tx
								.update(salesServiceOrderLineItem)
								.set(values)
								.where(eq(salesServiceOrderLineItem.id, item.id));
						} else {
							await tx.insert(salesServiceOrderLineItem).values({
								id: crypto.randomUUID(),
								serviceOrderId: input.id,
								...values,
								createdAt: now,
							});
						}
					}
				}

				await logActivity(tx, {
					serviceOrderId: input.id,
					userId: actor.id,
					action: "UPDATE",
					description: "Updated service order",
				});
			});

			return mapDetail(await fetchDetail(input.id));
		}),

	updateStatus: protectedProcedure
		.input(zId().extend({ status: serviceOrderStatusSchema }))
		.output(serviceOrderDetailSchema)
		.mutation(async ({ ctx, input }) => {
			const actor = await getAuthenticatedUser(ctx);
			await ensureMutationAccess(actor.id, actor.role, input.id);
			await db.transaction(async (tx) => {
				await tx
					.update(salesServiceOrder)
					.set({ status: input.status, updatedBy: actor.id, updatedAt: new Date() })
					.where(eq(salesServiceOrder.id, input.id));
				await logActivity(tx, {
					serviceOrderId: input.id,
					userId: actor.id,
					action: "STATUS_CHANGE",
					description: `Changed status to ${input.status}`,
				});
			});
			return mapDetail(await fetchDetail(input.id));
		}),

	deleteOrder: protectedProcedure
		.input(z.object({ serviceOrderId: z.string().uuid() }))
		.output(z.object({ success: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			const actor = await getAuthenticatedUser(ctx);
			await ensureMutationAccess(actor.id, actor.role, input.serviceOrderId);
			await db.delete(salesServiceOrder).where(eq(salesServiceOrder.id, input.serviceOrderId));
			return { success: true };
		}),

	sendEmail: protectedProcedure
		.input(sendServiceOrderEmailSchema)
		.output(z.object({ success: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			const actor = await getAuthenticatedUser(ctx);
			await ensureMutationAccess(actor.id, actor.role, input.serviceOrderId);
			const order = await fetchDetail(input.serviceOrderId);
			const { sendEmail } = await import("../../lib/email");
			const { renderServiceOrderDeliveryEmail } = await import("../../lib/email-templates");

			const formatDate = (date: Date | null | undefined) => {
				if (!date) return "N/A";
				return new Date(date).toLocaleDateString("en-GB", {
					year: "numeric",
					month: "long",
					day: "numeric",
				});
			};

			const emailHtml = await renderServiceOrderDeliveryEmail({
				customerName: order.customerName ?? "Valued Customer",
				orderNumber: order.orderNumber ?? "N/A",
				issueDate: formatDate(order.issueDate),
				validUntil: formatDate(order.validUntil),
				totalAmount: order.amount ?? "0.00",
				currency: order.currency ?? "KES",
				services: order.lineItems.map((item) => ({
					name: item.name || item.category || "Service",
					description: [item.category, item.primaryDomain].filter(Boolean).join(" · ") || undefined,
					quantity: item.quantity ?? undefined,
					price: item.total ? `${order.currency} ${item.total}` : undefined,
				})),
			});

			const filename = order.orderNumber
				? `${String(order.orderNumber).replace(/[^a-zA-Z0-9._-]/g, "_")}.pdf`
				: "Service-order.pdf";

			await sendEmail({
				to: input.toEmail,
				subject: `Service order ${order.orderNumber ?? ""} from Nisc Cloud®`,
				html: emailHtml,
				attachments: [
					{
						filename,
						content: Buffer.from(input.pdfBase64, "base64"),
						contentType: "application/pdf",
					},
				],
			});

			await db.transaction(async (tx) => {
				if (order.status === "DRAFT") {
					await tx
						.update(salesServiceOrder)
						.set({ status: "SENT", updatedBy: actor.id, updatedAt: new Date() })
						.where(eq(salesServiceOrder.id, input.serviceOrderId));
				}
				await logActivity(tx, {
					serviceOrderId: input.serviceOrderId,
					userId: actor.id,
					action: "EMAIL_SENT",
					description: `Service order sent to ${input.toEmail}`,
					metadata: { toEmail: input.toEmail },
				});
			});

			return { success: true };
		}),
});

function zId() {
	return z.object({ id: z.string().uuid() });
}
