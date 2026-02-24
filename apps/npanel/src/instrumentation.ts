/**
 * Logs every request error to console so Cloud Run / Firebase logs show the real cause of 500s.
 * In next.config we keep console.error in production.
 */
export async function onRequestError(
  err: Error & { digest?: string },
  request: { path: string; method: string },
  context: { routePath: string; routeType: string }
) {
  console.error(
    "[onRequestError]",
    err?.message ?? String(err),
    "| path:",
    request?.path,
    "| method:",
    request?.method,
    "| routePath:",
    context?.routePath,
    "| routeType:",
    context?.routeType,
    "| digest:",
    err?.digest ?? "",
    "| stack:",
    err?.stack ?? ""
  );
}
