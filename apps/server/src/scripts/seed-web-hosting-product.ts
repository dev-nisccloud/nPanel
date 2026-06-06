/**
 * Idempotent seed for Website Hosting product and plans.
 *
 * Run from apps/server:
 *   bun run seed:web-hosting
 */
import { and, eq, ilike, ne, notInArray, or } from "@npanel/db";
import { db } from "@npanel/db";
import { niscProduct, niscProductPlan } from "@npanel/db/schema/products";
import {
	NISC_WEB_HOSTING_PLAN_IDS,
	NISC_WEB_HOSTING_PRODUCT_ID,
} from "@npanel/api/lib/web-hosting-billing";
import { invalidateProductsCache } from "@npanel/api/lib/products-cache";

type ProductFeature = {
	key: string;
	label: string;
	description: string;
};

const PRODUCT_FEATURES: ProductFeature[] = [
	{ key: "ssd_storage", label: "SSD storage", description: "Fast SSD disk space for your site files" },
	{ key: "ram", label: "RAM", description: "Memory allocated to your hosting account" },
	{ key: "cpu", label: "CPU", description: "Processing power for your applications" },
	{ key: "databases", label: "Databases", description: "MySQL/MariaDB databases included" },
	{ key: "bandwidth", label: "Bandwidth", description: "Monthly data transfer allowance" },
	{ key: "ftp_accounts", label: "FTP accounts", description: "Secure file transfer accounts" },
	{ key: "email_accounts", label: "Email accounts", description: "Mailboxes included with hosting" },
	{ key: "subdomains", label: "Sub-domains", description: "Additional sub-domains on your account" },
	{ key: "wordpress_toolkit", label: "WordPress Toolkit", description: "Install and manage WordPress sites easily" },
	{ key: "wordpress_acceleration", label: "WordPress acceleration", description: "Performance optimizations for WordPress" },
	{ key: "free_ssl", label: "Free SSL", description: "HTTPS certificates included" },
	{ key: "dns_management", label: "DNS management", description: "Manage DNS records from your panel" },
	{ key: "scheduled_tasks", label: "Scheduled tasks", description: "Cron jobs for automated scripts" },
	{ key: "php_versions", label: "PHP versions", description: "Multiple PHP versions supported" },
	{ key: "dev_stack", label: "Developer stack", description: "Git, Node.js, Laravel, Docker, Ruby, and more" },
	{ key: "uptime_guarantee", label: "99.9% uptime guarantee", description: "Reliable hosting backed by SLA" },
	{ key: "support_247", label: "24/7/365 support", description: "Local Nisc Cloud support around the clock" },
];

const PRODUCT = {
	id: NISC_WEB_HOSTING_PRODUCT_ID,
	name: "Website Hosting",
	description:
		"Build, test, and deploy websites faster on Nisc Cloud - SSD hosting with WordPress toolkit, free SSL, and 24/7 local support.",
	category: "CLOUD",
	serviceType: "web_hosting",
	isActive: true,
	sortOrder: 10,
	features: PRODUCT_FEATURES,
	highlights: [
		"SSD-powered hosting with WordPress toolkit",
		"Free SSL and DNS management on every plan",
		"PHP, Node.js, Laravel, Docker, and more",
		"99.9% uptime with 24/7 Kenya-based support",
	],
	isAddOn: false,
	metadata: {
		niscWebHostingProduct: true,
		billingCurrency: "KES",
		legacyPlanType: "WEB_HOSTING",
	},
} as const;

type PlanFeatureEntry = {
	key: string;
	available: boolean;
	valueOverride?: string;
};

type PlanSeed = {
	id: string;
	name: string;
	description: string;
	pricingModel: "FIXED";
	billingCycle: "MONTHLY";
	priceKes: string;
	isPopular?: boolean;
	isRecommended?: boolean;
	sortOrder: number;
	highlights: string[];
	planFeatures: PlanFeatureEntry[];
};

function feature(key: string, available = true, valueOverride?: string): PlanFeatureEntry {
	return valueOverride ? { key, available, valueOverride } : { key, available };
}

