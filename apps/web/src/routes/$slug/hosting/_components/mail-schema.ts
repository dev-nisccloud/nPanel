import { z } from "zod";

export const mailAddressSchema = z.object({
  id: z.number(),
  name: z.string(),
  mailbox: z.object({
    enabled: z.boolean(),
    quota: z.number(), // -1 for unlimited
    usage: z.number(),
  }),
  forwarding: z.object({
    enabled: z.boolean(),
    address: z.union([z.string(), z.array(z.string())]).optional(),
  }),
  alias: z.array(z.string()).optional(),
  autoresponder: z.object({
    enabled: z.boolean(),
    subject: z.string().optional(),
    content_type: z.string().optional(),
    charset: z.string().optional(),
    text: z.string().optional(),
    end_date: z.string().optional(),
  }),
  password: z.object({
    value: z.string(),
    type: z.string(),
  }),
  antivir: z.enum(["off", "inout", "in", "out"]),
  description: z.string().optional(),
  "user-guid": z.string().optional(),
});

export type MailAddress = z.infer<typeof mailAddressSchema>;
