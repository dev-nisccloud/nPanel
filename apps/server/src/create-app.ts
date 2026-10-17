import { trpcServer } from "@hono/trpc-server";
import { createContext, t } from "@npanel/api";
import { appRouter } from "@npanel/api/routers/index";
import { auth } from "@npanel/auth";
import { env } from "@npanel/env/server";
import * as Sentry from "@sentry/hono/bun";
import { TRPCError } from "@trpc/server";
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
import { handleZeepoAiChatStream } from "./api/zeepo-ai-chat-stream";
import { handleZeepoAiSupportGuestStream } from "./api/zeepo-ai-support-guest-stream";
import { handleEmailBuilderAi } from "./api/workers/email-builder-ai";
import { handleNiscEmailBuilder } from "./api/workers/nisc-email-builder";
import { handleEmailBuilderAiWebhook } from "./api/webhooks/replicate-email-builder-ai";
import { handleMetaAdsAnalysis } from "./api/workers/meta-ads-analysis";
import { handleMetaAdsAnalysisWebhook } from "./api/webhooks/replicate-meta-ads-analysis";
import { handleInvoiceKraSync } from "./api/workers/invoice-kra-sync";
import { handleSeoSuiteRankCheck } from "./api/workers/seo-suite-rank";
import { handleSeoSuiteAudit } from "./api/workers/seo-suite-audit";
import { handleSubscriptionRenewalReminders } from "./api/workers/subscription-renewal-reminders";

import { handleCustomerOAuthCallback } from "./api/customer-oauth-callback";
import { handleHealth } from "./api/health";
import { handleManifest } from "./api/manifest";
import { handlePleskHealthCheck } from "./api/plesk-health-check";
import { handleNiscBackupHealthCheck } from "./api/nisc-backup-health-check";
import { handleNiscBackupDownloadFile } from "./api/nisc-backup-download-file";
import { handleHostingFtpDownload } from "./api/hosting-ftp-download";
import { handleHostingFtpExtract } from "./api/hosting-ftp-extract";
import { handleHostingFtpUpload } from "./api/hosting-ftp-upload";
import { handleTestPleskConnection } from "./api/test-plesk-connection";
import { handlePhpMyAdminSso } from "./api/hosting-phpmyadmin";
import { handlePhpMyAdminProxy } from "./api/hosting-phpmyadmin-proxy";
import { handleTestKenicConnection } from "./api/test-kenic-connection";
import { handleMpesaWebhook } from "./api/webhooks/mpesa";
import { handleJengaCallback, handleJengaIpn } from "./api/webhooks/jenga";
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

/** Expected client/business errors  do not send these to Sentry. */
const EXPECTED_TRPC_CODES = new Set([
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "BAD_REQUEST",
  "TIMEOUT",
  "CONFLICT",
  "PRECONDITION_FAILED",
  "PAYLOAD_TOO_LARGE",
  "METHOD_NOT_SUPPORTED",
  "CLIENT_CLOSED_REQUEST",
  "TOO_MANY_REQUESTS",
  "UNPROCESSABLE_CONTENT",
]);

function isHealthOrProbeTransaction(name: string): boolean {
  const n = name.toLowerCase();
  return (
    n === "get /" ||
    n === "/" ||
    n.includes("/api/health") ||
    n.includes("/healthz") ||
    n.endsWith("/health") ||
    n.includes("health-check")
  );
}

