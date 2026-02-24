"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

const APP_NAME = "Nisc Cloud - nPanel";
const FALLBACK_REDIRECT = "/auth/login";
/** Last-resort redirect if JS fails or fetch hangs (seconds). */
const META_REFRESH_SECONDS = 5;

/**
 * Root path "/" – client-side redirect only.
 * No server-side auth or DB on this route, so it cannot 500 from getRootRedirectTarget/Prisma.
 * Fetches /api/auth/redirect-target (which never returns 5xx) and redirects.
 */
export default function RootPage() {
  const [status, setStatus] = useState<"loading" | "redirecting">("loading");

  useEffect(() => {
    let cancelled = false;

    async function go() {
      try {
        const res = await fetch("/api/auth/redirect-target", {
          cache: "no-store",
          credentials: "include",
        });
        const data = (await res.json()) as { redirect?: string };
        const target =
          typeof data?.redirect === "string" && data.redirect
            ? data.redirect
            : FALLBACK_REDIRECT;
        if (cancelled) return;
        setStatus("redirecting");
        window.location.replace(target);
      } catch {
        if (cancelled) return;
        setStatus("redirecting");
        window.location.replace(FALLBACK_REDIRECT);
      }
    }

    go();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {/* If JS fails or fetch hangs, still get to login after N seconds */}
      <meta
        httpEquiv="refresh"
        content={`${META_REFRESH_SECONDS};url=${FALLBACK_REDIRECT}`}
      />
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100"
        aria-live="polite"
        aria-busy={status === "loading"}
        role="status"
      >
        <Spinner variant="infinite" className="text-primary" size={40} />
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-lg font-semibold">
            {status === "loading" ? "Loading…" : "Redirecting…"}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {APP_NAME}
          </p>
        </div>
      </div>
    </>
  );
}
