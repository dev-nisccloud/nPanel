import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, inArray, sql } from "@npanel/db";
import { protectedProcedure, router } from "../trpc";
import { db } from "@npanel/db";
import { user } from "@npanel/db/schema/auth";
import { userActivityLog } from "@npanel/db/schema/auth-extras";
import { domain } from "@npanel/db/schema/domains";
import {
	hostingPlan,
	hostingSubscription,
	hostingSubscriptionActivityLog,
	niscServicePlan,
} from "@npanel/db/schema/hosting";
import {
	invoice,
	invoiceActivityLog,
	invoiceCounter,
	invoiceLineItem,
} from "@npanel/db/schema/invoicing";
import {
	order as orderTable,
	orderActivityLog,
	orderItem,
	orderItemActivityLog,
} from "@npanel/db/schema/orders";
import { team, teamBillingSettings, teamMember } from "@npanel/db/schema/teams";
import * as crypto from "crypto";
import { ensurePleskIntegration, provisionToPlesk } from "../lib/plesk-integration";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbLike = typeof db | DbTransaction;

const isAgencyRole = (role: string) =>
	role === "AGENCY_USER" || role === "AGENCY_ADMIN" || role === "AGENCY_SUPER_ADMIN";

/** Sequential invoice number (same pattern as invoicing router). */
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

type NiscServicePlanRow = typeof niscServicePlan.$inferSelect;

// ============================================================================
// ZOD SCHEMAS - Independent from database schema
// ============================================================================

const billingCycleSchema = z.enum(["MONTHLY", "YEARLY", "BIENNIALLY", "CUSTOM"]);

const orderItemStatusSchema = z.enum(["PENDING", "PROVISIONING", "PROVISIONED", "FAILED", "SKIPPED"]);

const orderTypeSchema = z.enum([
	"DOMAIN_REGISTRATION",
	"DOMAIN_RENEWAL",
	"DOMAIN_TRANSFER",
	"HOSTING_SUBSCRIPTION",
	"HOSTING_RENEWAL",
	"HOSTING_UPGRADE",
	"EMAIL_HOSTING",
	"SSL_CERTIFICATE",
	"BACKUP_SERVICE",
	"CUSTOM_SERVICE",
]);

const orderStatusSchema = z.enum([
	"PENDING",
	"PROCESSING",
	"COMPLETED",
	"FAILED",
	"CANCELLED",
	"REFUNDED",
	"PARTIAL",
]);

// Get all orders input/output
const getAllOrdersInputSchema = z.object({
	teamId: z.string().optional(),
	status: orderStatusSchema.optional(),
	type: orderTypeSchema.optional(),
	limit: z.number().min(1).max(100).optional().default(50),
	offset: z.number().min(0).optional().default(0),
});

const orderItemOutputSchema = z.object({
	id: z.string(),
	orderId: z.string(),
	niscServicePlanId: z.string(),
	billingCycle: billingCycleSchema,
	itemPrice: z.string(),
	itemSubtotal: z.string(),
	itemCurrency: z.string(),
	domainName: z.string().nullable(),
	description: z.string().nullable(),
	adminDescription: z.string().nullable(),
	notes: z.string().nullable(),
	status: orderItemStatusSchema,
	isProvisioned: z.boolean(),
	provisioningError: z.string().nullable(),
	hostingSubscriptionId: z.string().nullable(),
	metadata: z.any().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
	// Relations
	niscServicePlan: z.object({
		id: z.string(),
		name: z.string(),
		planType: z.string(),
		hostingSubType: z.string().nullable(),
	}).optional(),
	hostingSubscription: z.object({
		id: z.string(),
		pleskName: z.string().nullable(),
		status: z.string(),
		primaryDomain: z.string().nullable(),
	}).optional(),
});

const orderOutputSchema = z.object({
	id: z.string(),
	orderNumber: z.string(),
	teamId: z.string().nullable(),
	createdBy: z.string().nullable(),
	type: orderTypeSchema,
	status: orderStatusSchema,
	description: z.string().nullable(),
	domainId: z.string().nullable(),
	hostingSubscriptionId: z.string().nullable(),
	subtotal: z.string().nullable(),
	discount: z.string().nullable(),
	isTaxable: z.boolean().nullable(),
	taxPercentage: z.number().nullable(),
	taxAmount: z.string().nullable(),
	total: z.string().nullable(),
	currency: z.string(),
	promoCode: z.string().nullable(),
	promoId: z.string().nullable(),
	invoiceNumber: z.string().nullable(),
	processedBy: z.string().nullable(),
	processedAt: z.date().nullable(),
	completedAt: z.date().nullable(),
	notes: z.string().nullable(),
	metadata: z.any().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
	// Relations (Prisma returns null when relation is absent)
	team: z.object({
		id: z.string(),
		name: z.string(),
		slug: z.string(),
	}).optional().nullable(),
	hostingSubscription: z.object({
		id: z.string(),
		pleskName: z.string().nullable(),
		status: z.string(),
		primaryDomain: z.string().nullable(),
	}).optional().nullable(),
	orderItems: z.array(orderItemOutputSchema).optional(), // Multiple order items
});

const getAllOrdersOutputSchema = z.object({
	orders: z.array(orderOutputSchema),
	total: z.number(),
});

// Get order by ID
const getOrderByIdInputSchema = z.object({
	id: z.string(),
});

const getOrderByIdOutputSchema = orderOutputSchema;

// Order Item Input Schema - for multiple items per order
const orderItemInputSchema = z.object({
	niscServicePlanId: z.string().min(1, "Service plan is required"),
	billingCycle: billingCycleSchema,
	// Optional fields for service-specific data
	domainName: z.string().optional(), // Required for HOSTING plans
	description: z.string().optional(),
	adminDescription: z.string().optional(),
	notes: z.string().optional(),
});

// Create service order input/output - supports multiple items
const createServiceOrderInputSchema = z.object({
	// Team selection
	teamId: z.string().min(1, "Team is required"),
	
	// Order items - array of service plans
	items: z.array(orderItemInputSchema).min(1, "At least one order item is required"),
	
	// Tax information
	isTaxable: z.boolean().optional().nullable(),
	taxPercentage: z.number().min(0).max(100).optional().nullable(),
	
	// Invoice generation
	createInvoice: z.boolean().optional().default(false), // Whether to auto-create invoice
	
	// Optional fields
	description: z.string().optional(),
	notes: z.string().optional(),
	promoCode: z.string().optional(),
}).refine(
	() => {
		// Validate that HOSTING plans have domainName
		// We'll validate this after fetching the plan details
		return true;
	},
	{
		message: "Domain name is required for HOSTING plans",
	}
);

// Legacy schema for backward compatibility (single hosting plan)
const createHostingOrderInputSchema = z.object({
	// Plan selection
	hostingPlanId: z.string().min(1, "Hosting plan is required"),
	
	// Team selection
	teamId: z.string().min(1, "Team is required"),
	
	// Domain selection (for provisioning, not persisted)
	domainName: z.string().min(1, "Domain name is required for provisioning"),
	
	// Billing cycle (must be >= plan's billing cycle)
	billingCycle: billingCycleSchema,
	
	// Optional fields
	description: z.string().optional(),
	adminDescription: z.string().optional(),
	notes: z.string().optional(),
});

const createHostingOrderOutputSchema = z.object({
	success: z.boolean(),
	order: orderOutputSchema,
	hostingSubscription: z.object({
		id: z.string(),
		pleskServiceId: z.string().nullable(),
		pleskName: z.string().nullable(),
		pleskFtpLogin: z.string().nullable(),
		pleskFtpPassword: z.string().nullable(),
	}).optional(),
	message: z.string(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get user role - optimized to use session role when available
 * Falls back to database query if role not in session
 */
async function getUserRole(userId: string, sessionUser?: { role?: string }): Promise<string> {
	// Optimize: Use role from session if available (set by auth hooks)
	// This avoids unnecessary database queries
	if (sessionUser?.role) {
		return sessionUser.role;
	}

	// Fallback: Query database if role not in session
	const [dbUser] = await db
		.select({ role: user.role })
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	if (!dbUser) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "User not found",
		});
	}
	return dbUser.role;
}

// Calculate billing cycle multiplier for price calculation
// If plan is MONTHLY (1) and order is YEARLY (12), multiplier is 12
// If plan is YEARLY (12) and order is BIENNIALLY (24), multiplier is 2
// Price from DB matches the plan's cycle, so we calculate based on ratio
function getBillingCycleMultiplier(planCycle: string, orderCycle: string): number {
	const cycleMonths = {
		MONTHLY: 1,
		YEARLY: 12,
		BIENNIALLY: 24,
		CUSTOM: 1, // Default to 1 for custom
	};

	const planMonths = cycleMonths[planCycle as keyof typeof cycleMonths] || 1;
	const orderMonths = cycleMonths[orderCycle as keyof typeof cycleMonths] || 1;

	// Calculate multiplier: orderMonths / planMonths
	// Example: plan is MONTHLY (1), order is YEARLY (12) -> 12/1 = 12
	// Example: plan is YEARLY (12), order is BIENNIALLY (24) -> 24/12 = 2
	return orderMonths / planMonths;
}

// Check if billing cycle is valid (no downgrade)
function isValidBillingCycle(planCycle: string, orderCycle: string): boolean {
	const cycleMonths = {
		MONTHLY: 1,
		YEARLY: 12,
		BIENNIALLY: 24,
		CUSTOM: 1, // Custom needs special handling
	};

	const planMonths = cycleMonths[planCycle as keyof typeof cycleMonths] || 1;
	const orderMonths = cycleMonths[orderCycle as keyof typeof cycleMonths] || 1;

	// Can't go below plan's cycle (order must be >= plan)
	return orderMonths >= planMonths;
}

