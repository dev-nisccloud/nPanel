"use client";

import { z } from "zod";

export const cronJobStatusSchema = z.enum(["ACTIVE", "DISABLED"]);

export const cronJobSchema = z.object({
  /** Stable key used in routing. */
  key: z.string(),
  name: z.string(),
  status: cronJobStatusSchema,
  description: z.string().nullable(),
});

export type CronJobRow = z.infer<typeof cronJobSchema>;

