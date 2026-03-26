import { trpcServer } from "@hono/trpc-server";
import { createContext, t } from "@npanel/api";
import { appRouter } from "@npanel/api/routers/index";
import { auth } from "@npanel/auth";
import { env } from "@npanel/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createRouteHandler } from "uploadthing/server";
import { ourFileRouter } from "./api/uploadthing";

import { registerAuthCustomRoutes } from "./auth-custom-routes";
import { handleImageGenerator } from "./api/workers/image-generator";
import { handleBackgroundRemover } from "./api/workers/background-remover";
import { handleProcessNiscOrder } from "./api/workers/process-nisc-order";
import { handleSendCampaignEmails } from "./api/workers/send-campaign-emails";
import { handlePublishContent } from "./api/workers/publish-content";
import { handlePublishLinkedInContent } from "./api/workers/publish-linkedin-content";
import { handleReplicateWebhook } from "./api/webhooks/replicate-image-generator";
import { handleMpesaWebhook } from "./api/webhooks/mpesa";
import { handleResendWebhook } from "./api/webhooks/resend";
import { handleHealth } from "./api/health";
import { handleManifest } from "./api/manifest";
import { handleTestPleskConnection } from "./api/test-plesk-connection";
import { handlePleskHealthCheck } from "./api/plesk-health-check";

const app = new Hono();

const appCaller = t.createCallerFactory(appRouter);

const trpcMiddleware = trpcServer({
  router: appRouter,
  createContext: (_opts, honoContext) => {
    return createContext({
      context: honoContext,
      createCaller: (ctx) => appCaller(ctx),
    });
  },
});

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "upstash-signature"],
    credentials: true,
  }),
);

registerAuthCustomRoutes(app);

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  if (process.env.NODE_ENV !== "production") {
    const path = c.req.path;
    if (path === "/api/auth/get-session" || path === "/api/auth/redirect-target") {
      const cookie = c.req.raw.headers.get("cookie") ?? "";
      console.log("[server][auth]", { method: c.req.method, path, cookiePresent: cookie.length > 0, cookieLen: cookie.length });
    }
  }

  return auth.handler(c.req.raw);
});

app.use("/trpc/*", trpcMiddleware);
app.use("/api/trpc/*", trpcMiddleware);

app.get("/", (c) => {
  return c.text("OK");
});

const uploadthingHandler = createRouteHandler({
  router: ourFileRouter,
});

app.on(["GET", "POST"], "/api/uploadthing*", async (c) => {
  const response = await uploadthingHandler(c.req.raw);
  return response;
});

app.on(["POST"], "/api/workers/image-generator*", handleImageGenerator);
app.on(["POST"], "/api/workers/background-remover*", handleBackgroundRemover);
app.on(["POST"], "/api/workers/process-nisc-order*", handleProcessNiscOrder);
app.on(["POST"], "/api/workers/send-campaign-emails*", handleSendCampaignEmails);
app.on(["POST"], "/api/workers/publish-content*", handlePublishContent);
app.on(["POST"], "/api/workers/publish-linkedin-content*", handlePublishLinkedInContent);

// Webhooks
app.on(["POST"], "/api/webhooks/replicate-image-generator*", handleReplicateWebhook);
app.on(["POST", "GET"], "/api/webhooks/mpesa*", handleMpesaWebhook);
app.on(["POST"], "/api/webhooks/resend*", handleResendWebhook);

// Remaining API Routes
app.on(["GET"], "/api/health*", handleHealth);
app.on(["GET"], "/api/manifest*", handleManifest);
app.on(["GET"], "/api/test-plesk-connection*", handleTestPleskConnection);
app.on(["GET"], "/api/plesk-health-check*", handlePleskHealthCheck);

export default {
  port: 3000,
  fetch: app.fetch,
  idleTimeout: 255,
  requestTimeout: 60000,
};

