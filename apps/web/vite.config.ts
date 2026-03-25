import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_SERVER_URL || "http://localhost:3000";

  return {
    plugins: [
      tailwindcss(),
      reactRouter(),
      tsconfigPaths({
        ignoreConfigErrors: true,
        skip: (dir) => dir.includes("previous_codebase"),
      }),
      VitePWA({
        registerType: "autoUpdate",
        manifest: {
          name: "npanel",
          short_name: "npanel",
          description: "npanel - PWA Application",
          theme_color: "#0c0c0c",
        },
        pwaAssets: { disabled: false, config: true },
        devOptions: { enabled: true },
      }),
    ],
    server: {
      // Allow ngrok host (useful when testing auth/cookies over public URLs).
      allowedHosts: [
        "localhost",
        "127.0.0.1",
        "loverlike-cinderella-signatureless.ngrok-free.dev",
      ],
      proxy: {
        // Keep the original `Host` header (e.g. `localhost:5173`) so Better Auth
        // sets cookies for the same host the browser will later send them from.
        "/api": { target: apiTarget, changeOrigin: false },
      },
    },
  };
});
