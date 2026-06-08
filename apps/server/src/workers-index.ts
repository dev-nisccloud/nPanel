/**
 * QStash / background worker entrypoint.
 * Deploy as a separate Cloud Run service (npanel-workers-*) with NPANEL_SERVICE_ROLE=workers.
 */
import { createApp } from "./create-app";

const { app } = createApp({ role: "workers" });

export default {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  hostname: process.env.HOSTNAME || "0.0.0.0",
  fetch: app.fetch,
  idleTimeout: 255,
  requestTimeout: 60000,
};
