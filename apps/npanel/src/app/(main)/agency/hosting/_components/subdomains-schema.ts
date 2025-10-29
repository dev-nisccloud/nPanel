import { z } from "zod";

// Schema for the raw Plesk subdomains API response
export const pleskSubdomainsResponseSchema = z.object({
  raw: z.string(),
  parsed: z.object({
    packet: z.object({
      subdomain: z.object({
        get: z.object({
          result: z.array(z.object({
            status: z.string().optional(),
            "filter-id": z.string().optional(),
            id: z.number().optional(),
            data: z.object({
              parent: z.string().optional(),
              name: z.string().optional(),
              property: z.array(z.object({
                name: z.string().optional(),
                value: z.union([z.string(), z.boolean()]).optional(),
              })).optional(),
            }).optional(),
          })),
        }),
      }),
    }),
  }),
});

// Schema for individual subdomain (used in components)
export const subdomainSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  parent: z.string().optional(),
  status: z.string().optional(),
  filterId: z.string().optional(),
  // Technology properties
  asp: z.boolean().optional(),
  ssi: z.boolean().optional(),
  php: z.boolean().optional(),
  phpHandlerId: z.string().optional(),
  cgi: z.boolean().optional(),
  perl: z.boolean().optional(),
  python: z.boolean().optional(),
  fastcgi: z.boolean().optional(),
  // Security properties
  ssl: z.boolean().optional(),
  sameSsl: z.boolean().optional(),
  // Path properties
  wwwRoot: z.string().optional(),
  // Statistics properties
  webstat: z.string().optional(),
  webstatProtected: z.string().optional(),
  emptyDocumentRoot: z.string().optional(),
});

export type PleskSubdomainsResponse = z.infer<typeof pleskSubdomainsResponseSchema>;
export type Subdomain = z.infer<typeof subdomainSchema>;