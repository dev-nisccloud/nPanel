import { TopProgressBar } from "@/components/top-progress-bar";

const FALLBACK_REDIRECT = "/auth/login";
/** Last-resort redirect if JS fails or fetch hangs (seconds). */
const META_REFRESH_SECONDS = 5;

/**
 * Root path "/" – returns 200 OK HTML with a small inline redirect bootstrap.
 *
 * Why: avoid 30x navigation issues with service workers and keep "/" resilient even if
 * client hydration is delayed.
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
      .then(function(res) {
        var contentType = res.headers.get("content-type") || "";
        if (!res.ok) throw new Error("redirect-target http " + res.status);
        if (contentType.indexOf("application/json") === -1) {
          return res.text().then(function(t) {
            throw new Error("redirect-target non-json: " + t.slice(0, 200));
          });
        }
        return res.json();
      })
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
      <TopProgressBar active />
    </>
  );
}
