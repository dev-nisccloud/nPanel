/**
 * vercel.json is generated from src/lib/public-routes.ts so Vercel only rewrites known routes,
 * each to its prerendered HTML file (scripts/prerender.ts). Unmatched paths fall through to dist/404.html, which Vercel serves
 * with HTTP 404 (the React app then renders the noindex NotFound page).
 *
 *   bun scripts/vercel-routes.ts          rewrite vercel.json
 *   bun scripts/vercel-routes.ts --check  exit 1 if vercel.json is out of date
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  DYNAMIC_PUBLIC_ROUTES,
  PERMANENT_REDIRECTS,
  PUBLIC_ROUTES,
  routeHtmlFile,
  SPA_SHELL_FILE,
} from "../src/lib/public-routes.ts";
import { SECURITY_HEADERS } from "../src/lib/security-headers.ts";

export const API_REWRITE = {
  source: "/api/:path*",
  destination: "https://npanel-server.nisccloud.com/api/:path*",
};

export function buildVercelConfig() {
  return {
    buildCommand: "cd ../.. && turbo build --filter=www.nisccloud.com",
    outputDirectory: "dist",
    trailingSlash: false,
    headers: [{ source: "/(.*)", headers: SECURITY_HEADERS }],
    redirects: Object.entries(PERMANENT_REDIRECTS).map(([source, destination]) => ({
      source,
      destination,
      permanent: true,
    })),
    rewrites: [
      API_REWRITE,
      ...PUBLIC_ROUTES.map((source) => ({ source, destination: routeHtmlFile(source) })),
      ...DYNAMIC_PUBLIC_ROUTES.map(({ source }) => ({ source, destination: SPA_SHELL_FILE })),
    ],
  };
}

export const VERCEL_JSON_PATH = join(import.meta.dirname, "..", "vercel.json");

export function vercelConfigIsCurrent(): boolean {
  const current = JSON.parse(readFileSync(VERCEL_JSON_PATH, "utf8"));
  return JSON.stringify(current) === JSON.stringify(buildVercelConfig());
}

if (import.meta.main) {
  if (process.argv.includes("--check")) {
    if (!vercelConfigIsCurrent()) {
      console.error("vercel.json is out of date. Run: bun scripts/vercel-routes.ts");
      process.exit(1);
    }
    console.log("vercel.json matches src/lib/public-routes.ts");
  } else {
    writeFileSync(VERCEL_JSON_PATH, `${JSON.stringify(buildVercelConfig(), null, 2)}\n`);
    console.log(`vercel.json written with ${PUBLIC_ROUTES.length} public routes`);
  }
}
