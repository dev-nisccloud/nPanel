import { z } from "zod";
/**
 * Agency sidebar permission keys – API-layer enum.
 * Independent from Prisma/DB. DB stores them as plain strings.
 *
 * Convention: use the route path as the permission key.
 * This makes it trivial for the UI to filter sidebar items by URL.
 */
export declare const agencyMenuKeys: readonly ["/agency/dashboard", "/agency/domains", "/agency/tlds", "/agency/domain-transfer", "/agency/domains-portfolio", "/agency/hosting", "/agency/dedicated-servers", "/agency/vps", "/agency/vds", "/agency/wordpress", "/agency/social-media-marketing", "/agency/social-media-marketing/facebook", "/agency/social-media-marketing/instagram", "/agency/social-media-marketing/linkedin", "/agency/ad-campaigns", "/agency/ad-campaigns/meta-ads", "/agency/ad-campaigns/instagram-ads", "/agency/ad-campaigns/google-ads", "/agency/ad-campaigns/linkedin-ads", "/agency/email-marketing", "/agency/email-marketing/campaigns", "/agency/email-marketing/domain-configuration", "/agency/email-marketing/audiences", "/agency/email-marketing/email-builder", "/agency/nisc-email-marketing", "/agency/nisc-email-marketing/campaigns", "/agency/nisc-email-marketing/audiences", "/agency/nisc-email-marketing/email-builder", "/agency/nisc-email-marketing/domain-configuration", "/agency/nisc-email-marketing/email-events", "/agency/seo", "/agency/seo-reports", "/agency/creative-assets", "/agency/gen-ai/image-gen-studio", "/agency/gen-ai/image-generator", "/agency/gen-ai/background-remover", "/agency/nisc-services", "/agency/nisc-service-orders", "/agency/clients", "/agency/manage-teams", "/agency/manage-users", "/agency/billing", "/agency/transactions", "/agency/invoices", "/agency/subscriptions", "/agency/quotations", "/agency/kra-etims/sales", "/agency/kra-etims/purchases", "/agency/kra-etims/products", "/agency/kra-etims/branches", "/agency/kra-etims/settings", "/agency/digitax/sales", "/agency/digitax/purchases", "/agency/digitax/products", "/agency/digitax/customers", "/agency/digitax/branches", "/agency/digitax/notices", "/agency/digitax/verifications", "/agency/reports/sales", "/agency/reports/creative", "/agency/nisc-reports/revenue", "/agency/nisc-reports/invoices", "/agency/nisc-reports/quotations", "/agency/nisc-reports/subscriptions", "/agency/nisc-reports/clients", "/agency/nisc-reports/profitability", "/agency/nisc-reports/payments", "/agency/nisc-reports/tax", "/agency/cronjobs"];
export declare const agencyMenuKeySchema: z.ZodEnum<{
    "/agency/dashboard": "/agency/dashboard";
    "/agency/domains": "/agency/domains";
    "/agency/tlds": "/agency/tlds";
    "/agency/domain-transfer": "/agency/domain-transfer";
    "/agency/domains-portfolio": "/agency/domains-portfolio";
    "/agency/hosting": "/agency/hosting";
    "/agency/dedicated-servers": "/agency/dedicated-servers";
    "/agency/vps": "/agency/vps";
    "/agency/vds": "/agency/vds";
    "/agency/wordpress": "/agency/wordpress";
    "/agency/social-media-marketing": "/agency/social-media-marketing";
    "/agency/social-media-marketing/facebook": "/agency/social-media-marketing/facebook";
    "/agency/social-media-marketing/instagram": "/agency/social-media-marketing/instagram";
    "/agency/social-media-marketing/linkedin": "/agency/social-media-marketing/linkedin";
    "/agency/ad-campaigns": "/agency/ad-campaigns";
    "/agency/ad-campaigns/meta-ads": "/agency/ad-campaigns/meta-ads";
    "/agency/ad-campaigns/instagram-ads": "/agency/ad-campaigns/instagram-ads";
    "/agency/ad-campaigns/google-ads": "/agency/ad-campaigns/google-ads";
    "/agency/ad-campaigns/linkedin-ads": "/agency/ad-campaigns/linkedin-ads";
    "/agency/email-marketing": "/agency/email-marketing";
    "/agency/email-marketing/campaigns": "/agency/email-marketing/campaigns";
    "/agency/email-marketing/domain-configuration": "/agency/email-marketing/domain-configuration";
    "/agency/email-marketing/audiences": "/agency/email-marketing/audiences";
    "/agency/email-marketing/email-builder": "/agency/email-marketing/email-builder";
    "/agency/nisc-email-marketing": "/agency/nisc-email-marketing";
    "/agency/nisc-email-marketing/campaigns": "/agency/nisc-email-marketing/campaigns";
    "/agency/nisc-email-marketing/audiences": "/agency/nisc-email-marketing/audiences";
    "/agency/nisc-email-marketing/email-builder": "/agency/nisc-email-marketing/email-builder";
    "/agency/nisc-email-marketing/domain-configuration": "/agency/nisc-email-marketing/domain-configuration";
    "/agency/nisc-email-marketing/email-events": "/agency/nisc-email-marketing/email-events";
    "/agency/seo": "/agency/seo";
    "/agency/seo-reports": "/agency/seo-reports";
    "/agency/creative-assets": "/agency/creative-assets";
    "/agency/gen-ai/image-gen-studio": "/agency/gen-ai/image-gen-studio";
    "/agency/gen-ai/image-generator": "/agency/gen-ai/image-generator";
    "/agency/gen-ai/background-remover": "/agency/gen-ai/background-remover";
    "/agency/nisc-services": "/agency/nisc-services";
    "/agency/nisc-service-orders": "/agency/nisc-service-orders";
    "/agency/clients": "/agency/clients";
    "/agency/manage-teams": "/agency/manage-teams";
    "/agency/manage-users": "/agency/manage-users";
    "/agency/billing": "/agency/billing";
    "/agency/transactions": "/agency/transactions";
    "/agency/invoices": "/agency/invoices";
    "/agency/subscriptions": "/agency/subscriptions";
    "/agency/quotations": "/agency/quotations";
    "/agency/kra-etims/sales": "/agency/kra-etims/sales";
    "/agency/kra-etims/purchases": "/agency/kra-etims/purchases";
    "/agency/kra-etims/products": "/agency/kra-etims/products";
    "/agency/kra-etims/branches": "/agency/kra-etims/branches";
    "/agency/kra-etims/settings": "/agency/kra-etims/settings";
    "/agency/digitax/sales": "/agency/digitax/sales";
    "/agency/digitax/purchases": "/agency/digitax/purchases";
    "/agency/digitax/products": "/agency/digitax/products";
    "/agency/digitax/customers": "/agency/digitax/customers";
    "/agency/digitax/branches": "/agency/digitax/branches";
    "/agency/digitax/notices": "/agency/digitax/notices";
    "/agency/digitax/verifications": "/agency/digitax/verifications";
    "/agency/reports/sales": "/agency/reports/sales";
    "/agency/reports/creative": "/agency/reports/creative";
    "/agency/nisc-reports/revenue": "/agency/nisc-reports/revenue";
    "/agency/nisc-reports/invoices": "/agency/nisc-reports/invoices";
    "/agency/nisc-reports/quotations": "/agency/nisc-reports/quotations";
    "/agency/nisc-reports/subscriptions": "/agency/nisc-reports/subscriptions";
    "/agency/nisc-reports/clients": "/agency/nisc-reports/clients";
    "/agency/nisc-reports/profitability": "/agency/nisc-reports/profitability";
    "/agency/nisc-reports/payments": "/agency/nisc-reports/payments";
    "/agency/nisc-reports/tax": "/agency/nisc-reports/tax";
    "/agency/cronjobs": "/agency/cronjobs";
}>;
export type AgencyMenuKey = z.infer<typeof agencyMenuKeySchema>;
