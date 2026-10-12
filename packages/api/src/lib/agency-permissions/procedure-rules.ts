import {
	keysForModule,
	type AgencyPermissionGrantedAccess,
	type AgencyPermissionKey,
	type AgencyPermissionModuleId,
} from "./catalog";

export type AgencyRequirement =
	| { type: "allow" }
	| { type: "key"; key: AgencyPermissionKey }
	| { type: "module"; module: AgencyPermissionModuleId }
	| { type: "anyKeys"; keys: AgencyPermissionKey[] }
	| { type: "anyGranted" };

const ALWAYS_ALLOW_EXACT = new Set([
	"healthCheck",
	"privateData",
	"agencyRbac.myPermissions",
	"agencyRbac.catalog",
]);

const ALWAYS_ALLOW_PREFIX = ["user.", "userProfile.", "notifications.", "currency.", "publicPricing.", "storefront."];

function key(keyName: AgencyPermissionKey): AgencyRequirement {
	return { type: "key", key: keyName };
}

function moduleOf(module: AgencyPermissionModuleId): AgencyRequirement {
	return { type: "module", module };
}

function anyKeys(keys: AgencyPermissionKey[]): AgencyRequirement {
	return { type: "anyKeys", keys };
}

function pleskRequirement(root: string): AgencyRequirement {
	if (root === "healthCheck") return { type: "allow" };
	if (root === "ftp" || root.startsWith("ftp")) return key("hosting.file_manager");
	if (root === "domainDns" || root.startsWith("dns")) return key("hosting.dns");
	if (root.startsWith("email")) return key("hosting.mail");
	if (root.startsWith("subdomain")) return key("hosting.subdomains");
	if (root.startsWith("database")) return key("hosting.databases");
	if (root.startsWith("wpPlugin")) return key("wordpress.plugins");
	if (root.startsWith("wpTheme")) return key("wordpress.themes");
	if (root === "wpCredentials") return key("wordpress.credentials");
	if (root.startsWith("wp")) return key("wordpress.tools");
	if (root === "wordpress") return key("hosting.wordpress");
	if (root === "subscriptionsCreate") return key("hosting.order");
	if (
		root === "subscriptionsSuspend" ||
		root === "subscriptionsDelete" ||
		root === "subscriptionsUpdate"
	) {
		return key("hosting.overview");
	}
	if (root.startsWith("subscription")) return key("hosting.list");
	if (root === "servicePlans") return key("products.catalog");
	if (root.startsWith("customer")) return key("clients.list");
	if (root === "domains") return key("hosting.overview");
	return moduleOf("hosting");
}

function serverKeys(tab: string): AgencyPermissionKey[] {
	const suffix = tab as
		| "list"
		| "order"
		| "overview"
		| "network"
		| "storage"
		| "access"
		| "terminal"
		| "metrics"
		| "history"
		| "rescue";
	return (["servers.vps", "servers.vds", "servers.dedicated"] as const).map(
		(module) => `${module}.${suffix}` as AgencyPermissionKey,
	);
}

function hivelocityRequirement(procedure: string): AgencyRequirement {
	if (procedure.startsWith("public")) return { type: "allow" };
	const name = procedure.split(".")[0] ?? procedure;
	const lower = name.toLowerCase();

	if (name === "provisionBareMetalDevice" || lower.includes("dedicated")) {
		const tab = /plan|product/.test(lower) ? "order" : serverTab(name);
		return key(`servers.dedicated.${tab}` as AgencyPermissionKey);
	}
	if (lower.includes("vds")) {
		return key(`servers.vds.${serverTab(name)}` as AgencyPermissionKey);
	}
	if (lower.includes("vps") || name === "provisionComputeDevice") {
		const tab = name === "provisionComputeDevice" ? "order" : serverTab(name);
		return key(`servers.vps.${tab}` as AgencyPermissionKey);
	}
	if (/plan|product|facilit|operating/.test(lower)) {
		return anyKeys([
			...keysForModule("servers.vps").filter((k) => k.endsWith(".order") || k.endsWith(".list")),
			...keysForModule("servers.vds").filter((k) => k.endsWith(".order") || k.endsWith(".list")),
			...keysForModule("servers.dedicated").filter((k) => k.endsWith(".order") || k.endsWith(".list")),
			"products.catalog",
		]);
	}
	return anyKeys(serverKeys(serverTab(name)));
}

