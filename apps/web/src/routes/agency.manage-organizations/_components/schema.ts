import { z } from "zod";

export const teamSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	baseCurrency: z.string(),
	logoUrl: z.string().nullable(),
	isActive: z.boolean(),
	createdById: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
	memberCount: z.number(),
});

export type Team = z.infer<typeof teamSchema>;

export const teamMemberSchema = z.object({
	id: z.string(),
	userId: z.string(),
	role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type TeamMember = z.infer<typeof teamMemberSchema>;

export const teamInviteSchema = z.object({
	id: z.string(),
	email: z.string(),
	role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
	status: z.enum(["PENDING", "ACCEPTED", "DECLINED", "EXPIRED", "CANCELLED"]),
	invitedById: z.string(),
	expiresAt: z.date(),
	acceptedAt: z.date().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type TeamInvite = z.infer<typeof teamInviteSchema>;

export const hostingSubscriptionSchema = z.object({
	id: z.string(),
	hostingPlanId: z.string(),
	primaryDomain: z.string().nullable(),
	billingCycle: z.enum(["YEARLY", "MONTHLY", "BIENNIALLY", "CUSTOM"]),
	nextRenewalDate: z.date().nullable(),
	expiryDate: z.date().nullable(),
	autoRenew: z.boolean(),
	hostingType: z.enum(["WEB_HOSTING", "EMAIL_HOSTING", "RESELLER_HOSTING", "VPS_HOSTING", "DEDICATED_HOSTING"]),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type HostingSubscription = z.infer<typeof hostingSubscriptionSchema>;

