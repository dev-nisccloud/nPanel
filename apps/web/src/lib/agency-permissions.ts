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
  { prefix: "/agency/my-account", rule: { type: "allow" } },
  { prefix: "/agency/dashboard", rule: { type: "key", key: "dashboard.view" } },
  { prefix: "/agency/domains-portfolio", rule: { type: "key", key: "domains.portfolio" } },
  { prefix: "/agency/domain-transfer", rule: { type: "key", key: "domains.transfer" } },
  { prefix: "/agency/domains", rule: { type: "key", key: "domains.search_register" } },
  { prefix: "/agency/tlds", rule: { type: "key", key: "domains.tlds" } },
  { prefix: "/agency/whois", rule: { type: "key", key: "domains.whois" } },
  { prefix: "/agency/hosting", rule: { type: "key", key: "hosting.list" } },
  { prefix: "/agency/wordpress", rule: { type: "key", key: "wordpress.list" } },
  { prefix: "/agency/dedicated-servers", rule: { type: "key", key: "servers.dedicated.list" } },
  { prefix: "/agency/vps", rule: { type: "key", key: "servers.vps.list" } },
  { prefix: "/agency/vds", rule: { type: "key", key: "servers.vds.list" } },
  { prefix: "/agency/backup-restore", rule: { type: "key", key: "backup.list" } },
  { prefix: "/agency/ad-campaigns/meta-ads", rule: { type: "module", module: "ads.meta" } },
  { prefix: "/agency/ad-campaigns/instagram-ads", rule: { type: "module", module: "ads.meta" } },
  { prefix: "/agency/ad-campaigns/google-ads", rule: { type: "module", module: "ads.google" } },
  { prefix: "/agency/ad-campaigns/linkedin-ads", rule: { type: "module", module: "ads.linkedin" } },
  {
    prefix: "/agency/ad-campaigns",
    rule: { type: "anyModule", modules: ["ads.meta", "ads.google", "ads.linkedin"] },
  },
  { prefix: "/agency/social-media-ads/linkedin", rule: { type: "module", module: "social_linkedin" } },
  { prefix: "/agency/social-media-ads/instagram", rule: { type: "module", module: "social_instagram" } },
  { prefix: "/agency/social-media-ads/google", rule: { type: "module", module: "social_google" } },
  {
    prefix: "/agency/social-media-ads",
    rule: { type: "anyModule", modules: ["social", "social_linkedin", "social_instagram", "social_google"] },
  },
  { prefix: "/agency/social-media-marketing", rule: { type: "module", module: "social" } },
  { prefix: "/agency/nisc-email-builder", rule: { type: "key", key: "email_marketing.email_builder" } },
  { prefix: "/agency/nisc-email-marketing/campaigns", rule: { type: "key", key: "email_marketing.campaigns" } },
  { prefix: "/agency/nisc-email-marketing/audiences", rule: { type: "key", key: "email_marketing.audiences" } },
  {
    prefix: "/agency/nisc-email-marketing/domain-configuration",
    rule: { type: "key", key: "email_marketing.sending_domains" },
  },
  { prefix: "/agency/nisc-email-marketing/email-events", rule: { type: "key", key: "email_marketing.events" } },
  { prefix: "/agency/nisc-email-marketing", rule: { type: "module", module: "email_marketing" } },
  { prefix: "/agency/email-marketing", rule: { type: "module", module: "email_marketing" } },
  { prefix: "/agency/seo-reports", rule: { type: "key", key: "seo.reports" } },
  { prefix: "/agency/seo-suite", rule: { type: "key", key: "seo.suite" } },
  { prefix: "/agency/seo", rule: { type: "module", module: "seo" } },
  { prefix: "/agency/creative-briefs", rule: { type: "key", key: "creatives.briefs" } },
  { prefix: "/agency/creative-assets", rule: { type: "key", key: "creatives.assets" } },
  { prefix: "/agency/zeepo-ai-agent", rule: { type: "key", key: "gen_ai.zeepo_agent" } },
  { prefix: "/agency/zeepo-canvas", rule: { type: "key", key: "gen_ai.zeepo_canvas" } },
  { prefix: "/agency/zeepo-ai", rule: { type: "key", key: "gen_ai.zeepo_ai" } },
  { prefix: "/agency/gen-ai", rule: { type: "module", module: "gen_ai" } },
  { prefix: "/agency/support", rule: { type: "key", key: "support.tickets" } },
  { prefix: "/agency/nisc-service-orders", rule: { type: "key", key: "products.orders" } },
  { prefix: "/agency/nisc-services", rule: { type: "key", key: "products.catalog" } },
  { prefix: "/agency/service-plans", rule: { type: "key", key: "products.catalog" } },
  { prefix: "/agency/manage-organizations", rule: { type: "key", key: "clients.organizations" } },
  { prefix: "/agency/manage-teams", rule: { type: "key", key: "clients.organizations" } },
  { prefix: "/agency/clients", rule: { type: "key", key: "clients.list" } },
  { prefix: "/agency/quotations", rule: { type: "key", key: "billing.quotations" } },
  { prefix: "/agency/sales", rule: { type: "key", key: "billing.quotations" } },
  { prefix: "/agency/transactions", rule: { type: "key", key: "billing.transactions" } },
  { prefix: "/agency/invoices", rule: { type: "key", key: "billing.invoices" } },
  { prefix: "/agency/invoicing", rule: { type: "key", key: "billing.invoices" } },
  { prefix: "/agency/subscriptions", rule: { type: "key", key: "billing.subscriptions" } },
  { prefix: "/agency/billing", rule: { type: "module", module: "billing" } },
  { prefix: "/agency/orders", rule: { type: "key", key: "billing.checkout" } },
  { prefix: "/agency/nisc-payment-gateway", rule: { type: "key", key: "payments.gateway" } },
  { prefix: "/agency/kra-etims/sales", rule: { type: "key", key: "etims.sales" } },
  { prefix: "/agency/kra-etims/purchases", rule: { type: "key", key: "etims.purchases" } },
  { prefix: "/agency/kra-etims/products", rule: { type: "key", key: "etims.products" } },
  { prefix: "/agency/kra-etims/stock", rule: { type: "key", key: "etims.stock" } },
  { prefix: "/agency/kra-etims/imports", rule: { type: "key", key: "etims.imports" } },
  { prefix: "/agency/kra-etims/customers", rule: { type: "key", key: "etims.customers" } },
  { prefix: "/agency/kra-etims/branches", rule: { type: "key", key: "etims.branches" } },
  { prefix: "/agency/kra-etims/codes", rule: { type: "key", key: "etims.codes" } },
  { prefix: "/agency/kra-etims/notices", rule: { type: "key", key: "etims.notices" } },
  { prefix: "/agency/kra-etims/settings", rule: { type: "key", key: "etims.settings" } },
  { prefix: "/agency/kra-etims", rule: { type: "module", module: "etims" } },
  { prefix: "/agency/digitax", rule: { type: "module", module: "etims" } },
  { prefix: "/agency/nisc-reports", rule: { type: "module", module: "reports" } },
  { prefix: "/agency/reports", rule: { type: "module", module: "reports" } },
  { prefix: "/agency/crm/companies", rule: { type: "key", key: "crm.companies" } },
  { prefix: "/agency/crm/contacts", rule: { type: "key", key: "crm.contacts" } },
  { prefix: "/agency/crm/deals", rule: { type: "key", key: "crm.deals" } },
  { prefix: "/agency/crm", rule: { type: "module", module: "crm" } },
  { prefix: "/agency/manage-users", rule: { type: "key", key: "agency_admin.users" } },
  { prefix: "/agency/api-keys", rule: { type: "key", key: "agency_admin.api_keys" } },
  { prefix: "/agency/cronjobs", rule: { type: "key", key: "operations.cronjobs" } },
];

const SORTED_RULES = [...PREFIX_RULES].sort((a, b) => b.prefix.length - a.prefix.length);

export function matchAgencyRoutePermission(pathname: string): AgencyRoutePermission {
  const path = pathname.split("?")[0] ?? pathname;
  if (!path.startsWith("/agency")) return { type: "allow" };
  if (
    path === "/agency" ||
    path.startsWith("/agency/coming-soon") ||
    path.startsWith("/agency/loading")
  ) {
    return { type: "allow" };
  }
  for (const row of SORTED_RULES) {
    if (path === row.prefix || path.startsWith(`${row.prefix}/`)) return row.rule;
  }
  return { type: "deny" };
}
