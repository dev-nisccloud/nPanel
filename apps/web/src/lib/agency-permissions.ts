export type AgencyPermissionGrantedAccess = "read" | "write";

export function agencyAccessSatisfies(
  granted: string | undefined,
  required: AgencyPermissionGrantedAccess,
): boolean {
  if (granted === "write") return true;
  if (required === "read") return granted === "read";
  return false;
}

export function agencyModuleAccessSatisfies(
  permissions: Record<string, string>,
  modulePrefix: string,
  required: AgencyPermissionGrantedAccess,
): boolean {
  const prefix = modulePrefix.endsWith(".") ? modulePrefix : `${modulePrefix}.`;
  return Object.entries(permissions).some(
    ([key, granted]) => key.startsWith(prefix) && agencyAccessSatisfies(granted, required),
  );
}

export type AgencyRoutePermission =
  | { type: "allow" }
  | { type: "deny" }
  | { type: "key"; key: string; access?: AgencyPermissionGrantedAccess }
  | { type: "module"; module: string; access?: AgencyPermissionGrantedAccess }
  | { type: "anyModule"; modules: string[]; access?: AgencyPermissionGrantedAccess };

const PREFIX_RULES: Array<{ prefix: string; rule: AgencyRoutePermission }> = [
  { prefix: "/hq/my-account", rule: { type: "allow" } },
  { prefix: "/hq/dashboard", rule: { type: "key", key: "dashboard.view" } },
  { prefix: "/hq/domains-portfolio", rule: { type: "key", key: "domains.portfolio" } },
  { prefix: "/hq/domain-transfer", rule: { type: "key", key: "domains.transfer" } },
  { prefix: "/hq/domains", rule: { type: "key", key: "domains.search_register" } },
  { prefix: "/hq/tlds", rule: { type: "key", key: "domains.tlds" } },
  { prefix: "/hq/whois", rule: { type: "key", key: "domains.whois" } },
  { prefix: "/hq/hosting", rule: { type: "key", key: "hosting.list" } },
  { prefix: "/hq/wordpress", rule: { type: "key", key: "wordpress.list" } },
  { prefix: "/hq/dedicated-servers", rule: { type: "key", key: "servers.dedicated.list" } },
  { prefix: "/hq/vps", rule: { type: "key", key: "servers.vps.list" } },
  { prefix: "/hq/vds", rule: { type: "key", key: "servers.vds.list" } },
  { prefix: "/hq/backup-restore", rule: { type: "key", key: "backup.list" } },
  { prefix: "/hq/cloud-storage", rule: { type: "key", key: "storage.browse" } },
  { prefix: "/hq/social-media-ads/linkedin", rule: { type: "module", module: "social_linkedin" } },
  { prefix: "/hq/social-media-ads/instagram", rule: { type: "module", module: "social_instagram" } },
  { prefix: "/hq/social-media-ads/google", rule: { type: "module", module: "social_google" } },
  {
    prefix: "/hq/social-media-ads",
    rule: { type: "anyModule", modules: ["social", "social_linkedin", "social_instagram", "social_google"] },
  },
  { prefix: "/hq/social-media-marketing", rule: { type: "module", module: "social" } },
  { prefix: "/hq/nisc-email-builder", rule: { type: "key", key: "email_marketing.email_builder" } },
  { prefix: "/hq/nisc-email-marketing/campaigns", rule: { type: "key", key: "email_marketing.campaigns" } },
  { prefix: "/hq/nisc-email-marketing/audiences", rule: { type: "key", key: "email_marketing.audiences" } },
  {
    prefix: "/hq/nisc-email-marketing/domain-configuration",
    rule: { type: "key", key: "email_marketing.sending_domains" },
  },
  { prefix: "/hq/nisc-email-marketing/email-events", rule: { type: "key", key: "email_marketing.events" } },
  { prefix: "/hq/nisc-email-marketing", rule: { type: "module", module: "email_marketing" } },
  { prefix: "/hq/email-marketing", rule: { type: "module", module: "email_marketing" } },
  { prefix: "/hq/seo-reports", rule: { type: "key", key: "seo.reports" } },
  { prefix: "/hq/seo-suite", rule: { type: "key", key: "seo.suite" } },
  { prefix: "/hq/seo", rule: { type: "module", module: "seo" } },
  { prefix: "/hq/creative-briefs", rule: { type: "key", key: "creatives.briefs" } },
  { prefix: "/hq/creative-assets", rule: { type: "key", key: "creatives.assets" } },
  { prefix: "/hq/zeepo-ai-agent", rule: { type: "key", key: "gen_ai.zeepo_agent" } },
  { prefix: "/hq/zeepo-canvas", rule: { type: "key", key: "gen_ai.zeepo_canvas" } },
  { prefix: "/hq/zeepo-ai", rule: { type: "key", key: "gen_ai.zeepo_ai" } },
  { prefix: "/hq/gen-ai", rule: { type: "module", module: "gen_ai" } },
  { prefix: "/hq/support", rule: { type: "key", key: "support.tickets" } },
  { prefix: "/hq/nisc-service-orders", rule: { type: "key", key: "products.orders" } },
  { prefix: "/hq/nisc-services", rule: { type: "key", key: "products.catalog" } },
  { prefix: "/hq/service-plans", rule: { type: "key", key: "products.catalog" } },
  { prefix: "/hq/manage-organizations", rule: { type: "key", key: "clients.organizations" } },
  { prefix: "/hq/manage-teams", rule: { type: "key", key: "clients.organizations" } },
  { prefix: "/hq/online-users", rule: { type: "key", key: "clients.list" } },
  { prefix: "/hq/clients", rule: { type: "key", key: "clients.list" } },
  { prefix: "/hq/quotations", rule: { type: "key", key: "billing.quotations" } },
  { prefix: "/hq/sales/service-orders", rule: { type: "key", key: "billing.service_orders" } },
  { prefix: "/hq/sales", rule: { type: "key", key: "billing.quotations" } },
  { prefix: "/hq/transactions", rule: { type: "key", key: "billing.transactions" } },
  { prefix: "/hq/invoices", rule: { type: "key", key: "billing.invoices" } },
  { prefix: "/hq/invoicing", rule: { type: "key", key: "billing.invoices" } },
  { prefix: "/hq/subscriptions", rule: { type: "key", key: "billing.subscriptions" } },
  { prefix: "/hq/billing", rule: { type: "module", module: "billing" } },
  { prefix: "/hq/orders", rule: { type: "key", key: "billing.checkout" } },
  { prefix: "/hq/nisc-payment-gateway", rule: { type: "key", key: "payments.gateway" } },
  { prefix: "/hq/kra-etims/sales", rule: { type: "key", key: "etims.sales" } },
  { prefix: "/hq/kra-etims/purchases", rule: { type: "key", key: "etims.purchases" } },
  { prefix: "/hq/kra-etims/products", rule: { type: "key", key: "etims.products" } },
  { prefix: "/hq/kra-etims/stock", rule: { type: "key", key: "etims.stock" } },
  { prefix: "/hq/kra-etims/imports", rule: { type: "key", key: "etims.imports" } },
  { prefix: "/hq/kra-etims/customers", rule: { type: "key", key: "etims.customers" } },
  { prefix: "/hq/kra-etims/branches", rule: { type: "key", key: "etims.branches" } },
  { prefix: "/hq/kra-etims/codes", rule: { type: "key", key: "etims.codes" } },
  { prefix: "/hq/kra-etims/notices", rule: { type: "key", key: "etims.notices" } },
  { prefix: "/hq/kra-etims/settings", rule: { type: "key", key: "etims.settings" } },
  { prefix: "/hq/kra-etims", rule: { type: "module", module: "etims" } },
  { prefix: "/hq/digitax", rule: { type: "module", module: "etims" } },
  { prefix: "/hq/nisc-reports", rule: { type: "module", module: "reports" } },
  { prefix: "/hq/reports", rule: { type: "module", module: "reports" } },
  { prefix: "/hq/crm/companies", rule: { type: "key", key: "crm.companies" } },
  { prefix: "/hq/crm/contacts", rule: { type: "key", key: "crm.contacts" } },
  { prefix: "/hq/crm/deals", rule: { type: "key", key: "crm.deals" } },
  { prefix: "/hq/crm", rule: { type: "module", module: "crm" } },
  { prefix: "/hq/hr/applications", rule: { type: "key", key: "hr.applications" } },
  { prefix: "/hq/hr", rule: { type: "module", module: "hr" } },
  { prefix: "/hq/manage-users", rule: { type: "key", key: "agency_admin.users" } },
  { prefix: "/hq/api-keys", rule: { type: "key", key: "agency_admin.api_keys" } },
  { prefix: "/hq/cronjobs", rule: { type: "key", key: "operations.cronjobs" } },
];

const SORTED_RULES = [...PREFIX_RULES].sort((a, b) => b.prefix.length - a.prefix.length);

export function matchAgencyRoutePermission(pathname: string): AgencyRoutePermission {
  let path = pathname.split("?")[0] ?? pathname;
  if (path === "/agency" || path.startsWith("/agency/")) {
    path = `/hq${path.slice("/agency".length)}`;
  }
  if (!path.startsWith("/hq")) return { type: "allow" };
  if (
    path === "/hq" ||
    path.startsWith("/hq/coming-soon") ||
    path.startsWith("/hq/loading")
  ) {
    return { type: "allow" };
  }
  for (const row of SORTED_RULES) {
    if (path === row.prefix || path.startsWith(`${row.prefix}/`)) return row.rule;
  }
  return { type: "deny" };
}
