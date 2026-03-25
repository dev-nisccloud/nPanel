import { z } from "zod";

export const wordpressThemeSchema = z.object({
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
});

export type WordPressTheme = z.infer<typeof wordpressThemeSchema>;
