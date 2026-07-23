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
import { createBunWebSocket } from "hono/bun";
import { handleVpsSshUpgrade } from "./api/ws/vps-ssh";

import { registerAuthCustomRoutes } from "./auth-custom-routes";
import { handleImageGenerator } from "./api/workers/image-generator";
import { handleBackgroundRemover } from "./api/workers/background-remover";
import { handleProcessNiscOrder } from "./api/workers/process-nisc-order";
import { handleSendCampaignEmails } from "./api/workers/send-campaign-emails";
import { handlePublishContent } from "./api/workers/publish-content";
import { handlePublishLinkedInContent } from "./api/workers/publish-linkedin-content";
import { handleNiscEmDispatch } from "./api/workers/nisc-em-dispatch";
import { handleZeepoCanvas } from "./api/workers/zeepo-canvas";
import { handleZeepoCanvasWebhook } from "./api/webhooks/zeepo-canvas";
import { handleZeepoAgent } from "./api/workers/zeepo-agent";
import { handleZeepoAgentWebhook } from "./api/webhooks/zeepo-agent";
import { handleEmailBuilderAi } from "./api/workers/email-builder-ai";
import { handleNiscEmailBuilder } from "./api/workers/nisc-email-builder";
import { handleEmailBuilderAiWebhook } from "./api/webhooks/replicate-email-builder-ai";
import { handleMetaAdsAnalysis } from "./api/workers/meta-ads-analysis";
import { handleMetaAdsAnalysisWebhook } from "./api/webhooks/replicate-meta-ads-analysis";
import { handleInvoiceKraSync } from "./api/workers/invoice-kra-sync";

import { handleHealth } from "./api/health";
import { handleManifest } from "./api/manifest";
import { handlePleskHealthCheck } from "./api/plesk-health-check";
import { handleJetBackupHealthCheck } from "./api/jetbackup-health-check";
import { handleJetBackupDownloadFile } from "./api/jetbackup-download-file";
import { handleTestPleskConnection } from "./api/test-plesk-connection";
import { handleTestKenicConnection } from "./api/test-kenic-connection";
import { handleMpesaWebhook } from "./api/webhooks/mpesa";
import { handleReplicateWebhook } from "./api/webhooks/replicate-image-generator";
import { handleResendWebhook } from "./api/webhooks/resend";
import { handleSnsWebhook } from "./api/webhooks/sns";
import { handleMyIp } from "./api/my-ip";
import { ensureClientIpOnRequest, readClientIpFromHeaders } from "./request-client-ip";
import { apiKeyAuth } from "./middleware/auth-middleware";
import { handleExternalImageGeneration } from "./api/ai/image-generator";
import { createCorsOriginMatcher } from "./cors-origins";
import { createNiscPaymentGatewayRoutes } from "./api/nisc-payment-gateway";

export type NpanelServiceRole = "api" | "workers" | "all";

export type CreateAppOptions = {
  /** Which route groups to mount. Defaults from NPANEL_SERVICE_ROLE or "all". */
  role?: NpanelServiceRole;
};

function resolveRole(explicit?: NpanelServiceRole): NpanelServiceRole {
  if (explicit) return explicit;
  const fromEnv = process.env.NPANEL_SERVICE_ROLE?.trim().toLowerCase();
  if (fromEnv === "api" || fromEnv === "workers") return fromEnv;
  return "all";
}

function shouldMountWorkers(role: NpanelServiceRole): boolean {
  if (process.env.DISABLE_WORKER_ROUTES === "1") {
    return role === "workers";
  }
  return role === "workers" || role === "all";
}

function shouldMountApi(role: NpanelServiceRole): boolean {
  return role === "api" || role === "all";
}

const { upgradeWebSocket, websocket } = createBunWebSocket();

