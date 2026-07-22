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
    const PENDING_KEY = "npanel_pending_auth_redirect";
    let cancelled = false;

    console.log("[RootPage] Bootstrapping redirect...", REDIRECT_TARGET_URL);

    function readPendingRedirect() {
      try {
        var value = sessionStorage.getItem(PENDING_KEY);
        return value && value.trim() ? value.trim() : null;
      } catch (e) {
        return null;
      }
    }

    function clearPendingRedirect() {
      try { sessionStorage.removeItem(PENDING_KEY); } catch (e) {}
    }

    function buildRedirectTargetUrl() {
      var pending = readPendingRedirect();
      if (!pending) return REDIRECT_TARGET_URL;
      var sep = REDIRECT_TARGET_URL.indexOf("?") >= 0 ? "&" : "?";
      return REDIRECT_TARGET_URL + sep + "redirect=" + encodeURIComponent(pending);
    }

    // Safety timeout in case fetch hangs
    setTimeout(function() {
      if (!cancelled) {
        console.log("[RootPage] Timeout hit, redirecting to fallback...");
        cancelled = true;
        window.location.replace(FALLBACK);
      }
    }, ${META_REFRESH_SECONDS * 1000});

    fetch(buildRedirectTargetUrl(), { cache: "no-store", credentials: "include" })
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
          var target = data.redirect || FALLBACK;
          console.log("[RootPage] Redirecting to:", target);
          cancelled = true;
          if (target !== FALLBACK) clearPendingRedirect();
          window.location.replace(target);
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
