/**
 * Idempotent seed for WordPress Hosting product and plans.
 *
 * Run from apps/server:
 *   bun run seed:wordpress-hosting
 */
import { and, eq, ilike, ne, notInArray, or } from "@npanel/db";
import { db } from "@npanel/db";
import { niscProduct, niscProductPlan } from "@npanel/db/schema/products";
import {
	NISC_WORDPRESS_HOSTING_PLAN_IDS,
	NISC_WORDPRESS_HOSTING_PRODUCT_ID,
} from "@npanel/api/lib/wordpress-hosting-billing";
import { invalidateProductsCache } from "@npanel/api/lib/products-cache";

type ProductFeature = {
	key: string;
	label: string;
	description: string;
};

const PRODUCT_FEATURES: ProductFeature[] = [
	{ key: "wordpress_sites", label: "WordPress sites", description: "Number of WordPress installations included" },
	{ key: "nvme_storage", label: "NVMe storage", description: "Ultra-fast NVMe SSD storage for WordPress" },
	{ key: "ram", label: "RAM", description: "Memory allocated for optimal WordPress performance" },
	{ key: "cpu", label: "CPU", description: "Processing power for your WordPress sites" },
	{ key: "bandwidth", label: "Bandwidth", description: "Monthly data transfer allowance" },
	{ key: "email_accounts", label: "Email accounts", description: "Professional email addresses included" },
	{ key: "free_ssl", label: "Free SSL", description: "HTTPS certificates for all your sites" },
	{ key: "auto_updates", label: "Automatic WordPress updates", description: "Keep WordPress core, themes, and plugins updated automatically" },
	{ key: "daily_backups", label: "Daily backups", description: "Automated daily backups with one-click restore" },
	{ key: "malware_scanning", label: "Malware scanning & removal", description: "Automated security scans and threat removal" },
	{ key: "staging_environment", label: "Staging environment", description: "Test changes safely before going live" },
	{ key: "wordpress_acceleration", label: "WordPress acceleration", description: "Built-in caching and performance optimization" },
	{ key: "litespeed_cache", label: "LiteSpeed cache", description: "Lightning-fast LiteSpeed web server with caching" },
	{ key: "cdn", label: "Free CDN", description: "Global content delivery network included" },
	{ key: "object_cache", label: "Object cache", description: "Redis/Memcached for database query optimization" },
	{ key: "woocommerce_ready", label: "WooCommerce ready", description: "Pre-configured for online stores" },
	{ key: "php_versions", label: "Multiple PHP versions", description: "Switch between PHP versions easily" },
	{ key: "git_integration", label: "Git integration", description: "Deploy and manage code with Git" },
	{ key: "wp_cli", label: "WP-CLI access", description: "Command-line interface for WordPress management" },
	{ key: "ssh_sftp", label: "SSH & SFTP access", description: "Secure shell and file transfer access" },
	{ key: "ddos_protection", label: "DDoS protection", description: "Enterprise-grade DDoS attack mitigation" },
	{ key: "uptime_guarantee", label: "99.9% uptime guarantee", description: "Reliable hosting backed by SLA" },
	{ key: "support_247", label: "24/7/365 support", description: "Local Nisc Cloud support around the clock" },
];

const PRODUCT = {
	id: NISC_WORDPRESS_HOSTING_PRODUCT_ID,
	name: "WordPress Hosting",
	description:
		"Lightning-fast managed WordPress hosting on Nisc Cloud - NVMe storage, automatic updates, daily backups, and enterprise security. Launch your WordPress site in minutes.",
	category: "CLOUD",
	serviceType: "wordpress_hosting",
	isActive: true,
	sortOrder: 11,
	features: PRODUCT_FEATURES,
	highlights: [
		"Managed WordPress with auto-updates and daily backups",
		"LiteSpeed cache and CDN for blazing-fast performance",
		"Staging environments and WooCommerce ready",
		"Enterprise security with malware scanning and DDoS protection",
	],
	isAddOn: false,
	metadata: {
		niscWordPressHostingProduct: true,
		billingCurrency: "KES",
		legacyPlanType: "WORDPRESS_HOSTING",
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
	wordpressSites: string;
	nvmeStorage: string;
	ram: string;
	cpu: string;
	bandwidth: string;
	emailAccounts: string;
	dailyBackups: boolean;
	stagingEnvironment: boolean;
	objectCache: boolean;
	woocommerceReady: boolean;
	gitIntegration: boolean;
	ddosProtection: boolean;
}): PlanFeatureEntry[] {
	return [
		feature("wordpress_sites", true, config.wordpressSites),
		feature("nvme_storage", true, config.nvmeStorage),
		feature("ram", true, config.ram),
		feature("cpu", true, config.cpu),
		feature("bandwidth", true, config.bandwidth),
		feature("email_accounts", true, config.emailAccounts),
		feature("free_ssl", true, "Unlimited"),
		feature("auto_updates"),
		feature("daily_backups", config.dailyBackups),
		feature("malware_scanning"),
		feature("staging_environment", config.stagingEnvironment),
		feature("wordpress_acceleration"),
		feature("litespeed_cache"),
		feature("cdn"),
		feature("object_cache", config.objectCache),
		feature("woocommerce_ready", config.woocommerceReady),
		feature("php_versions", true, "8.3, 8.2, 8.1, 8.0, 7.4"),
		feature("git_integration", config.gitIntegration),
		feature("wp_cli"),
		feature("ssh_sftp"),
		feature("ddos_protection", config.ddosProtection),
		feature("uptime_guarantee", true, "99.9%"),
		feature("support_247"),
	];
}

