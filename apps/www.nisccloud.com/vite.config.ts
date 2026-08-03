import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = (env.VITE_NPANEL_SERVER_URL ?? "https://npanel-server.nisccloud.com").replace(
    /\/+$/,
    "",
  );

  return {
    server: {
      host: "0.0.0.0",
      port: 5174,
      allowedHosts: true,
      hmr: {
        overlay: false,
      },
      proxy: {
        // Keep Host as the landing origin so forwarded Cookie headers match
        // sessions set on the same host (nPanel web on another port locally).
        "/api": {
          target: apiTarget,
          changeOrigin: false,
          timeout: 120_000,
          proxyTimeout: 120_000,
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
    plugins: [react(), tailwindcss()],
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
