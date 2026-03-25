import { z } from "zod";

/**
 * API-layer schemas for web design quote requests.
 * Independent from DB Prisma schema and UI schemas—no shared types across layers.
 */

// ---------------------------------------------------------------------------
// API enums (own definitions; values align with DB for storage)
// ---------------------------------------------------------------------------

export const apiWebDesignProjectTypeSchema = z.enum([
	"NEW_WEBSITE",
	"REDESIGN",
	"ECOMMERCE",
	"LANDING_PAGE",
	"WEB_APP",
	"OTHER",
]);
export type ApiWebDesignProjectType = z.infer<typeof apiWebDesignProjectTypeSchema>;

export const apiWebDesignQuoteStatusSchema = z.enum([
	"PENDING",
	"CONTACTED",
	"QUOTED",
	"ACCEPTED",
	"DECLINED",
	"EXPIRED",
]);
export type ApiWebDesignQuoteStatus = z.infer<typeof apiWebDesignQuoteStatusSchema>;

// ---------------------------------------------------------------------------
// Create input
// ---------------------------------------------------------------------------

export const webDesignQuoteCreateInputSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().min(1, "Email is required").email("Invalid email"),
	phone: z.string().min(1, "Phone is required"),
	companyName: z.string().min(1, "Company name is required"),
	domain: z.string().trim().optional(),
	projectType: apiWebDesignProjectTypeSchema,
	projectDescription: z.string().min(1, "Project description is required"),
	budget: z.string().min(1, "Budget is required"),
	targetLaunchDate: z
		.union([z.string().datetime(), z.coerce.date(), z.date()])
		.optional()
		.transform((v) => (v instanceof Date ? v : v ? new Date(v as string) : undefined)),
});
export type WebDesignQuoteCreateInput = z.infer<typeof webDesignQuoteCreateInputSchema>;

// ---------------------------------------------------------------------------
// Create output
// ---------------------------------------------------------------------------

export const webDesignQuoteCreateOutputSchema = z.object({
	id: z.string(),
	createdAt: z.date(),
});
export type WebDesignQuoteCreateOutput = z.infer<typeof webDesignQuoteCreateOutputSchema>;

// ---------------------------------------------------------------------------
// List item / detail (for agency use)
// ---------------------------------------------------------------------------

export const webDesignQuoteItemSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string(),
	phone: z.string(),
	companyName: z.string(),
	domain: z.string().nullable(),
	projectType: apiWebDesignProjectTypeSchema,
	projectDescription: z.string(),
	budget: z.string(),
	targetLaunchDate: z.date().nullable(),
	status: apiWebDesignQuoteStatusSchema,
	submittedById: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});
export type WebDesignQuoteItem = z.infer<typeof webDesignQuoteItemSchema>;

export const webDesignQuoteListOutputSchema = z.object({
	items: z.array(webDesignQuoteItemSchema),
	total: z.number(),
});
export type WebDesignQuoteListOutput = z.infer<typeof webDesignQuoteListOutputSchema>;

export const webDesignQuoteListInputSchema = z.object({
	limit: z.number().int().min(1).max(100).default(50),
	offset: z.number().int().min(0).default(0),
	status: apiWebDesignQuoteStatusSchema.optional(),
});
export type WebDesignQuoteListInput = z.infer<typeof webDesignQuoteListInputSchema>;
