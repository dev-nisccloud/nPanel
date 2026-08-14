import { z } from "zod";

/** Single database item from Plesk get-db result. */
const dbItemSchema = z.object({
  status: z.string().optional(),
  "filter-id": z.coerce.number().optional(),
  id: z.coerce.number().optional(),
  name: z.string().optional(),
  type: z.string().optional(),
  "webspace-id": z.coerce.number().optional(),
  "db-server-id": z.coerce.number().optional(),
  "related-site-id": z.coerce.number().optional().nullable(),
  "related-site-name": z.string().optional().nullable(),
});

/**
 * Plesk returns `result` as an array when multiple DBs, a single object when one,
 * or empty {} when none (fast-xml-parser behavior). We accept all and normalize to array.
 */
const resultSchema = z
  .union([z.array(dbItemSchema), dbItemSchema])
  .transform((r) => (Array.isArray(r) ? r : [r]));

export const relatedSiteSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const pleskRelatedSitesResponseSchema = z.object({
  relatedSites: z.record(z.string(), relatedSiteSchema),
});

// Schema for the raw Plesk databases API response
export const pleskDatabasesResponseSchema = z.object({
  raw: z.string(),
  parsed: z.object({
    packet: z.object({
      database: z.object({
        "get-db": z.object({
          result: resultSchema,
        }),
      }),
    }),
  }),
});

// Schema for individual database (used in components)
export const databaseSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  type: z.enum(["mysql", "postgresql", "mssql"]).optional(),
  status: z.string().optional(),
  "filter-id": z.number().optional(),
  "webspace-id": z.number().optional(),
  "db-server-id": z.number().optional(),
  "related-site-id": z.number().optional().nullable(),
  "related-site-name": z.string().optional().nullable(),
});

export type PleskDatabasesResponse = z.infer<typeof pleskDatabasesResponseSchema>;
export type Database = z.infer<typeof databaseSchema>;

export function relatedSiteLabel(
  db: {
    "related-site-id"?: number | null;
    "related-site-name"?: string | null;
  },
  status: "loading" | "ready" | "error" = "ready",
): string {
  const name = db["related-site-name"]?.trim();
  if (name) return name;
  if (status === "loading") return "…";
  if (status === "error") return "Related site unavailable";
  return "Not connected to any site";
}