export function createApp(options: CreateAppOptions = {}) {
  const role = resolveRole(options.role);
  const mountApi = shouldMountApi(role);
  const mountWorkers = shouldMountWorkers(role);

  const app = new Hono();

  app.use(logger());
  app.use("*", async (c, next) => {
    if (!readClientIpFromHeaders(c.req.raw.headers)) {
      try {
        c.req.raw.headers.set("x-forwarded-for", "127.0.0.1");
      } catch {
        // Request headers may be immutable; auth handler clones with IP below.
      }
    }
    await next();
  });
  app.use(
    "/*",
    cors({
      origin: createCorsOriginMatcher(env.CORS_ORIGIN),
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "upstash-signature"],
      credentials: true,
    }),
  );

  app.get("/api/health", handleHealth);
  app.get("/", (c) => c.text("OK"));

  if (mountApi) {
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

    registerAuthCustomRoutes(app);

    app.on(["POST", "GET"], "/api/auth/*", (c) => {
      if (process.env.NODE_ENV !== "production") {
        const path = c.req.path;
        if (path === "/api/auth/get-session" || path === "/api/auth/redirect-target") {
          const cookie = c.req.raw.headers.get("cookie") ?? "";
          console.log("[server][auth]", {
            method: c.req.method,
            path,
            cookiePresent: cookie.length > 0,
            cookieLen: cookie.length,
          });
        }
      }

      return auth.handler(ensureClientIpOnRequest(c.req.raw));
    });

    app.use("/trpc/*", trpcMiddleware);
    app.use("/api/trpc/*", trpcMiddleware);

    app.get("/manifest.json", handleManifest);
    app.get("/api/manifest.json", handleManifest);
    app.get("/api/plesk/health-check", handlePleskHealthCheck);
    app.get("/api/plesk/test-connection", handleTestPleskConnection);
    app.get("/api/jetbackup/health-check", handleJetBackupHealthCheck);
    app.get("/api/jetbackup/downloads/:id/file", handleJetBackupDownloadFile);
    app.get("/api/kenic/test-connection", handleTestKenicConnection);
    app.get("/api/my-ip", handleMyIp);

    app.post("/api/ai/image-generator", apiKeyAuth, handleExternalImageGeneration);

    // Nisc Payment Gateway - External REST API for merchants
    app.route("/api/nisc-gateway", createNiscPaymentGatewayRoutes());

    app.on(["POST"], "/api/webhooks/mpesa", handleMpesaWebhook);
    app.on(["POST"], "/api/webhooks/replicate", handleReplicateWebhook);
    app.on(["POST"], "/api/webhooks/zeepo-canvas", handleZeepoCanvasWebhook);
    app.on(["POST"], "/api/webhooks/zeepo-agent", handleZeepoAgentWebhook);
    app.on(["POST"], "/api/webhooks/resend", handleResendWebhook);
    app.on(["POST"], "/api/webhooks/sns", handleSnsWebhook);
    app.on(["POST"], "/api/webhooks/replicate/email-builder-ai", handleEmailBuilderAiWebhook);
    app.on(["POST"], "/api/webhooks/replicate/meta-ads-analysis", handleMetaAdsAnalysisWebhook);

    app.get("/api/ws/vps-ssh", upgradeWebSocket(handleVpsSshUpgrade));

    const uploadthingHandler = createRouteHandler({
      router: ourFileRouter,
    });

    app.on(["GET", "POST"], "/api/uploadthing*", async (c) => {
      const response = await uploadthingHandler(c.req.raw);
      return response;
    });
  }

  if (mountWorkers) {
    app.on(["POST"], "/api/workers/image-generator*", handleImageGenerator);
    app.on(["POST"], "/api/workers/background-remover*", handleBackgroundRemover);
    app.on(["POST"], "/api/workers/process-nisc-order*", handleProcessNiscOrder);
    app.on(["POST"], "/api/workers/send-campaign-emails*", handleSendCampaignEmails);
    app.on(["POST"], "/api/workers/nisc-em-dispatch*", handleNiscEmDispatch);
    app.on(["POST"], "/api/workers/publish-content*", handlePublishContent);
    app.on(["POST"], "/api/workers/publish-linkedin-content*", handlePublishLinkedInContent);
    app.on(["POST"], "/api/workers/zeepo-canvas*", handleZeepoCanvas);
    app.on(["POST"], "/api/workers/zeepo-agent*", handleZeepoAgent);
    app.on(["POST"], "/api/workers/email-builder-ai*", handleEmailBuilderAi);
    app.on(["POST"], "/api/workers/nisc-email-builder*", handleNiscEmailBuilder);
    app.on(["POST"], "/api/workers/meta-ads-analysis*", handleMetaAdsAnalysis);
    app.on(["POST"], "/api/workers/invoice-kra-sync*", handleInvoiceKraSync);
  }

  return { app, websocket, role };
}

export { websocket };
