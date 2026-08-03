import { reactRouter } from "@react-router/dev/vite";
import {
  sentryReactRouter,
  type SentryReactRouterBuildOptions,
} from "@sentry/react-router";
import tailwindcss from "@tailwindcss/vite";
import type { Plugin } from "vite";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Vite answers OPTIONS before the `/api` proxy runs, and its default CORS
 * response omits Access-Control-Allow-Origin for credentialed cross-origin
 * calls (www storefront → nPanel web). Handle `/api` preflight here so
 * completeProfile / createOrganization / etc. work from the landing origin.
 */
function apiCredentialedPreflight(): Plugin {
  return {
    name: "npanel-api-credentialed-preflight",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== "OPTIONS" || !req.url?.startsWith("/api")) {
          next();
          return;
        }
        const origin = req.headers.origin;
        if (!origin) {
          next();
          return;
        }
        res.statusCode = 204;
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        res.setHeader(
          "Access-Control-Allow-Headers",
          req.headers["access-control-request-headers"] ??
            "Content-Type, Authorization, upstash-signature",
        );
        res.setHeader("Access-Control-Max-Age", "86400");
        res.setHeader("Vary", "Origin, Access-Control-Request-Headers");
        res.end();
      });
    },
  };
}

export default defineConfig(async (config) => {
  const env = loadEnv(config.mode, process.cwd(), "");
  const apiTarget = env.VITE_SERVER_URL || "http://localhost:3000";

  const sentryConfig: SentryReactRouterBuildOptions = {
    org: "nisc-cloud-limited",
    project: "npanel-dashboard",
    // Required for uploading source maps; set in CI / local secrets
    authToken: env.SENTRY_AUTH_TOKEN || process.env.SENTRY_AUTH_TOKEN,
  };

  return {
    plugins: [
      apiCredentialedPreflight(),
      tailwindcss(),
      reactRouter(),
      ...(await sentryReactRouter(sentryConfig, config)),
      tsconfigPaths({
        ignoreConfigErrors: true,
        skip: (dir) => dir.includes("previous_codebase"),
      }),
      VitePWA({
        registerType: "autoUpdate",
        manifest: {
          name: "Nisc Cloud - nPanel",
          short_name: "nPanel",
          description: "nPanel - Nisc Cloud, Cloud Services & Digital Marketing Management Platform",
          theme_color: "#38b6ff",
        },
        pwaAssets: { disabled: false, config: true },
        devOptions: { enabled: true },
      }),
    ],
    // Required so sentryOnBuildEnd can upload source maps
    sentryConfig,
    server: {
      // Allow ngrok host (useful when testing auth/cookies over public URLs).
      allowedHosts: [
        "localhost",
        "127.0.0.1",
        "loverlike-cinderella-signatureless.ngrok-free.dev",
        "npanel-web.vercel.app",
        "npanel-server.vercel.app"
      ],
      // Reflect Origin for non-/api Vite responses; /api preflight handled above.
      cors: {
        origin: true,
        credentials: true,
      },
      proxy: {
        // Keep the original `Host` header (e.g. `localhost:5173`) so Better Auth
        // sets cookies for the same host the browser will later send them from.
        "/api": { target: apiTarget, changeOrigin: false, timeout: 120000, proxyTimeout: 120000, ws: true },
      },
    },
  };
});
