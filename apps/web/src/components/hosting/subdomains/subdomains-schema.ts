import { z } from "zod";
import { normalizePleskPacket } from "@/components/hosting/plesk-xml-normalize";

// Single subdomain result item (Plesk returns one object when there is only one subdomain)
const subdomainResultItemSchema = z.object({
  status: z.string().optional(),
  "filter-id": z.string().optional(),
  id: z.number().optional(),
  data: z
    .object({
      parent: z.string().optional(),
      name: z.string().optional(),
      property: z
        .array(
          z.object({
            name: z.string().optional(),
            value: z.union([z.string(), z.boolean()]).optional(),
          })
        )
        .optional(),
    })
    .optional(),
});

// Schema for the raw Plesk subdomains API response (result can be array or single object)
export const pleskSubdomainsResponseSchema = z.object({
  raw: z.string(),
  parsed: z.object({
    packet: z.preprocess(normalizePleskPacket, z.object({
      subdomain: z.object({
        get: z.object({
          result: z
            .union([z.array(subdomainResultItemSchema), subdomainResultItemSchema])
            .transform((val) => (Array.isArray(val) ? val : [val])),
        }),
      }),
    })),
  }),
});

// Schema for subdomain properties
export const subdomainPropertiesSchema = z.object({
  asp: z.boolean().optional(),
  ssi: z.boolean().optional(),
  php: z.boolean().optional(),
  php_handler_id: z.string().optional(),
  cgi: z.boolean().optional(),
  perl: z.boolean().optional(),
  python: z.boolean().optional(),
  fastcgi: z.boolean().optional(),
  ssl: z.boolean().optional(),
  same_ssl: z.boolean().optional(),
  www_root: z.string().optional(),
  webstat: z.string().optional(),
  webstat_protected: z.string().optional(),
  empty_document_root: z.string().optional(),
}).optional();

// Schema for individual subdomain (used in components)
export const subdomainSchema = z.object({
  id: z.number(),
  name: z.string(),
  parent: z.string(),
  status: z.string().optional(),
  properties: subdomainPropertiesSchema,
});

// Schema for array of subdomains
export const subdomainsDataSchema = z.object({
  subdomains: z.array(subdomainSchema),
});

/** FTP path of a subdomain's document root, relative to the subscription home. */
export function subdomainFtpHomePath(subdomain: {
  name?: string;
  parent?: string;
  properties?: { www_root?: string } | null;
}): string {
  const wwwRoot = subdomain.properties?.www_root?.trim().replace(/\\/g, "/") ?? "";
  const parent = subdomain.parent?.trim() ?? "";

  if (wwwRoot) {
    let relative = wwwRoot;
    if (parent) {
      const marker = `/${parent}/`;
      const index = wwwRoot.toLowerCase().indexOf(marker.toLowerCase());
      if (index >= 0) {
        relative = wwwRoot.slice(index + marker.length);
      }
    }
    relative = relative.replace(/^\/+/, "").replace(/\/+$/, "");
    const systemPath = /^(var|usr|home|opt)\//i.test(relative);
    if (relative && !systemPath) {
      return `/${relative}`.replace(/\/+/g, "/");
    }
  }

  const name = subdomain.name?.trim() ?? "";
  const host = name.includes(".") ? name : parent ? `${name}.${parent}` : name;
  return host ? `/${host}` : "/";
}

export type PleskSubdomainsResponse = z.infer<typeof pleskSubdomainsResponseSchema>;
export type SubdomainProperties = z.infer<typeof subdomainPropertiesSchema>;
export type Subdomain = z.infer<typeof subdomainSchema>;
export type SubdomainsData = z.infer<typeof subdomainsDataSchema>;
