import { z } from "zod";
export declare const backgroundRemoverStatusSchema: z.ZodEnum<{
    PROCESSING: "PROCESSING";
    QUEUED: "QUEUED";
    COMPLETED: "COMPLETED";
    FAILED: "FAILED";
}>;
export type BackgroundRemoverStatus = z.infer<typeof backgroundRemoverStatusSchema>;
export declare const startBackgroundRemovalSchema: z.ZodObject<{
    image: z.ZodString;
    teamId: z.ZodOptional<z.ZodString>;
    originalImageKey: z.ZodOptional<z.ZodString>;
    originalImageFileName: z.ZodOptional<z.ZodString>;
    originalImageSize: z.ZodOptional<z.ZodNumber>;
    originalImageMimeType: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const startBackgroundRemovalResponseSchema: z.ZodObject<{
    generationId: z.ZodString;
    status: z.ZodEnum<{
        PROCESSING: "PROCESSING";
        QUEUED: "QUEUED";
        COMPLETED: "COMPLETED";
        FAILED: "FAILED";
    }>;
}, z.core.$strip>;
export declare const removeBackgroundSchema: z.ZodObject<{
    image: z.ZodString;
    teamId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateBackgroundRemovalAfterUploadSchema: z.ZodObject<{
    generationId: z.ZodString;
    originalImageUrl: z.ZodString;
    originalImageKey: z.ZodString;
    originalImageFileName: z.ZodString;
    originalImageSize: z.ZodNumber;
    originalImageMimeType: z.ZodString;
    processedImageUrl: z.ZodString;
    processedImageKey: z.ZodString;
    processedImageFileName: z.ZodString;
    processedImageSize: z.ZodNumber;
    processedImageMimeType: z.ZodString;
}, z.core.$strip>;
export declare const getBackgroundRemovalsSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    teamId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const deleteBackgroundRemovalSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const backgroundRemoverGenerationSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    teamId: z.ZodNullable<z.ZodString>;
    originalImageUrl: z.ZodString;
    originalImageKey: z.ZodString;
    originalImageFileName: z.ZodString;
    originalImageSize: z.ZodNumber;
    originalImageMimeType: z.ZodString;
    originalImageMetadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodAny>>;
    processedImageUrl: z.ZodNullable<z.ZodString>;
    processedImageKey: z.ZodNullable<z.ZodString>;
    processedImageFileName: z.ZodNullable<z.ZodString>;
    processedImageSize: z.ZodNullable<z.ZodNumber>;
    processedImageMimeType: z.ZodNullable<z.ZodString>;
    processedImageMetadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodAny>>;
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
}, z.core.$strip>;
export declare const getBackgroundRemovalsResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        teamId: z.ZodNullable<z.ZodString>;
        originalImageUrl: z.ZodString;
        originalImageKey: z.ZodString;
        originalImageFileName: z.ZodString;
        originalImageSize: z.ZodNumber;
        originalImageMimeType: z.ZodString;
        originalImageMetadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodAny>>;
        processedImageUrl: z.ZodNullable<z.ZodString>;
        processedImageKey: z.ZodNullable<z.ZodString>;
        processedImageFileName: z.ZodNullable<z.ZodString>;
        processedImageSize: z.ZodNullable<z.ZodNumber>;
        processedImageMimeType: z.ZodNullable<z.ZodString>;
        processedImageMetadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodAny>>;
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
    }, z.core.$strip>>;
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        totalPages: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const removeBackgroundResponseSchema: z.ZodObject<{
    data: z.ZodString;
    generationId: z.ZodString;
}, z.core.$strip>;
export declare const updateBackgroundRemovalAfterUploadResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
