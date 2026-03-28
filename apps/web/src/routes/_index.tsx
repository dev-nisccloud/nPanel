import { TopProgressBar } from "@/components/top-progress-bar";
import { apiUrl } from "@/lib/auth-client";

const FALLBACK_REDIRECT = "/auth/login";
/** Last-resort redirect if JS fails or fetch hangs (seconds). */
const META_REFRESH_SECONDS = 3;

// Use the same server origin that authClient uses.
const REDIRECT_TARGET_URL = apiUrl("/api/auth/redirect-target");

/**
 * Root path "/" – returns 200 OK HTML with a small inline redirect bootstrap.
 */
export default function RootPage() {
  const inlineScript = `
    const FALLBACK = "${FALLBACK_REDIRECT}";
    const REDIRECT_TARGET_URL = ${JSON.stringify(REDIRECT_TARGET_URL)};
    let cancelled = false;
    
    console.log("[RootPage] Bootstrapping redirect...", REDIRECT_TARGET_URL);

    // Safety timeout in case fetch hangs
    setTimeout(function() {
      if (!cancelled) {
        console.log("[RootPage] Timeout hit, redirecting to fallback...");
        cancelled = true;
        window.location.replace(FALLBACK);
      }
    }, ${META_REFRESH_SECONDS * 1000});

    fetch(REDIRECT_TARGET_URL, { cache: "no-store", credentials: "include" })
      .then(function(res) {
        if (!res.ok) throw new Error("redirect-target http " + res.status);
        const contentType = res.headers.get("content-type") || "";
        if (contentType.indexOf("application/json") === -1) {
           throw new Error("redirect-target non-json");
        }
        return res.json();
      })
      .then(function(data) {
        if (!cancelled) {
          console.log("[RootPage] Redirecting to:", data.redirect || FALLBACK);
          cancelled = true;
          window.location.replace(data.redirect || FALLBACK);
        }
      })
      .catch(function(err) {
        console.error("[RootPage] Redirect check failed:", err);
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
