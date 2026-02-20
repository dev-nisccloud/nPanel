import { z } from "zod";

export const seoSiteSchema = z.object({
    siteUrl: z.string(),
    permissionLevel: z.string().nullable().optional(),
    ga4PropertyId: z.string().nullable().optional(),
    ga4DisplayName: z.string().nullable().optional(),
});

export type SeoSite = z.infer<typeof seoSiteSchema>;

export const seoAutomatedReportInputSchema = z.object({
    siteId: z.string(),
    ga4PropertyId: z.string().optional(),
    from: z.string(),
    to: z.string(),
});
