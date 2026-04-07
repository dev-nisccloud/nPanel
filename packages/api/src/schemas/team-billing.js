import { z } from "zod";
/**
 * API-layer schema for team billing settings.
 * Keeps the API independent of Prisma/DB generated types and enums.
 * Use this (and inferred types) in lib and routers instead of @prisma/client or Prisma.* types.
 */
const nullableString = z.string().trim().optional().nullable();
/** Shape of team billing settings as used across the API (e.g. from DB or input). */
export const teamBillingSettingsSchema = z.object({
    id: z.string().optional(),
    teamId: z.string().optional(),
    updatedBy: z.string().optional(),
    legalName: nullableString,
    billingEmail: nullableString,
    billingPhone: nullableString,
    addressLine1: nullableString,
    addressLine2: nullableString,
    city: nullableString,
    state: nullableString,
    country: nullableString,
    postalCode: nullableString,
    taxId: nullableString,
    additionalNotes: nullableString,
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
});
/** Fields required for "billing complete" (e.g. auto-invoice creation). */
export const TEAM_BILLING_REQUIRED_FIELDS = [
    "legalName",
    "billingEmail",
    "addressLine1",
    "city",
    "country",
];
/** Returns true if billing has all required fields non-empty. */
export function isTeamBillingComplete(billing) {
    if (billing == null)
        return false;
    return TEAM_BILLING_REQUIRED_FIELDS.every((field) => {
        const value = billing[field];
        return typeof value === "string" && value.trim().length > 0;
    });
}
