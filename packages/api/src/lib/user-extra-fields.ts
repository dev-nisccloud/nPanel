import { z } from "zod";

export const emailPreferenceSchema = z.boolean().nullable();

export const userEmailPreferencesSchema = z.object({
	generalEmailsAccepted: emailPreferenceSchema,
	invoiceEmailsAccepted: emailPreferenceSchema,
	supportEmailsAccepted: emailPreferenceSchema,
	productEmailsAccepted: emailPreferenceSchema,
	domainEmailsAccepted: emailPreferenceSchema,
	affiliateEmailsAccepted: emailPreferenceSchema,
	marketingEmailsAccepted: emailPreferenceSchema,
	smsMarketingAccepted: emailPreferenceSchema,
});

export const userEmailPreferencesInputSchema = z.object({
	generalEmailsAccepted: emailPreferenceSchema.optional(),
	invoiceEmailsAccepted: emailPreferenceSchema.optional(),
	supportEmailsAccepted: emailPreferenceSchema.optional(),
	productEmailsAccepted: emailPreferenceSchema.optional(),
	domainEmailsAccepted: emailPreferenceSchema.optional(),
	affiliateEmailsAccepted: emailPreferenceSchema.optional(),
	marketingEmailsAccepted: emailPreferenceSchema.optional(),
	smsMarketingAccepted: emailPreferenceSchema.optional(),
});

export const userAdminFieldsSchema = z.object({
	adminNotes: z.string().nullable(),
	howDidYouFindUs: z.string().nullable(),
	acceptedTermsAndConditions: z.boolean().nullable(),
});

export const userAdminFieldsInputSchema = z.object({
	adminNotes: z.string().nullable().optional(),
	howDidYouFindUs: z.string().nullable().optional(),
	acceptedTermsAndConditions: z.boolean().nullable().optional(),
});

const EMAIL_PREFERENCE_KEYS = [
	"generalEmailsAccepted",
	"invoiceEmailsAccepted",
	"supportEmailsAccepted",
	"productEmailsAccepted",
	"domainEmailsAccepted",
	"affiliateEmailsAccepted",
	"marketingEmailsAccepted",
	"smsMarketingAccepted",
] as const;

const ADMIN_FIELD_KEYS = ["adminNotes", "howDidYouFindUs", "acceptedTermsAndConditions"] as const;

type EmailPreferenceKey = (typeof EMAIL_PREFERENCE_KEYS)[number];
type AdminFieldKey = (typeof ADMIN_FIELD_KEYS)[number];

export type UserEmailPreferenceRow = Record<EmailPreferenceKey, boolean | null>;
export type UserAdminFieldRow = {
	adminNotes: string | null;
	howDidYouFindUs: string | null;
	acceptedTermsAndConditions: boolean | null;
};

export function mapUserEmailPreferences(row: UserEmailPreferenceRow) {
	return {
		generalEmailsAccepted: row.generalEmailsAccepted,
		invoiceEmailsAccepted: row.invoiceEmailsAccepted,
		supportEmailsAccepted: row.supportEmailsAccepted,
		productEmailsAccepted: row.productEmailsAccepted,
		domainEmailsAccepted: row.domainEmailsAccepted,
		affiliateEmailsAccepted: row.affiliateEmailsAccepted,
		marketingEmailsAccepted: row.marketingEmailsAccepted,
		smsMarketingAccepted: row.smsMarketingAccepted,
	};
}

export function mapUserAdminFields(row: UserAdminFieldRow) {
	return {
		adminNotes: row.adminNotes,
		howDidYouFindUs: row.howDidYouFindUs,
		acceptedTermsAndConditions: row.acceptedTermsAndConditions,
	};
}

export function pickEmailPreferenceUpdates(
	input: z.infer<typeof userEmailPreferencesInputSchema>,
): Partial<Record<EmailPreferenceKey, boolean | null>> {
	const update: Partial<Record<EmailPreferenceKey, boolean | null>> = {};
	for (const key of EMAIL_PREFERENCE_KEYS) {
		if (input[key] !== undefined) {
			update[key] = input[key];
		}
	}
	return update;
}

export function pickAdminFieldUpdates(
	input: z.infer<typeof userAdminFieldsInputSchema>,
): Partial<UserAdminFieldRow> {
	const update: Partial<UserAdminFieldRow> = {};
	if (input.adminNotes !== undefined) update.adminNotes = input.adminNotes;
	if (input.howDidYouFindUs !== undefined) update.howDidYouFindUs = input.howDidYouFindUs;
	if (input.acceptedTermsAndConditions !== undefined) update.acceptedTermsAndConditions = input.acceptedTermsAndConditions;
	return update;
}

export function hasEmailPreferenceUpdates(
	input: z.infer<typeof userEmailPreferencesInputSchema>,
): boolean {
	return EMAIL_PREFERENCE_KEYS.some((key) => input[key] !== undefined);
}

export function hasAdminFieldUpdates(input: z.infer<typeof userAdminFieldsInputSchema>): boolean {
	return ADMIN_FIELD_KEYS.some((key) => input[key] !== undefined);
}

export function hasAnyUserExtraFieldUpdates(
	input: z.infer<typeof userEmailPreferencesInputSchema> &
		z.infer<typeof userAdminFieldsInputSchema>,
): boolean {
	return hasEmailPreferenceUpdates(input) || hasAdminFieldUpdates(input);
}