function buildPlanFeatures(config: {
	ssdStorage: string;
	ram: string;
	cpu: string;
	databases: string;
	bandwidth: string;
	ftpAccounts: string;
	emailAccounts: string;
	subdomains: string;
}): PlanFeatureEntry[] {
	return [
		feature("ssd_storage", true, config.ssdStorage),
		feature("ram", true, config.ram),
		feature("cpu", true, config.cpu),
		feature("databases", true, config.databases),
		feature("bandwidth", true, config.bandwidth),
		feature("ftp_accounts", true, config.ftpAccounts),
		feature("email_accounts", true, config.emailAccounts),
		feature("subdomains", true, config.subdomains),
		feature("wordpress_toolkit"),
		feature("wordpress_acceleration"),
		feature("free_ssl"),
		feature("dns_management"),
		feature("scheduled_tasks", true, "Unlimited"),
		feature("php_versions", true, "8.1, 8.0, 7.4, 7.3, 5.6"),
		feature("dev_stack"),
		feature("uptime_guarantee", true, "99.9%"),
		feature("support_247"),
	];
}

const PLANS: PlanSeed[] = [
	{
		id: NISC_WEB_HOSTING_PLAN_IDS.starter,
		name: "Starter",
		description: "Affordable hosting for a single site - perfect for personal projects and small sites.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceKes: "149",
		sortOrder: 1,
		highlights: ["10 GB SSD", "1 website-ready stack", "WordPress toolkit included"],
		planFeatures: buildPlanFeatures({
			ssdStorage: "10 GB",
			ram: "1 GB",
			cpu: "1 Core",
			databases: "5",
			bandwidth: "100 GB",
			ftpAccounts: "4",
			emailAccounts: "10",
			subdomains: "5",
		}),
	},
	{
		id: NISC_WEB_HOSTING_PLAN_IDS.basic,
		name: "Basic",
		description: "More power for business websites - extra RAM, storage, and email accounts.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceKes: "249",
		isRecommended: true,
		sortOrder: 2,
		highlights: ["40 GB SSD", "4 GB RAM", "Unlimited databases"],
		planFeatures: buildPlanFeatures({
			ssdStorage: "40 GB",
			ram: "4 GB",
			cpu: "2 Cores",
			databases: "Unlimited",
			bandwidth: "500 GB",
			ftpAccounts: "3",
			emailAccounts: "20",
			subdomains: "5",
		}),
	},
	{
		id: NISC_WEB_HOSTING_PLAN_IDS.deluxe,
		name: "Deluxe",
		description: "High-traffic sites and multiple projects - generous resources and bandwidth.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceKes: "799",
		isPopular: true,
		sortOrder: 3,
		highlights: ["80 GB SSD", "8 GB RAM", "800 GB bandwidth"],
		planFeatures: buildPlanFeatures({
			ssdStorage: "80 GB",
			ram: "8 GB",
			cpu: "4 Cores",
			databases: "Unlimited",
			bandwidth: "800 GB",
			ftpAccounts: "10",
			emailAccounts: "50",
			subdomains: "10",
		}),
	},
	{
		id: NISC_WEB_HOSTING_PLAN_IDS.ultimate,
		name: "Ultimate",
		description: "Maximum resources for demanding sites - unlimited bandwidth and FTP accounts.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceKes: "1199",
		sortOrder: 4,
		highlights: ["200 GB SSD", "12 GB RAM", "Unlimited bandwidth"],
		planFeatures: buildPlanFeatures({
			ssdStorage: "200 GB",
			ram: "12 GB",
			cpu: "8 Cores",
			databases: "Unlimited",
			bandwidth: "Unlimited",
			ftpAccounts: "Unlimited",
			emailAccounts: "100",
			subdomains: "20",
		}),
	},
];

const CANONICAL_PLAN_IDS = PLANS.map((p) => p.id);

function webHostingProductMatch() {
	return or(
		ilike(niscProduct.name, "%web hosting%"),
		ilike(niscProduct.name, "%website hosting%"),
		eq(niscProduct.serviceType, "web_hosting"),
	);
}

