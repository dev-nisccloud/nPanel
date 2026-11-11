import { prerender } from "react-dom/static";
import { StaticRouter } from "react-router-dom";
import { AppRoutes } from "./App.tsx";
import { DefaultProviders } from "./components/providers/default.tsx";
import { ROUTE_META } from "./lib/route-meta.ts";
import { ssrMetaSink, type PageMeta } from "./lib/seo.ts";

export { PRERENDER_ROUTES } from "./lib/public-routes.ts";
export { ROUTE_META };
export { DEFAULT_OG_IMAGE, SITE_NAME, SITE_ORIGIN, fitDescription } from "./lib/seo.ts";

/**
 * Build-time render of one route. `prerender` waits for lazy route chunks, so the HTML holds
 * the real page content for crawlers that do not execute JavaScript. The browser bundle still
 * mounts with createRoot and replaces this markup.
 */
export async function render(url: string): Promise<{ html: string; meta: PageMeta | null }> {
  ssrMetaSink.current = null;
  const { prelude } = await prerender(
    <DefaultProviders>
      <StaticRouter location={url}>
        <AppRoutes />
      </StaticRouter>
    </DefaultProviders>,
  );
  const html = await new Response(prelude).text();
  const key = url.replace(/\/+$/, "") || "/";
  return { html, meta: ssrMetaSink.current ?? ROUTE_META[key] ?? null };
}
