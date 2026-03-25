import { NextResponse } from "next/server";

/**
 * Serves the web app manifest with correct Content-Type.
 * Using a route ensures the response is never HTML (avoids "Manifest: Line 1, column 1, Syntax error").
 */
export async function GET() {
  const manifest = {
    name: "Nisc Cloud nPanel",
    short_name: "nPanel",
    description: "Nisc Cloud nPanel - Agency Management Platform",
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

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
