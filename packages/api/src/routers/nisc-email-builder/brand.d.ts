import { z } from "zod";
export declare const previewWebsiteBrandSchema: z.ZodObject<{
    websiteUrl: z.ZodString;
    companyHint: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const nebBrandRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /** Optional preview before submit - same extraction as startBuild */
    previewFromWebsite: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            websiteUrl: string;
            companyHint?: string | undefined;
        };
        output: import("../../lib/nisc-email-builder/website-brand-extract").WebsiteBrandEnrichment;
        meta: object;
    }>;
}>>;
