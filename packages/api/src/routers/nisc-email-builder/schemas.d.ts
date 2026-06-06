import { z } from "zod";
export declare const createDesignSchema: z.ZodObject<{
    name: z.ZodString;
    teamId: z.ZodOptional<z.ZodString>;
    brandKitId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const listDesignsSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    teamId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const designIdSchema: z.ZodObject<{
    designId: z.ZodString;
}, z.core.$strip>;
/** Accepts `designId` (preferred) or legacy `id` from email-builder hooks. */
export declare const nebDesignRefSchema: z.ZodPipe<z.ZodObject<{
    designId: z.ZodOptional<z.ZodString>;
    id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodTransform<{
    designId: string;
}, {
    designId?: string | undefined;
    id?: string | undefined;
}>>;
export declare const updateDesignMetaSchema: z.ZodObject<{
    designId: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    subject: z.ZodOptional<z.ZodString>;
    preheader: z.ZodOptional<z.ZodString>;
    brandKitId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const startBuildSchema: z.ZodObject<{
    designId: z.ZodString;
    brief: z.ZodObject<{
        companyName: z.ZodOptional<z.ZodString>;
        productName: z.ZodOptional<z.ZodString>;
        audience: z.ZodOptional<z.ZodString>;
        goal: z.ZodOptional<z.ZodString>;
        tone: z.ZodOptional<z.ZodString>;
        emailType: z.ZodOptional<z.ZodString>;
        instructions: z.ZodOptional<z.ZodString>;
        brandColors: z.ZodOptional<z.ZodArray<z.ZodString>>;
        ctaUrl: z.ZodOptional<z.ZodString>;
        websiteUrl: z.ZodOptional<z.ZodString>;
        logoUrl: z.ZodOptional<z.ZodString>;
        companyContext: z.ZodOptional<z.ZodString>;
        webSearchFound: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const sendChatSchema: z.ZodObject<{
    designId: z.ZodString;
    message: z.ZodString;
    currentHtml: z.ZodOptional<z.ZodString>;
    intent: z.ZodOptional<z.ZodEnum<{
        edit: "edit";
        full_revamp: "full_revamp";
    }>>;
}, z.core.$strip>;
export declare const approveBuildSchema: z.ZodObject<{
    designId: z.ZodString;
}, z.core.$strip>;
export declare const retryHtmlBuildSchema: z.ZodObject<{
    designId: z.ZodString;
}, z.core.$strip>;
export declare const restoreVersionSchema: z.ZodObject<{
    designId: z.ZodString;
    versionId: z.ZodString;
}, z.core.$strip>;
export declare const generateVariationSchema: z.ZodObject<{
    designId: z.ZodString;
}, z.core.$strip>;
export declare const selectVariationSchema: z.ZodObject<{
    designId: z.ZodString;
    variationId: z.ZodString;
}, z.core.$strip>;
export declare const saveHtmlSchema: z.ZodObject<{
    designId: z.ZodString;
    html: z.ZodString;
    changeSummary: z.ZodOptional<z.ZodString>;
    inPlace: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const createBrandKitSchema: z.ZodObject<{
    name: z.ZodString;
    teamId: z.ZodOptional<z.ZodString>;
    colors: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    footerLegal: z.ZodOptional<z.ZodString>;
    logoAssetId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const listBrandKitsSchema: z.ZodObject<{
    teamId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
