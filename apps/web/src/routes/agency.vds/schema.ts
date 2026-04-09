"use client";

import { z } from "zod";

export const planSchema = z.object({
	product_id: z.number().int(),
	product_name: z.union([z.string(), z.null()]).transform((v) =>
		typeof v === "string" && v.trim().length > 0 ? v : "Custom VDS plan",
	),
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

export type VdsPlan = z.infer<typeof planSchema>;

export function inventoryToPlans(inventory: unknown): VdsPlan[] {
	if (!inventory || typeof inventory !== "object" || Array.isArray(inventory)) return [];

	const all: unknown[] = [];
	for (const value of Object.values(inventory as Record<string, unknown>)) {
		if (Array.isArray(value)) all.push(...value);
	}

	return all
		.map((item) => planSchema.safeParse(item))
		.filter((r): r is { success: true; data: VdsPlan } => r.success)
		.map((r) => r.data);
}

