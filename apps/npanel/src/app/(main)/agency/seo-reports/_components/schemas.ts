import { z } from "zod";

export const seoSiteSchema = z.object({
    siteUrl: z.string(),
    permissionLevel: z.string(),
});

export type SeoSite = z.infer<typeof seoSiteSchema>;

export const seoAutomatedReportInputSchema = z.object({
    siteId: z.string(),
    propertyId: z.string().optional(),
    from: z.string(),
    to: z.string(),
});
