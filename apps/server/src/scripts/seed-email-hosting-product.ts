/**
 * Idempotent seed for Email Hosting product and plans.
 *
 * Run from apps/server:
 *   bun run seed:email-hosting
 */
import { and, eq, ilike, ne, notInArray, or } from "@npanel/db";
import { db } from "@npanel/db";
import { niscProduct, niscProductPlan } from "@npanel/db/schema/products";
import {
	NISC_EMAIL_HOSTING_PLAN_IDS,
	NISC_EMAIL_HOSTING_PRODUCT_ID,
} from "@npanel/api/lib/email-hosting-billing";
import { invalidateProductsCache } from "@npanel/api/lib/products-cache";

type ProductFeature = {
	key: string;
	label: string;
	description: string;
};

const PRODUCT_FEATURES: ProductFeature[] = [
	{ key: "ssd_storage", label: "SSD storage", description: "Fast SSD storage for mailboxes" },
	{ key: "mailboxes", label: "Mail boxes", description: "Professional email addresses on your domain" },
	{ key: "incremental_backups", label: "Daily incremental backups", description: "Mail data backed up every day" },
	{ key: "imap_smtp_ssl", label: "IMAP/POP + secure SMTP", description: "Encrypted mail protocols included" },
	{ key: "anti_phishing", label: "Real-time anti-phishing", description: "Protect inboxes from phishing attacks" },
	{ key: "anti_virus", label: "Advanced anti-virus", description: "Scan incoming and outgoing mail" },
	{ key: "premium_webmail", label: "Premium webmail", description: "Modern webmail interface for any browser" },
	{ key: "anti_spam", label: "Advanced anti-spam", description: "Keep spam out of your inbox" },
	{ key: "email_clients", label: "Desktop email clients", description: "Outlook, Thunderbird, Windows Mail, and more" },
	{ key: "free_migration", label: "Automated free migration", description: "Move existing mailboxes at no extra cost" },
	{ key: "uptime_guarantee", label: "99.9% uptime guarantee", description: "Reliable email backed by SLA" },
	{ key: "control_panel", label: "Free control panel", description: "Preinstalled panel to manage mailboxes" },
	{ key: "support_247", label: "24/7/365 support", description: "Local Nisc Cloud support around the clock" },
];

const PRODUCT = {
	id: NISC_EMAIL_HOSTING_PRODUCT_ID,
	name: "Email Hosting",
	description:
		"Look professional with email at your domain — secure mailboxes, premium webmail, anti-spam, and daily backups from Nisc Cloud.",
	category: "CLOUD",
	serviceType: "email_hosting",
	isActive: true,
	sortOrder: 11,
	features: PRODUCT_FEATURES,
	highlights: [
		"you@yourdomain.com on every plan",
		"Premium webmail with anti-spam and anti-virus",
		"Free migration from your old provider",
		"99.9% uptime with 24/7 Kenya-based support",
	],
	isAddOn: false,
	metadata: {
		niscEmailHostingProduct: true,
		billingCurrency: "KES",
		legacyPlanType: "EMAIL_HOSTING",
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
	mailboxes: string;
}): PlanFeatureEntry[] {
	return [
		feature("ssd_storage", true, config.ssdStorage),
		feature("mailboxes", true, config.mailboxes),
		feature("incremental_backups"),
		feature("imap_smtp_ssl"),
		feature("anti_phishing"),
		feature("anti_virus"),
		feature("premium_webmail"),
		feature("anti_spam"),
		feature("email_clients"),
		feature("free_migration"),
		feature("uptime_guarantee", true, "99.9%"),
		feature("control_panel"),
		feature("support_247"),
	];
}

const PLANS: PlanSeed[] = [
	{
		id: NISC_EMAIL_HOSTING_PLAN_IDS.basic,
		name: "Basic",
		description: "Essential business email — 10 mailboxes with 10 GB SSD storage.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceKes: "320",
		sortOrder: 1,
		highlights: ["10 mailboxes", "10 GB SSD storage", "Premium webmail included"],
		planFeatures: buildPlanFeatures({ ssdStorage: "10 GB", mailboxes: "10" }),
	},
	{
		id: NISC_EMAIL_HOSTING_PLAN_IDS.standard,
		name: "Standard",
		description: "For growing teams — 20 mailboxes with 30 GB storage.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceKes: "500",
		isRecommended: true,
		sortOrder: 2,
		highlights: ["20 mailboxes", "30 GB SSD storage", "Recommended for teams"],
		planFeatures: buildPlanFeatures({ ssdStorage: "30 GB", mailboxes: "20" }),
	},
	{
		id: NISC_EMAIL_HOSTING_PLAN_IDS.corporate,
		name: "Corporate",
		description: "For larger organisations — 100 mailboxes with 100 GB storage.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceKes: "800",
		isPopular: true,
		sortOrder: 3,
		highlights: ["100 mailboxes", "100 GB SSD storage", "Enterprise-grade security"],
		planFeatures: buildPlanFeatures({ ssdStorage: "100 GB", mailboxes: "100" }),
	},
];

const CANONICAL_PLAN_IDS = PLANS.map((p) => p.id);

function emailHostingProductMatch() {
	return or(
		ilike(niscProduct.name, "%email hosting%"),
		eq(niscProduct.serviceType, "email_hosting"),
	);
}

async function deactivateLegacyCatalog() {
	const now = new Date();

	const legacyProducts = await db
		.select({ id: niscProduct.id, name: niscProduct.name })
		.from(niscProduct)
		.where(and(ne(niscProduct.id, PRODUCT.id), emailHostingProductMatch()));

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
		.where(and(emailHostingProductMatch(), notInArray(niscProductPlan.id, CANONICAL_PLAN_IDS)));

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
			hostingType: "EMAIL_HOSTING",
			metadata: { billingCurrency: "KES", legacyPlanType: "EMAIL_HOSTING" },
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
				hostingType: "EMAIL_HOSTING",
				metadata: { billingCurrency: "KES", legacyPlanType: "EMAIL_HOSTING" },
				updatedAt: now,
			},
		});
}

async function main() {
	console.log("Seeding Email Hosting product…");

	await deactivateLegacyCatalog();

	await upsertProduct();
	console.log(`  ✓ Product ${PRODUCT.id}`);

	for (const plan of PLANS) {
		await upsertPlan(plan);
		console.log(`  ✓ Plan ${plan.name} — KSh ${plan.priceKes}/mo (${plan.id})`);
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
