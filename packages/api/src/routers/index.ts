import { protectedProcedure, publicProcedure, router } from "../trpc";
import { customersRouter } from "./plesk/customers";
import { domainsRouter } from "./plesk/domains";
import { wordpressRouter } from "./plesk/wordpress";
import { domainDnsRouter } from "./plesk/domain-dns";
import { wpPluginsListRouter } from "./plesk/wp-plugins-list";
import { databasesRouter } from "./plesk/databases";
import { emailsRouter } from "./plesk/emails";
import { subdomainsRouter } from "./plesk/subdomains";
import { subscriptionsRouter } from "./plesk/subscriptions";
import { servicePlansRouter } from "./plesk/service-plans";
import { customersCreateRouter } from "./plesk/customers-create";
import { dnsCreateRouter } from "./plesk/dns-create";
import { dnsDeleteRouter } from "./plesk/dns-delete";
import { emailsCreateRouter } from "./plesk/emails-create";
import { emailsDeleteRouter } from "./plesk/emails-delete";
import { emailsUpdateRouter } from "./plesk/emails-update";
import { subdomainsCreateRouter } from "./plesk/subdomains-create";
import { subdomainsDeleteRouter } from "./plesk/subdomains-delete";
import { subscriptionsCreateRouter } from "./plesk/subscriptions-create";
import { subscriptionsDeleteRouter } from "./plesk/subscriptions-delete";
import { subscriptionsUpdateRouter } from "./plesk/subscriptions-update";
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
import { ftpRouter } from "./plesk/ftp";
import { pleskHealthCheckRouter } from "./plesk/health-check";
import { openProviderRouter } from "./openprovider";
import { nameserverGroupsRouter } from "./nameserver-groups";
import { tldSettingsRouter } from "./tld-settings";
import { domainsRouter as niscDomainsRouter } from "./domains";
import { currencyConversionRouter } from "./currency-conversion";
import { teamsRouter } from "./teams";
import { userProfileRouter } from "./user-profile";
import { creativeAssetsRouter } from "./creative-assets";
import { creativeBriefsRouter } from "./creative-briefs";
import { notificationsRouter } from "./notifications";
import { hostingRouter } from "./hosting";
import { hostingPlansRouter } from "./hosting-plans";
import { wordpressSubscriptionsRouter } from "./wordpress-subscriptions";
import { clientsRouter } from "./clients";
import { manageUsersRouter } from "./manage-users";
import { ordersRouter } from "./orders";
import { invoicingRouter } from "./invoicing";
import { teamBillingRouter } from "./team-billing";
import { metaRouter } from "./social-media-marketing/meta";
import { linkedinRouter } from "./social-media-marketing/linkedin";
import { serviceSubscriptionsRouter } from "./service-subscriptions";
import { googleAdsRouter } from "./google-ads";
import { metaAdsRouter } from "./meta-ads";
import { linkedInAdsRouter } from "./linkedin-ads";
import { imageGenStudioRouter } from "./imagegen-studio";
import { stabilityAiRouter } from "./stability-ai";
import { imageGeneratorRouter } from "./image-generator";
import { backgroundRemoverRouter } from "./background-remover";
import { paymentGatewayRouter } from "./payment-gateway";
import { paymentTransactionsRouter } from "./payment-transactions";

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
		emails: emailsRouter,
		subdomains: subdomainsRouter,
		subscriptions: subscriptionsRouter,
		servicePlans: servicePlansRouter,
		// CRUD Operations
		customersCreate: customersCreateRouter,
		dnsCreate: dnsCreateRouter,
		dnsDelete: dnsDeleteRouter,
		emailsCreate: emailsCreateRouter,
		emailsDelete: emailsDeleteRouter,
		emailsUpdate: emailsUpdateRouter,
		subdomainsCreate: subdomainsCreateRouter,
		subdomainsDelete: subdomainsDeleteRouter,
		subscriptionsCreate: subscriptionsCreateRouter,
		subscriptionsDelete: subscriptionsDeleteRouter,
		subscriptionsUpdate: subscriptionsUpdateRouter,
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
		// FTP File Manager
		ftp: ftpRouter,
	}),
	// OpenProvider integration routes
	openProvider: openProviderRouter,
	// Nameserver Groups management
	nameserverGroups: nameserverGroupsRouter,
	// TLD Settings management
	tldSettings: tldSettingsRouter,
	// Domains Management (NISC)
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
	// Team Billing Settings
	teamBilling: teamBillingRouter,
	// Service Subscriptions Management
	serviceSubscriptions: serviceSubscriptionsRouter,
	// Social Media Marketing - Meta/Facebook & LinkedIn
	socialMediaMarketing: router({
		meta: metaRouter,
		linkedin: linkedinRouter,
	}),
	// Google Ads Integration
	googleAds: googleAdsRouter,
	// Meta Ads Integration
	metaAds: metaAdsRouter,
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
});
export type AppRouter = typeof appRouter;
