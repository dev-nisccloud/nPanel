import { z } from "zod";
export declare const createDocumentArgsSchema: z.ZodObject<{
    title: z.ZodString;
    content: z.ZodString;
}, z.core.$strip>;
export type CreateDocumentArgs = z.infer<typeof createDocumentArgsSchema>;
export declare const presentationSlideSchema: z.ZodObject<{
    layout: z.ZodDefault<z.ZodEnum<{
        title: "title";
        content: "content";
        bullets: "bullets";
        "image-full": "image-full";
        "two-column": "two-column";
        quote: "quote";
        "section-break": "section-break";
        stats: "stats";
        chart: "chart";
        timeline: "timeline";
        "big-number": "big-number";
    }>>;
    title: z.ZodOptional<z.ZodString>;
    subtitle: z.ZodOptional<z.ZodString>;
    body: z.ZodOptional<z.ZodString>;
    bullets: z.ZodOptional<z.ZodArray<z.ZodString>>;
    leftContent: z.ZodOptional<z.ZodString>;
    rightContent: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodOptional<z.ZodString>;
    imagePosition: z.ZodOptional<z.ZodEnum<{
        background: "background";
        left: "left";
        right: "right";
    }>>;
    bgColor: z.ZodOptional<z.ZodString>;
    textColor: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createPresentationArgsSchema: z.ZodObject<{
    title: z.ZodString;
    theme: z.ZodDefault<z.ZodEnum<{
        dark: "dark";
        light: "light";
        branded: "branded";
        minimal: "minimal";
    }>>;
    slides: z.ZodArray<z.ZodObject<{
        layout: z.ZodDefault<z.ZodEnum<{
            title: "title";
            content: "content";
            bullets: "bullets";
            "image-full": "image-full";
            "two-column": "two-column";
            quote: "quote";
            "section-break": "section-break";
            stats: "stats";
            chart: "chart";
            timeline: "timeline";
            "big-number": "big-number";
        }>>;
        title: z.ZodOptional<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        body: z.ZodOptional<z.ZodString>;
        bullets: z.ZodOptional<z.ZodArray<z.ZodString>>;
        leftContent: z.ZodOptional<z.ZodString>;
        rightContent: z.ZodOptional<z.ZodString>;
        imageUrl: z.ZodOptional<z.ZodString>;
        imagePosition: z.ZodOptional<z.ZodEnum<{
            background: "background";
            left: "left";
            right: "right";
        }>>;
        bgColor: z.ZodOptional<z.ZodString>;
        textColor: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type CreatePresentationArgs = z.infer<typeof createPresentationArgsSchema>;
export { generateImagesArgsSchema, createImagePresentationArgsSchema, type GenerateImagesArgs, type CreateImagePresentationArgs, } from "./image-schemas";
export declare const clarifyingQuestionSchema: z.ZodObject<{
    question: z.ZodString;
    options: z.ZodArray<z.ZodString>;
    allow_upload: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const askClarifyingQuestionsArgsSchema: z.ZodObject<{
    intro: z.ZodOptional<z.ZodString>;
    questions: z.ZodArray<z.ZodObject<{
        question: z.ZodString;
        options: z.ZodArray<z.ZodString>;
        allow_upload: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type AskClarifyingQuestionsArgs = z.infer<typeof askClarifyingQuestionsArgsSchema>;
export type ClarifyingQuestion = z.infer<typeof clarifyingQuestionSchema>;
/** Anthropic client tools for Zeepo AI (documents + presentations + clarifying questions). */
export declare const ZEEPO_AI_CLIENT_TOOLS: readonly [{
    readonly name: "ask_clarifying_questions";
    readonly description: "Ask the user 1–3 sharp clarifying questions with option chips before producing a deliverable. Use ONLY when context is missing. Do NOT call create_document or create_presentation in the same turn. Do NOT include an 'Other' option  the UI adds it.";
    readonly input_schema: {
        readonly type: "object";
        readonly properties: {
            readonly intro: {
                readonly type: "string";
                readonly description: "Brief intro, e.g. Before I build this out, I have a couple of quick questions.";
            };
            readonly questions: {
                readonly type: "array";
                readonly minItems: 1;
                readonly maxItems: 3;
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly question: {
                            readonly type: "string";
                        };
                        readonly options: {
                            readonly type: "array";
                            readonly minItems: 2;
                            readonly maxItems: 5;
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly allow_upload: {
                            readonly type: "boolean";
                            readonly description: "True when the answer could be a file/image upload";
                        };
                    };
                    readonly required: readonly ["question", "options"];
                };
            };
        };
        readonly required: readonly ["questions"];
    };
}, {
    readonly name: "create_document";
    readonly description: "Create a long-form markdown document (report, brief, strategy, analysis). Put the COMPLETE markdown in content  do not truncate.";
    readonly input_schema: {
        readonly type: "object";
        readonly properties: {
            readonly title: {
                readonly type: "string";
                readonly description: "Document title";
            };
            readonly content: {
                readonly type: "string";
                readonly description: "Full markdown body of the document";
            };
        };
        readonly required: readonly ["title", "content"];
    };
}, {
    readonly name: "create_presentation";
    readonly description: "Create a structured text slide deck (title, content, bullets, stats). For photorealistic / full-bleed image decks use create_image_presentation instead.";
    readonly input_schema: {
        readonly type: "object";
        readonly properties: {
            readonly title: {
                readonly type: "string";
            };
            readonly theme: {
                readonly type: "string";
                readonly enum: readonly ["dark", "light", "branded", "minimal"];
            };
            readonly slides: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly layout: {
                            readonly type: "string";
                        };
                        readonly title: {
                            readonly type: "string";
                        };
                        readonly subtitle: {
                            readonly type: "string";
                        };
                        readonly body: {
                            readonly type: "string";
                        };
                        readonly bullets: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly leftContent: {
                            readonly type: "string";
                        };
                        readonly rightContent: {
                            readonly type: "string";
                        };
                        readonly notes: {
                            readonly type: "string";
                        };
                    };
                };
            };
        };
        readonly required: readonly ["title", "slides"];
    };
}, {
    readonly name: "generate_images";
    readonly description: "Generate 1–8 images with the Zeepo design engine. Use for logos, brand assets, photos, mockups, ads, drafts. For N DISTINCT subjects (e.g. 6 products), pass prompts as an array of N single-subject prompts  never one mega-prompt with count=N (that renders collage/grids). Prefer intent=design|logo|mockup for graphic design; intent=draft for fast thumbnails; intent=suite for multi-ad campaigns. Never mention underlying model/provider names to the user.";
    readonly input_schema: {
        readonly type: "object";
        readonly properties: {
            readonly prompt: {
                readonly type: "string";
                readonly description: "Single creative brief when generating one image, or identical variations. Do NOT list multiple distinct subjects here with count>1.";
            };
            readonly prompts: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly description: "Preferred for multi-image sets: one complete single-subject prompt per image (max 8). Length sets how many images to generate.";
            };
            readonly count: {
                readonly type: "number";
                readonly description: "How many images when using a single prompt for variations (1–8). Ignored when prompts[] is provided.";
            };
            readonly aspect_ratio: {
                readonly type: "string";
                readonly enum: readonly ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];
            };
            readonly intent: {
                readonly type: "string";
                readonly enum: readonly ["design", "photo", "draft", "logo", "mockup", "suite"];
                readonly description: "Routes quality/speed. design/logo/mockup = highest fidelity.";
            };
            readonly reference_attachment_ids: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly description: "Optional session attachment ids to use as visual references";
            };
            readonly title: {
                readonly type: "string";
                readonly description: "Short label shown in the UI (shared prefix for a set)";
            };
            readonly titles: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly description: "Optional per-image labels matching prompts[] length";
            };
        };
        readonly required: readonly [];
    };
}, {
    readonly name: "create_image_presentation";
    readonly description: "Create a photorealistic / high-graphic image slide deck where every slide is a generated image. Provide a detailed prompt per slide. Prefer this over create_presentation when the user wants cinematic/visual decks.";
    readonly input_schema: {
        readonly type: "object";
        readonly properties: {
            readonly title: {
                readonly type: "string";
            };
            readonly aspect_ratio: {
                readonly type: "string";
                readonly enum: readonly ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];
                readonly description: "Default 3:2 for landscape slides";
            };
            readonly slides: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly prompt: {
                            readonly type: "string";
                        };
                        readonly caption: {
                            readonly type: "string";
                        };
                        readonly notes: {
                            readonly type: "string";
                        };
                        readonly imageUrl: {
                            readonly type: "string";
                            readonly description: "Optional existing durable image URL to reuse";
                        };
                    };
                    readonly required: readonly ["prompt"];
                };
            };
        };
        readonly required: readonly ["title", "slides"];
    };
}];
export type ZeepoAiSkillDefinition = {
    id: string;
    category: string;
    title: string;
    description: string;
    /** When false, UI shows as coming soon and server ignores selection. */
    available: boolean;
    agentDirectives?: string;
    starterPrompt?: string;
};
export declare const ZEEPO_AI_SKILLS: readonly ZeepoAiSkillDefinition[];
export declare function getZeepoAiSkillById(id: string): ZeepoAiSkillDefinition | undefined;
