import { z } from "zod";

export const wordpressPluginSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  version: z.string(),
  availableVersion: z.string().nullable(),
  status: z.boolean(),
  autoUpdates: z.boolean(),
  autoUpdatesAvailable: z.boolean(),
  vulnerable: z.boolean(),
  changeLogUrl: z.string().nullable(),
  mustUse: z.boolean(),
});

export type WordPressPlugin = z.infer<typeof wordpressPluginSchema>;
