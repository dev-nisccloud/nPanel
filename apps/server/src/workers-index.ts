/**
 * QStash / background worker entrypoint.
 * Deploy as a separate Cloud Run service (npanel-workers-*) with NPANEL_SERVICE_ROLE=workers.
 */
import { createApp } from "./create-app";
import { ensureSubscriptionRenewalRemindersSchedule } from "@npanel/api/lib/qstash/subscription-renewal-reminders";

const { app } = createApp({ role: "workers" });

// Idempotent: upserts daily 00:00 UTC schedule when a public worker URL is available.
void ensureSubscriptionRenewalRemindersSchedule().catch((err) => {
  console.warn(
    "[subscription-renewal-reminders] Failed to ensure QStash schedule on boot:",
    err,
  );
});

export default {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  hostname: process.env.HOSTNAME || "0.0.0.0",
  fetch: app.fetch,
  idleTimeout: 255,
  // Workers may send many emails / chain long jobs; Cloud Run timeout is the outer bound.
  requestTimeout: 300000,
};