// Generate unique order number
function generateOrderNumber(): string {
	const year = new Date().getFullYear();
	const timestamp = Date.now().toString().slice(-6);
	const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
	return `ORD-${year}-${timestamp}-${random}`;
}

// ensurePleskIntegration and provisionToPlesk are imported from ../lib/plesk-integration.
// When calling from tRPC, wrap in try/catch and throw TRPCError with appropriate code.

// ============================================================================
// tRPC ROUTER
// ============================================================================

export const ordersRouter = router({
	// Get all orders
	getAll: protectedProcedure
		.input(getAllOrdersInputSchema)
		.output(getAllOrdersOutputSchema)
		.query(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to view orders",
				});
			}

			// Any agency role can read all orders
			// Optimize: Pass session user to avoid database query if role is in session
			const userRole = await getUserRole(session.user.id, session.user as { role?: string });
			if (!isAgencyRole(userRole)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to view orders",
				});
			}

			const conditions = [];
			if (input.teamId) {
				conditions.push(eq(orderTable.teamId, input.teamId));
			}
			if (input.status) {
				conditions.push(eq(orderTable.status, input.status));
			}
			if (input.type) {
				conditions.push(eq(orderTable.type, input.type));
			}
			const whereClause = conditions.length ? and(...conditions) : undefined;

			const [orders, countRows] = await Promise.all([
				db.query.order.findMany({
					where: whereClause,
					orderBy: [desc(orderTable.createdAt)],
					limit: input.limit,
					offset: input.offset,
					with: {
						team: {
							columns: { id: true, name: true, slug: true },
						},
						hostingSubscription: {
							columns: {
								id: true,
								pleskName: true,
								status: true,
								primaryDomain: true,
							},
						},
						orderItems: {
							with: {
								niscServicePlan: {
									columns: {
										id: true,
										name: true,
										planType: true,
										hostingSubType: true,
									},
								},
								hostingSubscription: {
									columns: {
										id: true,
										pleskName: true,
										status: true,
										primaryDomain: true,
									},
								},
							},
						},
					},
				}),
				whereClause
					? db.select({ c: count() }).from(orderTable).where(whereClause)
					: db.select({ c: count() }).from(orderTable),
			]);

			const total = Number(countRows[0]?.c ?? 0);

			return {
				orders: orders.map((order) => {
					// Recalculate total from order items if they exist (more accurate)
					let calculatedTotal = order.total;
					let calculatedSubtotal = order.subtotal;
					
					if (order.orderItems && order.orderItems.length > 0) {
						const itemsTotal = order.orderItems.reduce((sum, item) => {
							return sum + parseFloat(item.itemSubtotal || "0");
						}, 0);
						calculatedSubtotal = itemsTotal.toString();
						
						// Recalculate tax if applicable
						if (order.isTaxable && order.taxPercentage !== null && order.taxPercentage !== undefined) {
							const calculatedTax = itemsTotal * (order.taxPercentage / 100);
							calculatedTotal = (itemsTotal + calculatedTax).toString();
						} else {
							calculatedTotal = itemsTotal.toString(); // No discount for now
						}
					}

					return {
						id: order.id,
						orderNumber: order.orderNumber,
						teamId: order.teamId,
						createdBy: order.createdBy,
						type: order.type as z.infer<typeof orderTypeSchema>,
						status: order.status as z.infer<typeof orderStatusSchema>,
						description: order.description,
						domainId: order.domainId,
						hostingSubscriptionId: order.hostingSubscriptionId,
						subtotal: calculatedSubtotal,
						discount: order.discount,
						isTaxable: order.isTaxable,
						taxPercentage: order.taxPercentage,
						taxAmount: order.taxAmount,
						total: calculatedTotal,
						currency: order.currency,
					promoCode: order.promoCode,
					promoId: order.promoId,
					invoiceNumber: order.invoiceNumber,
					processedBy: order.processedBy,
					processedAt: order.processedAt,
					completedAt: order.completedAt,
					notes: order.notes,
					metadata: order.metadata,
					createdAt: order.createdAt,
					updatedAt: order.updatedAt,
					team: order.team || undefined,
					hostingSubscription: order.hostingSubscription
						? {
								id: order.hostingSubscription.id,
								pleskName: order.hostingSubscription.pleskName,
								status: order.hostingSubscription.status.toString(), // Convert enum to string
								primaryDomain: order.hostingSubscription.primaryDomain,
							}
						: undefined,
					orderItems: order.orderItems?.map((item) => ({
						id: item.id,
						orderId: item.orderId,
						niscServicePlanId: item.niscServicePlanId,
						billingCycle: item.billingCycle as z.infer<typeof billingCycleSchema>,
						itemPrice: item.itemPrice,
						itemSubtotal: item.itemSubtotal,
						itemCurrency: item.itemCurrency,
						domainName: item.domainName,
						description: item.description,
						adminDescription: item.adminDescription,
						notes: item.notes,
						status: item.status as any,
						isProvisioned: item.isProvisioned,
						provisioningError: item.provisioningError,
						hostingSubscriptionId: item.hostingSubscriptionId,
						metadata: item.metadata,
						createdAt: item.createdAt,
						updatedAt: item.updatedAt,
						niscServicePlan: item.niscServicePlan ? {
							id: item.niscServicePlan.id,
							name: item.niscServicePlan.name,
							planType: item.niscServicePlan.planType,
							hostingSubType: item.niscServicePlan.hostingSubType,
						} : undefined,
						hostingSubscription: item.hostingSubscription ? {
							id: item.hostingSubscription.id,
							pleskName: item.hostingSubscription.pleskName,
							status: item.hostingSubscription.status.toString(),
							primaryDomain: item.hostingSubscription.primaryDomain,
						} : undefined,
					})) || [],
					};
				}),
				total,
			};
		}),

	// Get order summary across all teams (agency dashboard – agency users only)
	getSummary: protectedProcedure
		.output(
			z.object({
				total: z.number(),
				completed: z.number(),
				failed: z.number(),
				pending: z.number(),
			})
		)
		.query(async ({ ctx }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in",
				});
			}

			const userRole = await getUserRole(session.user.id, session.user as { role?: string });
			if (!isAgencyRole(userRole)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only agency users can view the global order summary",
				});
			}

			const [totalRows, completedRows, failedRows, pendingRows] = await Promise.all([
				db.select({ c: count() }).from(orderTable),
				db.select({ c: count() }).from(orderTable).where(eq(orderTable.status, "COMPLETED")),
				db.select({ c: count() }).from(orderTable).where(eq(orderTable.status, "FAILED")),
				db
					.select({ c: count() })
					.from(orderTable)
					.where(inArray(orderTable.status, ["PENDING", "PROCESSING"])),
			]);

			return {
				total: Number(totalRows[0]?.c ?? 0),
				completed: Number(completedRows[0]?.c ?? 0),
				failed: Number(failedRows[0]?.c ?? 0),
				pending: Number(pendingRows[0]?.c ?? 0),
			};
		}),

	// Get order summary by team (for customer dashboard – allows CUSTOMER when they belong to the team)
	getSummaryByTeam: protectedProcedure
		.input(z.object({ teamId: z.string().min(1, "Team ID is required") }))
		.output(
			z.object({
				total: z.number(),
				completed: z.number(),
				failed: z.number(),
				pending: z.number(),
			})
		)
		.query(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in",
				});
			}

			const userRole = await getUserRole(session.user.id, session.user as { role?: string });
			const isAgency = isAgencyRole(userRole);

			if (!isAgency) {
				const [membership] = await db
					.select({ id: teamMember.id })
					.from(teamMember)
					.where(
						and(
							eq(teamMember.teamId, input.teamId),
							eq(teamMember.userId, session.user.id),
						),
					)
					.limit(1);
				const [teamRow] = await db
					.select({ createdById: team.createdById })
					.from(team)
					.where(eq(team.id, input.teamId))
					.limit(1);
				const isMember = Boolean(membership) || teamRow?.createdById === session.user.id;
				if (!isMember) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have access to this team's orders",
					});
				}
			}

			const teamCond = eq(orderTable.teamId, input.teamId);
			const [totalRows, completedRows, failedRows, pendingRows] = await Promise.all([
				db.select({ c: count() }).from(orderTable).where(teamCond),
				db
					.select({ c: count() })
					.from(orderTable)
					.where(and(teamCond, eq(orderTable.status, "COMPLETED"))),
				db
					.select({ c: count() })
					.from(orderTable)
					.where(and(teamCond, eq(orderTable.status, "FAILED"))),
				db
					.select({ c: count() })
					.from(orderTable)
					.where(
						and(teamCond, inArray(orderTable.status, ["PENDING", "PROCESSING"])),
					),
			]);

			return {
				total: Number(totalRows[0]?.c ?? 0),
				completed: Number(completedRows[0]?.c ?? 0),
				failed: Number(failedRows[0]?.c ?? 0),
				pending: Number(pendingRows[0]?.c ?? 0),
			};
		}),

	// Get order by ID
	getById: protectedProcedure
		.input(getOrderByIdInputSchema)
		.output(getOrderByIdOutputSchema)
		.query(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to view orders",
				});
			}

			const userRole = await getUserRole(session.user.id);
			if (!isAgencyRole(userRole)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to view orders",
				});
			}

			const order = await db.query.order.findFirst({
				where: eq(orderTable.id, input.id),
				with: {
					team: {
						columns: { id: true, name: true, slug: true },
					},
					hostingSubscription: {
						columns: {
							id: true,
							pleskName: true,
							status: true,
							primaryDomain: true,
						},
					},
					orderItems: {
						with: {
							niscServicePlan: {
								columns: {
									id: true,
									name: true,
									planType: true,
									hostingSubType: true,
								},
							},
							hostingSubscription: {
								columns: {
									id: true,
									pleskName: true,
									status: true,
									primaryDomain: true,
								},
							},
						},
					},
				},
			});

			if (!order) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Order not found",
				});
			}

			// Recalculate total from order items if they exist (more accurate)
			let calculatedTotal = order.total;
			let calculatedSubtotal = order.subtotal;
			
			if (order.orderItems && order.orderItems.length > 0) {
				const itemsTotal = order.orderItems.reduce((sum, item) => {
					return sum + parseFloat(item.itemSubtotal || "0");
				}, 0);
				calculatedSubtotal = itemsTotal.toString();
				
				// Recalculate tax if applicable
				if (order.isTaxable && order.taxPercentage !== null && order.taxPercentage !== undefined) {
					const calculatedTax = itemsTotal * (order.taxPercentage / 100);
					calculatedTotal = (itemsTotal + calculatedTax).toString();
				} else {
					calculatedTotal = itemsTotal.toString(); // No discount for now
				}
			}

			return {
				id: order.id,
				orderNumber: order.orderNumber,
				teamId: order.teamId,
				createdBy: order.createdBy,
				type: order.type as z.infer<typeof orderTypeSchema>,
				status: order.status as z.infer<typeof orderStatusSchema>,
				description: order.description,
				domainId: order.domainId ?? null,
				hostingSubscriptionId: order.hostingSubscriptionId,
				subtotal: calculatedSubtotal,
				discount: order.discount,
				isTaxable: order.isTaxable,
				taxPercentage: order.taxPercentage,
				taxAmount: order.taxAmount,
				total: calculatedTotal,
				currency: order.currency,
				promoCode: order.promoCode,
				promoId: order.promoId,
				invoiceNumber: order.invoiceNumber,
				processedBy: order.processedBy,
				processedAt: order.processedAt,
				completedAt: order.completedAt,
				notes: order.notes,
				metadata: order.metadata,
				createdAt: order.createdAt,
				updatedAt: order.updatedAt,
				team: order.team || undefined,
				hostingSubscription: order.hostingSubscription
					? {
							id: order.hostingSubscription.id,
							pleskName: order.hostingSubscription.pleskName,
							status: order.hostingSubscription.status.toString(), // Convert enum to string
							primaryDomain: order.hostingSubscription.primaryDomain,
						}
					: undefined,
				orderItems: order.orderItems?.map((item) => ({
					id: item.id,
					orderId: item.orderId,
					niscServicePlanId: item.niscServicePlanId,
					billingCycle: item.billingCycle as z.infer<typeof billingCycleSchema>,
					itemPrice: item.itemPrice,
					itemSubtotal: item.itemSubtotal,
					itemCurrency: item.itemCurrency,
					domainName: item.domainName,
					description: item.description,
					adminDescription: item.adminDescription,
					notes: item.notes,
					status: item.status as any,
					isProvisioned: item.isProvisioned,
					provisioningError: item.provisioningError,
					hostingSubscriptionId: item.hostingSubscriptionId,
					metadata: item.metadata,
					createdAt: item.createdAt,
					updatedAt: item.updatedAt,
					niscServicePlan: item.niscServicePlan ? {
						id: item.niscServicePlan.id,
						name: item.niscServicePlan.name,
						planType: item.niscServicePlan.planType,
						hostingSubType: item.niscServicePlan.hostingSubType,
					} : undefined,
					hostingSubscription: item.hostingSubscription ? {
						id: item.hostingSubscription.id,
						pleskName: item.hostingSubscription.pleskName,
						status: item.hostingSubscription.status.toString(),
						primaryDomain: item.hostingSubscription.primaryDomain,
					} : undefined,
				})) || [],
			};
		}),

	// Get domains for a team (for order form)
	getTeamDomains: protectedProcedure
		.input(z.object({
			teamId: z.string().min(1, "Team ID is required"),
		}))
		.output(z.array(z.object({
			id: z.string(),
			domainName: z.string(),
		})))
		.query(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in",
				});
			}

			const userRole = await getUserRole(session.user.id);
			if (!isAgencyRole(userRole)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission",
				});
			}

			const domains = await db
				.select({
					id: domain.id,
					domainName: domain.domainName,
				})
				.from(domain)
				.where(eq(domain.teamId, input.teamId))
				.orderBy(asc(domain.domainName));

			return domains.map((d) => ({
				id: d.id,
				domainName: d.domainName,
			}));
		}),

	// Create hosting order
	createHostingOrder: protectedProcedure
		.input(createHostingOrderInputSchema)
		.output(createHostingOrderOutputSchema)
		.mutation(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to create orders",
				});
			}

			const userRole = await getUserRole(session.user.id);
			if (!isAgencyRole(userRole)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to create orders",
				});
			}

			const now = new Date();
			const orderNumber = generateOrderNumber();

			// 1. Validate hosting plan
			const [hostingPlanRow] = await db
				.select()
				.from(hostingPlan)
				.where(eq(hostingPlan.id, input.hostingPlanId))
				.limit(1);

			if (!hostingPlanRow) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Hosting plan not found",
				});
			}

			if (!hostingPlanRow.isActive) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Hosting plan is not active",
				});
			}

			if (!hostingPlanRow.pleskServicePlanId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Hosting plan does not have a Plesk service plan ID configured",
				});
			}

			// 2. Validate billing cycle
			if (!isValidBillingCycle(hostingPlanRow.billingCycle, input.billingCycle)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Billing cycle cannot be shorter than the plan's cycle (${hostingPlanRow.billingCycle}). You can only upgrade to longer cycles (YEARLY, BIENNIALLY).`,
				});
			}

			// 3. Validate team
			const [teamRow] = await db
				.select()
				.from(team)
				.where(eq(team.id, input.teamId))
				.limit(1);

			if (!teamRow) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Team not found",
				});
			}

			// 4. Get team owner (createdById)
			const [teamOwner] = await db
				.select({ id: user.id })
				.from(user)
				.where(eq(user.id, teamRow.createdById))
				.limit(1);

			if (!teamOwner) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Team owner not found",
				});
			}

			// 5. Calculate pricing
			const planMultiplier = getBillingCycleMultiplier(hostingPlanRow.billingCycle, input.billingCycle);
			const planPrice = parseFloat(hostingPlanRow.niscPrice || "0");
			const subtotal = (planPrice * planMultiplier).toString();
			const total = subtotal; // No discount for now

			// 6. Provision to Plesk FIRST - before creating any database records
			// This ensures we only create orders/subscriptions if Plesk provisioning succeeds
			let pleskServiceId: string;
			let pleskFtpLogin: string;
			let pleskFtpPassword: string;
			let pleskOwnerId: string;
			let pleskStatus: number;
			let pleskGuid: string | null;

			// Batch: Log order creation start and Plesk integration check in a transaction
			// This reduces connection usage from 2 sequential queries to 1 transaction
			await db.transaction(async (tx) => {
				// Log: Starting order creation process
				await tx.insert(userActivityLog).values({
					id: crypto.randomUUID(),
					userId: session.user!.id,
					action: "ORDER_CREATION_STARTED",
					description: `Starting order creation process for ${orderNumber}`,
					metadata: {
						orderNumber: orderNumber,
						teamId: teamRow.id,
						teamName: teamRow.name,
						hostingPlanId: hostingPlanRow.id,
						hostingPlanName: hostingPlanRow.name,
						domainName: input.domainName,
						billingCycle: input.billingCycle,
					},
					createdAt: now,
				});

				// Log: Checking/creating Plesk integration
				await tx.insert(userActivityLog).values({
					id: crypto.randomUUID(),
					userId: session.user!.id,
					action: "PLESK_INTEGRATION_CHECK",
					description: `Checking Plesk integration for team owner (team: ${teamRow.name})`,
					metadata: {
						orderNumber: orderNumber,
						teamId: teamRow.id,
						teamOwnerId: teamRow.createdById,
					},
					createdAt: now,
				});
			});

			try {

				// Ensure Plesk integration exists (create if needed)
				if (!session.user?.id) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "You must be logged in",
					});
				}
				try {
					pleskOwnerId = await ensurePleskIntegration(teamRow.createdById, session.user.id);
				} catch (err) {
					const msg = err instanceof Error ? err.message : String(err);
					throw new TRPCError({
						code: msg.includes("not found") ? "NOT_FOUND" : "BAD_REQUEST",
						message: msg,
					});
				}

				// Batch: Log Plesk integration ready and provisioning started in a transaction
				// This reduces connection usage from 2 sequential queries to 1 transaction
				await db.transaction(async (tx) => {
					// Log: Plesk integration ready
					await tx.insert(userActivityLog).values({
						id: crypto.randomUUID(),
						userId: session.user!.id,
						action: "PLESK_INTEGRATION_READY",
						description: `Plesk integration ready for provisioning (owner ID: ${pleskOwnerId})`,
						metadata: {
							orderNumber: orderNumber,
							teamId: teamRow.id,
							pleskOwnerId: pleskOwnerId,
						},
						createdAt: now,
					});

					// Log: Starting Plesk provisioning
					await tx.insert(userActivityLog).values({
						id: crypto.randomUUID(),
						userId: session.user!.id,
						action: "PLESK_PROVISIONING_STARTED",
						description: `Starting Plesk provisioning for domain ${input.domainName}`,
						metadata: {
							orderNumber: orderNumber,
							teamId: teamRow.id,
							domainName: input.domainName,
							pleskServicePlanId: hostingPlanRow.pleskServicePlanId,
							pleskOwnerId: pleskOwnerId,
						},
						createdAt: now,
					});
				});

				// Provision to Plesk - MUST succeed before creating any database records
				let pleskResult: Awaited<ReturnType<typeof provisionToPlesk>>;
				try {
					pleskResult = await provisionToPlesk({
						domainName: input.domainName,
						pleskOwnerId,
						pleskServicePlanId: hostingPlanRow.pleskServicePlanId!,
						ipAddress: hostingPlanRow.pleskIpAddress || undefined,
						description: input.description || undefined,
						adminDescription: input.adminDescription || undefined,
					});
				} catch (err) {
					const msg = err instanceof Error ? err.message : String(err);
					throw new TRPCError({
						code: msg.includes("unreachable") ? "SERVICE_UNAVAILABLE" : "BAD_REQUEST",
						message: msg,
					});
				}

				// Save all auto-generated data from Plesk
				pleskServiceId = pleskResult.pleskServiceId;
				pleskFtpLogin = pleskResult.pleskFtpLogin;
				pleskFtpPassword = pleskResult.pleskFtpPassword;
				pleskStatus = pleskResult.pleskStatus;
				pleskGuid = pleskResult.pleskGuid;

				// Log: Plesk provisioning succeeded
				await db.insert(userActivityLog).values({
					id: crypto.randomUUID(),
					userId: session.user.id,
					action: "PLESK_PROVISIONING_SUCCESS",
					description: `Plesk provisioning completed successfully for domain ${input.domainName}`,
					metadata: {
						orderNumber: orderNumber,
						teamId: teamRow.id,
						domainName: input.domainName,
						pleskServiceId: pleskServiceId,
						pleskGuid: pleskGuid,
						pleskStatus: pleskStatus,
					},
					createdAt: now,
				});
			} catch (error) {
				// Log provisioning failure - NO order created, just log the attempt
				const errorMessage = error instanceof Error ? error.message : "Unknown error";
				
				await db.insert(userActivityLog).values({
					id: crypto.randomUUID(),
					userId: session.user.id,
					action: "PLESK_PROVISIONING_FAILED",
					description: `Failed to provision hosting to Plesk for domain ${input.domainName}`,
					metadata: {
						orderNumber: orderNumber,
						teamId: teamRow.id,
						hostingPlanId: hostingPlanRow.id,
						domainName: input.domainName,
						error: errorMessage,
					},
					createdAt: now,
				});

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Plesk provisioning failed: ${errorMessage}`,
				});
			}

			// 7. ONLY AFTER successful Plesk provisioning: Create Order and HostingSubscription together
			try {
				const result = await db.transaction(async (tx) => {
					const subscriptionId = crypto.randomUUID();
					const orderId = crypto.randomUUID();

					// Create HostingSubscription with all auto-generated data from Plesk
					// pleskFilterId must be unique, so we use pleskServiceId (which is unique from Plesk)
					await tx.insert(hostingSubscription).values({
						id: subscriptionId,
						hostingPlanId: hostingPlanRow.id,
						teamId: input.teamId,
						provisionedBy: session.user!.id,
						pleskFilterId: pleskServiceId, // Use pleskServiceId as unique filter ID
						pleskOwnerId,
						pleskServiceId: pleskServiceId,
						pleskName: input.domainName,
						pleskStatus,
						pleskDescription: input.description || null,
						pleskAdminDescription: input.adminDescription || null,
						primaryDomain: input.domainName,
						hostingType: hostingPlanRow.hostingType,
						operation: "PROVISION",
						provisioningMethod: "AUTOMATIC",
						status: "ACTIVE",
						billingCycle: input.billingCycle,
						niscPrice: total,
						niscCurrency: hostingPlanRow.niscCurrency || "KES",
						pleskFtpLogin: pleskFtpLogin,
						pleskFtpPassword: pleskFtpPassword,
						notes: input.notes || null,
						autoRenew: true,
						createdAt: now,
						updatedAt: now,
					});

					// Create Order (COMPLETED status) - only after successful provisioning
					await tx.insert(orderTable).values({
						id: orderId,
						orderNumber,
						teamId: input.teamId,
						createdBy: session.user!.id,
						type: "HOSTING_SUBSCRIPTION",
						status: "COMPLETED", // Success - provisioning already completed
						description: input.description || null,
						hostingSubscriptionId: subscriptionId,
						subtotal,
						total,
						currency: hostingPlanRow.niscCurrency || "KES",
						notes: input.notes || null,
						processedBy: session.user!.id,
						processedAt: now,
						completedAt: now,
						metadata: {
							hostingPlanId: hostingPlanRow.id,
							hostingPlanName: hostingPlanRow.name,
							domainName: input.domainName,
							billingCycle: input.billingCycle,
							planBillingCycle: hostingPlanRow.billingCycle,
							pleskServiceId: pleskServiceId,
							pleskGuid: pleskGuid,
						},
						createdAt: now,
						updatedAt: now,
					});

					const order = await tx.query.order.findFirst({
						where: eq(orderTable.id, orderId),
						with: {
							team: {
								columns: { id: true, name: true, slug: true },
							},
							hostingSubscription: {
								columns: {
									id: true,
									pleskName: true,
									status: true,
									primaryDomain: true,
								},
							},
						},
					});

					const subscription = await tx.query.hostingSubscription.findFirst({
						where: eq(hostingSubscription.id, subscriptionId),
					});

					if (!order || !subscription) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Failed to load order after creation",
						});
					}

					// Log order creation (after successful provisioning) - UserActivityLog
					await tx.insert(userActivityLog).values({
						id: crypto.randomUUID(),
						userId: session.user!.id,
						action: "ORDER_CREATED",
						description: `Created hosting order ${orderNumber} for team ${teamRow.name}`,
						metadata: {
							orderId: order.id,
							orderNumber: order.orderNumber,
							teamId: teamRow.id,
							hostingPlanId: hostingPlanRow.id,
							status: "COMPLETED",
						},
						createdAt: now,
					});

					// Log order creation - OrderActivityLog (order-specific audit trail)
					await tx.insert(orderActivityLog).values({
						id: crypto.randomUUID(),
						orderId: order.id,
						userId: session.user!.id,
						action: "CREATE",
						description: `Order ${orderNumber} created and provisioned successfully`,
						metadata: {
							orderNumber: order.orderNumber,
							teamId: teamRow.id,
							hostingPlanId: hostingPlanRow.id,
							domainName: input.domainName,
							billingCycle: input.billingCycle,
							status: "COMPLETED",
						},
						createdAt: now,
					});

					// Log hosting subscription creation - UserActivityLog
					await tx.insert(userActivityLog).values({
						id: crypto.randomUUID(),
						userId: session.user!.id,
						action: "HOSTING_SUBSCRIPTION_CREATED",
						description: `Created hosting subscription for ${input.domainName}`,
						metadata: {
							subscriptionId: subscription.id,
							orderId: order.id,
							orderNumber: order.orderNumber,
							teamId: teamRow.id,
							domainName: input.domainName,
							pleskServiceId: pleskServiceId,
						},
						createdAt: now,
					});

					// Log hosting subscription creation - HostingSubscriptionActivityLog (subscription-specific audit trail)
					await tx.insert(hostingSubscriptionActivityLog).values({
						id: crypto.randomUUID(),
						hostingSubscriptionId: subscription.id,
						userId: session.user!.id,
						action: "PROVISION",
						description: `Hosting subscription provisioned for ${input.domainName} via order ${orderNumber}`,
						metadata: {
							orderId: order.id,
							orderNumber: order.orderNumber,
							teamId: teamRow.id,
							domainName: input.domainName,
							pleskServiceId: pleskServiceId,
							pleskGuid: pleskGuid,
							pleskStatus: pleskStatus,
							hostingPlanId: hostingPlanRow.id,
							billingCycle: input.billingCycle,
							provisioningMethod: "AUTOMATIC",
						},
						createdAt: now,
					});

					// Log order completion - UserActivityLog
					await tx.insert(userActivityLog).values({
						id: crypto.randomUUID(),
						userId: session.user!.id,
						action: "ORDER_COMPLETED",
						description: `Order ${orderNumber} completed successfully`,
						metadata: {
							orderId: order.id,
							orderNumber: order.orderNumber,
							teamId: teamRow.id,
							hostingSubscriptionId: subscription.id,
						},
						createdAt: now,
					});

					// Log order completion - OrderActivityLog
					await tx.insert(orderActivityLog).values({
						id: crypto.randomUUID(),
						orderId: order.id,
						userId: session.user!.id,
						action: "COMPLETE",
						description: `Order ${orderNumber} marked as completed`,
						metadata: {
							orderNumber: order.orderNumber,
							hostingSubscriptionId: subscription.id,
							processedBy: session.user!.id,
							processedAt: now,
							completedAt: now,
						},
						createdAt: now,
					});

					return {
						order: {
							...order,
							domainId: order.domainId ?? null,
							hostingSubscription: {
								id: subscription.id,
								pleskName: subscription.pleskName,
								status: subscription.status.toString(),
								primaryDomain: subscription.primaryDomain,
							},
						},
						subscription,
					};
				});

				return {
					success: true,
					order: {
						...result.order,
						domainId: result.order.domainId ?? null,
						type: result.order.type as z.infer<typeof orderTypeSchema>,
						status: result.order.status as z.infer<typeof orderStatusSchema>,
					},
					hostingSubscription: {
						id: result.subscription.id,
						pleskServiceId: result.subscription.pleskServiceId,
						pleskName: result.subscription.pleskName,
						pleskFtpLogin: result.subscription.pleskFtpLogin,
						pleskFtpPassword: result.subscription.pleskFtpPassword,
					},
					message: "Order created and provisioned successfully",
				};
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("Failed to create hosting order:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Failed to create hosting order: ${error instanceof Error ? error.message : "Unknown error"}`,
				});
			}
		}),

	// Check if team has billing settings (for invoice generation)
	checkTeamBillingSettings: protectedProcedure
		.input(z.object({
			teamId: z.string().min(1, "Team ID is required"),
		}))
		.output(z.object({
			hasBillingSettings: z.boolean(),
			billingSettings: z.object({
				id: z.string(),
				legalName: z.string(),
				billingEmail: z.string(),
				billingPhone: z.string().nullable(),
				addressLine1: z.string(),
				addressLine2: z.string().nullable(),
				city: z.string(),
				state: z.string().nullable(),
				country: z.string(),
				postalCode: z.string().nullable(),
				taxId: z.string().nullable(),
			}).nullable(),
		}))
		.query(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in",
				});
			}

			const [billingSettings] = await db
				.select()
				.from(teamBillingSettings)
				.where(eq(teamBillingSettings.teamId, input.teamId))
				.limit(1);

			return {
				hasBillingSettings: Boolean(billingSettings),
				billingSettings: billingSettings ? {
					id: billingSettings.id,
					legalName: billingSettings.legalName,
					billingEmail: billingSettings.billingEmail,
					billingPhone: billingSettings.billingPhone,
					addressLine1: billingSettings.addressLine1,
					addressLine2: billingSettings.addressLine2,
					city: billingSettings.city,
					state: billingSettings.state,
					country: billingSettings.country,
					postalCode: billingSettings.postalCode,
					taxId: billingSettings.taxId,
				} : null,
			};
		}),

	// Create service order - supports multiple items and all plan types
	createServiceOrder: protectedProcedure
		.input(createServiceOrderInputSchema)
		.output(z.object({
			success: z.boolean(),
			order: orderOutputSchema,
			orderItems: z.array(z.object({
				id: z.string(),
				niscServicePlanId: z.string(),
				planName: z.string(),
				planType: z.string(),
				status: orderItemStatusSchema,
				isProvisioned: z.boolean(),
				provisioningError: z.string().nullable(),
				hostingSubscription: z.object({
					id: z.string(),
					pleskServiceId: z.string().nullable(),
					pleskName: z.string().nullable(),
					pleskFtpLogin: z.string().nullable(),
					pleskFtpPassword: z.string().nullable(),
				}).optional(),
			})),
			message: z.string(),
			requiresProvisioning: z.boolean(), // true if any items need manual provisioning
			nonProvisionedItems: z.array(z.object({
				planName: z.string(),
				planType: z.string(),
				orderItemId: z.string(),
			})).optional(), // Items that were not provisioned (non-hosting)
			orderItemStatuses: z.array(z.object({
				planName: z.string(),
				planType: z.string(),
				status: orderItemStatusSchema,
				provisioningError: z.string().nullable(),
				domainName: z.string().nullable(),
			})).optional(), // Detailed status for each order item
			invoiceCreated: z.boolean().optional(), // Whether invoice was auto-created
			invoiceNumber: z.string().optional(), // Invoice number if created
		}))
		.mutation(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to create orders",
				});
			}

			const userRole = await getUserRole(session.user.id);
			if (!isAgencyRole(userRole)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to create orders",
				});
			}

			const now = new Date();
			const orderNumber = generateOrderNumber();

			// 1. Validate team
			const [teamRow] = await db
				.select()
				.from(team)
				.where(eq(team.id, input.teamId))
				.limit(1);

			if (!teamRow) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Team not found",
				});
			}

			// 2. Validate all service plans and prepare order items
			const orderItemsData: Array<{
				plan: any;
				input: z.infer<typeof orderItemInputSchema>;
				itemPrice: number;
				itemSubtotal: number;
			}> = [];

			// Optimize: Fetch all service plans in parallel to avoid N+1 queries
			// This reduces connection usage from N sequential queries to 1 parallel query
			const planIds = input.items.map(item => item.niscServicePlanId);
			const plans = await db
				.select()
				.from(niscServicePlan)
				.where(inArray(niscServicePlan.id, planIds));

			// Create a map for quick lookup
			const plansMap = new Map<string, NiscServicePlanRow>(
				plans.map((plan): [string, NiscServicePlanRow] => [plan.id, plan]),
			);

			// Validate and process each item
			for (const itemInput of input.items) {
				// Fetch service plan from map
				const plan = plansMap.get(itemInput.niscServicePlanId);

				if (!plan) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: `Service plan not found: ${itemInput.niscServicePlanId}`,
					});
				}

				if (!plan.isActive) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Service plan "${plan.name}" is not active`,
					});
				}

				// Validate HOSTING plans have domainName
				if (plan.planType === "HOSTING") {
					if (!itemInput.domainName) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `Domain name is required for HOSTING plan "${plan.name}"`,
						});
					}

					if (!plan.pleskServicePlanId) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `HOSTING plan "${plan.name}" does not have a Plesk service plan ID configured`,
						});
					}
				}

				// Validate billing cycle
				if (!isValidBillingCycle(plan.billingCycle, itemInput.billingCycle)) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Billing cycle cannot be shorter than the plan's cycle (${plan.billingCycle}). You can only upgrade to longer cycles (YEARLY, BIENNIALLY).`,
					});
				}

				// Calculate pricing
				const planMultiplier = getBillingCycleMultiplier(plan.billingCycle, itemInput.billingCycle);
				const planPrice = parseFloat(plan.niscPrice || "0");
				const itemPrice = planPrice * planMultiplier;
				const itemSubtotal = itemPrice; // Quantity is always 1

				orderItemsData.push({
					plan,
					input: itemInput,
					itemPrice,
					itemSubtotal,
				});
			}

			// 3. Calculate order totals
			const subtotal = orderItemsData.reduce((sum, item) => sum + item.itemSubtotal, 0);
			
			// Calculate tax if applicable
			let taxAmount: number | null = null;
			let total: number;
			
			if (input.isTaxable && input.taxPercentage !== null && input.taxPercentage !== undefined) {
				taxAmount = subtotal * (input.taxPercentage / 100);
				total = subtotal + taxAmount; // No discount for now
			} else {
				total = subtotal; // No discount for now
			}
			
			const currency = orderItemsData[0]?.plan.niscCurrency || "KES";

			// 4. Determine order type
			// If all items are HOSTING, use HOSTING_SUBSCRIPTION, otherwise CUSTOM_SERVICE
			const allHosting = orderItemsData.every(item => item.plan.planType === "HOSTING");
			const orderType = allHosting ? "HOSTING_SUBSCRIPTION" : "CUSTOM_SERVICE";

			// 5. Get team owner for Plesk integration (if needed)
			let pleskOwnerId: string | null = null;
			const hasHostingItems = orderItemsData.some(item => item.plan.planType === "HOSTING");
			
			if (hasHostingItems) {
				const [teamOwner] = await db
					.select({ id: user.id })
					.from(user)
					.where(eq(user.id, teamRow.createdById))
					.limit(1);

				if (!teamOwner) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Team owner not found",
					});
				}

				// Ensure Plesk integration exists
				try {
					pleskOwnerId = await ensurePleskIntegration(teamRow.createdById, session.user.id);
				} catch (err) {
					const msg = err instanceof Error ? err.message : String(err);
					throw new TRPCError({
						code: msg.includes("not found") ? "NOT_FOUND" : "BAD_REQUEST",
						message: msg,
					});
				}
			}

			// 6. Create order and order items in transaction
			// NOTE: This transaction includes external API calls (provisionToPlesk) which holds
			// the database connection during the API call. This is a known issue that should be
			// refactored in the future to move external API calls outside the transaction.
			// For now, this is acceptable as order creation is not a high-frequency operation.
			try {
				const result = await db.transaction(async (tx) => {
					const orderId = crypto.randomUUID();
					await tx.insert(orderTable).values({
						id: orderId,
						orderNumber,
						teamId: input.teamId,
						createdBy: session.user!.id,
						type: orderType,
						status: hasHostingItems ? "PENDING" : "PENDING", // Will be updated after provisioning
						description: input.description || null,
						subtotal: subtotal.toString(),
						total: total.toString(),
						currency,
						notes: input.notes || null,
						metadata: {
							itemsCount: orderItemsData.length,
							hasHostingItems,
						},
						createdAt: now,
						updatedAt: now,
					});

					const order = await tx.query.order.findFirst({
						where: eq(orderTable.id, orderId),
						with: {
							team: {
								columns: { id: true, name: true, slug: true },
							},
						},
					});

					if (!order) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Failed to load order after creation",
						});
					}

					// Process each order item sequentially (first to last)
					const createdOrderItems: any[] = [];
					const nonProvisionedItems: Array<{ planName: string; planType: string; orderItemId: string }> = [];
					let requiresProvisioning = false;

					for (const itemData of orderItemsData) {
						const { plan, input: itemInput, itemPrice, itemSubtotal } = itemData;
						let hostingSubscriptionId: string | null = null;
						let itemStatus: "PENDING" | "PROVISIONING" | "PROVISIONED" | "FAILED" | "SKIPPED" = "PENDING";
						let provisioningError: string | null = null;
						let isProvisioned = false;

						// Provision HOSTING plans
						if (plan.planType === "HOSTING") {
							// Set status to PROVISIONING before attempting
							itemStatus = "PROVISIONING";
							
							// Log provisioning start
							await tx.insert(userActivityLog).values({
								id: crypto.randomUUID(),
								userId: session.user!.id,
								action: "ORDER_ITEM_PROVISIONING_STARTED",
								description: `Starting provisioning for ${plan.name} (${itemInput.domainName}) in order ${orderNumber}`,
								metadata: {
									orderId: order.id,
									orderNumber: order.orderNumber,
									planId: plan.id,
									planName: plan.name,
									domainName: itemInput.domainName,
								},
								createdAt: now,
							});

							try {
								// Provision to Plesk - MUST succeed before creating HostingSubscription
								const pleskResult = await (async () => {
									try {
										return await provisionToPlesk({
											domainName: itemInput.domainName!,
											pleskOwnerId: pleskOwnerId!,
											pleskServicePlanId: plan.pleskServicePlanId!,
											ipAddress: plan.pleskIpAddress || undefined,
											description: itemInput.description || undefined,
											adminDescription: itemInput.adminDescription || undefined,
										});
									} catch (err) {
										const msg = err instanceof Error ? err.message : String(err);
										throw new TRPCError({
											code: msg.includes("unreachable") ? "SERVICE_UNAVAILABLE" : "BAD_REQUEST",
											message: msg,
										});
									}
								})();

								// ONLY create HostingSubscription if provisioning succeeded
								// Find or create corresponding HostingPlan for backward compatibility
								let hostingPlanIdForItem: string;
								const [existingHostingPlan] = await tx
									.select()
									.from(hostingPlan)
									.where(
										and(
											eq(hostingPlan.hostingType, plan.hostingSubType!),
											eq(hostingPlan.pleskServicePlanId, plan.pleskServicePlanId),
										),
									)
									.limit(1);

								if (existingHostingPlan) {
									hostingPlanIdForItem = existingHostingPlan.id;
								} else {
									// Create a HostingPlan record for backward compatibility
									const newPlanId = crypto.randomUUID();
									await tx.insert(hostingPlan).values({
										id: newPlanId,
										name: plan.name,
										description: plan.description,
										hostingType: plan.hostingSubType!,
										pleskServicePlanId: plan.pleskServicePlanId,
										pleskFilterId: plan.pleskFilterId,
										pleskIpAddress: plan.pleskIpAddress,
										features: plan.features,
										highlights: plan.highlights,
										isPopular: plan.isPopular,
										isRecommended: plan.isRecommended,
										niscPrice: plan.niscPrice,
										niscCurrency: plan.niscCurrency,
										billingCycle: plan.billingCycle,
										setupFee: plan.setupFee,
										isActive: plan.isActive,
										isDefault: plan.isDefault,
										createdAt: now,
										updatedAt: now,
									});
									hostingPlanIdForItem = newPlanId;
								}

								// Create HostingSubscription ONLY after successful provisioning
								const subscriptionId = crypto.randomUUID();
								await tx.insert(hostingSubscription).values({
									id: subscriptionId,
									hostingPlanId: hostingPlanIdForItem,
									teamId: input.teamId,
									provisionedBy: session.user!.id,
									pleskFilterId: pleskResult.pleskServiceId,
									pleskOwnerId: pleskOwnerId!,
									pleskServiceId: pleskResult.pleskServiceId,
									pleskName: itemInput.domainName!,
									pleskStatus: pleskResult.pleskStatus,
									pleskDescription: itemInput.description || null,
									pleskAdminDescription: itemInput.adminDescription || null,
									primaryDomain: itemInput.domainName!,
									hostingType: plan.hostingSubType!,
									operation: "PROVISION",
									provisioningMethod: "AUTOMATIC",
									status: "ACTIVE",
									billingCycle: itemInput.billingCycle,
									niscPrice: itemSubtotal.toString(),
									niscCurrency: plan.niscCurrency || "KES",
									pleskFtpLogin: pleskResult.pleskFtpLogin,
									pleskFtpPassword: pleskResult.pleskFtpPassword,
									notes: itemInput.notes || null,
									autoRenew: true,
									createdAt: now,
									updatedAt: now,
								});

								hostingSubscriptionId = subscriptionId;
								itemStatus = "PROVISIONED";
								isProvisioned = true;

								// Log hosting subscription creation
								await tx.insert(hostingSubscriptionActivityLog).values({
									id: crypto.randomUUID(),
									hostingSubscriptionId: subscriptionId,
									userId: session.user!.id,
									action: "PROVISION",
									description: `Hosting subscription provisioned via order ${orderNumber}`,
									metadata: {
										orderId: order.id,
										orderNumber: order.orderNumber,
										domainName: itemInput.domainName,
										pleskServiceId: pleskResult.pleskServiceId,
									},
									createdAt: now,
								});
							} catch (error) {
								// Provisioning failed - log error per item and continue to next item
								const errorMessage = error instanceof Error ? error.message : "Unknown error";
								itemStatus = "FAILED";
								provisioningError = errorMessage;
								isProvisioned = false;
								requiresProvisioning = true;

								// Log failure - will be logged after orderItem creation so we have orderItemId
							}
						} else {
							// Non-hosting plans - mark as skipped
							itemStatus = "SKIPPED";
							requiresProvisioning = true;
						}

						// Create OrderItem with status
						const orderItemId = crypto.randomUUID();
						const [orderItemRow] = await tx
							.insert(orderItem)
							.values({
								id: orderItemId,
								orderId: order.id,
								niscServicePlanId: plan.id,
								billingCycle: itemInput.billingCycle,
								itemPrice: itemPrice.toString(),
								itemSubtotal: itemSubtotal.toString(),
								itemCurrency: plan.niscCurrency || "KES",
								domainName: itemInput.domainName || null,
								description: itemInput.description || null,
								adminDescription: itemInput.adminDescription || null,
								notes: itemInput.notes || null,
								status: itemStatus as any,
								isProvisioned,
								provisioningError,
								hostingSubscriptionId,
								metadata: {
									planType: plan.planType,
									planName: plan.name,
								},
								createdAt: now,
								updatedAt: now,
							})
							.returning();

						// Log order item creation
						await tx.insert(orderItemActivityLog).values({
							id: crypto.randomUUID(),
							orderItemId: orderItemRow!.id,
							userId: session.user!.id,
							action: "CREATE",
							description: `Order item created for ${plan.name} with status ${itemStatus}`,
							metadata: {
								planId: plan.id,
								planName: plan.name,
								planType: plan.planType,
								status: itemStatus,
								isProvisioned,
								provisioningError,
							},
							createdAt: now,
						});

						// Log successful provisioning if it succeeded
						if (itemStatus === "PROVISIONED" && hostingSubscriptionId) {
							await tx.insert(orderItemActivityLog).values({
								id: crypto.randomUUID(),
								orderItemId: orderItemRow!.id,
								userId: session.user!.id,
								action: "PROVISION_SUCCESS",
								description: `Successfully provisioned ${plan.name} to Plesk`,
								metadata: {
									orderId: order.id,
									orderNumber: order.orderNumber,
									planId: plan.id,
									planName: plan.name,
									domainName: itemInput.domainName,
									hostingSubscriptionId: hostingSubscriptionId,
								},
								createdAt: now,
							});
						}

						// Log provisioning failure if it failed (now we have orderItemId)
						if (itemStatus === "FAILED") {
							await tx.insert(orderItemActivityLog).values({
								id: crypto.randomUUID(),
								orderItemId: orderItemRow!.id,
								userId: session.user!.id,
								action: "PROVISION_FAILED",
								description: `Failed to provision ${plan.name} to Plesk: ${provisioningError}`,
								metadata: {
									orderId: order.id,
									orderNumber: order.orderNumber,
									planId: plan.id,
									planName: plan.name,
									domainName: itemInput.domainName,
									error: provisioningError,
								},
								createdAt: now,
							});

							// Also log in UserActivityLog for visibility
							await tx.insert(userActivityLog).values({
								id: crypto.randomUUID(),
								userId: session.user!.id,
								action: "ORDER_ITEM_PROVISIONING_FAILED",
								description: `Failed to provision ${plan.name} (${itemInput.domainName}) in order ${orderNumber}: ${provisioningError}`,
								metadata: {
									orderId: order.id,
									orderNumber: order.orderNumber,
									orderItemId: orderItemRow!.id,
									planId: plan.id,
									planName: plan.name,
									domainName: itemInput.domainName,
									error: provisioningError,
								},
								createdAt: now,
							});
						}

						// Track non-provisioned items (non-hosting or failed)
						if (itemStatus === "SKIPPED" || itemStatus === "FAILED") {
							nonProvisionedItems.push({
								planName: plan.name,
								planType: plan.planType,
								orderItemId: orderItemRow!.id,
							});
						}

						createdOrderItems.push({
							...orderItemRow!,
							planName: plan.name,
							planType: plan.planType,
							status: itemStatus,
							provisioningError,
							hostingSubscription: hostingSubscriptionId ? {
								id: hostingSubscriptionId,
								pleskServiceId: null, // Will be populated if needed
								pleskName: itemInput.domainName,
								pleskFtpLogin: null,
								pleskFtpPassword: null,
							} : undefined,
						});
					}

					// Recalculate order totals from actual created order items
					// This ensures accuracy even if there were any discrepancies during creation
					const recalculatedSubtotal = createdOrderItems.reduce((sum, item) => {
						return sum + parseFloat(item.itemSubtotal || "0");
					}, 0);
					
					// Recalculate tax if applicable
					let recalculatedTaxAmount: number | null = null;
					let recalculatedTotal: number;
					
					if (input.isTaxable && input.taxPercentage !== null && input.taxPercentage !== undefined) {
						recalculatedTaxAmount = recalculatedSubtotal * (input.taxPercentage / 100);
						recalculatedTotal = recalculatedSubtotal + recalculatedTaxAmount; // No discount for now
					} else {
						recalculatedTotal = recalculatedSubtotal; // No discount for now
					}

					// Update order status based on all items' statuses
					const allProvisioned = createdOrderItems.every(item => item.status === "PROVISIONED");
					const anyFailed = createdOrderItems.some(item => item.status === "FAILED");
					const anyPending = createdOrderItems.some(item => item.status === "PENDING" || item.status === "PROVISIONING");
					
					let orderStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "PARTIAL" = "PENDING";
					if (allProvisioned) {
						orderStatus = "COMPLETED";
					} else if (anyFailed && !anyPending) {
						// All items processed, but some failed
						orderStatus = "PARTIAL";
					} else if (anyPending) {
						// Still processing
						orderStatus = "PROCESSING";
					} else {
						// Mixed results
						orderStatus = "PARTIAL";
					}

					// Build update data conditionally to handle cases where Prisma client might not be regenerated
					const updateData: any = {
						status: orderStatus,
						subtotal: recalculatedSubtotal.toString(),
						total: recalculatedTotal.toString(),
						processedBy: allProvisioned ? session.user!.id : null,
						processedAt: allProvisioned ? now : null,
						completedAt: allProvisioned ? now : null,
						updatedAt: now,
					};

					// Only include tax fields if they exist in the schema (after Prisma client regeneration)
					// This prevents errors if the client hasn't been regenerated yet
					if (recalculatedTaxAmount !== null) {
						updateData.taxAmount = recalculatedTaxAmount.toString();
					}
					if (input.isTaxable !== undefined && input.isTaxable !== null) {
						updateData.isTaxable = input.isTaxable;
					}
					if (input.taxPercentage !== undefined && input.taxPercentage !== null) {
						updateData.taxPercentage = input.taxPercentage;
					}

					await tx.update(orderTable).set(updateData).where(eq(orderTable.id, order.id));

					const updatedOrder = await tx.query.order.findFirst({
						where: eq(orderTable.id, order.id),
						with: {
							team: {
								columns: { id: true, name: true, slug: true },
							},
						},
					});

					if (!updatedOrder) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Failed to load order after update",
						});
					}

					// Log order creation
					await tx.insert(orderActivityLog).values({
						id: crypto.randomUUID(),
						orderId: updatedOrder.id,
						userId: session.user!.id,
						action: "CREATE",
						description: `Order ${orderNumber} created with ${orderItemsData.length} item(s)`,
						metadata: {
							orderNumber: updatedOrder.orderNumber,
							itemsCount: orderItemsData.length,
							status: orderStatus,
							requiresProvisioning,
						},
						createdAt: now,
					});

					return {
						order: updatedOrder,
						orderItems: createdOrderItems,
						requiresProvisioning,
						nonProvisionedItems,
					};
				});

				// Fetch hosting subscription details for response
				const orderItemsWithDetails = await Promise.all(
					result.orderItems.map(async (item: any) => {
						if (item.hostingSubscriptionId) {
							const subscription = await db.query.hostingSubscription.findFirst({
								columns: {
									id: true,
									pleskServiceId: true,
									pleskName: true,
									pleskFtpLogin: true,
									pleskFtpPassword: true,
								},
								where: eq(hostingSubscription.id, item.hostingSubscriptionId),
							});

							if (subscription) {
								return {
									...item,
									hostingSubscription: {
										id: subscription.id,
										pleskServiceId: subscription.pleskServiceId,
										pleskName: subscription.pleskName,
										pleskFtpLogin: subscription.pleskFtpLogin,
										pleskFtpPassword: subscription.pleskFtpPassword,
									},
								};
							}
						}
						return item;
					})
				);


				// Auto-create invoice if requested and billing settings exist
				let invoiceCreated = false;
				let invoiceNumber: string | null = null;
				let generatedInvoiceNumber: string = "";
				
				if (input.createInvoice) {
					try {
						// Check if team has billing settings
						const [billingSettings] = await db
							.select()
							.from(teamBillingSettings)
							.where(eq(teamBillingSettings.teamId, input.teamId))
							.limit(1);

						if (billingSettings) {
							// Fetch order items with plan details for invoice line items
							const orderItemsForInvoice = await db.query.orderItem.findMany({
								where: eq(orderItem.orderId, result.order.id),
								with: {
									niscServicePlan: true,
								},
							});

							// Helper function to format item name
							const formatItemName = (plan: any, billingCycle: string): string => {
								let categoryName = "";
								
								// If HOSTING plan and has hostingSubType, use that (e.g., "Email Hosting")
								if (plan.planType === "HOSTING" && plan.hostingSubType) {
									const subTypeMap: Record<string, string> = {
										WEB_HOSTING: "Web Hosting",
										EMAIL_HOSTING: "Email Hosting",
										RESELLER_HOSTING: "Reseller Hosting",
										VPS_HOSTING: "VPS Hosting",
										DEDICATED_HOSTING: "Dedicated Hosting",
									};
									categoryName = subTypeMap[plan.hostingSubType] || plan.hostingSubType.replace(/_/g, " ");
								} else {
									// Use planType for non-hosting plans
									const planTypeMap: Record<string, string> = {
										HOSTING: "Hosting",
										SEO: "SEO",
										VIDEOGRAPHY: "Videography",
										VISUAL_CREATIVE: "Visual Creative",
										SOCIAL_MEDIA_MARKETING: "Social Media Marketing",
										PAY_PER_CLICK_ADVERTISING: "Pay Per Click Advertising",
									};
									categoryName = planTypeMap[plan.planType] || plan.planType.replace(/_/g, " ");
								}

								const billingCycleMap: Record<string, string> = {
									MONTHLY: "Monthly",
									YEARLY: "Yearly",
									BIENNIALLY: "Biennially",
									CUSTOM: "Custom",
								};
								const cycleDisplay = billingCycleMap[billingCycle] || billingCycle;

								return `${plan.name} (${categoryName} - ${cycleDisplay})`;
							};

							// Get currency from first order item (all should be same)
							const currency = orderItemsForInvoice[0]?.itemCurrency || result.order.currency || "KES";

							// Create invoice line items
							const lineItems = orderItemsForInvoice.map((item, index) => ({
								id: crypto.randomUUID(),
								position: index,
								name: formatItemName(item.niscServicePlan, item.billingCycle),
								description: item.description || undefined,
								quantity: 1, // Always 1 as per requirements
								unit: undefined,
								price: item.itemPrice,
								discount: undefined,
								total: item.itemSubtotal,
								metadata: undefined,
							}));

							// Calculate totals
							const subtotal = parseFloat(result.order.subtotal || "0");
							const taxAmount = result.order.taxAmount ? parseFloat(result.order.taxAmount) : null;
							const total = parseFloat(result.order.total || "0");

							// Prepare dates
							const issueDate = new Date();
							const dueDate = new Date(issueDate);
							dueDate.setDate(dueDate.getDate() + 7); // 7 days from issue date

							// Prepare invoice data
							const companyLogoUrl = "https://res.cloudinary.com/df5ntv9gb/image/upload/v1758621603/Nisc_Logo_Original_im5pgk.png";
							
							const fromDetails = {
								name: "Nisc Cloud Limited",
								email: "billing@nisccloud.com",
								address: "Applewood Adams Suite 805 - Ngong Rd",
								city: "Nairobi",
								zip: "743-00511",
								country: "Kenya",
								taxId: "P051787789M",
								logoUrl: companyLogoUrl,
							};

							const customerDetails = {
								name: billingSettings.legalName,
								email: billingSettings.billingEmail,
								phone: billingSettings.billingPhone || null,
								address: billingSettings.addressLine1,
								addressLine2: billingSettings.addressLine2 || null,
								city: billingSettings.city,
								state: billingSettings.state || null,
								zip: billingSettings.postalCode || null,
								country: billingSettings.country,
								taxId: billingSettings.taxId || null,
							};

							const paymentDetails = {
								method: "MPESA",
								paybillNumber: "303030",
								accountNumber: "2052676528",
								instructions: "Absa Bank Kenya",
								qrCodeValue: "www.nisccloud.com",
							};

							// Generate QR code
							let qrCodeDataUrl: string | undefined;
							try {
								const QRCodeUtil = await import("qrcode");
								qrCodeDataUrl = await QRCodeUtil.toDataURL(paymentDetails.qrCodeValue, {
									width: 120,
									margin: 1,
								});
							} catch (error) {
								console.error("Failed to generate QR code:", error);
							}

							// Create invoice in transaction
							// invoiceId is a UUID (unique identifier), invoiceNumber is sequential (e.g., INV-0001)
							const newInvoiceId: string = crypto.randomUUID();
							const token = crypto.randomUUID();

							await db.transaction(async (tx) => {
								generatedInvoiceNumber = await generateNextInvoiceNumber(tx);

								const invoiceNow = new Date();
								await tx.insert(invoice).values({
									id: newInvoiceId,
									token,
									teamId: input.teamId,
									customerName: billingSettings.legalName,
									customerEmail: billingSettings.billingEmail,
									invoiceNumber: generatedInvoiceNumber,
									status: "DRAFT",
									amount: total.toString(),
									subtotal: subtotal.toString(),
									tax: taxAmount ? taxAmount.toString() : undefined,
									taxPercentage:
										result.order.isTaxable && result.order.taxPercentage
											? result.order.taxPercentage
											: undefined,
									discount: result.order.discount || undefined,
									currency,
									issueDate,
									dueDate,
									fromDetails,
									customerDetails,
									paymentDetails: {
										...paymentDetails,
										qrCodeDataUrl,
									},
									template: {
										logoUrl: companyLogoUrl,
									},
									createdBy: session.user!.id,
									updatedBy: session.user!.id,
									createdAt: invoiceNow,
									updatedAt: invoiceNow,
								});

								for (const item of lineItems) {
									await tx.insert(invoiceLineItem).values({
										id: item.id,
										invoiceId: newInvoiceId,
										position: item.position,
										name: item.name,
										description: item.description,
										quantity: item.quantity,
										unit: item.unit,
										price: item.price,
										discount: item.discount,
										total: item.total,
										metadata: item.metadata,
										createdAt: invoiceNow,
										updatedAt: invoiceNow,
									});
								}

								await tx.insert(invoiceActivityLog).values({
									id: crypto.randomUUID(),
									invoiceId: newInvoiceId,
									userId: session.user!.id,
									action: "CREATE",
									description: "Auto-generated invoice from order",
									metadata: {
										orderId: result.order.id,
										orderNumber: result.order.orderNumber,
									},
									createdAt: invoiceNow,
								});

								await tx
									.update(orderTable)
									.set({
										invoiceNumber: generatedInvoiceNumber,
										invoiceId: newInvoiceId,
									})
									.where(eq(orderTable.id, result.order.id));
							});

							invoiceCreated = true;
							invoiceNumber = generatedInvoiceNumber;
						}
					} catch (invoiceError) {
						console.error("Failed to auto-create invoice:", invoiceError);
						// Don't fail the order creation if invoice creation fails
						// Log the error but continue
					}
				}

				// Fetch order items with plan details (used for both email and status reporting)
				const orderItemsForStatus = await db.query.orderItem.findMany({
					where: eq(orderItem.orderId, result.order.id),
					with: {
						niscServicePlan: true,
					},
				});

				// Send order confirmation email if billing settings exist
				try {
					const [billingSettings] = await db
						.select()
						.from(teamBillingSettings)
						.where(eq(teamBillingSettings.teamId, input.teamId))
						.limit(1);

					if (billingSettings && billingSettings.billingEmail) {
						// Import email utilities
						const { sendEmail } = await import("../lib/email");
						const { renderOrderConfirmationEmail } = await import("../lib/email-templates");
						
						// Helper function to format item name (same as invoice)
						const formatItemName = (plan: any, billingCycle: string): string => {
							let categoryName = "";
							
							if (plan.planType === "HOSTING" && plan.hostingSubType) {
								const subTypeMap: Record<string, string> = {
									WEB_HOSTING: "Web Hosting",
									EMAIL_HOSTING: "Email Hosting",
									RESELLER_HOSTING: "Reseller Hosting",
									VPS_HOSTING: "VPS Hosting",
									DEDICATED_HOSTING: "Dedicated Hosting",
								};
								categoryName = subTypeMap[plan.hostingSubType] || plan.hostingSubType.replace(/_/g, " ");
							} else {
								const planTypeMap: Record<string, string> = {
									HOSTING: "Hosting",
									SEO: "SEO",
									VIDEOGRAPHY: "Videography",
									VISUAL_CREATIVE: "Visual Creative",
									SOCIAL_MEDIA_MARKETING: "Social Media Marketing",
									PAY_PER_CLICK_ADVERTISING: "Pay Per Click Advertising",
								};
								categoryName = planTypeMap[plan.planType] || plan.planType.replace(/_/g, " ");
							}

							const billingCycleMap: Record<string, string> = {
								MONTHLY: "Monthly",
								YEARLY: "Yearly",
								BIENNIALLY: "Biennially",
								CUSTOM: "Custom",
							};
							const cycleDisplay = billingCycleMap[billingCycle] || billingCycle;

							return `${plan.name} (${categoryName} - ${cycleDisplay})`;
						};

						// Format order items for email
						const emailOrderItems = orderItemsForStatus.map((item) => ({
							name: formatItemName(item.niscServicePlan, item.billingCycle),
							description: item.description || undefined,
							quantity: 1,
							price: item.itemPrice ? `${result.order.currency} ${item.itemPrice}` : undefined,
							status: item.status === "PROVISIONED" ? "PROVISIONED" : item.status === "PROVISIONING" ? "PROVISIONING" : item.status,
						}));

						// Format order date
						const formatDate = (date: Date): string => {
							return date.toLocaleDateString("en-US", {
								year: "numeric",
								month: "long",
								day: "numeric",
							});
						};

						// Generate order link
						const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3002";
						const orderLink = `${frontendUrl}/orders/${result.order.id}`;

						// Render email
						const emailHtml = await renderOrderConfirmationEmail({
							customerName: billingSettings.legalName,
							orderNumber: result.order.orderNumber,
							orderDate: formatDate(result.order.createdAt),
							totalAmount: result.order.total || "0.00",
							currency: result.order.currency || "KES",
							orderItems: emailOrderItems,
							supportEmail: "support@nisccloud.com",
							supportPhone: "+254 748 777 666",
							orderLink,
						});

						// Send email
						await sendEmail({
							to: billingSettings.billingEmail,
							subject: `Order Confirmation - ${result.order.orderNumber} from Nisc Cloud Limited`,
							html: emailHtml,
						});
					}
				} catch (emailError) {
					console.error("Failed to send order confirmation email:", emailError);
					// Don't fail the order creation if email sending fails
					// Log the error but continue
				}

				// Build detailed order item statuses for frontend toasts
				const orderItemStatuses = orderItemsForStatus.map((item) => ({
					planName: item.niscServicePlan?.name || "Unknown",
					planType: item.niscServicePlan?.planType || "Unknown",
					status: item.status as z.infer<typeof orderItemStatusSchema>,
					provisioningError: item.provisioningError,
					domainName: item.domainName,
				}));

				return {
					success: true,
					order: {
						...result.order,
						domainId: result.order.domainId ?? null,
						type: result.order.type as z.infer<typeof orderTypeSchema>,
						status: result.order.status as z.infer<typeof orderStatusSchema>,
					},
					orderItems: orderItemsWithDetails,
					message: invoiceCreated
						? (result.requiresProvisioning
							? "Order and invoice created successfully. Some items require manual provisioning."
							: "Order and invoice created successfully.")
						: (result.requiresProvisioning
							? "Order created successfully. Some items require manual provisioning."
							: "Order created and all items provisioned successfully"),
					requiresProvisioning: result.requiresProvisioning,
					nonProvisionedItems: result.nonProvisionedItems && result.nonProvisionedItems.length > 0 
						? result.nonProvisionedItems 
						: undefined,
					orderItemStatuses, // Detailed status for each item
					invoiceCreated,
					invoiceNumber: invoiceNumber || undefined,
				};
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("Failed to create service order:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Failed to create service order: ${error instanceof Error ? error.message : "Unknown error"}`,
				});
			}
		}),

	// Delete order
	delete: protectedProcedure
		.input(z.object({ orderId: z.string() }))
		.output(z.object({ success: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to delete orders",
				});
			}

			// Any agency role can delete own orders; super admin can override ownership
			// Optimize: Pass session user to avoid database query if role is in session
			const userRole = await getUserRole(session.user.id, session.user as { role?: string });
			if (!isAgencyRole(userRole)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to delete orders",
				});
			}

			// Check if order exists
			const order = await db.query.order.findFirst({
				where: eq(orderTable.id, input.orderId),
				with: {
					team: {
						columns: { id: true, name: true },
					},
				},
			});

			if (!order) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Order not found",
				});
			}

			if (userRole !== "AGENCY_SUPER_ADMIN" && order.createdBy !== session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only the order creator can delete it",
				});
			}

			// Prevent deletion of completed orders that have active subscriptions
			if (order.status === "COMPLETED" && order.hostingSubscriptionId) {
				const subscription = await db.query.hostingSubscription.findFirst({
					columns: { status: true },
					where: eq(hostingSubscription.id, order.hostingSubscriptionId),
				});

				if (subscription && subscription.status === "ACTIVE") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Cannot delete order with active hosting subscription. Please terminate the subscription first.",
					});
				}
			}

			const now = new Date();

			// Log order deletion attempt - UserActivityLog
			await db.insert(userActivityLog).values({
				id: crypto.randomUUID(),
				userId: session.user.id,
				action: "ORDER_DELETION_STARTED",
				description: `Starting deletion of order ${order.orderNumber}`,
				metadata: {
					orderId: order.id,
					orderNumber: order.orderNumber,
					orderType: order.type,
					orderStatus: order.status,
					teamId: order.teamId,
					teamName: order.team?.name,
				},
				createdAt: now,
			});

			// Log order deletion - OrderActivityLog (before deletion so orderId still exists)
			await db.insert(orderActivityLog).values({
				id: crypto.randomUUID(),
				orderId: order.id,
				userId: session.user.id,
				action: "DELETE",
				description: `Order ${order.orderNumber} deleted by admin`,
				metadata: {
					orderNumber: order.orderNumber,
					orderType: order.type,
					orderStatus: order.status,
					teamId: order.teamId,
					teamName: order.team?.name,
					deletedBy: session.user.id,
					deletedByEmail: session.user.email,
					hostingSubscriptionId: order.hostingSubscriptionId,
				},
				createdAt: now,
			});

			// If order has a hosting subscription, log subscription-related activity
			if (order.hostingSubscriptionId) {
				const subscription = await db.query.hostingSubscription.findFirst({
					columns: { id: true, status: true, pleskName: true },
					where: eq(hostingSubscription.id, order.hostingSubscriptionId),
				});

				if (subscription) {
					// Log subscription impact in HostingSubscriptionActivityLog
					await db.insert(hostingSubscriptionActivityLog).values({
						id: crypto.randomUUID(),
						hostingSubscriptionId: subscription.id,
						userId: session.user.id,
						action: "ORDER_DELETED",
						description: `Order ${order.orderNumber} deleted - associated subscription may be affected`,
						metadata: {
							orderId: order.id,
							orderNumber: order.orderNumber,
							subscriptionStatus: subscription.status,
							deletedBy: session.user.id,
						},
						createdAt: now,
					});
				}
			}

			// Batch: Delete order and log activity in a transaction
			// This reduces connection usage from 2 sequential queries to 1 transaction
			await db.transaction(async (tx) => {
				await tx.delete(orderTable).where(eq(orderTable.id, input.orderId));

				await tx.insert(userActivityLog).values({
					id: crypto.randomUUID(),
					userId: session.user!.id,
					action: "ORDER_DELETED",
					description: `Order ${order.orderNumber} deleted successfully by admin`,
					metadata: {
						orderId: order.id,
						orderNumber: order.orderNumber,
						orderType: order.type,
						orderStatus: order.status,
						teamId: order.teamId,
						teamName: order.team?.name,
						deletedBy: session.user!.id,
						deletedByEmail: session.user!.email,
						hostingSubscriptionId: order.hostingSubscriptionId,
					},
					createdAt: now,
				});
			});

			return { success: true };
		}),
});

