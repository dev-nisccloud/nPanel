import { z } from "zod";
export declare const generationStatusSchema: z.ZodEnum<{
    PROCESSING: "PROCESSING";
    QUEUED: "QUEUED";
    COMPLETED: "COMPLETED";
    FAILED: "FAILED";
}>;
export type GenerationStatus = z.infer<typeof generationStatusSchema>;
export declare const variationStatusSchema: z.ZodEnum<{
    PROCESSING: "PROCESSING";
    COMPLETED: "COMPLETED";
    FAILED: "FAILED";
}>;
export type VariationStatus = z.infer<typeof variationStatusSchema>;
export declare const aspectRatioSchema: z.ZodEnum<{
    "21:9": "21:9";
    "16:9": "16:9";
    "3:2": "3:2";
    "5:4": "5:4";
    "1:1": "1:1";
    "4:5": "4:5";
    "2:3": "2:3";
    "9:16": "9:16";
    "3:4": "3:4";
    "4:3": "4:3";
}>;
export declare const outputFormatSchema: z.ZodEnum<{
    png: "png";
    jpg: "jpg";
}>;
export declare const resolutionSchema: z.ZodEnum<{
    "1K": "1K";
    "2K": "2K";
    "4K": "4K";
}>;
export declare const startGenerationSchema: z.ZodObject<{
    prompt: z.ZodString;
    referenceImageUrls: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    aspectRatio: z.ZodDefault<z.ZodEnum<{
        "21:9": "21:9";
        "16:9": "16:9";
        "3:2": "3:2";
        "5:4": "5:4";
        "1:1": "1:1";
        "4:5": "4:5";
        "2:3": "2:3";
        "9:16": "9:16";
        "3:4": "3:4";
        "4:3": "4:3";
    }>>;
    outputFormat: z.ZodDefault<z.ZodEnum<{
        png: "png";
        jpg: "jpg";
    }>>;
    resolution: z.ZodDefault<z.ZodEnum<{
        "1K": "1K";
        "2K": "2K";
        "4K": "4K";
    }>>;
    variations: z.ZodDefault<z.ZodNumber>;
    teamId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const startGenerationResponseSchema: z.ZodObject<{
    generationId: z.ZodString;
    status: z.ZodEnum<{
        PROCESSING: "PROCESSING";
        QUEUED: "QUEUED";
        COMPLETED: "COMPLETED";
        FAILED: "FAILED";
    }>;
    variationsCount: z.ZodNumber;
}, z.core.$strip>;
export declare const getGenerationByIdSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const getGenerationsSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    teamId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const imageGeneratorVariationSchema: z.ZodObject<{
    id: z.ZodString;
    imageGeneratorGenerationId: z.ZodString;
    variationIndex: z.ZodNumber;
    status: z.ZodEnum<{
        PROCESSING: "PROCESSING";
        COMPLETED: "COMPLETED";
        FAILED: "FAILED";
    }>;
    errorMessage: z.ZodNullable<z.ZodString>;
    imageUrl: z.ZodNullable<z.ZodString>;
    imageKey: z.ZodNullable<z.ZodString>;
    imageFileName: z.ZodNullable<z.ZodString>;
    imageSize: z.ZodNullable<z.ZodNumber>;
    imageMimeType: z.ZodNullable<z.ZodString>;
    imageMetadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export declare const imageGeneratorGenerationSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    teamId: z.ZodNullable<z.ZodString>;
    prompt: z.ZodString;
    referenceImageUrls: z.ZodNullable<z.ZodArray<z.ZodString>>;
    aspectRatio: z.ZodString;
    outputFormat: z.ZodString;
    resolution: z.ZodString;
    variationsCount: z.ZodNumber;
    modelId: z.ZodString;
    modelName: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        PROCESSING: "PROCESSING";
        QUEUED: "QUEUED";
        COMPLETED: "COMPLETED";
        FAILED: "FAILED";
    }>;
    errorMessage: z.ZodNullable<z.ZodString>;
    qstashMessageId: z.ZodNullable<z.ZodString>;
    startedAt: z.ZodNullable<z.ZodDate>;
    completedAt: z.ZodNullable<z.ZodDate>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    variations: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        imageGeneratorGenerationId: z.ZodString;
        variationIndex: z.ZodNumber;
        status: z.ZodEnum<{
            PROCESSING: "PROCESSING";
            COMPLETED: "COMPLETED";
            FAILED: "FAILED";
        }>;
        errorMessage: z.ZodNullable<z.ZodString>;
        imageUrl: z.ZodNullable<z.ZodString>;
        imageKey: z.ZodNullable<z.ZodString>;
        imageFileName: z.ZodNullable<z.ZodString>;
        imageSize: z.ZodNullable<z.ZodNumber>;
        imageMimeType: z.ZodNullable<z.ZodString>;
        imageMetadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodAny>>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const getGenerationsResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        teamId: z.ZodNullable<z.ZodString>;
        prompt: z.ZodString;
        referenceImageUrls: z.ZodNullable<z.ZodArray<z.ZodString>>;
        aspectRatio: z.ZodString;
        outputFormat: z.ZodString;
        resolution: z.ZodString;
        variationsCount: z.ZodNumber;
        modelId: z.ZodString;
        modelName: z.ZodNullable<z.ZodString>;
        status: z.ZodEnum<{
            PROCESSING: "PROCESSING";
            QUEUED: "QUEUED";
            COMPLETED: "COMPLETED";
            FAILED: "FAILED";
        }>;
        errorMessage: z.ZodNullable<z.ZodString>;
        qstashMessageId: z.ZodNullable<z.ZodString>;
        startedAt: z.ZodNullable<z.ZodDate>;
        completedAt: z.ZodNullable<z.ZodDate>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        variations: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            imageGeneratorGenerationId: z.ZodString;
            variationIndex: z.ZodNumber;
            status: z.ZodEnum<{
                PROCESSING: "PROCESSING";
                COMPLETED: "COMPLETED";
                FAILED: "FAILED";
            }>;
            errorMessage: z.ZodNullable<z.ZodString>;
            imageUrl: z.ZodNullable<z.ZodString>;
            imageKey: z.ZodNullable<z.ZodString>;
            imageFileName: z.ZodNullable<z.ZodString>;
            imageSize: z.ZodNullable<z.ZodNumber>;
            imageMimeType: z.ZodNullable<z.ZodString>;
            imageMetadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodAny>>;
            createdAt: z.ZodDate;
            updatedAt: z.ZodDate;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        totalPages: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const deleteGenerationSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const updateVariationAfterUploadSchema: z.ZodObject<{
    variationId: z.ZodString;
    imageUrl: z.ZodString;
    imageKey: z.ZodString;
    imageFileName: z.ZodString;
    imageSize: z.ZodNumber;
    imageMimeType: z.ZodString;
}, z.core.$strip>;
export declare const generateImageSchema: z.ZodObject<{
    prompt: z.ZodString;
    referenceImageUrls: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    aspectRatio: z.ZodDefault<z.ZodEnum<{
        "21:9": "21:9";
        "16:9": "16:9";
        "3:2": "3:2";
        "5:4": "5:4";
        "1:1": "1:1";
        "4:5": "4:5";
        "2:3": "2:3";
        "9:16": "9:16";
        "3:4": "3:4";
        "4:3": "4:3";
    }>>;
    outputFormat: z.ZodDefault<z.ZodEnum<{
        png: "png";
        jpg: "jpg";
    }>>;
    resolution: z.ZodDefault<z.ZodEnum<{
        "1K": "1K";
        "2K": "2K";
        "4K": "4K";
    }>>;
    variations: z.ZodDefault<z.ZodNumber>;
    teamId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
