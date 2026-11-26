import type { HivelocityAddonOption, HivelocityOsOption } from "@/lib/vps-plans-api.ts";

/** Supplier names carry plan suffixes such as "(VPS)" or "(AlmaLinux 9 - VPS)" that mean nothing to buyers. */
export function cleanOptionName(name: string): string {
  return name
    .replace(/\s*\((?:[^)]*\s-\s)?VPS\)\s*$/i, "")
    .replace(/\s*-\s*latest$/i, "")
    .replace(/^wordpress$/i, "WordPress")
    .replace(/^grafana-prometheus$/i, "Grafana + Prometheus")
    .replace(/^I am interested\. Please contact me with more details\.?\s*$/i, "Ask us about it")
    .replace(/\s+/g, " ")
    .trim();
}

export function isNoneOption(option: { name: string }): boolean {
  return /^none$/i.test(option.name.trim());
}

// ─── Operating systems ────────────────────────────────────────────────────────

const FAMILIES: { key: string; name: string; match: RegExp; strip: RegExp }[] = [
  { key: "ubuntu", name: "Ubuntu", match: /ubuntu/i, strip: /ubuntu/i },
  { key: "debian", name: "Debian", match: /debian/i, strip: /debian/i },
  { key: "almalinux", name: "AlmaLinux", match: /alma/i, strip: /almalinux/i },
  { key: "rocky", name: "Rocky Linux", match: /rocky/i, strip: /rocky\s*linux/i },
  { key: "windows", name: "Windows Server", match: /windows/i, strip: /windows(\s+server)?/i },
  { key: "proxmox", name: "Proxmox", match: /proxmox/i, strip: /proxmox(\s+ve)?/i },
  { key: "centos", name: "CentOS", match: /centos/i, strip: /centos/i },
  { key: "fedora", name: "Fedora", match: /fedora/i, strip: /fedora/i },
  { key: "flatcar", name: "Flatcar Linux", match: /flatcar/i, strip: /flatcar(\s+linux)?/i },
];

export type OsVersion = { os: HivelocityOsOption; label: string };
export type OsFamily = { key: string; name: string; versions: OsVersion[] };

function versionNumbers(label: string): number[] {
  return [...label.matchAll(/\d+/g)].map((m) => Number(m[0]));
}

function compareVersionsDesc(a: OsVersion, b: OsVersion): number {
  const na = versionNumbers(a.label);
  const nb = versionNumbers(b.label);
  for (let i = 0; i < Math.max(na.length, nb.length); i++) {
    const diff = (nb[i] ?? -1) - (na[i] ?? -1);
    if (diff !== 0) return diff;
  }
  return a.os.monthlyPriceUsd - b.os.monthlyPriceUsd;
}

function versionLabel(familyKey: string, strip: RegExp | null, name: string): string {
  let label = strip ? name.replace(strip, "") : name;
  label = label.replace(/\.x\b/gi, "").replace(/\s+/g, " ").trim();
  if (familyKey === "ubuntu") {
    const m = label.match(/^(\d{2})\.04$/);
    if (m && Number(m[1]) % 2 === 0) label = `${label} LTS`;
  }
  return label || "Latest";
}

/** One tile per distribution, newest version first, in the order buyers usually look for them. */
export function groupOsFamilies(osList: HivelocityOsOption[]): OsFamily[] {
  const families = new Map<string, OsFamily>();
  for (const os of osList) {
    const name = cleanOptionName(os.name);
    const rule = FAMILIES.find((f) => f.match.test(name));
    const key = rule?.key ?? name.toLowerCase();
    const family = families.get(key) ?? { key, name: rule?.name ?? name, versions: [] };
    family.versions.push({ os, label: rule ? versionLabel(rule.key, rule.strip, name) : "Latest" });
    families.set(key, family);
  }
  const order = (key: string) => {
    const i = FAMILIES.findIndex((f) => f.key === key);
    return i === -1 ? FAMILIES.length : i;
  };
  return [...families.values()]
    .map((f) => ({ ...f, versions: [...f.versions].sort(compareVersionsDesc) }))
    .sort((a, b) => order(a.key) - order(b.key) || a.name.localeCompare(b.name));
}

