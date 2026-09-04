import { z } from "zod";
import { normalizePleskPacket } from "@/components/hosting/plesk-xml-normalize";

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
      ttl: z.number().optional(),
    })
    .optional(),
});

export const pleskDnsResponseSchema = z.object({
  raw: z.string(),
  parsed: z.object({
    packet: z.preprocess(normalizePleskPacket, z.object({
      dns: z.object({
        "get_rec": z.object({
          result: z.preprocess(normalizeDnsGetRecResult, z.array(pleskDnsResultItemSchema)),
        }),
      }),
    })),
  }),
});

export const dnsRecordSchema = z.object({
  id: z.number().optional(),
  "site-id": z.number().optional(),
  type: z.string().optional(),
  host: z.string().optional(),
  value: z.string().optional(),
  opt: z.union([z.string(), z.number()]).optional(),
  ttl: z.number().optional(),
  status: z.string().optional(),
});

export type PleskDnsResponse = z.infer<typeof pleskDnsResponseSchema>;
export type DnsRecord = z.infer<typeof dnsRecordSchema>;
