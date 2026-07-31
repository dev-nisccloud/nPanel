import { protectedProcedure, publicProcedure, router } from "../trpc";
import { customersRouter } from "./plesk/customers";
import { domainsRouter } from "./plesk/domains";
import { wordpressRouter } from "./plesk/wordpress";
import { domainDnsRouter } from "./plesk/domain-dns";
import { wpPluginsListRouter } from "./plesk/wp-plugins-list";
import { databasesRouter } from "./plesk/databases";
import { databasesCreateRouter } from "./plesk/databases-create";
import { databasesDeleteRouter } from "./plesk/databases-delete";
import { databasesSetUserRouter } from "./plesk/databases-set-user";
import { databasesAssignRouter } from "./plesk/databases-assign";
import { emailsRouter } from "./plesk/emails";
import { subdomainsRouter } from "./plesk/subdomains";
import { subscriptionsRouter } from "./plesk/subscriptions";
import { servicePlansRouter } from "./plesk/service-plans";
import { customersCreateRouter } from "./plesk/customers-create";
import { dnsCreateRouter } from "./plesk/dns-create";
import { dnsDeleteRouter } from "./plesk/dns-delete";
import { dnsUpdateRouter } from "./plesk/dns-update";
import { emailsCreateRouter } from "./plesk/emails-create";
import { emailsDeleteRouter } from "./plesk/emails-delete";
import { emailsUpdateRouter } from "./plesk/emails-update";
import { subdomainsCreateRouter } from "./plesk/subdomains-create";
import { subdomainsDeleteRouter } from "./plesk/subdomains-delete";
import { subscriptionsCreateRouter } from "./plesk/subscriptions-create";
import { subscriptionsDeleteRouter } from "./plesk/subscriptions-delete";
import { subscriptionsUpdateRouter } from "./plesk/subscriptions-update";
import { subscriptionsSuspendRouter } from "./plesk/subscriptions-suspend";
import { wpCredentialsRouter } from "./plesk/wp-credentials";
import { wpPluginsAutoupdateRouter } from "./plesk/wp-plugins-autoupdate";
import { wpPluginsDeleteRouter } from "./plesk/wp-plugins-delete";
import { wpPluginsInstallRouter } from "./plesk/wp-plugins-install";
import { wpPluginsStatusRouter } from "./plesk/wp-plugins-status";
import { wpThemesAutoupdateRouter } from "./plesk/wp-themes-autoupdate";
import { wpThemesDeleteRouter } from "./plesk/wp-themes-delete";
import { wpThemesInstallRouter } from "./plesk/wp-themes-install";
import { wpThemesListRouter } from "./plesk/wp-themes-list";
import { wpThemesStatusRouter } from "./plesk/wp-themes-status";
import { wpUpdatesInfoRouter } from "./plesk/wp-updates-info";
import { wpUpdatesSettingsRouter } from "./plesk/wp-updates-settings";
import { wpInstallRouter } from "./plesk/wp-install";
import { wpFeaturesRouter } from "./plesk/wp-features";
import { wpBackgroundTasksRouter } from "./plesk/wp-background-tasks";
import { ftpRouter } from "./plesk/ftp";
import { pleskHealthCheckRouter } from "./plesk/health-check";
import { openProviderRouter } from "./openprovider";
import { kenicRouter } from "./kenic";
import { domainTransferRouter } from "./domain-transfer";
import { nameserverGroupsRouter } from "./nameserver-groups";
import { tldSettingsRouter } from "./tld-settings";
import { aiDomainSearchRouter } from "./ai-domain-search";
import { domainsRouter as niscDomainsRouter } from "./domains";
import { currencyConversionRouter } from "./currency-conversion";
import { teamsRouter } from "./teams";
import { userProfileRouter } from "./user-profile";
import { creativeAssetsRouter } from "./creative-assets";
import { creativeBriefsRouter } from "./creative-briefs";
import { notificationsRouter } from "./notifications";
import { ticketsRouter } from "./tickets";
import { hostingRouter } from "./hosting";
import { hostingPlansRouter } from "./hosting-plans";
import { wordpressSubscriptionsRouter } from "./wordpress-subscriptions";
import { clientsRouter } from "./clients";
import { manageUsersRouter } from "./manage-users";
import { ordersRouter } from "./orders";
import { invoicingRouter } from "./invoicing";
import { quotationsRouter } from "./quotations";
import { teamBillingRouter } from "./team-billing";
import { metaRouter } from "./social-media-marketing/meta";
import { linkedinRouter } from "./social-media-marketing/linkedin";
import { instagramRouter } from "./social-media-marketing/instagram";
import { serviceSubscriptionsRouter } from "./service-subscriptions";
import { googleAdsRouter } from "./google-ads";
import { metaAdsRouter } from "./meta-ads";
import { instagramAdsRouter } from "./instagram-ads";
import { linkedInAdsRouter } from "./linkedin-ads";
import { imageGenStudioRouter } from "./imagegen-studio";
import { stabilityAiRouter } from "./stability-ai";
import { imageGeneratorRouter } from "./image-generator";
import { backgroundRemoverRouter } from "./background-remover";
import { paymentGatewayRouter } from "./payment-gateway";
import { paymentTransactionsRouter } from "./payment-transactions";
import { pagespeedInsightsRouter } from "./pagespeed-insights";
import { seoReportsRouter } from "./seo-reports";
import { emailMarketingRouter } from "./email-marketing";
import { niscEmailMarketingRouter } from "./nisc-email-marketing";
import { niscEmailBuilderRouter } from "./nisc-email-builder";
import { webDesignQuotesRouter } from "./web-design-quotes";
import { userRouter } from "./user";
import { emailBuilderRouter } from "./email-builder";
import { emailBuilderLibraryRouter } from "./email-builder-library";
import { aiRouter } from "./ai";
import { etimsRouter } from "./etims";
import { reportsRouter } from "./reports";
import { niscReportsRouter } from "./nisc-reports";
import { productsRouter } from "./products";
import { clientSubscriptionsRouter } from "./client-subscriptions";
import { subscriptionUsageRouter } from "./subscription-usage";
import { niscServiceOrdersRouter } from "./nisc-service-orders";
import { publicPricingRouter } from "./public-pricing";
import { agencyRbacRouter } from "./agency-rbac";
import { hivelocityRouter } from "./hivelocity";
import { hivelocityPricingSettingsRouter } from "./hivelocity-pricing-settings";
import { cronWorkflowRunRouter } from "./cron-workflow-run";
import { apiKeysRouter } from "./api-keys";
import { digitaxRouter } from "./digitax";
import { ipRecordsRouter } from "./ip-records";
import { zeepoCanvasRouter } from "./zeepo-canvas";
import { zeepoAgentRouter } from "./zeepo-agent";
import { niscBackupDashboardRouter } from "./nisc-backup/dashboard";
import { niscBackupSystemRouter } from "./nisc-backup/system";
import { niscBackupAccountsRouter } from "./nisc-backup/accounts";
import { niscBackupJobsRouter } from "./nisc-backup/jobs";
import { niscBackupSchedulesRouter } from "./nisc-backup/schedules";
import { niscBackupAccountFiltersRouter } from "./nisc-backup/account-filters";
import { niscBackupDestinationsRouter } from "./nisc-backup/destinations";
import { niscBackupQueuesRouter } from "./nisc-backup/queues";
import { niscBackupBackupsRouter } from "./nisc-backup/backups";
import { niscBackupDownloadsRouter } from "./nisc-backup/downloads";
import { niscBackupAlertsRouter } from "./nisc-backup/alerts";
import { niscBackupLogsRouter } from "./nisc-backup/logs";
import { niscBackupSettingsRouter } from "./nisc-backup/settings";
import { niscBackupPermissionsRouter } from "./nisc-backup/permissions";
import { niscBackupRestoreConditionsRouter } from "./nisc-backup/restore-conditions";
import { niscBackupFilePermissionsRouter } from "./nisc-backup/file-permissions";
import { niscBackupPluginsRouter } from "./nisc-backup/plugins";
import { storefrontRouter } from "./storefront";
export const appRouter = router({
    healthCheck: publicProcedure.query(() => {
        return "OK";
    }),
    privateData: protectedProcedure.query(({ ctx }) => {
        return {
            message: "This is private",
            user: ctx.session?.user,
        };
    }),
    // Plesk integration routes
    plesk: router({
        // Health Check
        healthCheck: pleskHealthCheckRouter,
        // Core Resources
        customers: customersRouter,
        domains: domainsRouter,
        wordpress: wordpressRouter,
        domainDns: domainDnsRouter,
        wpPlugins: wpPluginsListRouter,
        databases: databasesRouter,
        databasesCreate: databasesCreateRouter,
        databasesDelete: databasesDeleteRouter,
        databasesSetUser: databasesSetUserRouter,
        databasesAssign: databasesAssignRouter,
        emails: emailsRouter,
        subdomains: subdomainsRouter,
        subscriptions: subscriptionsRouter,
        servicePlans: servicePlansRouter,
        // CRUD Operations
        customersCreate: customersCreateRouter,
        dnsCreate: dnsCreateRouter,
        dnsDelete: dnsDeleteRouter,
        dnsUpdate: dnsUpdateRouter,
        emailsCreate: emailsCreateRouter,
        emailsDelete: emailsDeleteRouter,
        emailsUpdate: emailsUpdateRouter,
        subdomainsCreate: subdomainsCreateRouter,
        subdomainsDelete: subdomainsDeleteRouter,
        subscriptionsCreate: subscriptionsCreateRouter,
        subscriptionsDelete: subscriptionsDeleteRouter,
        subscriptionsUpdate: subscriptionsUpdateRouter,
        subscriptionsSuspend: subscriptionsSuspendRouter,
        // WordPress Toolkit
        wpCredentials: wpCredentialsRouter,
        wpPluginsInstall: wpPluginsInstallRouter,
        wpPluginsDelete: wpPluginsDeleteRouter,
        wpPluginsStatus: wpPluginsStatusRouter,
        wpPluginsAutoupdate: wpPluginsAutoupdateRouter,
        // WordPress Toolkit - Themes
        wpThemesAutoupdate: wpThemesAutoupdateRouter,
        wpThemesDelete: wpThemesDeleteRouter,
        wpThemesInstall: wpThemesInstallRouter,
        wpThemesList: wpThemesListRouter,
        wpThemesStatus: wpThemesStatusRouter,
        // WordPress Toolkit - Updates
        wpUpdatesInfo: wpUpdatesInfoRouter,
        wpUpdatesSettings: wpUpdatesSettingsRouter,
        // WordPress Toolkit - Installation
        wpInstall: wpInstallRouter,
        // WordPress Toolkit - Extended Features
        wpFeatures: wpFeaturesRouter,
        wpBackgroundTasks: wpBackgroundTasksRouter,
        // FTP File Manager
        ftp: ftpRouter,
    }),
    // OpenProvider integration routes
    openProvider: openProviderRouter,
    // KENIC EPP integration (.ke and other local TLDs)
    kenic: kenicRouter,
    // Domain transfer check (routes to KENIC or OpenProvider)
    domainTransfer: domainTransferRouter,
    // Nameserver Groups management
    nameserverGroups: nameserverGroupsRouter,
    // TLD Settings management
    tldSettings: tldSettingsRouter,
    // AI domain name ideas (authenticated - Replicate / Claude Haiku)
    aiDomainSearch: aiDomainSearchRouter,
    // Domains Management (Nisc)
    domains: niscDomainsRouter,
    // Currency Conversion
    currency: currencyConversionRouter,
    // Teams Management
    teams: teamsRouter,
    // User Profile Management
    userProfile: userProfileRouter,
    // Creative Assets Management
    creativeAssets: creativeAssetsRouter,
    // Creative Briefs Management
    creativeBriefs: creativeBriefsRouter,
    // Notifications Management
    notifications: notificationsRouter,
    // Tickets/Support System Management
    tickets: ticketsRouter,
    // Hosting Management
    hosting: hostingRouter,
    // Hosting Plans Management
    hostingPlans: hostingPlansRouter,
    // WordPress Subscriptions Management
    wordpressSubscriptions: wordpressSubscriptionsRouter,
    // Clients Management
    clients: clientsRouter,
    // Manage Users (Agency Users)
    manageUsers: manageUsersRouter,
    // Orders Management
    orders: ordersRouter,
    // Invoicing Management
    invoicing: invoicingRouter,
    // Quotations Management
    quotations: quotationsRouter,
    // Team Billing Settings
    teamBilling: teamBillingRouter,
    // Service Subscriptions Management
    serviceSubscriptions: serviceSubscriptionsRouter,
    // Social Media Marketing - Meta/Facebook, LinkedIn & Instagram (standalone)
    socialMediaMarketing: router({
        meta: metaRouter,
        linkedin: linkedinRouter,
        instagram: instagramRouter,
    }),
    // Google Ads Integration
    googleAds: googleAdsRouter,
    // Meta Ads Integration
    metaAds: metaAdsRouter,
    // Instagram Ads Integration
    instagramAds: instagramAdsRouter,
    // LinkedIn Ads Integration
    linkedInAds: linkedInAdsRouter,
    // ImageGen Studio
    imageGenStudio: imageGenStudioRouter,
    // Stability AI Image Generation
    stabilityAi: stabilityAiRouter,
    // Image Generator
    imageGenerator: imageGeneratorRouter,
    // Background Remover
    backgroundRemover: backgroundRemoverRouter,
    // Payment Gateway Integration
    paymentGateway: paymentGatewayRouter,
    // Payment Transactions
    paymentTransactions: paymentTransactionsRouter,
    // Google PageSpeed Insights
    pagespeedInsights: pagespeedInsightsRouter,
    // SEO Reports
    seoReports: seoReportsRouter,
    // Email Marketing (Resend Integration)
    emailMarketing: emailMarketingRouter,
    // nisc Email Marketing (SES Integration - new, parallel)
    niscEmailMarketing: niscEmailMarketingRouter,
    /** Standalone Nisc Email Builder (AI HTML - not legacy emailBuilder) */
    niscEmailBuilder: niscEmailBuilderRouter,
    // Web Design Quote Requests (domain portfolio dialog)
    webDesignQuotes: webDesignQuotesRouter,
    // User preferences and profile
    user: userRouter,
    // Email Builder (Design Management)
    emailBuilder: emailBuilderRouter,
    // Email Builder Asset Library (uploads)
    emailBuilderLibrary: emailBuilderLibraryRouter,
    // Live AI Assistant
    ai: aiRouter,
    // eTIMS Integration
    etims: etimsRouter,
    // Reports & Analytics
    reports: reportsRouter,
    // Nisc Cloud Sales Reporting (new   comprehensive live-query system)
    niscReports: niscReportsRouter,
    // Product Catalogue Management
    products: productsRouter,
    // Client Subscriptions Management (universal)
    clientSubscriptions: clientSubscriptionsRouter,
    // Subscription usage & credits (per subscription per usage kind)
    subscriptionUsage: subscriptionUsageRouter,
    // Nisc Service Orders (async processing via QStash)
    niscServiceOrders: niscServiceOrdersRouter,
    // Public, read-only pricing helpers (margin + conversion)
    publicPricing: publicPricingRouter,
    // Agency RBAC – roles and menu access
    agencyRbac: agencyRbacRouter,
    // Hivelocity integration (dedicated servers / VPS / VDS reseller)
    hivelocity: hivelocityRouter,
    // Hivelocity pricing (currency + margin shown in UI)
    hivelocityPricingSettings: hivelocityPricingSettingsRouter,
    // Cron / workflow runs (node editor persistence)
    cronWorkflowRun: cronWorkflowRunRouter,
    // API Keys Management
    apiKeys: apiKeysRouter,
    // DigiTax Integration
    digitax: digitaxRouter,
    // IP Records
    ipRecords: ipRecordsRouter,
    // Zeepo Canvas
    zeepoCanvas: zeepoCanvasRouter,
    // Zeepo AI Agent (chat + Replicate jobs)
    zeepoAgent: zeepoAgentRouter,
    // Public landing-page storefront checkout (isolated from dashboard routers)
    storefront: storefrontRouter,
    // Nisc Backup Integration
    niscBackup: router({
        dashboard: niscBackupDashboardRouter,
        system: niscBackupSystemRouter,
        accounts: niscBackupAccountsRouter,
        jobs: niscBackupJobsRouter,
        schedules: niscBackupSchedulesRouter,
        accountFilters: niscBackupAccountFiltersRouter,
        destinations: niscBackupDestinationsRouter,
        queues: niscBackupQueuesRouter,
        backups: niscBackupBackupsRouter,
        downloads: niscBackupDownloadsRouter,
        alerts: niscBackupAlertsRouter,
        logs: niscBackupLogsRouter,
        settings: niscBackupSettingsRouter,
        permissions: niscBackupPermissionsRouter,
        restoreConditions: niscBackupRestoreConditionsRouter,
        filePermissions: niscBackupFilePermissionsRouter,
        plugins: niscBackupPluginsRouter,
    }),
});
