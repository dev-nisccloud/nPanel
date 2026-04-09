"use client";

import { z } from "zod";

/**
 * This file intentionally keeps the UI page thin by centralizing:
 * - the subset of fields our Dedicated Servers UI consumes
 * - the transformation from Hivelocity inventory shape -> flat plan cards
 */

export const dedicatedPlanSchema = z.object({
	product_id: z.number().int(),
	// Hivelocity often returns null here; fall back for display.
	product_name: z
		.union([z.string(), z.null()])
		.transform((v) => (typeof v === "string" && v.trim().length > 0 ? v : "Custom dedicated server plan")),
	data_center: z.string(),
	location_option_id: z.number().int(),
	stock: z.enum(["available", "limited", "unavailable"]),

	is_vps: z.boolean(),
	is_vds: z.boolean(),

	product_cpu_cores: z.string().optional(),
	product_cpu: z.string().optional(),
	processor_info: z.unknown().optional(),
	product_memory: z.string().optional(),
	product_drive: z.string().optional(),
	product_drive_info: z.unknown().optional(),
	product_bandwidth: z.string().optional(),
	product_hourly_price: z.number().optional(),
	product_monthly_price: z.number().optional(),
	product_on_sale: z.boolean().optional(),
	product_original_price: z.number().optional(),
	product_new: z.boolean().optional(),
});

export type DedicatedPlan = z.infer<typeof dedicatedPlanSchema>;

export function inventoryToDedicatedPlans(inventory: unknown): DedicatedPlan[] {
	if (!inventory || typeof inventory !== "object" || Array.isArray(inventory)) {
		return [];
	}

	const all: unknown[] = [];
	for (const value of Object.values(inventory as Record<string, unknown>)) {
		if (Array.isArray(value)) all.push(...value);
	}

	const parsed = all
		.map((item) => dedicatedPlanSchema.safeParse(item))
		.filter((r): r is { success: true; data: DedicatedPlan } => r.success)
		.map((r) => r.data);

	return parsed
		.filter((p) => p.is_vps === false && p.is_vds === false)
		.sort((a, b) => {
			const stockRank = (s: DedicatedPlan["stock"]) => (s === "available" ? 0 : s === "limited" ? 1 : 2);
			const sr = stockRank(a.stock) - stockRank(b.stock);
			if (sr !== 0) return sr;
			const ap = a.product_monthly_price ?? Number.POSITIVE_INFINITY;
			const bp = b.product_monthly_price ?? Number.POSITIVE_INFINITY;
			return ap - bp;
		});
}

