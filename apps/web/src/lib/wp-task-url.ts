/** Client-side mirror of packages/api normalizeWpToolkitTaskUrl for polling. */
export function normalizeWpToolkitTaskUrl(taskUrl: string): string | null {
  try {
    let path = taskUrl.trim();
    if (path.startsWith("http://") || path.startsWith("https://")) {
      path = new URL(path).pathname;
    }
    for (const prefix of ["/api/modules/wp-toolkit", "/modules/wp-toolkit"]) {
      if (path.startsWith(prefix)) {
        path = path.slice(prefix.length);
        break;
      }
    }
    if (!path.startsWith("/")) path = `/${path}`;
    path = path.replace(/\/$/, "");
    if (!/^\/v1\/background-tasks\/[a-zA-Z0-9._-]+\/\d+$/.test(path)) {
      return null;
    }
    return path;
  } catch {
    return null;
  }
}
