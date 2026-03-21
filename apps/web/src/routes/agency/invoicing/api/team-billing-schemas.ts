"use client";

import { z } from "zod";

export const teamBillingSettingsSchema = z.object({
	id: z.string(),
	teamId: z.string(),
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
	additionalNotes: z.string().nullable(),
	updatedBy: z.string(),
	createdAt: z.union([z.string(), z.date()]),
	updatedAt: z.union([z.string(), z.date()]),
});

export type TeamBillingSettings = z.infer<typeof teamBillingSettingsSchema>;

export const teamBillingSummarySchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	hasBillingSettings: z.boolean(),
	isBillingComplete: z.boolean(),
	billingSettings: teamBillingSettingsSchema.nullable(),
});

export type TeamBillingSummary = z.infer<typeof teamBillingSummarySchema>;

export const teamBillingListResponseSchema = z.object({
	teams: z.array(teamBillingSummarySchema),
});

export type TeamBillingListResponse = z.infer<typeof teamBillingListResponseSchema>;

