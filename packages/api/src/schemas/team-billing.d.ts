import { z } from "zod";
/** Shape of team billing settings as used across the API (e.g. from DB or input). */
export declare const teamBillingSettingsSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    teamId: z.ZodOptional<z.ZodString>;
    updatedBy: z.ZodOptional<z.ZodString>;
    legalName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    billingEmail: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    billingPhone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    addressLine1: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    addressLine2: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    city: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    state: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    country: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    postalCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    taxId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    additionalNotes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    updatedAt: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
export type TeamBillingSettings = z.infer<typeof teamBillingSettingsSchema>;
/** Fields required for "billing complete" (e.g. auto-invoice creation). */
export declare const TEAM_BILLING_REQUIRED_FIELDS: readonly ["legalName", "billingEmail", "addressLine1", "city", "country"];
export type TeamBillingRequiredField = (typeof TEAM_BILLING_REQUIRED_FIELDS)[number];
/** Returns true if billing has all required fields non-empty. */
export declare function isTeamBillingComplete(billing: TeamBillingSettings | null | undefined): boolean;