async function deactivateLegacyCatalog() {
	const now = new Date();

	const legacyProducts = await db
		.select({ id: niscProduct.id, name: niscProduct.name })
		.from(niscProduct)
		.where(and(ne(niscProduct.id, PRODUCT.id), webHostingProductMatch()));

	for (const product of legacyProducts) {
		await db
			.update(niscProduct)
			.set({ isActive: false, updatedAt: now })
			.where(eq(niscProduct.id, product.id));
		console.log(`  ⊘ Deactivated legacy product ${product.id} (${product.name})`);
	}

	const stalePlans = await db
		.select({ id: niscProductPlan.id, name: niscProductPlan.name })
		.from(niscProductPlan)
		.innerJoin(niscProduct, eq(niscProductPlan.productId, niscProduct.id))
		.where(and(webHostingProductMatch(), notInArray(niscProductPlan.id, CANONICAL_PLAN_IDS)));

	for (const plan of stalePlans) {
		await db
			.update(niscProductPlan)
			.set({ isActive: false, isDefault: false, updatedAt: now })
			.where(eq(niscProductPlan.id, plan.id));
		console.log(`  ⊘ Deactivated legacy plan ${plan.id} (${plan.name})`);
	}
}

async function upsertProduct() {
	const now = new Date();
	await db
		.insert(niscProduct)
		.values({
			id: PRODUCT.id,
			name: PRODUCT.name,
			description: PRODUCT.description,
			category: PRODUCT.category,
			serviceType: PRODUCT.serviceType,
			isActive: PRODUCT.isActive,
			sortOrder: PRODUCT.sortOrder,
			features: PRODUCT.features,
			highlights: PRODUCT.highlights,
			isAddOn: PRODUCT.isAddOn,
			metadata: PRODUCT.metadata,
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: niscProduct.id,
			set: {
				name: PRODUCT.name,
				description: PRODUCT.description,
				category: PRODUCT.category,
				serviceType: PRODUCT.serviceType,
				isActive: PRODUCT.isActive,
				sortOrder: PRODUCT.sortOrder,
				features: PRODUCT.features,
				highlights: PRODUCT.highlights,
				isAddOn: PRODUCT.isAddOn,
				metadata: PRODUCT.metadata,
				updatedAt: now,
			},
		});
}

async function upsertPlan(plan: PlanSeed) {
	const now = new Date();
	await db
		.insert(niscProductPlan)
		.values({
			id: plan.id,
			productId: PRODUCT.id,
			name: plan.name,
			description: plan.description,
			pricingModel: plan.pricingModel,
			billingCycle: plan.billingCycle,
			price: plan.priceKes,
			currency: "KES",
			setupFee: null,
			cost: plan.priceKes,
			costCurrency: "KES",
			planFeatures: plan.planFeatures,
			highlights: plan.highlights,
			isPopular: plan.isPopular ?? false,
			isRecommended: plan.isRecommended ?? false,
			isActive: true,
			isDefault: false,
			sortOrder: plan.sortOrder,
			hostingType: "WEB_HOSTING",
			metadata: { billingCurrency: "KES", legacyPlanType: "WEB_HOSTING" },
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: niscProductPlan.id,
			set: {
				productId: PRODUCT.id,
				name: plan.name,
				description: plan.description,
				pricingModel: plan.pricingModel,
				billingCycle: plan.billingCycle,
				price: plan.priceKes,
				currency: "KES",
				cost: plan.priceKes,
				costCurrency: "KES",
				planFeatures: plan.planFeatures,
				highlights: plan.highlights,
				isPopular: plan.isPopular ?? false,
				isRecommended: plan.isRecommended ?? false,
				isActive: true,
				isDefault: false,
				sortOrder: plan.sortOrder,
				hostingType: "WEB_HOSTING",
				metadata: { billingCurrency: "KES", legacyPlanType: "WEB_HOSTING" },
				updatedAt: now,
			},
		});
}

async function main() {
	console.log("Seeding Website Hosting product…");

	await deactivateLegacyCatalog();

	await upsertProduct();
	console.log(`  ✓ Product ${PRODUCT.id}`);

	for (const plan of PLANS) {
		await upsertPlan(plan);
		console.log(`  ✓ Plan ${plan.name} - KSh ${plan.priceKes}/mo (${plan.id})`);
	}

	await invalidateProductsCache();
	console.log("\nDone. Product cache invalidated.");
}

main()
	.catch((err) => {
		console.error("Seed failed:", err);
		process.exit(1);
	})
	.finally(() => {
		process.exit(0);
	});