export function createApp(options: CreateAppOptions = {}) {
  const role = resolveRole(options.role);
  const mountApi = shouldMountApi(role);
  const mountWorkers = shouldMountWorkers(role);

  const app = new Hono();
  const isProd = process.env.NODE_ENV === "production";

  // Sentry must be registered before other middleware so it wraps the full request
  app.use(
    "*",
    Sentry.sentry(app, {
      dsn: "https://0df60016827daed71bd983b0321e7642@o4511794820415488.ingest.us.sentry.io/4511845991972864",
      environment: process.env.NODE_ENV ?? "development",
      enableLogs: !isProd,
      // Identity only  does NOT send API request/response bodies
      sendDefaultPii: false,
      dataCollection: {
        userInfo: true,
        httpBodies: [],
        genAI: { inputs: false, outputs: false },
        cookies: false,
        urlQueryParams: false,
        stackFrameVariables: false,
      },
      // Skip probes; sample 1% of other requests in production
      tracesSampler: (ctx) => {
        const name = ctx.name ?? ctx.transactionContext?.name ?? "";
        if (isHealthOrProbeTransaction(String(name))) return 0;
        return isProd ? 0.01 : 1.0;
      },
    }),
  );

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
      allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "upstash-signature"],
      credentials: true,
    }),
  );

  app.get("/api/health", handleHealth);
  app.get("/", (c) => c.text("OK"));

  // Verify Sentry wiring. Available when not production, or when SENTRY_DEBUG_ROUTE=1.
  if (!isProd || process.env.SENTRY_DEBUG_ROUTE === "1") {
    app.get("/api/debug-sentry", () => {
      Sentry.logger.info("User triggered test error", {
        action: "test_error_endpoint",
      });
      throw new Error("My first Sentry error!");
    });
  }

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
      onError: ({ error, path, type }) => {
        const code =
          error instanceof TRPCError
            ? error.code
            : typeof (error as { code?: unknown })?.code === "string"
              ? (error as { code: string }).code
              : undefined;

        // Skip expected client/business errors to protect performance + quota
        if (code && EXPECTED_TRPC_CODES.has(code)) return;

        Sentry.captureException(error, {
          tags: {
            trpc_path: path ?? "unknown",
            trpc_type: type,
            ...(code ? { trpc_code: code } : {}),
          },
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

    app.get("/api/oauth/:platform/callback", handleCustomerOAuthCallback);

    app.get("/manifest.json", handleManifest);
    app.get("/api/manifest.json", handleManifest);
    app.get("/api/plesk/health-check", handlePleskHealthCheck);
    app.get("/api/plesk/test-connection", handleTestPleskConnection);
    app.get("/api/hosting/db-webadmin", handlePhpMyAdminSso);
    app.use("/api/hosting/db-webadmin/p/*", handlePhpMyAdminProxy);
    app.get("/api/hosting/phpmyadmin", handlePhpMyAdminSso);
    app.use("/api/hosting/phpmyadmin/proxy/*", handlePhpMyAdminProxy);
    app.get("/api/nisc-backup/health-check", handleNiscBackupHealthCheck);
    app.get("/api/nisc-backup/downloads/:id/file", handleNiscBackupDownloadFile);
    app.get("/api/hosting/ftp/download", handleHostingFtpDownload);
    app.put("/api/hosting/ftp/upload", handleHostingFtpUpload);
    app.post("/api/hosting/ftp/extract", handleHostingFtpExtract);
    app.get("/api/kenic/test-connection", handleTestKenicConnection);
    app.get("/api/my-ip", handleMyIp);

    app.post("/api/ai/image-generator", apiKeyAuth, handleExternalImageGeneration);

    // Nisc Payment Gateway - External REST API for merchants
    app.route("/api/nisc-gateway", createNiscPaymentGatewayRoutes());

    app.on(["POST"], "/api/webhooks/mpesa", handleMpesaWebhook);
    app.on(["GET"], "/api/webhooks/jenga/callback", handleJengaCallback);
    app.on(["POST"], "/api/webhooks/jenga/ipn", handleJengaIpn);
    app.on(["POST"], "/api/webhooks/replicate", handleReplicateWebhook);
    app.on(["POST"], "/api/webhooks/zeepo-canvas", handleZeepoCanvasWebhook);
    app.on(["POST"], "/api/webhooks/zeepo-agent", handleZeepoAgentWebhook);
    app.on(["POST"], "/api/zeepo-ai/chat/stream", handleZeepoAiChatStream);
    app.on(["POST"], "/api/zeepo-ai/support/guest/stream", handleZeepoAiSupportGuestStream);
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
    app.on(["POST"], "/api/workers/seo-suite-rank*", handleSeoSuiteRankCheck);
    app.on(["POST"], "/api/workers/seo-suite-audit*", handleSeoSuiteAudit);
    app.on(
      ["POST"],
      "/api/workers/subscription-renewal-reminders*",
      handleSubscriptionRenewalReminders,
    );
  }

  return { app, websocket, role };
}

export { websocket };
