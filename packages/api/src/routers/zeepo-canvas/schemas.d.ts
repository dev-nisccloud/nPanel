import { z } from "zod";
export declare const zeepoCanvasProjectSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    userId: z.ZodString;
    teamId: z.ZodNullable<z.ZodString>;
    canvasJson: z.ZodAny;
    width: z.ZodNumber;
    height: z.ZodNumber;
    thumbnailUrl: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export declare const createProjectSchema: z.ZodObject<{
    name: z.ZodString;
    teamId: z.ZodOptional<z.ZodString>;
    canvasJson: z.ZodOptional<z.ZodAny>;
    width: z.ZodDefault<z.ZodNumber>;
    height: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const getProjectSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const getProjectsSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    teamId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateProjectSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    canvasJson: z.ZodOptional<z.ZodAny>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    thumbnailUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const deleteProjectSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const duplicateProjectSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const startGenerationSchema: z.ZodObject<{
    projectId: z.ZodString;
    nodeId: z.ZodString;
    teamId: z.ZodOptional<z.ZodString>;
    modelCategory: z.ZodString;
    modelId: z.ZodString;
    prompt: z.ZodOptional<z.ZodString>;
    inputs: z.ZodOptional<z.ZodAny>;
}, z.core.$strip>;
export declare const getGenerationSchema: z.ZodObject<{
    generationId: z.ZodString;
}, z.core.$strip>;
export declare const getGenerationsByNodeSchema: z.ZodObject<{
    projectId: z.ZodString;
    nodeId: z.ZodString;
}, z.core.$strip>;
