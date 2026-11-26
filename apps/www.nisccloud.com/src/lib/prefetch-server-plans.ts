const started = new Set<string>();

/**
 * Warms the server-plan catalogue when a visitor points at a server link, so the plan grid is
 * usually ready when the page opens. Uses the same request and cache as the plan sections.
 */
export function prefetchServerPlans(href: string): void {
  if (started.has(href)) return;
  const kind =
    href === "/hosting/vps" ? "vps" : href === "/hosting/vds" ? "vds" : href === "/hosting/dedicated-servers" ? "dedicated" : null;
  if (!kind) return;
  started.add(href);
  void import("./vps-plans-api.ts")
    .then((api) =>
      Promise.all([
        kind === "vps"
          ? api.fetchVpsPlansPublic(0, 6)
          : kind === "vds"
            ? api.fetchVdsPlansPublic(0, 6)
            : api.fetchDedicatedPlansPublic(0, 6),
        api.fetchVpsPricingSettings(kind === "vps" ? "VPS" : kind === "vds" ? "VDS" : "DEDICATED_SERVERS"),
        api.fetchExchangeRatesPublic(),
        api.fetchFacilitiesPublic(),
      ]),
    )
    .catch(() => started.delete(href));
}
