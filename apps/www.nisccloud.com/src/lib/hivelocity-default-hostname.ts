/** Parent domain for default Hivelocity server hostnames (FQDN suffix). */
export const HIVELOCITY_DEFAULT_HOSTNAME_DOMAIN =
  (import.meta.env.VITE_HIVELOCITY_DEFAULT_HOSTNAME_DOMAIN as string | undefined)?.trim().toLowerCase() ||
  "nisccloud.com";

export type HivelocityDefaultHostnameProductType = "DEDICATED_SERVERS" | "VPS" | "VDS";

const HOSTNAME_SUFFIX_BY_PRODUCT: Record<HivelocityDefaultHostnameProductType, string> = {
  VPS: "vps",
  VDS: "vds",
  DEDICATED_SERVERS: "ds",
};

function randomHostnameToken(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 16);
}

/** e.g. `mpkxfyu852t7fgki-vps.nisccloud.com` */
export function generateDefaultHivelocityHostname(
  productType: HivelocityDefaultHostnameProductType,
): string {
  const suffix = HOSTNAME_SUFFIX_BY_PRODUCT[productType] ?? "ds";
  const label = `${randomHostnameToken()}-${suffix}`.slice(0, 63);
  return `${label}.${HIVELOCITY_DEFAULT_HOSTNAME_DOMAIN}`;
}

export function isValidHivelocityHostname(value: string): boolean {
  if (!value.trim()) return false;
  return /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(value.trim());
}

export function serviceTypeToHivelocityProductType(
  serviceType: string,
): HivelocityDefaultHostnameProductType | null {
  if (serviceType === "vps") return "VPS";
  if (serviceType === "vds") return "VDS";
  if (serviceType === "dedicated_servers") return "DEDICATED_SERVERS";
  return null;
}
