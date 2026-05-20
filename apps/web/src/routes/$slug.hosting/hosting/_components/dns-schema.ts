import { z } from "zod";

// Plesk returns an array, a single result object, or omits records when empty (then wrapped as one stub).
function normalizeDnsGetRecResult(val: unknown): unknown[] {
  if (val == null) return [];
  if (Array.isArray(val)) return val;
  return [val];
}

const pleskDnsResultItemSchema = z.object({
  status: z.string().optional(),
  id: z.number().optional(),
  data: z
    .object({
      "site-id": z.number().optional(),
      type: z.string().optional(),
      host: z.string().optional(),
      value: z.union([z.string(), z.number()]).optional(),
      opt: z.union([z.string(), z.number()]).optional(),
    })
    .optional(),
});

// Schema for the raw Plesk DNS API response
export const pleskDnsResponseSchema = z.object({
  raw: z.string(),
  parsed: z.object({
    packet: z.object({
      dns: z.object({
        "get_rec": z.object({
          result: z.preprocess(normalizeDnsGetRecResult, z.array(pleskDnsResultItemSchema)),
        }),
      }),
    }),
  }),
});

// Schema for individual DNS record (used in components)
export const dnsRecordSchema = z.object({
  id: z.number().optional(),
  "site-id": z.number().optional(),
  type: z.string().optional(),
  host: z.string().optional(),
  value: z.string().optional(),
  opt: z.union([z.string(), z.number()]).optional(),
  status: z.string().optional(),
});

export type PleskDnsResponse = z.infer<typeof pleskDnsResponseSchema>;
export type DnsRecord = z.infer<typeof dnsRecordSchema>;
