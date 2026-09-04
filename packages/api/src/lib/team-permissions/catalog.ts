export const TEAM_PERMISSION_ACCESS = ["none", "read", "write"] as const;
export type TeamPermissionAccess = (typeof TEAM_PERMISSION_ACCESS)[number];
export type TeamPermissionGrantedAccess = Exclude<TeamPermissionAccess, "none">;

export type TeamPermissionModuleId =
	| "domains"
	| "hosting"
	| "emails"
	| "wordpress"
	| "servers.vps"
	| "servers.vds"
	| "servers.dedicated"
	| "ads.meta"
	| "ads.google"
	| "ads.linkedin"
	| "email_marketing"
	| "seo"
	| "creatives"
	| "gen_ai"
	| "billing"
	| "team_settings"
	| "marketplace";

export type TeamPermissionEntry = {
	key: string;
	module: TeamPermissionModuleId;
	moduleLabel: string;
	label: string;
	description: string;
};

const MODULE_LABELS: Record<TeamPermissionModuleId, string> = {
	domains: "Domains",
	hosting: "Hosting",
	emails: "Emails",
	wordpress: "WordPress",
	"servers.vps": "VPS Hosting",
	"servers.vds": "VDS Hosting",
	"servers.dedicated": "Dedicated Servers",
	"ads.meta": "Meta Ads",
	"ads.google": "Google Ads",
	"ads.linkedin": "LinkedIn Ads",
	email_marketing: "Email Marketing",
	seo: "SEO",
	creatives: "Creatives & Design",
	gen_ai: "Gen AI",
	billing: "Billing",
	team_settings: "Team settings",
	marketplace: "Marketplace",
};

function entry(
	module: TeamPermissionModuleId,
	keySuffix: string,
	label: string,
	description: string,
): TeamPermissionEntry {
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
		entry(module, "order", "Order", "Order a new server"),
		entry(module, "overview", "Overview", "View server overview and power actions (write)"),
		entry(module, "network", "Network", "View or change network settings"),
		entry(module, "storage", "Storage", "View or change disks and storage"),
		entry(module, "access", "Access", "View or manage SSH keys and credentials"),
		entry(module, "terminal", "Terminal", "Open the web terminal"),
		entry(module, "metrics", "Metrics", "View performance metrics"),
		entry(module, "history", "History", "View server event history"),
		entry(module, "rescue", "Rescue", "Use rescue / recovery tools"),
	];
}

function adsEntries(module: "ads.meta" | "ads.google" | "ads.linkedin") {
	return [
		entry(module, "accounts", "Accounts", "View or connect ad accounts"),
		entry(module, "campaigns", "Campaigns", "View or create, pause, and edit campaigns"),
	];
}

