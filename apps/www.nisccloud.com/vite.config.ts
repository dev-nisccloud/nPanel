import { copyFileSync, readFileSync } from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv, type Plugin, type ProxyOptions } from "vite";
import { PUBLIC_ROUTES, routeHtmlFile } from "./src/lib/public-routes.ts";

/**
 * Production 404s on Vercel: vercel.json rewrites only the public routes (each to its
 * prerendered file, see scripts/prerender.ts), and Vercel serves
 * dist/404.html with status 404 for everything else. Fails the build if vercel.json has
 * drifted from src/lib/public-routes.ts (fix with `bun scripts/vercel-routes.ts`).
 */
function notFoundPage(): Plugin {
  return {
    name: "nisc-404-page",
    apply: (_config, env) => env.command === "build" && !env.isSsrBuild,
    buildStart() {
      const vercel = JSON.parse(readFileSync(path.resolve(__dirname, "vercel.json"), "utf8")) as {
        rewrites?: { source: string; destination: string }[];
      };
      const rewritten = new Set(
        (vercel.rewrites ?? []).filter((r) => r.destination === routeHtmlFile(r.source)).map((r) => r.source),
      );
      const missing = PUBLIC_ROUTES.filter((r) => !rewritten.has(r));
      const extra = [...rewritten].filter((r) => !PUBLIC_ROUTES.includes(r));
      if (missing.length || extra.length) {
        this.error(
          `vercel.json is out of date (missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"}). Run: bun scripts/vercel-routes.ts`,
        );
      }
    },
    closeBundle() {
      const dist = path.resolve(__dirname, "dist");
      copyFileSync(path.join(dist, "index.html"), path.join(dist, "404.html"));
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = (env.VITE_NPANEL_SERVER_URL ?? "https://npanel-server.nisccloud.com").replace(
    /\/+$/,
    "",
  );
  // Dev-only: send storefront location/FX calls to a local API, optionally as a given country.
  const localLocationApi = env.DEV_LOCATION_API_URL?.replace(/\/+$/, "");
  const simulatedCountry = env.DEV_SIMULATE_COUNTRY?.trim().toUpperCase();
  const locationProxy: Record<string, ProxyOptions> = localLocationApi
    ? {
        "/api/trpc/storefront.location.": {
          target: localLocationApi,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              if (simulatedCountry) proxyReq.setHeader("cf-ipcountry", simulatedCountry);
            });
          },
        },
      }
    : {};

  return {
    server: {
      host: "0.0.0.0",
      port: 5174,
      allowedHosts: true,
      hmr: {
        overlay: false,
      },
      proxy: {
        ...locationProxy,
        // Address the upstream virtual host; preserve the browser origin below.
        // x-forwarded-host retains the local origin for backend session handling.
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          timeout: 1_800_000,
          proxyTimeout: 1_800_000,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              const host = req.headers.host;
              if (host) proxyReq.setHeader("x-forwarded-host", host);
              // Browser-facing scheme (local Vite is HTTP). Do not inherit
              // upstream HTTPS or Secure cookies get dropped on localhost.
              const local =
                typeof host === "string" &&
                (host.startsWith("localhost") ||
                  host.startsWith("127.0.0.1") ||
                  host.startsWith("[::1]"));
              proxyReq.setHeader("x-forwarded-proto", local ? "http" : "https");
            });
          },
        },
      },
    },
    plugins: [react(), tailwindcss(), notFoundPage()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },
    build: {
      chunkSizeWarningLimit: 1000,
    },
  };
});
