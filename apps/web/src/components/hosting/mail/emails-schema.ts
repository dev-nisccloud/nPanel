import { z } from "zod";
import { normalizePleskPacket } from "@/components/hosting/plesk-xml-normalize";

// Single result item from Plesk (API may return one object or an array)
const pleskMailResultItemSchema = z.object({
  status: z.string().optional(),
  mailname: z.object({
    id: z.number().optional(),
    name: z.string().optional(),
    mailbox: z.object({
      enabled: z.boolean().optional(),
      quota: z.number().optional(),
      usage: z.number().optional(),
    }).optional(),
    forwarding: z.object({
      enabled: z.boolean().optional(),
      address: z.union([z.string(), z.array(z.string())]).optional(),
    }).optional(),
    alias: z.union([z.string(), z.array(z.string())]).optional(),
    autoresponder: z.object({
      enabled: z.boolean().optional(),
      subject: z.string().optional(),
      content_type: z.string().optional(),
      charset: z.string().optional(),
      text: z.string().optional(),
      end_date: z.string().optional(),
    }).optional(),
    password: z.object({
      value: z.string().optional(),
      type: z.string().optional(),
    }).optional(),
    antivir: z.string().optional(),
    description: z.string().optional(),
    "outgoing-messages-mbox-limit": z.union([z.number(), z.string()]).optional(),
    "user-guid": z.string().optional(),
  }).optional(),
});

// Normalize Plesk result: API returns array, single object, or null/undefined
function normalizeMailResult(val: unknown): unknown[] {
  if (val == null) return [];
  if (Array.isArray(val)) return val;
  return [val];
}

// Schema for the raw Plesk emails API response
export const pleskEmailsResponseSchema = z.object({
  raw: z.string(),
  parsed: z.object({
    packet: z.preprocess(normalizePleskPacket, z.object({
      mail: z.object({
        "get_info": z.object({
          result: z.preprocess(normalizeMailResult, z.array(pleskMailResultItemSchema)),
        }),
      }),
    })),
  }),
});

// Schema for individual email account (used in components)
export const emailAccountSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  mailbox: z.object({
    enabled: z.boolean().optional(),
    quota: z.number().optional(),
    usage: z.number().optional(),
  }).optional(),
  forwarding: z.object({
    enabled: z.boolean().optional(),
    addresses: z.array(z.string()).optional(),
  }).optional(),
  aliases: z.array(z.string()).optional(),
  autoresponder: z.object({
    enabled: z.boolean().optional(),
    subject: z.string().optional(),
    content_type: z.string().optional(),
    charset: z.string().optional(),
    text: z.string().optional(),
    end_date: z.string().optional(),
  }).optional(),
  password: z.object({
    value: z.string().optional(),
    type: z.string().optional(),
  }).optional(),
  antivir: z.string().optional(),
  description: z.string().optional(),
  outgoingMessagesLimit: z.number().optional(),
  userGuid: z.string().optional(),
  status: z.string().optional(),
});

export type PleskEmailsResponse = z.infer<typeof pleskEmailsResponseSchema>;
export type EmailAccount = z.infer<typeof emailAccountSchema>;
