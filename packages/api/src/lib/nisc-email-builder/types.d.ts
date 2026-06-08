import { z } from "zod";
export declare const nebBriefSchema: z.ZodObject<{
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
export type NebBrief = z.infer<typeof nebBriefSchema>;
export declare const imageSlotSchema: z.ZodObject<{
    key: z.ZodString;
    kind: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        photo: "photo";
        icon: "icon";
        hero: "hero";
    }>>>;
    prompt: z.ZodString;
    alt: z.ZodString;
    aspectRatio: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<"16:9" | "3:2" | "1:1" | "9:16" | "4:3", string | undefined>>;
    imageSize: z.ZodPipe<z.ZodOptional<z.ZodEnum<{
        "1K": "1K";
        "2K": "2K";
    }>>, z.ZodTransform<"1K" | "2K", "1K" | "2K" | undefined>>;
    backgroundColor: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type NebImageSlot = z.infer<typeof imageSlotSchema>;
export declare const plannerOutputSchema: z.ZodObject<{
    archetype: z.ZodString;
    subject: z.ZodString;
    preheader: z.ZodString;
    assistant_summary: z.ZodString;
    image_slots: z.ZodDefault<z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        kind: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            photo: "photo";
            icon: "icon";
            hero: "hero";
        }>>>;
        prompt: z.ZodString;
        alt: z.ZodString;
        aspectRatio: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<"16:9" | "3:2" | "1:1" | "9:16" | "4:3", string | undefined>>;
        imageSize: z.ZodPipe<z.ZodOptional<z.ZodEnum<{
            "1K": "1K";
            "2K": "2K";
        }>>, z.ZodTransform<"1K" | "2K", "1K" | "2K" | undefined>>;
        backgroundColor: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    copy_strategy: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type NebPlannerOutput = z.infer<typeof plannerOutputSchema>;
export declare const htmlArchitectOutputSchema: z.ZodObject<{
    html: z.ZodString;
    change_summary: z.ZodString;
    assistant_text: z.ZodString;
}, z.core.$strip>;
export type NebHtmlArchitectOutput = z.infer<typeof htmlArchitectOutputSchema>;
export declare const revisionOutputSchema: z.ZodObject<{
    html: z.ZodString;
    change_summary: z.ZodString;
    assistant_text: z.ZodString;
    image_slots: z.ZodOptional<z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        kind: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            photo: "photo";
            icon: "icon";
            hero: "hero";
        }>>>;
        prompt: z.ZodString;
        alt: z.ZodString;
        aspectRatio: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<"16:9" | "3:2" | "1:1" | "9:16" | "4:3", string | undefined>>;
        imageSize: z.ZodPipe<z.ZodOptional<z.ZodEnum<{
            "1K": "1K";
            "2K": "2K";
        }>>, z.ZodTransform<"1K" | "2K", "1K" | "2K" | undefined>>;
        backgroundColor: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type NebRevisionOutput = z.infer<typeof revisionOutputSchema>;
/** Output schema for the direct build path (template-guided, no vision spec). */
export declare const directBuildOutputSchema: z.ZodObject<{
    html: z.ZodString;
    change_summary: z.ZodString;
    assistant_text: z.ZodString;
    subject: z.ZodOptional<z.ZodString>;
    preheader: z.ZodOptional<z.ZodString>;
    image_slots: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        kind: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            photo: "photo";
            icon: "icon";
            hero: "hero";
        }>>>;
        prompt: z.ZodString;
        alt: z.ZodString;
        aspectRatio: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<"16:9" | "3:2" | "1:1" | "9:16" | "4:3", string | undefined>>;
        imageSize: z.ZodPipe<z.ZodOptional<z.ZodEnum<{
            "1K": "1K";
            "2K": "2K";
        }>>, z.ZodTransform<"1K" | "2K", "1K" | "2K" | undefined>>;
        backgroundColor: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>>;
}, z.core.$strip>;
export type NebDirectBuildOutput = z.infer<typeof directBuildOutputSchema>;
export declare const compAnalysisOutputSchema: z.ZodObject<{
    analysis_thinking: z.ZodOptional<z.ZodString>;
    layout_blueprint: z.ZodString;
    exact_copy: z.ZodObject<{
        subject: z.ZodString;
        preheader: z.ZodString;
        headlines: z.ZodDefault<z.ZodArray<z.ZodString>>;
        subheadlines: z.ZodDefault<z.ZodArray<z.ZodString>>;
        bodyParagraphs: z.ZodDefault<z.ZodArray<z.ZodString>>;
        ctaLabels: z.ZodDefault<z.ZodArray<z.ZodString>>;
        footerText: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    colors: z.ZodOptional<z.ZodObject<{
        pageBackground: z.ZodOptional<z.ZodString>;
        sectionBackgrounds: z.ZodOptional<z.ZodArray<z.ZodObject<{
            section: z.ZodString;
            color: z.ZodString;
        }, z.core.$strip>>>;
        primaryText: z.ZodOptional<z.ZodString>;
        secondaryText: z.ZodOptional<z.ZodString>;
        accent: z.ZodOptional<z.ZodString>;
        ctaBackground: z.ZodOptional<z.ZodString>;
        ctaText: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    typography: z.ZodOptional<z.ZodString>;
    sections: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        type: z.ZodString;
        backgroundColor: z.ZodOptional<z.ZodString>;
        textColor: z.ZodOptional<z.ZodString>;
        paddingTopPx: z.ZodOptional<z.ZodNumber>;
        paddingBottomPx: z.ZodOptional<z.ZodNumber>;
        elements: z.ZodDefault<z.ZodArray<z.ZodObject<{
            kind: z.ZodString;
            text: z.ZodOptional<z.ZodString>;
            color: z.ZodOptional<z.ZodString>;
            fontSizePx: z.ZodOptional<z.ZodNumber>;
            fontWeight: z.ZodOptional<z.ZodString>;
            alignment: z.ZodOptional<z.ZodString>;
            imageKey: z.ZodOptional<z.ZodString>;
            iconHtml: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>>;
    image_slots: z.ZodDefault<z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        kind: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            photo: "photo";
            icon: "icon";
            hero: "hero";
        }>>>;
        prompt: z.ZodString;
        alt: z.ZodString;
        aspectRatio: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<"16:9" | "3:2" | "1:1" | "9:16" | "4:3", string | undefined>>;
        imageSize: z.ZodPipe<z.ZodOptional<z.ZodEnum<{
            "1K": "1K";
            "2K": "2K";
        }>>, z.ZodTransform<"1K" | "2K", "1K" | "2K" | undefined>>;
        backgroundColor: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    icons: z.ZodDefault<z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        description: z.ZodString;
        htmlHint: z.ZodString;
        sectionId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    fidelity_checklist: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type NebCompAnalysisOutput = z.infer<typeof compAnalysisOutputSchema>;
export type NebValidationReport = {
    ok: boolean;
    errors: string[];
    warnings: string[];
};
export declare const IMAGE_PLACEHOLDER_PREFIX = "{{NEB_IMG:";
export declare function imagePlaceholder(key: string): string;