export function osDisplayName(os: HivelocityOsOption): string {
  const name = cleanOptionName(os.name);
  const family = groupOsFamilies([os])[0];
  const version = family?.versions[0]?.label;
  return family && version && version !== "Latest" ? `${family.name} ${version}` : name;
}

/** OS names whose tags satisfy any of the given expressions, e.g. "AlmaLinux 8 or 9, Ubuntu 22.04". */
export function describeCompatibleOs(expressions: string[], osList: HivelocityOsOption[]): string | null {
  const tokens = new Set(expressions.flatMap((e) => e.toLowerCase().match(/[a-z]+\d+/g) ?? []));
  if (!tokens.size) return null;
  const matching = osList.filter((os) => (os.tags ?? []).some((t) => tokens.has(t.toLowerCase())));
  if (!matching.length) return null;
  const parts = groupOsFamilies(matching).map((f) => {
    const versions = f.versions.map((v) => v.label.replace(/ LTS$/, ""));
    return `${f.name} ${versions.join(" or ")}`;
  });
  return parts.join(", ");
}

// ─── Add-on groups ────────────────────────────────────────────────────────────

export type GroupKind = "apps" | "panel" | "location" | "os" | "upgrade";

export function groupKind(groupName: string): GroupKind {
  const g = groupName.toLowerCase();
  if (g.includes("operating system")) return "os";
  if (g.includes("data center") || g.includes("location")) return "location";
  if (g.includes("control panel")) return "panel";
  if (g.includes("app") || g.includes("application")) return "apps";
  return "upgrade";
}

/** Groups with a real choice: at least one option other than "None", and more than one option overall. */
export function hasRealChoice(options: HivelocityAddonOption[]): boolean {
  const real = options.filter((o) => !isNoneOption(o));
  return real.length > 0 && options.length > 1;
}

const GROUP_LABELS: Record<string, string> = {
  ddos: "DDoS protection",
  "drive upgrades": "Extra drive",
  "daily backup & rapid restore": "Daily backups",
  "managed services": "Server management",
  "data migration": "Data migration",
  "wasabi object storage": "Object storage",
  litespeed: "LiteSpeed web server",
};

export function groupLabel(groupName: string): string {
  const known = GROUP_LABELS[groupName.trim().toLowerCase()];
  if (known) return known;
  const lower = groupName.trim().toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** The choice that means "keep what the server comes with", shown first and selected when nothing is picked. */
export function defaultChoice(options: HivelocityAddonOption[]): { label: string; optionId: number | null } | null {
  const none = options.filter(isNoneOption);
  const freeReal = options.filter((o) => !isNoneOption(o) && o.monthlyPriceUsd <= 0);
  const looksLikeSpec = (name: string) => /\d\s*(GB|TB|Gbps)\b/i.test(name);
  if (none.length && freeReal.length === 1 && looksLikeSpec(freeReal[0].name)) {
    return { label: cleanOptionName(freeReal[0].name), optionId: freeReal[0].id };
  }
  if (none.length) return { label: "None", optionId: null };
  if (freeReal.length) return { label: cleanOptionName(freeReal[0].name), optionId: freeReal[0].id };
  return null;
}

// ─── Specs shown on the server card ───────────────────────────────────────────

const SPEC_GROUPS: { key: "cpu" | "memory" | "disk" | "network" | "ip"; match: RegExp }[] = [
  { key: "cpu", match: /^processor$/i },
  { key: "memory", match: /^memory$/i },
  { key: "disk", match: /primary (hard )?drive/i },
  { key: "network", match: /^bandwidth$/i },
  { key: "ip", match: /^ip addresses$/i },
];

export type ServerSpec = { key: (typeof SPEC_GROUPS)[number]["key"]; value: string };

/** What the server comes with, from single-value groups, updated when an upgrade in that group is picked. */
export function serverSpecs(groups: Record<string, HivelocityAddonOption[]>, selectedIds: number[]): ServerSpec[] {
  const specs: ServerSpec[] = [];
  for (const { key, match } of SPEC_GROUPS) {
    const entry = Object.entries(groups).find(([name]) => match.test(name.trim()));
    if (!entry) continue;
    const options = entry[1];
    const picked = options.find((o) => selectedIds.includes(o.id) && !isNoneOption(o));
    const base = options.filter((o) => !isNoneOption(o) && o.monthlyPriceUsd <= 0);
    const value = picked?.name ?? (base.length === 1 ? base[0].name : null);
    if (!value) continue;
    const usableIps = key === "ip" ? Number(value.match(/\((\d+)\s+usable IPs?\)/i)?.[1]) : NaN;
    specs.push({
      key,
      value: Number.isFinite(usableIps)
        ? `${usableIps} usable IP${usableIps === 1 ? "" : "s"}`
        : cleanOptionName(value).replace(/(\d)(GB|TB)\b/g, "$1 $2").replace(/\.0 (GB|TB)/, " $1"),
    });
  }
  return specs;
}

// ─── Control panels ───────────────────────────────────────────────────────────

export type PanelTier = { label: string; options: HivelocityAddonOption[] };
export type PanelProduct = { name: string; tiers: PanelTier[]; expressions: string[] };

function panelName(name: string): string {
  return cleanOptionName(name)
    .replace(/^\(legacy\)\s*/i, "")
    .replace(/\s+for\s+.*$/i, "")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim();
}

function panelTierLabel(name: string): string {
  const clean = cleanOptionName(name).replace(/\s*\([^)]*\)\s*$/, "");
  const accounts = clean.match(/for\s+([\d+–-]+)\s+accounts/i)?.[1]?.replace("-", "–");
  const extra = clean.match(/additional accounts\s+(\$[\d.]+)\s+each/i)?.[1];
  const legacy = /^\(legacy\)/i.test(name.trim()) ? " (legacy)" : "";
  if (!accounts) return clean;
  return `${accounts} accounts${extra ? `, then ${extra} per account` : ""}${legacy}`;
}

