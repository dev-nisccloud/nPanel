import { Context } from "hono";

/**
 * Serves the web app manifest
 */
export async function handleManifest(c: Context) {
  const manifest = {
    name: "Nisc Cloud npanel",
    short_name: "npanel",
    description: "Nisc Cloud npanel - Agency Management Platform",
    start_url: "/",
    scope: "/",
    display: "standalone" as const,
    orientation: "portrait-primary" as const,
    theme_color: "#38b6ff",
    background_color: "#ffffff",
    icons: [
      {
        src: "/favicon/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/favicon/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
    categories: ["business", "productivity"],
  };

  return c.json(manifest, 200, {
    "Content-Type": "application/manifest+json",
    "Cache-Control": "public, max-age=86400",
  });
}
