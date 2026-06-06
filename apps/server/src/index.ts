import { createApp } from "./create-app";

// Default "all" routes for local dev. Production API sets NPANEL_SERVICE_ROLE=api
// only after QStash worker URLs point at the workers Cloud Run service.
const { app, websocket } = createApp();

export default {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  hostname: process.env.HOSTNAME || "0.0.0.0",
  fetch: app.fetch,
  websocket,
  idleTimeout: 255,
  requestTimeout: 60000,
};
