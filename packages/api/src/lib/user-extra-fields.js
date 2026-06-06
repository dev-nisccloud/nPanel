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
];
const ADMIN_FIELD_KEYS = ["adminNotes", "howDidYouFindUs", "acceptedTermsAndConditions"];
export function mapUserEmailPreferences(row) {
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
export function mapUserAdminFields(row) {
    return {
        adminNotes: row.adminNotes,
        howDidYouFindUs: row.howDidYouFindUs,
        acceptedTermsAndConditions: row.acceptedTermsAndConditions,
    };
}
export function pickEmailPreferenceUpdates(input) {
    const update = {};
    for (const key of EMAIL_PREFERENCE_KEYS) {
        if (input[key] !== undefined) {
            update[key] = input[key];
        }
    }
    return update;
}
export function pickAdminFieldUpdates(input) {
    const update = {};
    if (input.adminNotes !== undefined)
        update.adminNotes = input.adminNotes;
    if (input.howDidYouFindUs !== undefined)
        update.howDidYouFindUs = input.howDidYouFindUs;
    if (input.acceptedTermsAndConditions !== undefined)
        update.acceptedTermsAndConditions = input.acceptedTermsAndConditions;
    return update;
}
export function hasEmailPreferenceUpdates(input) {
    return EMAIL_PREFERENCE_KEYS.some((key) => input[key] !== undefined);
}
export function hasAdminFieldUpdates(input) {
    return ADMIN_FIELD_KEYS.some((key) => input[key] !== undefined);
}
export function hasAnyUserExtraFieldUpdates(input) {
    return hasEmailPreferenceUpdates(input) || hasAdminFieldUpdates(input);
}
