import { Spinner } from "@/components/ui/shadcn-io/spinner";

const APP_NAME = "Nisc Cloud - nPanel";
const FALLBACK_REDIRECT = "/auth/login";
/** Last-resort redirect if JS fails or fetch hangs (seconds). */
const META_REFRESH_SECONDS = 5;

/**
 * Root path "/" – Server Component returning a 200 OK HTML document.
 * 
 * WHY THIS APPROACH?
 * 1. Service Worker Bug: If we use Next.js `redirect()` it returns a 307. 
 *    Service Workers fail to handle 30X redirects on `navigate` requests, causing an offline/Not Found error.
 * 2. Next.js 15+ Standalone Bug: If we use `"use client"` here, Next.js throws 
 *    `InvariantError: The client reference manifest for route "/" does not exist.`
 * 
 * SOLUTION:
 * Pure Server Component that returns 200 OK and executes a vanilla inline script 
 * to fetch the redirect target and navigate client-side.
 */
export default function RootPage() {
  const inlineScript = `
    const FALLBACK = "${FALLBACK_REDIRECT}";
    let cancelled = false;
    
    // Safety timeout in case fetch hangs
    setTimeout(function() {
      if (!cancelled) {
        cancelled = true;
        window.location.replace(FALLBACK);
      }
    }, ${META_REFRESH_SECONDS * 1000});

    fetch("/api/auth/redirect-target", { cache: "no-store", credentials: "include" })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (!cancelled) {
          cancelled = true;
          window.location.replace(data.redirect || FALLBACK);
        }
      })
      .catch(function() {
        if (!cancelled) {
          cancelled = true;
          window.location.replace(FALLBACK);
        }
      });
  `;

  return (
    <>
      {/* If JS fails to run entirely, still get to login after N seconds */}
      <meta
        httpEquiv="refresh"
        content={`${META_REFRESH_SECONDS};url=${FALLBACK_REDIRECT}`}
      />
      {/* Execute the auth check and redirect client-side */}
      <script dangerouslySetInnerHTML={{ __html: inlineScript }} />

      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100"
        aria-live="polite"
        aria-busy="true"
        role="status"
      >
        <Spinner variant="infinite" className="text-primary" size={40} />
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-lg font-semibold">Redirecting…</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {APP_NAME}
          </p>
        </div>
      </div>
    </>
  );
}
