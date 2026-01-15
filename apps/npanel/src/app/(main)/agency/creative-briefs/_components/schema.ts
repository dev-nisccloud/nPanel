import { z } from "zod";

// UI Layer Schema - Independent from DB and API schemas
// Dates can be Date objects or ISO strings (from tRPC serialization)
const dateSchema = z.union([z.date(), z.string()]).transform((val) => typeof val === "string" ? new Date(val) : val);
const nullableDateSchema = z.union([z.date(), z.string()]).nullable().transform((val) => val === null ? null : (typeof val === "string" ? new Date(val) : val));

export const creativeBriefReferenceImageSchema = z.object({
  id: z.string(),
  creativeBriefId: z.string(),
  fileUrl: z.string(),
  fileKey: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  fileMetadata: z.unknown().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

export const creativeBriefSchema = z.object({
  id: z.string(),
  name: z.string(),
  userId: z.string(),
  teamId: z.string().nullable(),
  status: z.enum(["DRAFT", "REVIEWING", "APPROVED", "REJECTED"]),
  background: z.string(),
  objectives: z.string(),
  requirements: z.string(),
  comments: z.string().nullable(),
  approvedBy: z.string().nullable(),
  approvedAt: nullableDateSchema,
  rejectedBy: z.string().nullable(),
  rejectedAt: nullableDateSchema,
  timelineStartDate: nullableDateSchema,
  timelineEndDate: nullableDateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }).optional(),
  team: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }).nullable().optional(),
  referenceImages: z.array(creativeBriefReferenceImageSchema).optional(),
});

export type CreativeBrief = z.infer<typeof creativeBriefSchema>;
export type CreativeBriefReferenceImage = z.infer<typeof creativeBriefReferenceImageSchema>;
