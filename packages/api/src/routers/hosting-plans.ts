import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "@npanel/db";
import { randomUUID } from "node:crypto";

import { db } from "@npanel/db";
import {
	niscServicePlan,
	niscServicePlanActivityLog,
} from "@npanel/db/schema/hosting";
import { protectedProcedure, router } from "../trpc";

const isAgencySuperAdminRole = (role: string | null | undefined) =>
	role === "AGENCY_SUPER_ADMIN";

// ============================================================================
// ZOD SCHEMAS - Independent from database schema
// ============================================================================

// Service Plan Type Enum - All supported plan types
const servicePlanTypeSchema = z.enum([
	"HOSTING",
	"SEO",
	"VIDEOGRAPHY",
	"VISUAL_CREATIVE",
	"SOCIAL_MEDIA_MARKETING",
	"PAY_PER_CLICK_ADVERTISING",
]);

// Hosting sub-type enum (for HOSTING plans)
const hostingSubTypeSchema = z.enum([
	"WEB_HOSTING",
	"EMAIL_HOSTING",
	"RESELLER_HOSTING",
	"VPS_HOSTING",
	"DEDICATED_HOSTING",
]);

// Billing Cycle Enum
const billingCycleSchema = z.enum(["YEARLY", "MONTHLY", "BIENNIALLY", "CUSTOM"]);

// Service Plan Input Schema
const baseServicePlanSchema = z.object({
	name: z.string().min(1, "Plan name is required").max(255),
	description: z.string().optional(),
	planType: servicePlanTypeSchema,
	hostingSubType: hostingSubTypeSchema.optional(), // Only required if planType is HOSTING
	features: z.array(z.string()).default([]),
	highlights: z.array(z.string()).default([]),
	isPopular: z.boolean().default(false),
	isRecommended: z.boolean().default(false),
	niscPrice: z.string().optional(),
	niscCurrency: z.string().default("KES"),
	billingCycle: billingCycleSchema.default("MONTHLY"),
	setupFee: z.string().optional(),
	isActive: z.boolean().default(true),
	isDefault: z.boolean().default(false),
	// Plesk-specific fields (only for HOSTING plans)
	pleskServicePlanId: z.string().optional(),
	pleskFilterId: z.string().optional(),
	pleskIpAddress: z.string().optional(),
});

const createServicePlanInputSchema = baseServicePlanSchema.refine(
	(data) => {
		// If planType is HOSTING, hostingSubType should be provided
		if (data.planType === "HOSTING" && !data.hostingSubType) {
			return false;
		}
		return true;
	},
	{
		message: "hostingSubType is required when planType is HOSTING",
		path: ["hostingSubType"],
	},
);

const updateServicePlanInputSchema = baseServicePlanSchema.partial().extend({
	id: z.string(),
});

const getServicePlanByIdInputSchema = z.object({
	id: z.string(),
});

const getServicePlansInputSchema = z.object({
	planType: servicePlanTypeSchema.optional(),
	hostingSubType: hostingSubTypeSchema.optional(),
	isActive: z.boolean().optional(),
});

// Service Plan Output Schema
const servicePlanOutputSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	planType: servicePlanTypeSchema,
	hostingSubType: hostingSubTypeSchema.nullable(),
	features: z.array(z.string()),
	highlights: z.array(z.string()),
	isPopular: z.boolean(),
	isRecommended: z.boolean(),
	niscPrice: z.string().nullable(),
	niscCurrency: z.string(),
	billingCycle: billingCycleSchema,
	setupFee: z.string().nullable(),
	isActive: z.boolean(),
	isDefault: z.boolean(),
	pleskServicePlanId: z.string().nullable(),
	pleskFilterId: z.string().nullable(),
	pleskIpAddress: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

const deleteServicePlanInputSchema = z.object({
	id: z.string(),
});

/** JSON / unknown columns from DB → output string arrays */
function asStringArray(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.filter((x): x is string => typeof x === "string");
	}
	return [];
}

