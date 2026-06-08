import { z } from "zod";
export declare const emailPreferenceSchema: z.ZodNullable<z.ZodBoolean>;
export declare const userEmailPreferencesSchema: z.ZodObject<{
    generalEmailsAccepted: z.ZodNullable<z.ZodBoolean>;
    invoiceEmailsAccepted: z.ZodNullable<z.ZodBoolean>;
    supportEmailsAccepted: z.ZodNullable<z.ZodBoolean>;
    productEmailsAccepted: z.ZodNullable<z.ZodBoolean>;
    domainEmailsAccepted: z.ZodNullable<z.ZodBoolean>;
    affiliateEmailsAccepted: z.ZodNullable<z.ZodBoolean>;
    marketingEmailsAccepted: z.ZodNullable<z.ZodBoolean>;
    smsMarketingAccepted: z.ZodNullable<z.ZodBoolean>;
}, z.core.$strip>;
export declare const userEmailPreferencesInputSchema: z.ZodObject<{
    generalEmailsAccepted: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    invoiceEmailsAccepted: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    supportEmailsAccepted: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    productEmailsAccepted: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    domainEmailsAccepted: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    affiliateEmailsAccepted: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    marketingEmailsAccepted: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    smsMarketingAccepted: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const userAdminFieldsSchema: z.ZodObject<{
    adminNotes: z.ZodNullable<z.ZodString>;
    howDidYouFindUs: z.ZodNullable<z.ZodString>;
    acceptedTermsAndConditions: z.ZodNullable<z.ZodBoolean>;
}, z.core.$strip>;
export declare const userAdminFieldsInputSchema: z.ZodObject<{
    adminNotes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    howDidYouFindUs: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    acceptedTermsAndConditions: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
}, z.core.$strip>;
declare const EMAIL_PREFERENCE_KEYS: readonly ["generalEmailsAccepted", "invoiceEmailsAccepted", "supportEmailsAccepted", "productEmailsAccepted", "domainEmailsAccepted", "affiliateEmailsAccepted", "marketingEmailsAccepted", "smsMarketingAccepted"];
type EmailPreferenceKey = (typeof EMAIL_PREFERENCE_KEYS)[number];
export type UserEmailPreferenceRow = Record<EmailPreferenceKey, boolean | null>;
export type UserAdminFieldRow = {
    adminNotes: string | null;
    howDidYouFindUs: string | null;
    acceptedTermsAndConditions: boolean | null;
};
export declare function mapUserEmailPreferences(row: UserEmailPreferenceRow): {
    generalEmailsAccepted: boolean | null;
    invoiceEmailsAccepted: boolean | null;
    supportEmailsAccepted: boolean | null;
    productEmailsAccepted: boolean | null;
    domainEmailsAccepted: boolean | null;
    affiliateEmailsAccepted: boolean | null;
    marketingEmailsAccepted: boolean | null;
    smsMarketingAccepted: boolean | null;
};
export declare function mapUserAdminFields(row: UserAdminFieldRow): {
    adminNotes: string | null;
    howDidYouFindUs: string | null;
    acceptedTermsAndConditions: boolean | null;
};
export declare function pickEmailPreferenceUpdates(input: z.infer<typeof userEmailPreferencesInputSchema>): Partial<Record<EmailPreferenceKey, boolean | null>>;
export declare function pickAdminFieldUpdates(input: z.infer<typeof userAdminFieldsInputSchema>): Partial<UserAdminFieldRow>;
export declare function hasEmailPreferenceUpdates(input: z.infer<typeof userEmailPreferencesInputSchema>): boolean;
export declare function hasAdminFieldUpdates(input: z.infer<typeof userAdminFieldsInputSchema>): boolean;
export declare function hasAnyUserExtraFieldUpdates(input: z.infer<typeof userEmailPreferencesInputSchema> & z.infer<typeof userAdminFieldsInputSchema>): boolean;
export {};
