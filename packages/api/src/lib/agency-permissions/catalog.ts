export const AGENCY_PERMISSION_ACCESS = ["none", "read", "write"] as const;
export type AgencyPermissionAccess = (typeof AGENCY_PERMISSION_ACCESS)[number];
export type AgencyPermissionGrantedAccess = Exclude<AgencyPermissionAccess, "none">;

export type AgencyPermissionModuleId =
	| "dashboard"
	| "domains"
	| "hosting"
	| "wordpress"
	| "servers.vps"
	| "servers.vds"
	| "servers.dedicated"
	| "backup"
	| "social"
	| "social_linkedin"
	| "social_instagram"
	| "social_google"
	| "email_marketing"
	| "seo"
	| "creatives"
	| "gen_ai"
	| "clients"
	| "crm"
	| "billing"
	| "payments"
	| "etims"
	| "reports"
	| "support"
	| "products"
	| "operations"
	| "agency_admin";

export type AgencyPermissionEntry = {
	key: string;
	module: AgencyPermissionModuleId;
	moduleLabel: string;
	label: string;
	description: string;
};

const MODULE_LABELS: Record<AgencyPermissionModuleId, string> = {
	dashboard: "Dashboard",
	domains: "Domains",
	hosting: "Hosting",
	wordpress: "WordPress",
	"servers.vps": "VPS",
	"servers.vds": "VDS",
	"servers.dedicated": "Dedicated servers",
	backup: "Backup & restore",
	social: "Social",
	social_linkedin: "LinkedIn",
	social_instagram: "Instagram",
	social_google: "Google Ads",
	email_marketing: "Email marketing",
	seo: "SEO",
	creatives: "Creatives",
	gen_ai: "Gen AI",
	clients: "Clients",
	crm: "CRM",
	billing: "Billing",
	payments: "Payment gateway",
	etims: "KRA eTIMS",
	reports: "Reporting",
	support: "Support",
	products: "Products & orders",
	operations: "Operations",
	agency_admin: "Agency administration",
};

function entry(
	module: AgencyPermissionModuleId,
	keySuffix: string,
	label: string,
	description: string,
): AgencyPermissionEntry {
	return {
		key: `${module}.${keySuffix}`,
		module,
		moduleLabel: MODULE_LABELS[module],
		label,
		description,
	};
}

function serverEntries(module: "servers.vps" | "servers.vds" | "servers.dedicated") {
	return [
		entry(module, "list", "List", "View servers in this category"),
		entry(module, "order", "Order", "Order or provision a server"),
		entry(module, "overview", "Overview", "View the server and run power actions (write)"),
		entry(module, "network", "Network", "View or change network settings"),
		entry(module, "storage", "Storage", "View or change disks, volumes, and snapshots"),
		entry(module, "access", "Access", "View or manage SSH keys and credentials"),
		entry(module, "terminal", "Terminal", "Open the web console"),
		entry(module, "metrics", "Metrics", "View performance metrics"),
		entry(module, "history", "History", "View server event history"),
		entry(module, "rescue", "Rescue", "Use rescue, reload, and ISO tools"),
	];
}