export const hostingPlansRouter = router({
	// Get all service plans with optional filtering
	getAll: protectedProcedure
		.input(getServicePlansInputSchema.optional())
		.output(z.array(servicePlanOutputSchema))
		.query(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to view service plans",
				});
			}

			const conditions = [];
			if (input?.planType !== undefined) {
				conditions.push(eq(niscServicePlan.planType, input.planType));
			}
			if (input?.hostingSubType !== undefined) {
				conditions.push(eq(niscServicePlan.hostingSubType, input.hostingSubType));
			}
			if (input?.isActive !== undefined) {
				conditions.push(eq(niscServicePlan.isActive, input.isActive));
			}

			const plans = await db
				.select()
				.from(niscServicePlan)
				.where(conditions.length ? and(...conditions) : sql`true`)
				.orderBy(desc(niscServicePlan.createdAt));

			return plans.map((plan) => ({
				id: plan.id,
				name: plan.name,
				description: plan.description,
				planType: plan.planType as any,
				hostingSubType: plan.hostingSubType as any,
				features: asStringArray(plan.features),
				highlights: asStringArray(plan.highlights),
				isPopular: plan.isPopular,
				isRecommended: plan.isRecommended,
				niscPrice: plan.niscPrice,
				niscCurrency: plan.niscCurrency || "KES",
				billingCycle: plan.billingCycle as any,
				setupFee: plan.setupFee,
				isActive: plan.isActive,
				isDefault: plan.isDefault,
				pleskServicePlanId: plan.pleskServicePlanId,
				pleskFilterId: plan.pleskFilterId,
				pleskIpAddress: plan.pleskIpAddress,
				createdAt: plan.createdAt,
				updatedAt: plan.updatedAt,
			}));
		}),

	// Get service plan by ID
	getById: protectedProcedure
		.input(getServicePlanByIdInputSchema)
		.output(servicePlanOutputSchema)
		.query(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to view service plans",
				});
			}

			const planRows = await db
				.select()
				.from(niscServicePlan)
				.where(eq(niscServicePlan.id, input.id))
				.limit(1);
			const plan = planRows[0];

			if (!plan) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Service plan not found",
				});
			}

			return {
				id: plan.id,
				name: plan.name,
				description: plan.description,
				planType: plan.planType as any,
				hostingSubType: plan.hostingSubType as any,
				features: asStringArray(plan.features),
				highlights: asStringArray(plan.highlights),
				isPopular: plan.isPopular,
				isRecommended: plan.isRecommended,
				niscPrice: plan.niscPrice,
				niscCurrency: plan.niscCurrency || "KES",
				billingCycle: plan.billingCycle as any,
				setupFee: plan.setupFee,
				isActive: plan.isActive,
				isDefault: plan.isDefault,
				pleskServicePlanId: plan.pleskServicePlanId,
				pleskFilterId: plan.pleskFilterId,
				pleskIpAddress: plan.pleskIpAddress,
				createdAt: plan.createdAt,
				updatedAt: plan.updatedAt,
			};
		}),

	// Create a new service plan
	create: protectedProcedure
		.input(createServicePlanInputSchema)
		.output(servicePlanOutputSchema)
		.mutation(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to create service plans",
				});
			}
			if (!isAgencySuperAdminRole(session.user.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only agency super admins can create service plans",
				});
			}

			// Validate hostingSubType is provided for HOSTING plans
			if (input.planType === "HOSTING" && !input.hostingSubType) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "hostingSubType is required for HOSTING plans",
				});
			}

			// Validate Plesk fields are only provided for HOSTING plans
			if (input.planType !== "HOSTING") {
				if (input.pleskServicePlanId || input.pleskFilterId || input.pleskIpAddress) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Plesk fields can only be set for HOSTING plans",
					});
				}
			}

			const userId = session.user.id;

			const inserted = await db
				.insert(niscServicePlan)
				.values({
					id: randomUUID(),
					name: input.name,
					description: input.description || null,
					planType: input.planType as any,
					hostingSubType: input.hostingSubType || null,
					features: input.features,
					highlights: input.highlights,
					isPopular: input.isPopular,
					isRecommended: input.isRecommended,
					niscPrice: input.niscPrice || null,
					niscCurrency: input.niscCurrency,
					billingCycle: input.billingCycle,
					setupFee: input.setupFee || null,
					isActive: input.isActive,
					isDefault: input.isDefault,
					pleskServicePlanId:
						input.planType === "HOSTING" ? (input.pleskServicePlanId || null) : null,
					pleskFilterId: input.planType === "HOSTING" ? (input.pleskFilterId || null) : null,
					pleskIpAddress: input.planType === "HOSTING" ? (input.pleskIpAddress || null) : null,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();
			const plan = inserted[0];
			if (!plan) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create service plan",
				});
			}

			// Log activity - comprehensive logging for CREATE
			await db.insert(niscServicePlanActivityLog).values({
				id: randomUUID(),
				niscServicePlanId: plan.id,
				userId: userId,
				action: "CREATE",
				description: `Created service plan: ${plan.name} (${plan.planType})`,
				metadata: {
					planId: plan.id,
					planName: plan.name,
					description: plan.description,
					planType: plan.planType,
					hostingSubType: plan.hostingSubType,
					// Pricing information
					niscPrice: plan.niscPrice,
					niscCurrency: plan.niscCurrency,
					setupFee: plan.setupFee,
					billingCycle: plan.billingCycle,
					// Status flags
					isActive: plan.isActive,
					isDefault: plan.isDefault,
					isPopular: plan.isPopular,
					isRecommended: plan.isRecommended,
					// Features and highlights
					features: asStringArray(plan.features),
					featuresCount: asStringArray(plan.features).length,
					highlights: asStringArray(plan.highlights),
					highlightsCount: asStringArray(plan.highlights).length,
					// Plesk integration (if applicable)
					pleskServicePlanId: plan.pleskServicePlanId,
					pleskFilterId: plan.pleskFilterId,
					pleskIpAddress: plan.pleskIpAddress,
				},
				createdAt: new Date(),
			});

			return {
				id: plan.id,
				name: plan.name,
				description: plan.description,
				planType: plan.planType as any,
				hostingSubType: plan.hostingSubType as any,
				features: asStringArray(plan.features),
				highlights: asStringArray(plan.highlights),
				isPopular: plan.isPopular,
				isRecommended: plan.isRecommended,
				niscPrice: plan.niscPrice,
				niscCurrency: plan.niscCurrency || "KES",
				billingCycle: plan.billingCycle as any,
				setupFee: plan.setupFee,
				isActive: plan.isActive,
				isDefault: plan.isDefault,
				pleskServicePlanId: plan.pleskServicePlanId,
				pleskFilterId: plan.pleskFilterId,
				pleskIpAddress: plan.pleskIpAddress,
				createdAt: plan.createdAt,
				updatedAt: plan.updatedAt,
			};
		}),

	// Update a service plan
	update: protectedProcedure
		.input(updateServicePlanInputSchema)
		.output(servicePlanOutputSchema)
		.mutation(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to update service plans",
				});
			}
			if (!isAgencySuperAdminRole(session.user.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only agency super admins can update service plans",
				});
			}

			const userId = session.user.id;

			const existingRows = await db
				.select()
				.from(niscServicePlan)
				.where(eq(niscServicePlan.id, input.id))
				.limit(1);
			const existingPlan = existingRows[0];

			if (!existingPlan) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Service plan not found",
				});
			}

			// Helper function to compare arrays (order-independent)
			const arraysEqual = (a: string[], b: string[]): boolean => {
				if (a.length !== b.length) return false;
				const sortedA = [...a].sort();
				const sortedB = [...b].sort();
				return sortedA.every((val, index) => val === sortedB[index]);
			};

			// Helper function to check if a value actually changed
			const hasChanged = <T>(newValue: T | undefined, oldValue: T | null): boolean => {
				if (newValue === undefined) return false; // Field not provided
				// Handle null/undefined comparison
				if (newValue === null && oldValue === null) return false;
				if (newValue === null || oldValue === null) return true;
				// For arrays, use deep comparison
				if (Array.isArray(newValue) && Array.isArray(oldValue)) {
					return !arraysEqual(newValue, oldValue);
				}
				// For strings, handle empty string vs null
				if (typeof newValue === "string" && newValue === "" && oldValue === null) return false;
				if (typeof oldValue === "string" && oldValue === "" && newValue === null) return false;
				return newValue !== oldValue;
			};

			// Validate plan type changes
			const newPlanType = input.planType !== undefined ? input.planType : existingPlan.planType;
			if (newPlanType === "HOSTING" && input.hostingSubType === undefined && !existingPlan.hostingSubType) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "hostingSubType is required for HOSTING plans",
				});
			}

			// Validate Plesk fields are only for HOSTING plans
			if (newPlanType !== "HOSTING") {
				if (input.pleskServicePlanId !== undefined || input.pleskFilterId !== undefined || input.pleskIpAddress !== undefined) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Plesk fields can only be set for HOSTING plans",
					});
				}
			}

			const updateData: any = {
				updatedAt: new Date(),
			};
			const changedFields: string[] = [];

			// Only update fields that were provided AND actually changed
			if (hasChanged(input.name, existingPlan.name)) {
				updateData.name = input.name;
				changedFields.push("name");
			}

			if (hasChanged(input.description, existingPlan.description)) {
				updateData.description = input.description || null;
				changedFields.push("description");
			}

			if (hasChanged(input.planType, existingPlan.planType)) {
				updateData.planType = input.planType;
				changedFields.push("planType");
			}

			if (input.hostingSubType !== undefined) {
				const newHostingSubType = input.hostingSubType || null;
				if (newHostingSubType !== existingPlan.hostingSubType) {
					updateData.hostingSubType = newHostingSubType;
					changedFields.push("hostingSubType");
				}
			}

			// Handle features array - support adding/removing items
			if (input.features !== undefined) {
				if (!arraysEqual(input.features, asStringArray(existingPlan.features))) {
					updateData.features = input.features;
					changedFields.push("features");
				}
			}

			// Handle highlights array - support adding/removing items
			if (input.highlights !== undefined) {
				if (!arraysEqual(input.highlights, asStringArray(existingPlan.highlights))) {
					updateData.highlights = input.highlights;
					changedFields.push("highlights");
				}
			}

			if (hasChanged(input.isPopular, existingPlan.isPopular)) {
				updateData.isPopular = input.isPopular;
				changedFields.push("isPopular");
			}

			if (hasChanged(input.isRecommended, existingPlan.isRecommended)) {
				updateData.isRecommended = input.isRecommended;
				changedFields.push("isRecommended");
			}

			if (input.niscPrice !== undefined) {
				const newPrice = input.niscPrice || null;
				if (newPrice !== existingPlan.niscPrice) {
					updateData.niscPrice = newPrice;
					changedFields.push("niscPrice");
				}
			}

			if (hasChanged(input.niscCurrency, existingPlan.niscCurrency)) {
				updateData.niscCurrency = input.niscCurrency;
				changedFields.push("niscCurrency");
			}

			if (hasChanged(input.billingCycle, existingPlan.billingCycle)) {
				updateData.billingCycle = input.billingCycle;
				changedFields.push("billingCycle");
			}

			if (input.setupFee !== undefined) {
				const newSetupFee = input.setupFee || null;
				if (newSetupFee !== existingPlan.setupFee) {
					updateData.setupFee = newSetupFee;
					changedFields.push("setupFee");
				}
			}

			if (hasChanged(input.isActive, existingPlan.isActive)) {
				updateData.isActive = input.isActive;
				changedFields.push("isActive");
			}

			if (hasChanged(input.isDefault, existingPlan.isDefault)) {
				updateData.isDefault = input.isDefault;
				changedFields.push("isDefault");
			}

			// Only update Plesk fields if plan type is HOSTING
			if (newPlanType === "HOSTING") {
				if (input.pleskServicePlanId !== undefined) {
					const newPleskServicePlanId = input.pleskServicePlanId || null;
					if (newPleskServicePlanId !== existingPlan.pleskServicePlanId) {
						updateData.pleskServicePlanId = newPleskServicePlanId;
						changedFields.push("pleskServicePlanId");
					}
				}
				if (input.pleskFilterId !== undefined) {
					const newPleskFilterId = input.pleskFilterId || null;
					if (newPleskFilterId !== existingPlan.pleskFilterId) {
						updateData.pleskFilterId = newPleskFilterId;
						changedFields.push("pleskFilterId");
					}
				}
				if (input.pleskIpAddress !== undefined) {
					const newPleskIpAddress = input.pleskIpAddress || null;
					if (newPleskIpAddress !== existingPlan.pleskIpAddress) {
						updateData.pleskIpAddress = newPleskIpAddress;
						changedFields.push("pleskIpAddress");
					}
				}
			} else {
				// Clear Plesk fields if changing away from HOSTING
				if (input.planType !== undefined && input.planType !== "HOSTING") {
					if (existingPlan.pleskServicePlanId !== null) {
						updateData.pleskServicePlanId = null;
						changedFields.push("pleskServicePlanId");
					}
					if (existingPlan.pleskFilterId !== null) {
						updateData.pleskFilterId = null;
						changedFields.push("pleskFilterId");
					}
					if (existingPlan.pleskIpAddress !== null) {
						updateData.pleskIpAddress = null;
						changedFields.push("pleskIpAddress");
					}
				}
			}

			// If no fields actually changed, return existing plan without updating
			if (changedFields.length === 0) {
				return {
					id: existingPlan.id,
					name: existingPlan.name,
					description: existingPlan.description,
					planType: existingPlan.planType as any,
					hostingSubType: existingPlan.hostingSubType as any,
					features: asStringArray(existingPlan.features),
					highlights: asStringArray(existingPlan.highlights),
					isPopular: existingPlan.isPopular,
					isRecommended: existingPlan.isRecommended,
					niscPrice: existingPlan.niscPrice,
					niscCurrency: existingPlan.niscCurrency || "KES",
					billingCycle: existingPlan.billingCycle as any,
					setupFee: existingPlan.setupFee,
					isActive: existingPlan.isActive,
					isDefault: existingPlan.isDefault,
					pleskServicePlanId: existingPlan.pleskServicePlanId,
					pleskFilterId: existingPlan.pleskFilterId,
					pleskIpAddress: existingPlan.pleskIpAddress,
					createdAt: existingPlan.createdAt,
					updatedAt: existingPlan.updatedAt,
				};
			}

			const updatedRows = await db
				.update(niscServicePlan)
				.set(updateData)
				.where(eq(niscServicePlan.id, input.id))
				.returning();
			const updatedPlan = updatedRows[0];
			if (!updatedPlan) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update service plan",
				});
			}

			// Build previous and new values for changed fields only
			const previousValues: Record<string, any> = {};
			const newValues: Record<string, any> = {};

			changedFields.forEach((field) => {
				previousValues[field] = (existingPlan as any)[field];
				newValues[field] = (updatedPlan as any)[field];
			});

			// Log activity - track what fields were actually changed
			await db.insert(niscServicePlanActivityLog).values({
				id: randomUUID(),
				niscServicePlanId: updatedPlan.id,
				userId: userId,
				action: "UPDATE",
				description: `Updated service plan: ${updatedPlan.name} (${changedFields.length} field${changedFields.length > 1 ? "s" : ""} changed)`,
				metadata: {
					planId: updatedPlan.id,
					planName: updatedPlan.name,
					planType: updatedPlan.planType,
					changedFields: changedFields,
					previousValues: previousValues,
					newValues: newValues,
					// Include full plan state for reference
					currentState: {
						name: updatedPlan.name,
						planType: updatedPlan.planType,
						hostingSubType: updatedPlan.hostingSubType,
						isActive: updatedPlan.isActive,
						isDefault: updatedPlan.isDefault,
						isPopular: updatedPlan.isPopular,
						isRecommended: updatedPlan.isRecommended,
						niscPrice: updatedPlan.niscPrice,
						niscCurrency: updatedPlan.niscCurrency,
						billingCycle: updatedPlan.billingCycle,
						featuresCount: asStringArray(updatedPlan.features).length,
						highlightsCount: asStringArray(updatedPlan.highlights).length,
					},
				},
				createdAt: new Date(),
			});

			return {
				id: updatedPlan.id,
				name: updatedPlan.name,
				description: updatedPlan.description,
				planType: updatedPlan.planType as any,
				hostingSubType: updatedPlan.hostingSubType as any,
				features: asStringArray(updatedPlan.features),
				highlights: asStringArray(updatedPlan.highlights),
				isPopular: updatedPlan.isPopular,
				isRecommended: updatedPlan.isRecommended,
				niscPrice: updatedPlan.niscPrice,
				niscCurrency: updatedPlan.niscCurrency || "KES",
				billingCycle: updatedPlan.billingCycle as any,
				setupFee: updatedPlan.setupFee,
				isActive: updatedPlan.isActive,
				isDefault: updatedPlan.isDefault,
				pleskServicePlanId: updatedPlan.pleskServicePlanId,
				pleskFilterId: updatedPlan.pleskFilterId,
				pleskIpAddress: updatedPlan.pleskIpAddress,
				createdAt: updatedPlan.createdAt,
				updatedAt: updatedPlan.updatedAt,
			};
		}),

	// Delete a service plan
	delete: protectedProcedure
		.input(deleteServicePlanInputSchema)
		.output(z.object({ success: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to delete service plans",
				});
			}
			if (!isAgencySuperAdminRole(session.user.role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only agency super admins can delete service plans",
				});
			}

			const userId = session.user.id;

			const planRows = await db
				.select()
				.from(niscServicePlan)
				.where(eq(niscServicePlan.id, input.id))
				.limit(1);
			const plan = planRows[0];

			if (!plan) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Service plan not found",
				});
			}

			// Log activity before deletion (since cascade will delete logs)
			// Capture complete plan details for audit trail
			await db.insert(niscServicePlanActivityLog).values({
				id: randomUUID(),
				niscServicePlanId: plan.id,
				userId: userId,
				action: "DELETE",
				description: `Deleted service plan: ${plan.name} (${plan.planType})`,
				metadata: {
					planId: plan.id,
					planName: plan.name,
					description: plan.description,
					planType: plan.planType,
					hostingSubType: plan.hostingSubType,
					// Pricing information
					niscPrice: plan.niscPrice,
					niscCurrency: plan.niscCurrency,
					setupFee: plan.setupFee,
					billingCycle: plan.billingCycle,
					// Status flags
					isActive: plan.isActive,
					isDefault: plan.isDefault,
					isPopular: plan.isPopular,
					isRecommended: plan.isRecommended,
					// Features and highlights
					features: asStringArray(plan.features),
					featuresCount: asStringArray(plan.features).length,
					highlights: asStringArray(plan.highlights),
					highlightsCount: asStringArray(plan.highlights).length,
					// Plesk integration (if applicable)
					pleskServicePlanId: plan.pleskServicePlanId,
					pleskFilterId: plan.pleskFilterId,
					pleskIpAddress: plan.pleskIpAddress,
					// Timestamps
					createdAt: plan.createdAt,
					updatedAt: plan.updatedAt,
					deletedAt: new Date(),
				},
				createdAt: new Date(),
			});

			await db.delete(niscServicePlan).where(eq(niscServicePlan.id, input.id));

			return { success: true };
		}),
});