export const TEAM_PERMISSION_CATALOG: readonly TeamPermissionEntry[] = [
	entry("domains", "search_register", "Search & register", "Search and register new domains"),
	entry("domains", "transfer", "Transfer", "Start and manage domain transfers"),
	entry("domains", "portfolio", "Portfolio", "View owned domains"),
	entry("domains", "dns", "DNS", "View or edit DNS records"),
	entry("domains", "nameservers", "Nameservers", "View or change nameservers"),
	entry("domains", "brand_protection", "Brand protection", "View or manage brand protection"),

	entry("hosting", "list", "List", "View hosting subscriptions"),
	entry("hosting", "order", "Order", "Order a hosting plan"),
	entry("hosting", "dns", "DNS", "View or edit hosting DNS"),
	entry("hosting", "mail", "Mail", "View or manage mailboxes"),
	entry("hosting", "file_manager", "File manager", "Browse or edit site files"),
	entry("hosting", "subdomains", "Subdomains", "View or manage subdomains"),
	entry("hosting", "databases", "Databases", "View or manage databases and phpMyAdmin"),
	entry("hosting", "wordpress", "WordPress on hosting", "View or install WordPress on a hosting site"),
	entry("hosting", "backups", "Backups", "View or restore hosting backups"),

	entry("emails", "list", "List", "View email subscriptions"),
	entry("emails", "order", "Order", "Order an email plan"),
	entry("emails", "dns", "DNS", "View or edit email DNS"),
	entry("emails", "mail", "Mail", "View or manage mail accounts"),
	entry("emails", "file_manager", "File manager", "Browse or edit email hosting files"),

	entry("wordpress", "list", "List", "View WordPress installations"),
	entry("wordpress", "order", "Order", "Order WordPress hosting"),
	entry("wordpress", "plugins", "Plugins", "View or manage plugins"),
	entry("wordpress", "themes", "Themes", "View or manage themes"),
	entry("wordpress", "tools", "Tools", "Use debug, security, maintenance, and indexing tools"),
	entry("wordpress", "credentials", "Credentials", "View or change WordPress credentials"),

	...serverEntries("servers.vps"),
	...serverEntries("servers.vds"),
	...serverEntries("servers.dedicated"),

	...adsEntries("ads.meta"),
	...adsEntries("ads.google"),
	...adsEntries("ads.linkedin"),

	entry("email_marketing", "campaigns", "Campaigns", "View or create and send campaigns"),
	entry("email_marketing", "audiences", "Audiences", "View or manage audiences"),
	entry("email_marketing", "email_builder", "AI email builder", "View or edit email designs"),
	entry("email_marketing", "sending_domains", "Sending domains", "View or configure sending domains"),

	entry("seo", "reports", "Reports", "View or manage SEO reports"),
	entry("creatives", "assets", "Assets", "View or manage creative assets"),

	entry("gen_ai", "zeepo_ai", "Zeepo AI", "Use Zeepo AI chat"),
	entry("gen_ai", "zeepo_agent", "Zeepo agent", "Use the Zeepo AI agent"),
	entry("gen_ai", "image_generator", "Image generator", "Generate images"),
	entry("gen_ai", "background_remover", "Background remover", "Remove image backgrounds"),

	entry("billing", "invoices_view", "View invoices", "View invoices and credit notes"),
	entry("billing", "invoices_create", "Create invoices", "Create invoices"),
	entry("billing", "subscriptions", "Subscriptions", "View or manage subscriptions"),
	entry("billing", "checkout", "Checkout", "Place orders and complete checkout"),
	entry("billing", "team_billing", "Company billing", "View or edit company billing details"),

	entry("team_settings", "members", "Members", "View or remove team members"),
	entry("team_settings", "invitations", "Invitations", "View or send and cancel invitations"),

	entry("marketplace", "browse", "Browse", "Browse the marketplace"),
] as const;

export type TeamPermissionKey = (typeof TEAM_PERMISSION_CATALOG)[number]["key"];

export const TEAM_PERMISSION_KEYS = TEAM_PERMISSION_CATALOG.map((e) => e.key) as [
	TeamPermissionKey,
	...TeamPermissionKey[],
];

export const TEAM_PERMISSION_KEY_SET = new Set<string>(TEAM_PERMISSION_KEYS);

export const TEAM_PERMISSION_MODULES: {
	id: TeamPermissionModuleId;
	label: string;
	keys: TeamPermissionKey[];
}[] = (
	Object.keys(MODULE_LABELS) as TeamPermissionModuleId[]
).map((id) => ({
	id,
	label: MODULE_LABELS[id],
	keys: TEAM_PERMISSION_CATALOG.filter((e) => e.module === id).map((e) => e.key as TeamPermissionKey),
}));

export function isTeamPermissionKey(value: string): value is TeamPermissionKey {
	return TEAM_PERMISSION_KEY_SET.has(value);
}

export function accessSatisfies(
	granted: TeamPermissionAccess | undefined,
	required: TeamPermissionGrantedAccess,
): boolean {
	if (granted === "write") return true;
	if (required === "read") return granted === "read";
	return false;
}

export function allWritePermissions(): Record<TeamPermissionKey, TeamPermissionGrantedAccess> {
	const out = {} as Record<TeamPermissionKey, TeamPermissionGrantedAccess>;
	for (const key of TEAM_PERMISSION_KEYS) {
		out[key] = "write";
	}
	return out;
}
