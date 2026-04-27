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
export type NiscEmailDomainStatus = z.infer<typeof niscEmailDomainStatusSchema>;

export const niscDkimStatusSchema = z.enum([
  "Pending",
  "Success",
  "Failed",
  "TemporaryFailure",
  "NotStarted",
]);
export type NiscDkimStatus = z.infer<typeof niscDkimStatusSchema>;

export const niscMailFromModeSchema = z.enum(["DEFAULT", "CUSTOM"]);
export type NiscMailFromMode = z.infer<typeof niscMailFromModeSchema>;

export const niscEmailDomainCreateInputSchema = z.object({
  domainName: z.string().min(1, "Domain name is required"),
  teamId: optStrNullable(),
});
export type NiscEmailDomainCreateInput = z.infer<typeof niscEmailDomainCreateInputSchema>;

export const niscEmailDomainVerifyInputSchema = z.object({
  id: z.string().min(1),
});
export type NiscEmailDomainVerifyInput = z.infer<typeof niscEmailDomainVerifyInputSchema>;

export const niscEmailDomainSendTestEmailInputSchema = z.object({
  domainId: z.string().min(1),
  to: z.string().email(),
  cc: z.array(z.string().email()).optional().default([]),
  bcc: z.array(z.string().email()).optional().default([]),
});
export type NiscEmailDomainSendTestEmailInput = z.infer<typeof niscEmailDomainSendTestEmailInputSchema>;

export const niscEmailDomainListFiltersSchema = z.object({
  teamId: optStrNullable(),
  status: niscEmailDomainStatusSchema.optional(),
  search: optStrNullable().default(undefined),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});
export type NiscEmailDomainListFilters = z.infer<typeof niscEmailDomainListFiltersSchema>;

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
export type NiscEmailDomainSummary = z.infer<typeof niscEmailDomainSummarySchema>;

export const niscEmailDomainDetailSchema = niscEmailDomainSummarySchema.extend({
  dkimTokens: z.array(z.string()),
  dnsRecords: optJson(),
  mailFromDomain: z.string().optional().nullable(),
  feedbackForwardingDisabled: z.boolean(),
});
export type NiscEmailDomainDetail = z.infer<typeof niscEmailDomainDetailSchema>;

export const niscEmailDomainListResponseSchema = z.object({
  domains: z.array(niscEmailDomainSummarySchema),
  total: z.number().int().nonnegative(),
});
export type NiscEmailDomainListResponse = z.infer<typeof niscEmailDomainListResponseSchema>;

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
export type NiscEmailQuotaStatus = z.infer<typeof niscEmailQuotaStatusSchema>;

