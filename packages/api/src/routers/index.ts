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
import { openProviderRouter } from "./openprovider";
import { nameserverGroupsRouter } from "./nameserver-groups";
import { tldSettingsRouter } from "./tld-settings";
import { currencyConversionRouter } from "./currency-conversion";
import { emailMarketingRouter } from "./email-marketing";
import { teamsRouter } from "./teams";
import { userProfileRouter } from "./user-profile";
import { creativeAssetsRouter } from "./creative-assets";

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
	// Currency Conversion
	currency: currencyConversionRouter,
	// Email Marketing
	emailMarketing: emailMarketingRouter,
	// Teams Management
	teams: teamsRouter,
	// User Profile Management
	userProfile: userProfileRouter,
	// Creative Assets Management
	creativeAssets: creativeAssetsRouter,
});
export type AppRouter = typeof appRouter;
