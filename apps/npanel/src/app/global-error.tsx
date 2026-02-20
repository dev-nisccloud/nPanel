"use client";

/**
 * Catches uncaught errors in the root layout and elsewhere.
 * Only active in production; in dev Next.js shows the error overlay.
 * Must define its own <html> and <body> (replaces root layout when triggered).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fafafa", color: "#18181b", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#71717a", marginBottom: "1.5rem" }}>
            The page could not be loaded. Please try again. If the problem persists, try again later or contact support.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              backgroundColor: "#18181b",
              color: "#fff",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <div style={{ marginTop: "1.5rem" }}>
            <a
              href="/"
              style={{ fontSize: "0.875rem", color: "#3b82f6", textDecoration: "none" }}
            >
              Go to home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
