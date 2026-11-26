import { type RouteConfig, type RouteConfigEntry } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

function rewriteStaffPath(path: string | undefined): string | undefined {
  if (!path) return path;
  if (path === "agency") return "hq";
  if (path.startsWith("agency/")) return `hq/${path.slice("agency/".length)}`;
  return path;
}

/** Same pages as /agency, served at /hq so the address no longer says agency. */
function cloneAsHq(entry: RouteConfigEntry): RouteConfigEntry {
  const fileId = entry.file.replace(/\.[jt]sx?$/, "");
  return {
    ...entry,
    id: `hq/${fileId}`,
    path: rewriteStaffPath(entry.path),
    children: entry.children?.map(cloneAsHq),
  };
}

function withHqAlias(entries: RouteConfigEntry[]): RouteConfigEntry[] {
  return entries.flatMap((entry) => {
    if (entry.path === "agency" || entry.path?.startsWith("agency/")) {
      return [entry, cloneAsHq(entry)];
    }
    if (entry.children) {
      return [{ ...entry, children: withHqAlias(entry.children) }];
    }
    return [entry];
  });
}

export default flatRoutes().then((routes) => withHqAlias(routes)) satisfies RouteConfig;
