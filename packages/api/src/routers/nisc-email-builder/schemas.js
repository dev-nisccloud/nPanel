import { z } from "zod";
import { nebBriefSchema } from "../../lib/nisc-email-builder/types";
export const createDesignSchema = z.object({
    name: z.string().min(1),
    teamId: z.string().optional(),
    brandKitId: z.string().optional(),
});
export const listDesignsSchema = z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(50).default(10),
    teamId: z.string().optional(),
});
export const designIdSchema = z.object({
    designId: z.string(),
});
/** Accepts `designId` (preferred) or legacy `id` from email-builder hooks. */
export const nebDesignRefSchema = z
    .object({
    designId: z.string().optional(),
    id: z.string().optional(),
})
    .refine((v) => Boolean(v.designId ?? v.id), {
    message: "designId is required",
    path: ["designId"],
})
    .transform((v) => ({ designId: (v.designId ?? v.id) }));
export const updateDesignMetaSchema = z.object({
    designId: z.string(),
    name: z.string().optional(),
    subject: z.string().optional(),
    preheader: z.string().optional(),
    brandKitId: z.string().nullable().optional(),
});
export const startBuildSchema = z.object({
    designId: z.string(),
    brief: nebBriefSchema,
});
export const sendChatSchema = z.object({
    designId: z.string(),
    message: z.string().min(1),
    /** Snapshot of the email HTML at send time (includes unsaved canvas edits). */
    currentHtml: z.string().optional(),
    intent: z.enum(["edit", "full_revamp"]).optional(),
});
export const approveBuildSchema = z.object({
    designId: z.string(),
});
export const retryHtmlBuildSchema = z.object({
    designId: z.string(),
});
export const restoreVersionSchema = z.object({
    designId: z.string(),
    versionId: z.string(),
});
export const generateVariationSchema = z.object({
    designId: z.string(),
});
export const selectVariationSchema = z.object({
    designId: z.string(),
    variationId: z.string(),
});
export const saveHtmlSchema = z.object({
    designId: z.string(),
    html: z.string().min(1),
    changeSummary: z.string().optional(),
    /** When true, updates the current version row instead of creating a new version (auto-save). */
    inPlace: z.boolean().optional(),
    /** Client version for conflict resolution (optimistic updates). */
    clientVersion: z.number().optional(),
});
export const saveHtmlContentSchema = z.object({
    designId: z.string(),
    html: z.string().min(1),
    clientVersion: z.number().optional(),
});
export const createBrandKitSchema = z.object({
    name: z.string().min(1),
    teamId: z.string().optional(),
    colors: z.record(z.string(), z.string()).optional(),
    footerLegal: z.string().optional(),
    logoAssetId: z.string().optional(),
});
export const listBrandKitsSchema = z.object({
    teamId: z.string().optional(),
});