export const AGENCY_PERMISSION_CATALOG: readonly AgencyPermissionEntry[] = [
	entry("dashboard", "view", "Dashboard", "View the agency home dashboard"),

	entry("domains", "search_register", "Search & register", "Search and register domains"),
	entry("domains", "tlds", "TLDs", "View or manage TLD settings"),
	entry("domains", "transfer", "Transfer", "Start and manage domain transfers"),
	entry("domains", "portfolio", "Portfolio", "View the domain portfolio"),
	entry("domains", "whois", "WHOIS", "Run WHOIS lookups"),
	entry("domains", "dns", "DNS", "View or edit domain DNS"),
	entry("domains", "nameservers", "Nameservers", "View or change nameservers"),

	entry("hosting", "list", "List", "View hosting subscriptions"),
	entry("hosting", "order", "Order", "Order or change a hosting plan"),
	entry("hosting", "overview", "Overview", "View a hosting site and run subscription actions (write)"),
	entry("hosting", "dns", "DNS", "View or edit hosting DNS records"),
	entry("hosting", "mail", "Mail", "View or manage mailboxes"),
	entry("hosting", "file_manager", "File manager", "Browse or change site files"),
	entry("hosting", "subdomains", "Subdomains", "View or manage subdomains"),
	entry("hosting", "databases", "Databases", "View or manage databases and phpMyAdmin"),
	entry("hosting", "wordpress", "WordPress on hosting", "View or install WordPress on a hosting site"),
	entry("hosting", "backups", "Backups", "View or restore hosting backups"),

	entry("wordpress", "list", "List", "View WordPress installations"),
	entry("wordpress", "order", "Order", "Order WordPress hosting"),
	entry("wordpress", "plugins", "Plugins", "View or manage plugins"),
	entry("wordpress", "themes", "Themes", "View or manage themes"),
	entry("wordpress", "tools", "Tools", "Use updates, maintenance, and install tools"),
	entry("wordpress", "credentials", "Credentials", "View or change WordPress credentials"),

	...serverEntries("servers.vps"),
	...serverEntries("servers.vds"),
	...serverEntries("servers.dedicated"),

	entry("backup", "list", "List", "View backup accounts and the backup dashboard"),
	entry("backup", "jobs", "Jobs", "View or manage backup jobs and schedules"),
	entry("backup", "restores", "Restores", "View or run restores and downloads"),
	entry("backup", "settings", "Settings", "View or change backup settings"),

	entry("social", "accounts", "Accounts", "View or connect social accounts"),
	entry("social", "posts", "Posts", "View or publish social posts"),

	entry("social_linkedin", "accounts", "Accounts", "View or connect LinkedIn ad accounts"),
	entry("social_linkedin", "campaigns", "Campaigns", "View LinkedIn campaigns and performance"),

	entry("social_instagram", "accounts", "Accounts", "View Meta ad accounts used for Instagram ads"),
	entry("social_instagram", "campaigns", "Campaigns", "View Instagram delivery and performance"),

	entry("social_google", "accounts", "Accounts", "View or connect Google Ads accounts"),
	entry("social_google", "campaigns", "Campaigns", "View Google Ads campaigns and performance"),

	entry("email_marketing", "campaigns", "Campaigns", "View or create and send campaigns"),
	entry("email_marketing", "audiences", "Audiences", "View or manage audiences"),
	entry("email_marketing", "email_builder", "Email builder", "View or edit email designs"),
	entry("email_marketing", "sending_domains", "Sending domains", "View or configure sending domains"),
	entry("email_marketing", "events", "Events", "View email delivery events"),

	entry("seo", "reports", "Reports", "View or manage SEO reports"),
	entry("seo", "suite", "SEO suite", "Use the SEO suite"),

	entry("creatives", "assets", "Assets", "View or manage creative assets"),
	entry("creatives", "briefs", "Briefs", "View or manage creative briefs"),

	entry("gen_ai", "zeepo_ai", "Zeepo AI", "Use Zeepo AI chat"),
	entry("gen_ai", "zeepo_agent", "Zeepo agent", "Use the Zeepo AI agent"),
	entry("gen_ai", "zeepo_canvas", "Zeepo canvas", "Use Zeepo canvas"),
	entry("gen_ai", "image_generator", "Image generator", "Generate images"),
	entry("gen_ai", "background_remover", "Background remover", "Remove image backgrounds"),

	entry("clients", "list", "Clients", "View client accounts"),
	entry("clients", "profile", "Profile", "View or edit a client profile"),
	entry("clients", "activity", "Sessions", "View client sessions and activity"),
	entry("clients", "integrations", "Integrations", "View or manage client integrations"),
	entry("clients", "organizations", "Organizations", "View or manage client organizations"),
	entry("clients", "billing", "Client billing", "View or edit client billing details"),

	entry("crm", "companies", "Companies", "View or manage CRM companies"),
	entry("crm", "contacts", "Contacts", "View or manage CRM contacts"),
	entry("crm", "deals", "Deals", "View or manage CRM deals"),

	entry("billing", "invoices", "Invoices", "View or create invoices and credit notes"),
	entry("billing", "quotations", "Quotations", "View or manage quotations"),
	entry("billing", "subscriptions", "Subscriptions", "View or manage subscriptions"),
	entry("billing", "transactions", "Transactions", "View payment transactions"),
	entry("billing", "checkout", "Checkout", "Place orders and complete checkout"),

	entry("payments", "gateway", "Gateway", "View or manage the payment gateway"),

	entry("etims", "sales", "Sales", "View or submit eTIMS sales"),
	entry("etims", "purchases", "Purchases", "View or manage eTIMS purchases"),
	entry("etims", "products", "Products", "View or manage eTIMS products"),
	entry("etims", "stock", "Stock", "View or record stock movements"),
	entry("etims", "imports", "Imports", "View or manage imports"),
	entry("etims", "customers", "Customers", "View or manage eTIMS customers"),
	entry("etims", "branches", "Branches", "View or manage branches"),
	entry("etims", "codes", "Codes", "View classification codes"),
	entry("etims", "notices", "Notices", "View eTIMS notices"),
	entry("etims", "settings", "Settings", "View or change eTIMS settings"),

	entry("reports", "sales", "Sales", "View sales reports"),
	entry("reports", "revenue", "Revenue", "View revenue reports"),
	entry("reports", "invoices", "Invoices", "View invoice reports"),
	entry("reports", "quotations", "Quotations", "View quotation reports"),
	entry("reports", "subscriptions", "Subscriptions", "View subscription reports"),
	entry("reports", "clients", "Clients", "View client reports"),
	entry("reports", "profitability", "Profitability", "View profitability reports"),
	entry("reports", "payments", "Payments", "View payment reports"),
	entry("reports", "tax", "Tax", "View tax reports"),
	entry("reports", "creative", "Creative", "View creative reports"),

	entry("support", "tickets", "Tickets", "View or reply to support tickets"),

	entry("products", "catalog", "Catalog", "View or manage products and services"),
	entry("products", "orders", "Service orders", "View or manage service orders"),

	entry("operations", "cronjobs", "Workflow jobs", "View or manage scheduled jobs"),

	entry("agency_admin", "users", "Users", "View or manage agency users"),
	entry("agency_admin", "roles", "Roles", "View or manage agency roles and permissions"),
	entry("agency_admin", "api_keys", "API keys", "View or manage API keys"),
] as const;

