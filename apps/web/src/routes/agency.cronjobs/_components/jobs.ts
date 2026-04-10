"use client";

import { cronJobSchema, type CronJobRow } from "./schema";

export const CRON_JOB_KEYS = {
  MEDIA_BUYING_EOM_TOTAL_SPEND_INVOICES: "media-buying-eom-total-spend-invoices",
} as const;

const raw: CronJobRow[] = [
  {
    key: CRON_JOB_KEYS.MEDIA_BUYING_EOM_TOTAL_SPEND_INVOICES,
    name: "Media Buying End Month Total Spend Invoices",
    status: "ACTIVE",
    description:
      "Generate end-of-month invoices from selected ad platform campaigns (Meta, Google Ads, LinkedIn) using plan commission rates and optional ad serving fees.",
  },
];

export const cronJobs: CronJobRow[] = raw.map((j) => cronJobSchema.parse(j));