const PLANS: PlanSeed[] = [
	{
		id: NISC_WORDPRESS_HOSTING_PLAN_IDS.starter,
		name: "Starter",
		description: "Perfect for bloggers and personal WordPress sites - managed hosting with essential features.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceKes: "299",
		sortOrder: 1,
		highlights: ["1 WordPress site", "20 GB NVMe storage", "LiteSpeed cache & free CDN"],
		planFeatures: buildPlanFeatures({
			wordpressSites: "1",
			nvmeStorage: "20 GB",
			ram: "2 GB",
			cpu: "2 Cores",
			bandwidth: "200 GB",
			emailAccounts: "10",
			dailyBackups: false,
			stagingEnvironment: false,
			objectCache: false,
			woocommerceReady: false,
			gitIntegration: false,
			ddosProtection: false,
		}),
	},
	{
		id: NISC_WORDPRESS_HOSTING_PLAN_IDS.business,
		name: "Business",
		description: "Most popular for growing sites and small businesses - staging, daily backups, and WooCommerce support.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceKes: "599",
		isRecommended: true,
		sortOrder: 2,
		highlights: ["3 WordPress sites", "50 GB NVMe storage", "Daily backups & staging"],
		planFeatures: buildPlanFeatures({
			wordpressSites: "3",
			nvmeStorage: "50 GB",
			ram: "4 GB",
			cpu: "4 Cores",
			bandwidth: "500 GB",
			emailAccounts: "25",
			dailyBackups: true,
			stagingEnvironment: true,
			objectCache: true,
			woocommerceReady: true,
			gitIntegration: false,
			ddosProtection: true,
		}),
	},
	{
		id: NISC_WORDPRESS_HOSTING_PLAN_IDS.pro,
		name: "Pro",
		description: "Maximum power for agencies, multiple sites, and high-traffic eCommerce - all premium features included.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceKes: "1199",
		isPopular: true,
		sortOrder: 3,
		highlights: ["Unlimited WordPress sites", "100 GB NVMe storage", "Object cache & Git integration"],
		planFeatures: buildPlanFeatures({
			wordpressSites: "Unlimited",
			nvmeStorage: "100 GB",
			ram: "8 GB",
			cpu: "8 Cores",
			bandwidth: "Unlimited",
			emailAccounts: "100",
			dailyBackups: true,
			stagingEnvironment: true,
			objectCache: true,
			woocommerceReady: true,
			gitIntegration: true,
			ddosProtection: true,
		}),
	},
];

const CANONICAL_PLAN_IDS = PLANS.map((p) => p.id);

function wordPressHostingProductMatch() {
	return or(
		ilike(niscProduct.name, "%wordpress hosting%"),
		ilike(niscProduct.name, "%wordpress managed%"),
		eq(niscProduct.serviceType, "wordpress_hosting"),
	);
}

async function deactivateLegacyCatalog() {
	const now = new Date();

	const legacyProducts = await db
		.select({ id: niscProduct.id, name: niscProduct.name })
		.from(niscProduct)
		.where(and(ne(niscProduct.id, PRODUCT.id), wordPressHostingProductMatch()));

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
		.where(and(wordPressHostingProductMatch(), notInArray(niscProductPlan.id, CANONICAL_PLAN_IDS)));

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
			hostingType: "WORDPRESS_HOSTING",
			metadata: { billingCurrency: "KES", legacyPlanType: "WORDPRESS_HOSTING" },
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
				hostingType: "WORDPRESS_HOSTING",
				metadata: { billingCurrency: "KES", legacyPlanType: "WORDPRESS_HOSTING" },
				updatedAt: now,
			},
		});
}

async function main() {
	console.log("Seeding WordPress Hosting product…");

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
