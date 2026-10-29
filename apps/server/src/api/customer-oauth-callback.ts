import { createContext, t } from "@npanel/api";
import { appRouter } from "@npanel/api/routers/index";
import { TRPCError } from "@trpc/server";
import type { Context } from "hono";

const callerFactory = t.createCallerFactory(appRouter);

const PLATFORM_BY_SLUG = {
  meta: "meta_facebook",
  linkedin: "linkedin_ads",
  google: "google_ads",
} as const;

const FALLBACK_BY_SLUG: Record<string, string> = {
  meta: "/agency/social-media-ads/facebook",
  linkedin: "/agency/social-media-ads/linkedin",
  google: "/agency/social-media-ads/google",
};

const FALLBACK_PATH = FALLBACK_BY_SLUG.meta;

function publicOrigin(c: Context): string {
  const configured = process.env.VITE_PUBLIC_APP_URL || process.env.FRONTEND_URL;
  if (configured) return configured.replace(/\/$/, "");
  const host = c.req.header("x-forwarded-host");
  const proto = c.req.header("x-forwarded-proto") || "http";
  if (host) return `${proto}://${host}`;
  return new URL(c.req.url).origin;
}

function safeReturnUrl(value: string | null | undefined, c: Context): string {
  const fallback = new URL(FALLBACK_PATH, publicOrigin(c)).toString();
  if (!value) return fallback;

  if (value.startsWith("/") && !value.startsWith("//")) {
    return new URL(value, publicOrigin(c)).toString();
  }

  try {
    const url = new URL(value);
    const allowed = new Set<string>();
    const configured = process.env.VITE_PUBLIC_APP_URL || process.env.FRONTEND_URL;
    if (configured) allowed.add(new URL(configured).origin);
    const host = c.req.header("x-forwarded-host");
    const proto = c.req.header("x-forwarded-proto") || "http";
    if (host) allowed.add(`${proto}://${host}`);
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if ((url.protocol === "http:" || url.protocol === "https:") && (allowed.has(url.origin) || local)) {
      return `${url.origin}${url.pathname}`;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function redirectWith(c: Context, target: string, params: Record<string, string>) {
  const next = new URL(target);
  for (const [key, value] of Object.entries(params)) {
    next.searchParams.set(key, value);
  }
  return c.redirect(next.toString());
}

export async function handleCustomerOAuthCallback(c: Context) {
  const slug = c.req.param("platform");
  const platform = PLATFORM_BY_SLUG[slug as keyof typeof PLATFORM_BY_SLUG];
  const fallbackPath = FALLBACK_BY_SLUG[slug] || FALLBACK_PATH;
  const fallback = safeReturnUrl(fallbackPath, c);

  if (!platform) {
    return redirectWith(c, fallback, { oauth: "error", message: "Unsupported platform" });
  }

  const oauthError = c.req.query("error");
  if (oauthError) {
    return redirectWith(c, fallback, {
      oauth: "error",
      message: c.req.query("error_description") || "Authorization was cancelled.",
    });
  }

  const code = c.req.query("code");
  const state = c.req.query("state");
  if (!code || !state) {
    return redirectWith(c, fallback, { oauth: "error", message: "Missing authorization code" });
  }

  const ctx = await createContext({
    context: c,
    createCaller: (inner) => callerFactory(inner),
  });

  if (!ctx.session?.user?.id) {
    const login = new URL("/auth/login", publicOrigin(c));
    login.searchParams.set("redirect", fallbackPath);
    return c.redirect(login.toString());
  }

  try {
    const caller = callerFactory(ctx);
    const result = await caller.customerOAuth.auth.handleCallback({
      platform,
      code,
      state,
    });
    return redirectWith(c, safeReturnUrl(result.returnUrl, c), {
      oauth: "connected",
      connectionId: result.connectionId,
    });
  } catch (error) {
    const message = error instanceof TRPCError ? error.message : "Failed to connect the account";
    return redirectWith(c, fallback, { oauth: "error", message });
  }
}
