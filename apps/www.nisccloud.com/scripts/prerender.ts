/**
 * Writes one static HTML file per public route after `vite build` and `vite build --ssr`.
 * Each file carries the route's own title, description, canonical, Open Graph tags, JSON-LD
 * and rendered page content, so search engines and AI crawlers that do not execute JavaScript
 * see the real page. A route that fails to render still gets a file with its metadata, so
 * vercel.json and server.ts never point at a missing file.
 *
 *   bun scripts/prerender.ts
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { SPA_SHELL_FILE, routeHtmlFile } from "../src/lib/public-routes.ts";
import type { PageMeta } from "../src/lib/seo.ts";

type ServerEntry = {
  render: (url: string) => Promise<{ html: string; meta: PageMeta | null }>;
  PRERENDER_ROUTES: readonly string[];
  ROUTE_META: Record<string, PageMeta>;
  SITE_ORIGIN: string;
  SITE_NAME: string;
  DEFAULT_OG_IMAGE: string;
  fitDescription: (text: string) => string;
};

const ROOT = join(import.meta.dirname, "..");
const DIST = join(ROOT, "dist");
const SSR_ENTRY = join(ROOT, "dist-ssr", "entry-server.js");
const ROBOTS = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

const escapeAttr = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeJson = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

function setTag(html: string, pattern: RegExp, replacement: string): string {
  return pattern.test(html) ? html.replace(pattern, replacement) : html.replace("</head>", `    ${replacement}\n  </head>`);
}

function applyHead(template: string, route: string, meta: PageMeta | null, entry: ServerEntry): string {
  if (!meta) return template;
  const url = `${entry.SITE_ORIGIN}${route === "/" ? "/" : route}`;
  const title = meta.title.includes(entry.SITE_NAME) ? meta.title : `${meta.title} | ${entry.SITE_NAME}`;
  const description = entry.fitDescription(meta.description);
  const image = meta.ogImage ?? entry.DEFAULT_OG_IMAGE;
  const t = escapeAttr(title);
  const d = escapeAttr(description);

  let html = template.replace(/<title>[\s\S]*?<\/title>/, `<title>${t}</title>`);
  html = setTag(html, /<meta name="description"[^>]*>/, `<meta name="description" content="${d}" />`);
  html = setTag(html, /<meta name="robots"[^>]*>/, `<meta name="robots" content="${meta.noindex ? "noindex, nofollow" : ROBOTS}" />`);
  html = setTag(html, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${escapeAttr(url)}" />`);
  html = setTag(html, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${t}" />`);
  html = setTag(html, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${d}" />`);
  html = setTag(html, /<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${escapeAttr(url)}" />`);
  html = setTag(html, /<meta property="og:type"[^>]*>/, `<meta property="og:type" content="${meta.ogType ?? "website"}" />`);
  html = setTag(html, /<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${escapeAttr(image)}" />`);
  html = setTag(html, /<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${t}" />`);
  html = setTag(html, /<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${d}" />`);
  html = setTag(html, /<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${escapeAttr(image)}" />`);

  if (meta.jsonLd) {
    const items = (Array.isArray(meta.jsonLd) ? meta.jsonLd : [meta.jsonLd]).map((item) => ({
      "@context": "https://schema.org",
      ...item,
    }));
    html = html.replace(
      "</head>",
      `    <script id="route-jsonld" type="application/ld+json">${escapeJson(items)}</script>\n  </head>`,
    );
  }
  return html;
}

function applyBody(html: string, rendered: string): string {
  if (!rendered.trim()) return html;
  return html
    .replace(/\s*<noscript>[\s\S]*?<\/noscript>/, "")
    .replace('<div id="root"></div>', `<div id="root">${rendered}</div>`);
}

async function main() {
  if (!existsSync(SSR_ENTRY)) throw new Error(`Missing ${SSR_ENTRY}. Run vite build --ssr first.`);
  const templatePath = join(DIST, "index.html");
  const shellPath = join(DIST, SPA_SHELL_FILE);
  if (!existsSync(shellPath)) copyFileSync(templatePath, shellPath);
  const template = readFileSync(shellPath, "utf8");

  const entry = (await import(pathToFileURL(SSR_ENTRY).href)) as ServerEntry;
  const failures: string[] = [];

  for (const route of entry.PRERENDER_ROUTES) {
    let html = template;
    try {
      const { html: rendered, meta } = await entry.render(route);
      html = applyBody(applyHead(template, route, meta, entry), rendered);
    } catch (error) {
      html = applyHead(template, route, entry.ROUTE_META[route] ?? null, entry);
      failures.push(`${route}: ${error instanceof Error ? error.message : String(error)}`);
    }
    const out = join(DIST, routeHtmlFile(route));
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html);
  }

  console.log(`[prerender] ${entry.PRERENDER_ROUTES.length - failures.length}/${entry.PRERENDER_ROUTES.length} routes rendered`);
  if (failures.length) {
    console.warn(`[prerender] Served as the SPA shell instead:\n  ${failures.join("\n  ")}`);
  }
}

await main();
