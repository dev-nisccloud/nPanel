export type TeamPermissionGrantedAccess = "read" | "write";

export function accessSatisfies(
  granted: string | undefined,
  required: TeamPermissionGrantedAccess,
): boolean {
  if (granted === "write") return true;
  if (required === "read") return granted === "read";
  return false;
}

export function moduleAccessSatisfies(
  permissions: Record<string, string>,
  modulePrefix: string,
  required: TeamPermissionGrantedAccess,
): boolean {
  const prefix = modulePrefix.endsWith(".") ? modulePrefix : `${modulePrefix}.`;
  return Object.entries(permissions).some(
    ([key, granted]) => key.startsWith(prefix) && accessSatisfies(granted, required),
  );
}

export type CustomerRoutePermission =
  | { type: "allow" }
  | { type: "key"; key: string; access?: TeamPermissionGrantedAccess }
  | { type: "module"; module: string; access?: TeamPermissionGrantedAccess };

const PREFIX_RULES: Array<{ prefix: string; rule: CustomerRoutePermission }> = [
  { prefix: "/invoices/create", rule: { type: "key", key: "billing.invoices_create", access: "write" } },
  { prefix: "/invoices", rule: { type: "key", key: "billing.invoices_view" } },
  { prefix: "/subscriptions", rule: { type: "key", key: "billing.subscriptions" } },
  { prefix: "/marketplace", rule: { type: "key", key: "marketplace.browse" } },
  { prefix: "/domains-portfolio", rule: { type: "key", key: "domains.portfolio" } },
  { prefix: "/domain-transfer", rule: { type: "key", key: "domains.transfer" } },
  { prefix: "/domains", rule: { type: "key", key: "domains.search_register" } },
  { prefix: "/hosting", rule: { type: "module", module: "hosting" } },
  { prefix: "/emails", rule: { type: "module", module: "emails" } },
  { prefix: "/wordpress", rule: { type: "module", module: "wordpress" } },
  { prefix: "/vps", rule: { type: "module", module: "servers.vps" } },
  { prefix: "/vds", rule: { type: "module", module: "servers.vds" } },
  { prefix: "/dedicated-servers", rule: { type: "module", module: "servers.dedicated" } },
  { prefix: "/ad-campaigns/meta-ads", rule: { type: "module", module: "ads.meta" } },
  { prefix: "/ad-campaigns/google-ads", rule: { type: "module", module: "ads.google" } },
  { prefix: "/ad-campaigns/linkedin-ads", rule: { type: "module", module: "ads.linkedin" } },
  { prefix: "/ad-campaigns", rule: { type: "module", module: "ads" } },
  { prefix: "/nisc-email-marketing/campaigns", rule: { type: "key", key: "email_marketing.campaigns" } },
  { prefix: "/nisc-email-marketing/audiences", rule: { type: "key", key: "email_marketing.audiences" } },
  { prefix: "/nisc-email-marketing/domain-configuration", rule: { type: "key", key: "email_marketing.sending_domains" } },
  { prefix: "/nisc-email-marketing", rule: { type: "module", module: "email_marketing" } },
  { prefix: "/nisc-email-builder", rule: { type: "key", key: "email_marketing.email_builder" } },
  { prefix: "/seo-reports", rule: { type: "key", key: "seo.reports" } },
  { prefix: "/creative-assets", rule: { type: "key", key: "creatives.assets" } },
  { prefix: "/zeepo-ai-agent", rule: { type: "key", key: "gen_ai.zeepo_agent" } },
  { prefix: "/zeepo-ai", rule: { type: "key", key: "gen_ai.zeepo_ai" } },
  { prefix: "/gen-ai/image-generator", rule: { type: "key", key: "gen_ai.image_generator" } },
  { prefix: "/gen-ai/background-remover", rule: { type: "key", key: "gen_ai.background_remover" } },
];

const ALWAYS_ALLOWED = new Set([
  "/dashboard",
  "/my-profile",
  "/settings",
]);

export function customerPathAfterSlug(pathname: string, teamSlug: string): string {
  const prefix = `/${teamSlug}`;
  if (pathname === prefix) return "/dashboard";
  if (pathname.startsWith(`${prefix}/`)) return `/${pathname.slice(prefix.length + 1)}`;
  return pathname;
}

export function matchCustomerRoutePermission(
  pathname: string,
  teamSlug: string,
): CustomerRoutePermission {
  const rest = customerPathAfterSlug(pathname, teamSlug);
  const path = rest.split("?")[0] ?? rest;
  if (ALWAYS_ALLOWED.has(path) || path === "/") return { type: "allow" };

  for (const { prefix, rule } of PREFIX_RULES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return rule;
  }
  return { type: "allow" };
}

export type NavPermissionFields = {
  permissionKey?: string;
  permissionModule?: string;
};

export function navItemIsAllowed<T extends NavPermissionFields & { subItems?: T[] }>(
  item: T,
  can: (key: string, access?: TeamPermissionGrantedAccess) => boolean,
  canModule: (module: string, access?: TeamPermissionGrantedAccess) => boolean,
): boolean {
  if (item.subItems && item.subItems.length > 0) {
    return item.subItems.some((sub) => navItemIsAllowed(sub, can, canModule));
  }
  if (item.permissionKey) return can(item.permissionKey, "read");
  if (item.permissionModule) return canModule(item.permissionModule, "read");
  return true;
}