function serverTab(name: string): string {
	if (/console|terminal|wsticket/i.test(name)) return "terminal";
	if (/metric/i.test(name)) return "metrics";
	if (/volume|snapshot/i.test(name)) return "storage";
	if (/ssh|password|cred|ipmi|whitelist/i.test(name)) return "access";
	if (/event/i.test(name)) return "history";
	if (/rescue|reload|iso/i.test(name)) return "rescue";
	if (/port|deviceips|getdeviceips/i.test(name)) return "network";
	if (/power|suspend|reactivate|provision|updatedevice/i.test(name)) return "overview";
	return "list";
}

function emailRequirement(sub: string): AgencyRequirement {
	if (sub === "audiences") return key("email_marketing.audiences");
	if (sub === "campaigns") return key("email_marketing.campaigns");
	if (sub === "domains" || sub === "sesIdentities") return key("email_marketing.sending_domains");
	if (sub === "emailEvents") return key("email_marketing.events");
	return moduleOf("email_marketing");
}

function etimsRequirement(sub: string): AgencyRequirement {
	if (sub === "sales") return key("etims.sales");
	if (sub === "purchases") return key("etims.purchases");
	if (sub === "items") return key("etims.products");
	if (sub === "stock") return key("etims.stock");
	if (sub === "imports") return key("etims.imports");
	if (sub === "branch") return key("etims.branches");
	if (sub === "auth" || sub === "initialization" || sub === "data") return key("etims.settings");
	return moduleOf("etims");
}

function backupRequirement(sub: string): AgencyRequirement {
	if (sub === "settings" || sub === "permissions" || sub === "system" || sub === "plugins") {
		return key("backup.settings");
	}
	if (sub === "jobs" || sub === "schedules" || sub === "queues" || sub === "accountFilters") {
		return key("backup.jobs");
	}
	if (sub === "backups" || sub === "downloads" || sub === "restoreConditions" || sub === "filePermissions") {
		return key("backup.restores");
	}
	return key("backup.list");
}

function crmRequirement(sub: string): AgencyRequirement {
	if (sub === "companies") return key("crm.companies");
	if (sub === "contacts") return key("crm.contacts");
	if (sub === "deals") return key("crm.deals");
	return moduleOf("crm");
}

