import { z } from "zod";
/**
 * API-layer schemas for web design quote requests.
 * Independent from DB Prisma schema and UI schemas no shared types across layers.
 */
export declare const apiWebDesignProjectTypeSchema: z.ZodEnum<{
    OTHER: "OTHER";
    NEW_WEBSITE: "NEW_WEBSITE";
    REDESIGN: "REDESIGN";
    ECOMMERCE: "ECOMMERCE";
    LANDING_PAGE: "LANDING_PAGE";
    WEB_APP: "WEB_APP";
}>;
export type ApiWebDesignProjectType = z.infer<typeof apiWebDesignProjectTypeSchema>;
export declare const apiWebDesignQuoteStatusSchema: z.ZodEnum<{
    PENDING: "PENDING";
    ACCEPTED: "ACCEPTED";
    EXPIRED: "EXPIRED";
    DECLINED: "DECLINED";
    CONTACTED: "CONTACTED";
    QUOTED: "QUOTED";
}>;
export type ApiWebDesignQuoteStatus = z.infer<typeof apiWebDesignQuoteStatusSchema>;
export declare const webDesignQuoteCreateInputSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    companyName: z.ZodString;
    domain: z.ZodOptional<z.ZodString>;
    projectType: z.ZodEnum<{
        OTHER: "OTHER";
        NEW_WEBSITE: "NEW_WEBSITE";
        REDESIGN: "REDESIGN";
        ECOMMERCE: "ECOMMERCE";
        LANDING_PAGE: "LANDING_PAGE";
        WEB_APP: "WEB_APP";
    }>;
    projectDescription: z.ZodString;
    budget: z.ZodString;
    targetLaunchDate: z.ZodPipe<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodCoercedDate<unknown>, z.ZodDate]>>, z.ZodTransform<Date | undefined, string | Date | undefined>>;
}, z.core.$strip>;
export type WebDesignQuoteCreateInput = z.infer<typeof webDesignQuoteCreateInputSchema>;
export declare const webDesignQuoteCreateOutputSchema: z.ZodObject<{
    id: z.ZodString;
    createdAt: z.ZodDate;
}, z.core.$strip>;
export type WebDesignQuoteCreateOutput = z.infer<typeof webDesignQuoteCreateOutputSchema>;
export declare const webDesignQuoteItemSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    companyName: z.ZodString;
    domain: z.ZodNullable<z.ZodString>;
    projectType: z.ZodEnum<{
        OTHER: "OTHER";
        NEW_WEBSITE: "NEW_WEBSITE";
        REDESIGN: "REDESIGN";
        ECOMMERCE: "ECOMMERCE";
        LANDING_PAGE: "LANDING_PAGE";
        WEB_APP: "WEB_APP";
    }>;
    projectDescription: z.ZodString;
    budget: z.ZodString;
    targetLaunchDate: z.ZodNullable<z.ZodDate>;
    status: z.ZodEnum<{
        PENDING: "PENDING";
        ACCEPTED: "ACCEPTED";
        EXPIRED: "EXPIRED";
        DECLINED: "DECLINED";
        CONTACTED: "CONTACTED";
        QUOTED: "QUOTED";
    }>;
    submittedById: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export type WebDesignQuoteItem = z.infer<typeof webDesignQuoteItemSchema>;
export declare const webDesignQuoteListOutputSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        email: z.ZodString;
        phone: z.ZodString;
        companyName: z.ZodString;
        domain: z.ZodNullable<z.ZodString>;
        projectType: z.ZodEnum<{
            OTHER: "OTHER";
            NEW_WEBSITE: "NEW_WEBSITE";
            REDESIGN: "REDESIGN";
            ECOMMERCE: "ECOMMERCE";
            LANDING_PAGE: "LANDING_PAGE";
            WEB_APP: "WEB_APP";
        }>;
        projectDescription: z.ZodString;
        budget: z.ZodString;
        targetLaunchDate: z.ZodNullable<z.ZodDate>;
        status: z.ZodEnum<{
            PENDING: "PENDING";
            ACCEPTED: "ACCEPTED";
            EXPIRED: "EXPIRED";
            DECLINED: "DECLINED";
            CONTACTED: "CONTACTED";
            QUOTED: "QUOTED";
        }>;
        submittedById: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, z.core.$strip>>;
    total: z.ZodNumber;
}, z.core.$strip>;
export type WebDesignQuoteListOutput = z.infer<typeof webDesignQuoteListOutputSchema>;
export declare const webDesignQuoteListInputSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<{
        PENDING: "PENDING";
        ACCEPTED: "ACCEPTED";
        EXPIRED: "EXPIRED";
        DECLINED: "DECLINED";
        CONTACTED: "CONTACTED";
        QUOTED: "QUOTED";
    }>>;
}, z.core.$strip>;
export type WebDesignQuoteListInput = z.infer<typeof webDesignQuoteListInputSchema>;
