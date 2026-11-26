import { z } from "zod";
import { normalizePleskPacket } from "@/components/hosting/plesk-xml-normalize";

function asList(value: unknown): unknown[] {
  if (value == null || value === "") return [];
  return Array.isArray(value) ? value : [value];
}

function asText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object" && value && "#text" in value) {
    return asText((value as { "#text"?: unknown })["#text"]);
  }
  return "";
}

function asBool(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "on";
  }
  return false;
}

/** Plesk returns aliases and auto-reply in more than one shape. Fold them into the fields the form reads. */
function normalizeMailname(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const mail = { ...(value as Record<string, unknown>) };

  const aliasValues = [
    ...asList(mail.alias),
    ...asList((mail.aliases as { alias?: unknown } | undefined)?.alias),
  ].map(asText).map((alias) => alias.trim()).filter(Boolean);
  if (aliasValues.length === 1) mail.alias = aliasValues[0];
  else if (aliasValues.length > 1) mail.alias = aliasValues;

  const wrapped = (mail.autoresponders as { autoresponder?: unknown } | undefined)?.autoresponder;
  const responders = asList(mail.autoresponder ?? wrapped).filter(
    (item): item is Record<string, unknown> => !!item && typeof item === "object" && !Array.isArray(item),
  );
  if (responders.length > 0) {
    const chosen = responders.find((item) => asBool(item.enabled)) ?? responders[0];
    mail.autoresponder = {
      enabled: asBool(chosen.enabled),
      subject: asText(chosen.subject),
      content_type: asText(chosen.content_type ?? chosen["content-type"]) || "text/plain",
      charset: asText(chosen.charset) || "UTF-8",
      text: asText(chosen.text),
      end_date: (() => {
        const endDate = asText(chosen.end_date ?? chosen["end-date"]).trim();
        return endDate === "0" ? "" : endDate;
      })(),
    };
  }

  return mail;
}

// Single result item from Plesk (API may return one object or an array)
const pleskMailResultItemSchema = z.object({
  status: z.string().optional(),
  mailname: z.preprocess(normalizeMailname, z.object({
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
  })).optional(),
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