const NAMESPACE_RULES: Record<string, (rest: string) => AgencyRequirement> = {
	plesk: (rest) => pleskRequirement(rest.split(".")[0] ?? ""),
	hivelocity: (rest) => hivelocityRequirement(rest),
	hivelocityPricingSettings: () => key("products.catalog"),
	openProvider: () => key("domains.search_register"),
	kenic: () => key("domains.search_register"),
	domainTransfer: () => key("domains.transfer"),
	nameserverGroups: () => key("domains.nameservers"),
	tldSettings: () => key("domains.tlds"),
	aiDomainSearch: () => key("domains.search_register"),
	domains: () => key("domains.portfolio"),
	whois: () => key("domains.whois"),
	hosting: () => key("hosting.list"),
	hostingPlans: () => key("hosting.order"),
	wordpressSubscriptions: () => key("wordpress.list"),
	niscBackup: (rest) => backupRequirement(rest.split(".")[0] ?? ""),
	googleAds: () => moduleOf("ads.google"),
	metaAds: () => moduleOf("ads.meta"),
	instagramAds: () => moduleOf("ads.meta"),
	linkedInAds: () => moduleOf("ads.linkedin"),
	socialMediaMarketing: () => moduleOf("social"),
	customerOAuth: () =>
		anyKeys([
			"social.accounts",
			"ads.meta.accounts",
			"ads.google.accounts",
			"ads.linkedin.accounts",
		]),
	niscEmailMarketing: (rest) => emailRequirement(rest.split(".")[0] ?? ""),
	emailMarketing: (rest) => emailRequirement(rest.split(".")[0] ?? ""),
	niscEmailBuilder: () => key("email_marketing.email_builder"),
	emailBuilder: () => key("email_marketing.email_builder"),
	emailBuilderLibrary: () => key("email_marketing.email_builder"),
	seoReports: () => key("seo.reports"),
	pagespeedInsights: () => key("seo.reports"),
	seoSuite: () => key("seo.suite"),
	creativeAssets: () => key("creatives.assets"),
	creativeBriefs: () => key("creatives.briefs"),
	webDesignQuotes: () => key("creatives.briefs"),
	zeepoAi: () => key("gen_ai.zeepo_ai"),
	zeepoAiSupport: () => key("gen_ai.zeepo_ai"),
	ai: () => key("gen_ai.zeepo_ai"),
	zeepoAgent: () => key("gen_ai.zeepo_agent"),
	zeepoCanvas: () => key("gen_ai.zeepo_canvas"),
	imageGenerator: () => key("gen_ai.image_generator"),
	imageGenStudio: () => key("gen_ai.image_generator"),
	stabilityAi: () => key("gen_ai.image_generator"),
	backgroundRemover: () => key("gen_ai.background_remover"),
	clients: () => key("clients.list"),
	teams: (rest) => {
		const sub = rest.split(".")[0] ?? "";
		if (sub === "permissions") return key("clients.organizations");
		return key("clients.organizations");
	},
	teamBilling: () => key("clients.billing"),
	crm: (rest) => crmRequirement(rest.split(".")[0] ?? ""),
	invoicing: () => key("billing.invoices"),
	quotations: () => key("billing.quotations"),
	paymentTransactions: () => key("billing.transactions"),
	paymentGateway: () => key("billing.transactions"),
	clientSubscriptions: () => key("billing.subscriptions"),
	subscriptionUsage: () => key("billing.subscriptions"),
	serviceSubscriptions: () => key("billing.subscriptions"),
	orders: () => key("billing.checkout"),
	niscPaymentGateway: () => key("payments.gateway"),
	etims: (rest) => etimsRequirement(rest.split(".")[0] ?? ""),
	etimsCert: () => key("etims.settings"),
	digitax: () => moduleOf("etims"),
	reports: () => moduleOf("reports"),
	niscReports: () => moduleOf("reports"),
	tickets: () => key("support.tickets"),
	support: () => key("support.tickets"),
	products: () => key("products.catalog"),
	niscServiceOrders: () => key("products.orders"),
	cronWorkflowRun: () => key("operations.cronjobs"),
	manageUsers: () => key("agency_admin.users"),
	apiKeys: () => key("agency_admin.api_keys"),
	agencyRbac: () => key("agency_admin.roles"),
	agencyDashboard: () => key("dashboard.view"),
	ipRecords: () => key("hosting.overview"),
	objectStorage: () => ({ type: "anyGranted" }),
};

export function resolveAgencyProcedure(path: string): AgencyRequirement | null {
	if (ALWAYS_ALLOW_EXACT.has(path)) return { type: "allow" };
	if (ALWAYS_ALLOW_PREFIX.some((prefix) => path.startsWith(prefix))) return { type: "allow" };

	const dot = path.indexOf(".");
	const ns = dot === -1 ? path : path.slice(0, dot);
	const rest = dot === -1 ? "" : path.slice(dot + 1);
	const rule = NAMESPACE_RULES[ns];
	if (!rule) return null;
	return rule(rest);
}

export function requiredAccessForProcedureType(
	type: "query" | "mutation" | "subscription",
): AgencyPermissionGrantedAccess {
	return type === "mutation" ? "write" : "read";
}
