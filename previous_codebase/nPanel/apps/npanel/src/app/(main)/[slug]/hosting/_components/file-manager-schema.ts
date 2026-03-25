import { z } from "zod";

export const fileManagerItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["file", "folder"]),
  size: z.number().optional(), // in bytes, only for files
  modified: z.string(), // ISO date string
  permissions: z.string(), // e.g., "755", "644"
  path: z.string(), // full path from root
  extension: z.string().optional(), // file extension without dot
  mimeType: z.string().optional(), // MIME type for files
});

export type FileManagerItem = z.infer<typeof fileManagerItemSchema>;

export const fileManagerSchema = z.object({
  currentPath: z.string(),
  items: z.array(fileManagerItemSchema),
  breadcrumbs: z.array(z.object({
    name: z.string(),
    path: z.string(),
  })),
});

export type FileManagerData = z.infer<typeof fileManagerSchema>;
