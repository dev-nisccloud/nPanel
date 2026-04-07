import { z } from "zod";
export declare const createProjectSchema: z.ZodObject<{
    name: z.ZodString;
    json: z.ZodString;
    width: z.ZodNumber;
    height: z.ZodNumber;
    teamId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateProjectSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    json: z.ZodOptional<z.ZodString>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    thumbnailUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const getProjectSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const getProjectsSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    teamId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const deleteProjectSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const duplicateProjectSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const createTemplateSchema: z.ZodObject<{
    name: z.ZodString;
    json: z.ZodString;
    width: z.ZodNumber;
    height: z.ZodNumber;
    isPublic: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const updateTemplateSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    json: z.ZodOptional<z.ZodString>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    thumbnailUrl: z.ZodOptional<z.ZodString>;
    isPublic: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const getTemplateSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const getTemplatesSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const deleteTemplateSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const generateImageSchema: z.ZodObject<{
    prompt: z.ZodString;
    referenceImageUrls: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    teamId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const removeBgSchema: z.ZodObject<{
    image: z.ZodString;
}, z.core.$strip>;
export declare const getAiGenerationsSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    teamId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const deleteAiGenerationSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const createUploadSchema: z.ZodObject<{
    fileUrl: z.ZodString;
    fileKey: z.ZodString;
    fileName: z.ZodString;
    fileSize: z.ZodNumber;
    mimeType: z.ZodString;
    fileMetadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    teamId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const getUploadsSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    teamId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const deleteUploadSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const getImagesSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    perPage: z.ZodDefault<z.ZodNumber>;
    query: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const imageGenAiGenerationSchema: z.ZodObject<{
    id: z.ZodString;
    prompt: z.ZodString;
    referenceImageUrls: z.ZodArray<z.ZodString>;
    imageUrl: z.ZodString;
    imageFileName: z.ZodString;
    imageSize: z.ZodNumber;
    imageMimeType: z.ZodString;
    imageMetadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodAny>>;
    modelId: z.ZodString;
    modelName: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export declare const imageGenProjectSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    json: z.ZodString;
    width: z.ZodNumber;
    height: z.ZodNumber;
    thumbnailUrl: z.ZodNullable<z.ZodString>;
    userId: z.ZodString;
    teamId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export declare const imageGenTemplateSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    json: z.ZodString;
    width: z.ZodNumber;
    height: z.ZodNumber;
    thumbnailUrl: z.ZodNullable<z.ZodString>;
    isPublic: z.ZodBoolean;
    userId: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export declare const getAiGenerationsResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        prompt: z.ZodString;
        referenceImageUrls: z.ZodArray<z.ZodString>;
        imageUrl: z.ZodString;
        imageFileName: z.ZodString;
        imageSize: z.ZodNumber;
        imageMimeType: z.ZodString;
        imageMetadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodAny>>;
        modelId: z.ZodString;
        modelName: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, z.core.$strip>>;
    nextPage: z.ZodNullable<z.ZodNumber>;
}, z.core.$strip>;
export declare const imageGenUploadSchema: z.ZodObject<{
    id: z.ZodString;
    fileUrl: z.ZodString;
    fileName: z.ZodString;
    fileSize: z.ZodNumber;
    mimeType: z.ZodString;
    fileMetadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export declare const getUploadsResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        fileUrl: z.ZodString;
        fileName: z.ZodString;
        fileSize: z.ZodNumber;
        mimeType: z.ZodString;
        fileMetadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodAny>>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, z.core.$strip>>;
    nextPage: z.ZodNullable<z.ZodNumber>;
}, z.core.$strip>;
export declare const generateImageResponseSchema: z.ZodObject<{
    data: z.ZodString;
    generationId: z.ZodString;
}, z.core.$strip>;
export declare const updateGenerationAfterUploadResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const removeBgResponseSchema: z.ZodObject<{
    data: z.ZodString;
}, z.core.$strip>;
