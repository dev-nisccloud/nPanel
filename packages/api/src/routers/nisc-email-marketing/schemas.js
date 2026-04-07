import { z } from "zod";
const optStr = () => z.string().optional();
const optStrNullable = () => z.string().optional().nullable();
const optJson = () => z.unknown().optional().nullable();
export const niscEmailDomainStatusSchema = z.enum([
    "PENDING",
    "VERIFIED",
    "FAILED",
    "DELETING",
]);
export const niscDkimStatusSchema = z.enum([
    "Pending",
    "Success",
    "Failed",
    "TemporaryFailure",
    "NotStarted",
]);
export const niscMailFromModeSchema = z.enum(["DEFAULT", "CUSTOM"]);
export const niscEmailDomainCreateInputSchema = z.object({
    domainName: z.string().min(1, "Domain name is required"),
    teamId: optStrNullable(),
});
export const niscEmailDomainVerifyInputSchema = z.object({
    id: z.string().min(1),
});
export const niscEmailDomainListFiltersSchema = z.object({
    teamId: optStrNullable(),
    status: niscEmailDomainStatusSchema.optional(),
    search: optStrNullable().default(undefined),
    limit: z.number().int().min(1).max(100).optional().default(50),
    offset: z.number().int().min(0).optional().default(0),
});
export const niscEmailDomainSummarySchema = z.object({
    id: z.string(),
    domainName: z.string(),
    status: niscEmailDomainStatusSchema,
    dkimStatus: niscDkimStatusSchema,
    mailFromMode: niscMailFromModeSchema,
    mailFromStatus: z.string().optional().nullable(),
    userId: z.string(),
    teamId: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    verifiedAt: z.date().nullable(),
});
export const niscEmailDomainDetailSchema = niscEmailDomainSummarySchema.extend({
    dkimTokens: z.array(z.string()),
    dnsRecords: optJson(),
    mailFromDomain: z.string().optional().nullable(),
    feedbackForwardingDisabled: z.boolean(),
});
export const niscEmailDomainListResponseSchema = z.object({
    domains: z.array(niscEmailDomainSummarySchema),
    total: z.number().int().nonnegative(),
});
// =============================================================================
// Quota schemas
// =============================================================================
export const niscEmailQuotaStatusSchema = z.object({
    windowStart: z.date(),
    windowEnd: z.date(),
    maxSendRate: z.number().int().nonnegative(),
    max24HourSend: z.number().int().nonnegative(),
    sentLast24HoursAtStart: z.number().int().nonnegative(),
    reservedEmails: z.number().int().nonnegative(),
    remainingEmails: z.number().int().nonnegative(),
});