export type ServerComponentLine = { name: string; price: string; logo: boolean };

/** The OS and add-ons the buyer picked, for the order summary. Prices are labels such as "Included" or "KES 390/mo". */
export function describeServerSelection(input: {
  selectedOsId: string;
  selectedOptionIds: number[];
  osList: HivelocityOsOption[];
  addonGroups: Record<string, HivelocityAddonOption[]>;
  osPrice: (usd: number) => string;
  addonPrice: (usd: number) => string;
}): ServerComponentLine[] {
  const lines: ServerComponentLine[] = [];
  const os = input.osList.find((o) => String(o.id) === input.selectedOsId);
  if (os) lines.push({ name: osDisplayName(os), price: input.osPrice(os.monthlyPriceUsd), logo: true });
  for (const [group, options] of Object.entries(input.addonGroups)) {
    const kind = groupKind(group);
    for (const option of options) {
      if (!input.selectedOptionIds.includes(option.id) || isNoneOption(option)) continue;
      const name =
        kind === "panel"
          ? `${panelName(option.name)}, ${panelTierLabel(option.name)}`
          : kind === "upgrade"
            ? `${groupLabel(group)}: ${cleanOptionName(option.name)}`
            : cleanOptionName(option.name);
      lines.push({ name, price: input.addonPrice(option.monthlyPriceUsd), logo: kind !== "upgrade" });
    }
  }
  return lines;
}

/** cPanel arrives as one row per account tier per OS; buyers pick a panel and a tier. */
export function groupPanels(options: HivelocityAddonOption[]): PanelProduct[] {
  const products = new Map<string, PanelProduct>();
  for (const option of options) {
    if (isNoneOption(option)) continue;
    const name = panelName(option.name);
    const product = products.get(name) ?? { name, tiers: [], expressions: [] };
    const label = panelTierLabel(option.name);
    const tier = product.tiers.find((t) => t.label === label);
    if (tier) tier.options.push(option);
    else product.tiers.push({ label, options: [option] });
    product.expressions.push(...(option.expressions ?? []));
    products.set(name, product);
  }
  for (const product of products.values()) {
    product.tiers.sort((a, b) => (versionNumbers(a.label)[0] ?? 0) - (versionNumbers(b.label)[0] ?? 0));
  }
  return [...products.values()];
}
