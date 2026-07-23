/**
 * QStash / background worker entrypoint.
 * Deploy as a separate Cloud Run service (npanel-workers-*) with NPANEL_SERVICE_ROLE=workers.
 */
import type { Hono } from "hono";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const hostname = process.env.HOSTNAME || "0.0.0.0";

let app: Hono | null = null;
let bootError: unknown = null;

const boot = import("./create-app")
  .then(({ createApp }) => {
    const created = createApp({ role: "workers" });
    app = created.app;
    console.log(`[workers] app ready on ${hostname}:${port}`);
    return created.app;
  })
  .catch((err) => {
    bootError = err;
    console.error("[workers] failed to load app", err);
    throw err;
  });

export default {
  port,
  hostname,
  idleTimeout: 255,
  requestTimeout: 60000,
  async fetch(req: Request) {
    if (bootError) {
      return new Response("Workers failed to start", { status: 500 });
    }
    if (!app) {
      await boot;
    }
    return app!.fetch(req);
  },
};
