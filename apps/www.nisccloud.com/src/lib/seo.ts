import { useEffect } from "react";

export const SITE_ORIGIN = "https://nisccloud.com";
export const SITE_NAME = "Nisc Cloud";
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/nisccloud-logo.svg`;
const DEFAULT_ROBOTS = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

export type PageMeta = {
  /** Page title without the site suffix. */
  title: string;
  description: string;
  /** Path (e.g. `/hosting/vps`). Defaults to the current pathname without query. */
  canonicalPath?: string;
  /** Prevent indexing (cart, 404, soft-404 states). */
  noindex?: boolean;
  ogType?: "website" | "article";
  ogImage?: string;
  /** One or more JSON-LD objects for this route. Replaced on every route change. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    document.head.appendChild(el);
  }
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

const ROUTE_JSONLD_ID = "route-jsonld";
const MAX_DESCRIPTION = 160;

/** Search results truncate around 160 characters; prefer ending on a full sentence. */
export function fitDescription(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= MAX_DESCRIPTION) return clean;
  const head = clean.slice(0, MAX_DESCRIPTION);
  const sentenceEnd = Math.max(head.lastIndexOf(". "), head.lastIndexOf("? "), head.lastIndexOf("! "));
  if (sentenceEnd >= 70) return head.slice(0, sentenceEnd + 1);
  const wordEnd = head.slice(0, MAX_DESCRIPTION - 1).lastIndexOf(" ");
  return `${head.slice(0, wordEnd).replace(/[,;:\s]+$/, "")}…`;
}

/**
 * Apply metadata for the current route. Safe to call repeatedly; every call
 * fully overwrites the previous route's values so nothing leaks between pages.
 */
export function applyPageMeta(meta: PageMeta) {
  if (typeof document === "undefined") return;
  const path = meta.canonicalPath ?? (window.location.pathname.replace(/\/+$/, "") || "/");
  const url = `${SITE_ORIGIN}${path === "/" ? "/" : path}`;
  const fullTitle = meta.title.includes(SITE_NAME) ? meta.title : `${meta.title} | ${SITE_NAME}`;

  document.title = fullTitle;
  const description = fitDescription(meta.description);
  upsertMeta('meta[name="description"]', { name: "description", content: description });
  upsertMeta('meta[name="robots"]', {
    name: "robots",
    content: meta.noindex ? "noindex, nofollow" : DEFAULT_ROBOTS,
  });
  upsertLink("canonical", url);

  upsertMeta('meta[property="og:title"]', { property: "og:title", content: fullTitle });
  upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
  upsertMeta('meta[property="og:url"]', { property: "og:url", content: url });
  upsertMeta('meta[property="og:type"]', { property: "og:type", content: meta.ogType ?? "website" });
  upsertMeta('meta[property="og:image"]', { property: "og:image", content: meta.ogImage ?? DEFAULT_OG_IMAGE });
  upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: fullTitle });
  upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
  upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: meta.ogImage ?? DEFAULT_OG_IMAGE });

  const existing = document.getElementById(ROUTE_JSONLD_ID);
  if (meta.jsonLd) {
    const script = (existing as HTMLScriptElement | null) ?? document.createElement("script");
    script.id = ROUTE_JSONLD_ID;
    script.type = "application/ld+json";
    const items = Array.isArray(meta.jsonLd) ? meta.jsonLd : [meta.jsonLd];
    script.textContent = JSON.stringify(
      items.map((item) => ({ "@context": "https://schema.org", ...item })),
    );
    if (!existing) document.head.appendChild(script);
  } else if (existing) {
    existing.remove();
  }
}

/** Build-time prerender: effects do not run on the server, so the last page metadata rendered is kept here. */
export const ssrMetaSink: { current: PageMeta | null } = { current: null };

/** Hook form of {@link applyPageMeta}. Re-applies when any field changes. */
export function usePageMeta(meta: PageMeta) {
  if (typeof document === "undefined") ssrMetaSink.current = meta;
  const serialized = JSON.stringify(meta);
  useEffect(() => {
    applyPageMeta(JSON.parse(serialized) as PageMeta);
  }, [serialized]);
}

/** Breadcrumb JSON-LD helper. `items` are [label, path] pairs from the home page down. */
export function breadcrumbJsonLd(items: [string, string][]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: `${SITE_ORIGIN}${path}`,
    })),
  };
}

/** Service JSON-LD helper for product and service pages. */
export function serviceJsonLd(input: { name: string; description: string; path: string; category?: string }) {
  return {
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: `${SITE_ORIGIN}${input.path}`,
    ...(input.category ? { serviceType: input.category } : {}),
    provider: { "@type": "Organization", name: SITE_NAME, url: SITE_ORIGIN },
    areaServed: { "@type": "Country", name: "Kenya" },
  };
}

/** FAQPage JSON-LD helper. */
export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
