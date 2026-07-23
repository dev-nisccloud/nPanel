import type { Hono } from "hono";
import { websocket } from "./bun-ws";

// Bind PORT immediately so Cloud Run's TCP startup probe succeeds while the
// monorepo TypeScript graph (create-app + workspace packages) is still loading.
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const hostname = process.env.HOSTNAME || "0.0.0.0";

let app: Hono | null = null;
let bootError: unknown = null;

const boot = import("./create-app")
  .then(({ createApp }) => {
    // Default "all" routes for local dev. Production API sets NPANEL_SERVICE_ROLE=api
    // only after QStash worker URLs point at the workers Cloud Run service.
    const created = createApp();
    app = created.app;
    console.log(`[server] app ready on ${hostname}:${port}`);
    return created.app;
  })
  .catch((err) => {
    bootError = err;
    console.error("[server] failed to load app", err);
    throw err;
  });

export default {
  port,
  hostname,
  websocket,
  idleTimeout: 255,
  requestTimeout: 60000,
  async fetch(req: Request) {
    if (bootError) {
      return new Response("Server failed to start", { status: 500 });
    }
    if (!app) {
      await boot;
    }
    return app!.fetch(req);
  },
};
