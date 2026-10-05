export declare const agencyRbacRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    permissionCatalog: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: ("/agency/dashboard" | "/agency/domains" | "/agency/tlds" | "/agency/domain-transfer" | "/agency/domains-portfolio" | "/agency/whois" | "/agency/hosting" | "/agency/dedicated-servers" | "/agency/vps" | "/agency/vds" | "/agency/wordpress" | "/agency/backup-restore" | "/agency/backup-restore/nisc-backup" | "/agency/social-media-marketing" | "/agency/social-media-marketing/facebook" | "/agency/social-media-marketing/instagram" | "/agency/social-media-marketing/linkedin" | "/agency/ad-campaigns" | "/agency/ad-campaigns/meta-ads" | "/agency/ad-campaigns/instagram-ads" | "/agency/ad-campaigns/google-ads" | "/agency/ad-campaigns/linkedin-ads" | "/agency/email-marketing" | "/agency/email-marketing/campaigns" | "/agency/email-marketing/domain-configuration" | "/agency/email-marketing/audiences" | "/agency/email-marketing/email-builder" | "/agency/nisc-email-marketing" | "/agency/nisc-email-marketing/campaigns" | "/agency/nisc-email-marketing/audiences" | "/agency/nisc-email-marketing/email-builder" | "/agency/nisc-email-marketing/domain-configuration" | "/agency/nisc-email-marketing/email-events" | "/agency/nisc-email-builder" | "/agency/seo" | "/agency/seo-reports" | "/agency/seo-suite" | "/agency/creative-assets" | "/agency/zeepo-canvas" | "/agency/zeepo-ai-agent" | "/agency/zeepo-ai" | "/agency/zeepo-ai/activity" | "/agency/nisc-services" | "/agency/nisc-service-orders" | "/agency/clients" | "/agency/manage-organizations" | "/agency/manage-users" | "/agency/billing" | "/agency/transactions" | "/agency/invoices" | "/agency/subscriptions" | "/agency/quotations" | "/agency/nisc-payment-gateway" | "/agency/kra-etims/sales" | "/agency/kra-etims/purchases" | "/agency/kra-etims/products" | "/agency/kra-etims/customers" | "/agency/kra-etims/branches" | "/agency/kra-etims/notices" | "/agency/kra-etims/settings" | "/agency/digitax/sales" | "/agency/digitax/purchases" | "/agency/digitax/products" | "/agency/digitax/customers" | "/agency/digitax/branches" | "/agency/digitax/notices" | "/agency/digitax/verifications" | "/agency/reports/sales" | "/agency/reports/creative" | "/agency/nisc-reports" | "/agency/nisc-reports/revenue" | "/agency/nisc-reports/invoices" | "/agency/nisc-reports/quotations" | "/agency/nisc-reports/subscriptions" | "/agency/nisc-reports/clients" | "/agency/nisc-reports/profitability" | "/agency/nisc-reports/payments" | "/agency/nisc-reports/tax" | "/agency/cronjobs" | "/agency/support")[];
        meta: object;
    }>;
    rolesList: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            id: string;
            name: string;
            description: string | null;
            menus: string[];
            isSystem: boolean;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: object;
    }>;
    roleById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            roleId: string;
        };
        output: {
            id: string;
            name: string;
            description: string | null;
            menus: string[];
            isSystem: boolean;
            createdAt: Date;
            updatedAt: Date;
            permissionKeys: ("/agency/dashboard" | "/agency/domains" | "/agency/tlds" | "/agency/domain-transfer" | "/agency/domains-portfolio" | "/agency/whois" | "/agency/hosting" | "/agency/dedicated-servers" | "/agency/vps" | "/agency/vds" | "/agency/wordpress" | "/agency/backup-restore" | "/agency/backup-restore/nisc-backup" | "/agency/social-media-marketing" | "/agency/social-media-marketing/facebook" | "/agency/social-media-marketing/instagram" | "/agency/social-media-marketing/linkedin" | "/agency/ad-campaigns" | "/agency/ad-campaigns/meta-ads" | "/agency/ad-campaigns/instagram-ads" | "/agency/ad-campaigns/google-ads" | "/agency/ad-campaigns/linkedin-ads" | "/agency/email-marketing" | "/agency/email-marketing/campaigns" | "/agency/email-marketing/domain-configuration" | "/agency/email-marketing/audiences" | "/agency/email-marketing/email-builder" | "/agency/nisc-email-marketing" | "/agency/nisc-email-marketing/campaigns" | "/agency/nisc-email-marketing/audiences" | "/agency/nisc-email-marketing/email-builder" | "/agency/nisc-email-marketing/domain-configuration" | "/agency/nisc-email-marketing/email-events" | "/agency/nisc-email-builder" | "/agency/seo" | "/agency/seo-reports" | "/agency/seo-suite" | "/agency/creative-assets" | "/agency/zeepo-canvas" | "/agency/zeepo-ai-agent" | "/agency/zeepo-ai" | "/agency/zeepo-ai/activity" | "/agency/nisc-services" | "/agency/nisc-service-orders" | "/agency/clients" | "/agency/manage-organizations" | "/agency/manage-users" | "/agency/billing" | "/agency/transactions" | "/agency/invoices" | "/agency/subscriptions" | "/agency/quotations" | "/agency/nisc-payment-gateway" | "/agency/kra-etims/sales" | "/agency/kra-etims/purchases" | "/agency/kra-etims/products" | "/agency/kra-etims/customers" | "/agency/kra-etims/branches" | "/agency/kra-etims/notices" | "/agency/kra-etims/settings" | "/agency/digitax/sales" | "/agency/digitax/purchases" | "/agency/digitax/products" | "/agency/digitax/customers" | "/agency/digitax/branches" | "/agency/digitax/notices" | "/agency/digitax/verifications" | "/agency/reports/sales" | "/agency/reports/creative" | "/agency/nisc-reports" | "/agency/nisc-reports/revenue" | "/agency/nisc-reports/invoices" | "/agency/nisc-reports/quotations" | "/agency/nisc-reports/subscriptions" | "/agency/nisc-reports/clients" | "/agency/nisc-reports/profitability" | "/agency/nisc-reports/payments" | "/agency/nisc-reports/tax" | "/agency/cronjobs" | "/agency/support")[];
        };
        meta: object;
    }>;
    roleCreate: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name: string;
            description?: string | undefined;
            menus?: string[] | undefined;
        };
        output: {
            id: string;
            name: string;
            description: string | null;
            menus: string[];
            isSystem: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    roleUpdate: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            roleId: string;
            name?: string | undefined;
            description?: string | undefined;
            menus?: string[] | undefined;
        };
        output: {
            id: string;
            name: string;
            description: string | null;
            menus: string[];
            isSystem: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    roleDelete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            roleId: string;
        };
        output: {
            success: boolean;
        };
        meta: object;
    }>;
    permissionsList: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            id: string;
            key: "/agency/dashboard" | "/agency/domains" | "/agency/tlds" | "/agency/domain-transfer" | "/agency/domains-portfolio" | "/agency/whois" | "/agency/hosting" | "/agency/dedicated-servers" | "/agency/vps" | "/agency/vds" | "/agency/wordpress" | "/agency/backup-restore" | "/agency/backup-restore/nisc-backup" | "/agency/social-media-marketing" | "/agency/social-media-marketing/facebook" | "/agency/social-media-marketing/instagram" | "/agency/social-media-marketing/linkedin" | "/agency/ad-campaigns" | "/agency/ad-campaigns/meta-ads" | "/agency/ad-campaigns/instagram-ads" | "/agency/ad-campaigns/google-ads" | "/agency/ad-campaigns/linkedin-ads" | "/agency/email-marketing" | "/agency/email-marketing/campaigns" | "/agency/email-marketing/domain-configuration" | "/agency/email-marketing/audiences" | "/agency/email-marketing/email-builder" | "/agency/nisc-email-marketing" | "/agency/nisc-email-marketing/campaigns" | "/agency/nisc-email-marketing/audiences" | "/agency/nisc-email-marketing/email-builder" | "/agency/nisc-email-marketing/domain-configuration" | "/agency/nisc-email-marketing/email-events" | "/agency/nisc-email-builder" | "/agency/seo" | "/agency/seo-reports" | "/agency/seo-suite" | "/agency/creative-assets" | "/agency/zeepo-canvas" | "/agency/zeepo-ai-agent" | "/agency/zeepo-ai" | "/agency/zeepo-ai/activity" | "/agency/nisc-services" | "/agency/nisc-service-orders" | "/agency/clients" | "/agency/manage-organizations" | "/agency/manage-users" | "/agency/billing" | "/agency/transactions" | "/agency/invoices" | "/agency/subscriptions" | "/agency/quotations" | "/agency/nisc-payment-gateway" | "/agency/kra-etims/sales" | "/agency/kra-etims/purchases" | "/agency/kra-etims/products" | "/agency/kra-etims/customers" | "/agency/kra-etims/branches" | "/agency/kra-etims/notices" | "/agency/kra-etims/settings" | "/agency/digitax/sales" | "/agency/digitax/purchases" | "/agency/digitax/products" | "/agency/digitax/customers" | "/agency/digitax/branches" | "/agency/digitax/notices" | "/agency/digitax/verifications" | "/agency/reports/sales" | "/agency/reports/creative" | "/agency/nisc-reports" | "/agency/nisc-reports/revenue" | "/agency/nisc-reports/invoices" | "/agency/nisc-reports/quotations" | "/agency/nisc-reports/subscriptions" | "/agency/nisc-reports/clients" | "/agency/nisc-reports/profitability" | "/agency/nisc-reports/payments" | "/agency/nisc-reports/tax" | "/agency/cronjobs" | "/agency/support";
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: object;
    }>;
    permissionUpsert: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            key: "/agency/dashboard" | "/agency/domains" | "/agency/tlds" | "/agency/domain-transfer" | "/agency/domains-portfolio" | "/agency/whois" | "/agency/hosting" | "/agency/dedicated-servers" | "/agency/vps" | "/agency/vds" | "/agency/wordpress" | "/agency/backup-restore" | "/agency/backup-restore/nisc-backup" | "/agency/social-media-marketing" | "/agency/social-media-marketing/facebook" | "/agency/social-media-marketing/instagram" | "/agency/social-media-marketing/linkedin" | "/agency/ad-campaigns" | "/agency/ad-campaigns/meta-ads" | "/agency/ad-campaigns/instagram-ads" | "/agency/ad-campaigns/google-ads" | "/agency/ad-campaigns/linkedin-ads" | "/agency/email-marketing" | "/agency/email-marketing/campaigns" | "/agency/email-marketing/domain-configuration" | "/agency/email-marketing/audiences" | "/agency/email-marketing/email-builder" | "/agency/nisc-email-marketing" | "/agency/nisc-email-marketing/campaigns" | "/agency/nisc-email-marketing/audiences" | "/agency/nisc-email-marketing/email-builder" | "/agency/nisc-email-marketing/domain-configuration" | "/agency/nisc-email-marketing/email-events" | "/agency/nisc-email-builder" | "/agency/seo" | "/agency/seo-reports" | "/agency/seo-suite" | "/agency/creative-assets" | "/agency/zeepo-canvas" | "/agency/zeepo-ai-agent" | "/agency/zeepo-ai" | "/agency/zeepo-ai/activity" | "/agency/nisc-services" | "/agency/nisc-service-orders" | "/agency/clients" | "/agency/manage-organizations" | "/agency/manage-users" | "/agency/billing" | "/agency/transactions" | "/agency/invoices" | "/agency/subscriptions" | "/agency/quotations" | "/agency/nisc-payment-gateway" | "/agency/kra-etims/sales" | "/agency/kra-etims/purchases" | "/agency/kra-etims/products" | "/agency/kra-etims/customers" | "/agency/kra-etims/branches" | "/agency/kra-etims/notices" | "/agency/kra-etims/settings" | "/agency/digitax/sales" | "/agency/digitax/purchases" | "/agency/digitax/products" | "/agency/digitax/customers" | "/agency/digitax/branches" | "/agency/digitax/notices" | "/agency/digitax/verifications" | "/agency/reports/sales" | "/agency/reports/creative" | "/agency/nisc-reports" | "/agency/nisc-reports/revenue" | "/agency/nisc-reports/invoices" | "/agency/nisc-reports/quotations" | "/agency/nisc-reports/subscriptions" | "/agency/nisc-reports/clients" | "/agency/nisc-reports/profitability" | "/agency/nisc-reports/payments" | "/agency/nisc-reports/tax" | "/agency/cronjobs" | "/agency/support";
            description?: string | undefined;
        };
        output: {
            id: string;
            key: "/agency/dashboard" | "/agency/domains" | "/agency/tlds" | "/agency/domain-transfer" | "/agency/domains-portfolio" | "/agency/whois" | "/agency/hosting" | "/agency/dedicated-servers" | "/agency/vps" | "/agency/vds" | "/agency/wordpress" | "/agency/backup-restore" | "/agency/backup-restore/nisc-backup" | "/agency/social-media-marketing" | "/agency/social-media-marketing/facebook" | "/agency/social-media-marketing/instagram" | "/agency/social-media-marketing/linkedin" | "/agency/ad-campaigns" | "/agency/ad-campaigns/meta-ads" | "/agency/ad-campaigns/instagram-ads" | "/agency/ad-campaigns/google-ads" | "/agency/ad-campaigns/linkedin-ads" | "/agency/email-marketing" | "/agency/email-marketing/campaigns" | "/agency/email-marketing/domain-configuration" | "/agency/email-marketing/audiences" | "/agency/email-marketing/email-builder" | "/agency/nisc-email-marketing" | "/agency/nisc-email-marketing/campaigns" | "/agency/nisc-email-marketing/audiences" | "/agency/nisc-email-marketing/email-builder" | "/agency/nisc-email-marketing/domain-configuration" | "/agency/nisc-email-marketing/email-events" | "/agency/nisc-email-builder" | "/agency/seo" | "/agency/seo-reports" | "/agency/seo-suite" | "/agency/creative-assets" | "/agency/zeepo-canvas" | "/agency/zeepo-ai-agent" | "/agency/zeepo-ai" | "/agency/zeepo-ai/activity" | "/agency/nisc-services" | "/agency/nisc-service-orders" | "/agency/clients" | "/agency/manage-organizations" | "/agency/manage-users" | "/agency/billing" | "/agency/transactions" | "/agency/invoices" | "/agency/subscriptions" | "/agency/quotations" | "/agency/nisc-payment-gateway" | "/agency/kra-etims/sales" | "/agency/kra-etims/purchases" | "/agency/kra-etims/products" | "/agency/kra-etims/customers" | "/agency/kra-etims/branches" | "/agency/kra-etims/notices" | "/agency/kra-etims/settings" | "/agency/digitax/sales" | "/agency/digitax/purchases" | "/agency/digitax/products" | "/agency/digitax/customers" | "/agency/digitax/branches" | "/agency/digitax/notices" | "/agency/digitax/verifications" | "/agency/reports/sales" | "/agency/reports/creative" | "/agency/nisc-reports" | "/agency/nisc-reports/revenue" | "/agency/nisc-reports/invoices" | "/agency/nisc-reports/quotations" | "/agency/nisc-reports/subscriptions" | "/agency/nisc-reports/clients" | "/agency/nisc-reports/profitability" | "/agency/nisc-reports/payments" | "/agency/nisc-reports/tax" | "/agency/cronjobs" | "/agency/support";
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    rolePermissionsSet: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            roleId: string;
            permissionKeys?: ("/agency/dashboard" | "/agency/domains" | "/agency/tlds" | "/agency/domain-transfer" | "/agency/domains-portfolio" | "/agency/whois" | "/agency/hosting" | "/agency/dedicated-servers" | "/agency/vps" | "/agency/vds" | "/agency/wordpress" | "/agency/backup-restore" | "/agency/backup-restore/nisc-backup" | "/agency/social-media-marketing" | "/agency/social-media-marketing/facebook" | "/agency/social-media-marketing/instagram" | "/agency/social-media-marketing/linkedin" | "/agency/ad-campaigns" | "/agency/ad-campaigns/meta-ads" | "/agency/ad-campaigns/instagram-ads" | "/agency/ad-campaigns/google-ads" | "/agency/ad-campaigns/linkedin-ads" | "/agency/email-marketing" | "/agency/email-marketing/campaigns" | "/agency/email-marketing/domain-configuration" | "/agency/email-marketing/audiences" | "/agency/email-marketing/email-builder" | "/agency/nisc-email-marketing" | "/agency/nisc-email-marketing/campaigns" | "/agency/nisc-email-marketing/audiences" | "/agency/nisc-email-marketing/email-builder" | "/agency/nisc-email-marketing/domain-configuration" | "/agency/nisc-email-marketing/email-events" | "/agency/nisc-email-builder" | "/agency/seo" | "/agency/seo-reports" | "/agency/seo-suite" | "/agency/creative-assets" | "/agency/zeepo-canvas" | "/agency/zeepo-ai-agent" | "/agency/zeepo-ai" | "/agency/zeepo-ai/activity" | "/agency/nisc-services" | "/agency/nisc-service-orders" | "/agency/clients" | "/agency/manage-organizations" | "/agency/manage-users" | "/agency/billing" | "/agency/transactions" | "/agency/invoices" | "/agency/subscriptions" | "/agency/quotations" | "/agency/nisc-payment-gateway" | "/agency/kra-etims/sales" | "/agency/kra-etims/purchases" | "/agency/kra-etims/products" | "/agency/kra-etims/customers" | "/agency/kra-etims/branches" | "/agency/kra-etims/notices" | "/agency/kra-etims/settings" | "/agency/digitax/sales" | "/agency/digitax/purchases" | "/agency/digitax/products" | "/agency/digitax/customers" | "/agency/digitax/branches" | "/agency/digitax/notices" | "/agency/digitax/verifications" | "/agency/reports/sales" | "/agency/reports/creative" | "/agency/nisc-reports" | "/agency/nisc-reports/revenue" | "/agency/nisc-reports/invoices" | "/agency/nisc-reports/quotations" | "/agency/nisc-reports/subscriptions" | "/agency/nisc-reports/clients" | "/agency/nisc-reports/profitability" | "/agency/nisc-reports/payments" | "/agency/nisc-reports/tax" | "/agency/cronjobs" | "/agency/support")[] | undefined;
        };
        output: {
            success: boolean;
        };
        meta: object;
    }>;
    userAgencyRoleAssign: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            userId: string;
            roleId: string | null;
        };
        output: {
            success: boolean;
        };
        meta: object;
    }>;
    myMenuAccess: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            roleId: string | null;
            roleName: string | null;
            allowedKeys: string[];
        };
        meta: object;
    }>;
}>>;