export type AgencyPermissionKey = (typeof AGENCY_PERMISSION_CATALOG)[number]["key"];

export const AGENCY_PERMISSION_KEYS = AGENCY_PERMISSION_CATALOG.map((e) => e.key) as [
	AgencyPermissionKey,
	...AgencyPermissionKey[],
];

export const AGENCY_PERMISSION_KEY_SET = new Set<string>(AGENCY_PERMISSION_KEYS);

export const AGENCY_PERMISSION_MODULES: {
	id: AgencyPermissionModuleId;
	label: string;
	keys: AgencyPermissionKey[];
}[] = (Object.keys(MODULE_LABELS) as AgencyPermissionModuleId[]).map((id) => ({
	id,
	label: MODULE_LABELS[id],
	keys: AGENCY_PERMISSION_CATALOG.filter((e) => e.module === id).map(
		(e) => e.key as AgencyPermissionKey,
	),
}));

const LABEL_BY_KEY = new Map(AGENCY_PERMISSION_CATALOG.map((e) => [e.key, e.label]));

export function isAgencyPermissionKey(value: string): value is AgencyPermissionKey {
	return AGENCY_PERMISSION_KEY_SET.has(value);
}

export function agencyPermissionLabel(key: string): string {
	return LABEL_BY_KEY.get(key) ?? key;
}

export function agencyAccessSatisfies(
	granted: AgencyPermissionAccess | string | undefined,
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

export function allAgencyWritePermissions(): Record<AgencyPermissionKey, AgencyPermissionGrantedAccess> {
	const out = {} as Record<AgencyPermissionKey, AgencyPermissionGrantedAccess>;
	for (const key of AGENCY_PERMISSION_KEYS) {
		out[key] = "write";
	}
	return out;
}

export function keysForModule(moduleId: AgencyPermissionModuleId): AgencyPermissionKey[] {
	return AGENCY_PERMISSION_CATALOG.filter((e) => e.module === moduleId).map(
		(e) => e.key as AgencyPermissionKey,
	);
}
