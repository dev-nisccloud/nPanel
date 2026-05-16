import { z } from "zod";

export const clientSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string().email(),
	emailVerified: z.boolean(),
	role: z.enum(["CUSTOMER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"]),
	status: z.enum(["ACTIVE", "SUSPENDED", "BANNED", "DEACTIVATED"]),
	image: z.string().nullable(),
	lastLoginAt: z.date().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
	generalEmailsAccepted: z.boolean().nullable(),
	invoiceEmailsAccepted: z.boolean().nullable(),
	supportEmailsAccepted: z.boolean().nullable(),
	productEmailsAccepted: z.boolean().nullable(),
	domainEmailsAccepted: z.boolean().nullable(),
	affiliateEmailsAccepted: z.boolean().nullable(),
	marketingEmailsAccepted: z.boolean().nullable(),
	smsMarketingAccepted: z.boolean().nullable(),
	adminNotes: z.string().nullable(),
	howDidYouFindUs: z.string().nullable(),
	acceptedTermsAndConditions: z.boolean().nullable(),
});

export type Client = z.infer<typeof clientSchema>;
