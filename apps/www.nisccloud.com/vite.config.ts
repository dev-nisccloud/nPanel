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
