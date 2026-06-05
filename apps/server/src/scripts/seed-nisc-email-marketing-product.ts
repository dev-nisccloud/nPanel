/**
 * Idempotent seed for Nisc Email Marketing product, plans, and plan usage limits.
 *
 * Run from apps/server (env + DATABASE_URL live here):
 *   bun run seed:nisc-email-marketing
 */
import { randomUUID } from "node:crypto";
import { and, eq, ilike, ne, notInArray, or } from "@npanel/db";
import { db } from "@npanel/db";
import {
	niscProduct,
	niscProductPlan,
	niscProductPlanUsage,
} from "@npanel/db/schema/products";
import {
	NISC_EMAIL_MARKETING_PLAN_IDS,
	NISC_EMAIL_MARKETING_PRODUCT_ID,
	NISC_EM_CONTACTS_USAGE_KIND,
	NISC_EM_EMAILS_MONTHLY_USAGE_KIND,
} from "@npanel/api/lib/nisc-email-marketing-billing";
import { invalidateProductsCache } from "@npanel/api/lib/products-cache";

type ProductFeature = {
	key: string;
	label: string;
	description: string;
};

/** Pricing-table rows — order defines column order in getNiscEmailMarketingPlansForPricing. */
const PRODUCT_FEATURES: ProductFeature[] = [
	{
		key: "contacts",
		label: "Contacts",
		description: "Subscribers you can store and email",
	},
	{
		key: "emails_per_month",
		label: "Emails per month",
		description: "Campaign and automation sends included each month",
	},
	{
		key: "newsletters",
		label: "Send newsletters",
		description: "Design and send email campaigns to your audience",
	},
	{
		key: "campaign_analytics",
		label: "Campaign analytics",
		description: "Schedule sends and track opens and clicks for every campaign",
	},
	{
		key: "ai_templates",
		label: "AI email templates",
		description: "Describe your goal to generate a professional email, then customize",
	},
	{
		key: "optimize_opens",
		label: "Optimize opens",
		description: "AI subject line writer and spam checker before every send",
	},
	{
		key: "campaign_ideas",
		label: "Weekly campaign ideas",
		description: "AI suggests what to send, tailored to your niche and season",
	},
	{
		key: "welcome_sequences",
		label: "Welcome & sequences",
		description: "Greet new subscribers and nurture them over days or weeks",
	},
	{
		key: "ecommerce_automation",
		label: "E-commerce automation",
		description: "Abandoned cart and post-purchase follow-ups on autopilot",
	},
	{
		key: "segments",
		label: "Audience segments",
		description: "Group contacts by behavior — manually or with AI",
	},
	{
		key: "white_label",
		label: "Your brand",
		description: "Emails look like they come from your business, not a third-party tool",
	},
	{
		key: "collaborators",
		label: "Team collaborators",
		description: "Invite as many teammates as you need to manage campaigns",
	},
];

const PRODUCT = {
	id: NISC_EMAIL_MARKETING_PRODUCT_ID,
	name: "Nisc Email Marketing",
	description:
		"AI-powered email marketing for growing businesses. Send newsletters, automate welcome and e-commerce flows, build segments, and track every open and click — with AI templates, subject lines, and campaign ideas built in.",
	category: "MARKETING",
	serviceType: "nisc_email_marketing",
	isActive: true,
	sortOrder: 21,
	features: PRODUCT_FEATURES,
	highlights: [
		"AI email templates, subject lines, and weekly campaign ideas",
		"Schedule campaigns and track opens and clicks per send",
		"Welcome sequences and e-commerce automation",
		"Audience segments and team collaborators",
		"Send from your own domain — your brand front and center",
	],
	isAddOn: false,
	metadata: {
		niscEmailMarketingProduct: true,
		billingCurrency: "KES",
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
	contactLimit: number;
	emailsPerMonth: number;
	isPopular?: boolean;
	isRecommended?: boolean;
	isDefault?: boolean;
	sortOrder: number;
	highlights: string[];
	planFeatures: PlanFeatureEntry[];
};

function feature(
	key: string,
	available: boolean,
	valueOverride?: string,
): PlanFeatureEntry {
	return valueOverride ? { key, available, valueOverride } : { key, available };
}

function buildPlanFeatures(config: {
	contacts: string;
	emailsPerMonth: string;
	campaignIdeas: boolean;
	ecommerceAutomation: boolean;
	segments: string;
}): PlanFeatureEntry[] {
	return [
		feature("contacts", true, config.contacts),
		feature("emails_per_month", true, config.emailsPerMonth),
		feature("newsletters", true),
		feature("campaign_analytics", true),
		feature("ai_templates", true),
		feature("optimize_opens", true),
		feature("campaign_ideas", config.campaignIdeas),
		feature("welcome_sequences", true),
		feature("ecommerce_automation", config.ecommerceAutomation),
		feature("segments", true, config.segments),
		feature("white_label", true),
		feature("collaborators", true, "Unlimited"),
	];
}

const PLANS: PlanSeed[] = [
	{
		id: NISC_EMAIL_MARKETING_PLAN_IDS.starter,
		name: "Starter",
		description:
			"Everything you need to launch email marketing — 2,500 contacts and 10,000 sends per month.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceKes: "1999.00",
		contactLimit: 2500,
		emailsPerMonth: 10000,
		sortOrder: 1,
		highlights: [
			"2,500 contacts",
			"10,000 emails per month",
			"AI templates and open optimization",
		],
		planFeatures: buildPlanFeatures({
			contacts: "2,500",
			emailsPerMonth: "10,000",
			campaignIdeas: false,
			ecommerceAutomation: false,
			segments: "5 segments",
		}),
	},
	{
		id: NISC_EMAIL_MARKETING_PLAN_IDS.growth,
		name: "Growth",
		description:
			"Scale your list and automation — 10,000 contacts, 50,000 sends, unlimited segments, and weekly AI campaign ideas.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceKes: "4999.00",
		contactLimit: 10000,
		emailsPerMonth: 50000,
		isPopular: true,
		isRecommended: true,
		isDefault: true,
		sortOrder: 2,
		highlights: [
			"10,000 contacts",
			"50,000 emails per month",
			"Unlimited segments and AI campaign ideas",
		],
		planFeatures: buildPlanFeatures({
			contacts: "10,000",
			emailsPerMonth: "50,000",
			campaignIdeas: true,
			ecommerceAutomation: false,
			segments: "Unlimited",
		}),
	},
	{
		id: NISC_EMAIL_MARKETING_PLAN_IDS.pro,
		name: "Pro",
		description:
			"For high-volume senders — 50,000 contacts, 200,000 sends, and full e-commerce automation.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceKes: "9999.00",
		contactLimit: 50000,
		emailsPerMonth: 200000,
		sortOrder: 3,
		highlights: [
			"50,000 contacts",
			"200,000 emails per month",
			"E-commerce automation included",
		],
		planFeatures: buildPlanFeatures({
			contacts: "50,000",
			emailsPerMonth: "200,000",
			campaignIdeas: true,
			ecommerceAutomation: true,
			segments: "Unlimited",
		}),
	},
];

const CANONICAL_PLAN_IDS = PLANS.map((plan) => plan.id);

function emailMarketingProductMatch() {
	return or(
		ilike(niscProduct.name, "%nisc email marketing%"),
		ilike(niscProduct.name, "%email marketing%"),
		eq(niscProduct.serviceType, "nisc_email_marketing"),
		eq(niscProduct.serviceType, "email_marketing"),
	);
}

/** Deactivate duplicate products and stale plans so pricing shows only the seeded catalog. */
async function deactivateLegacyCatalog() {
	const now = new Date();

	const legacyProducts = await db
		.select({ id: niscProduct.id, name: niscProduct.name })
		.from(niscProduct)
		.where(and(ne(niscProduct.id, PRODUCT.id), emailMarketingProductMatch()));

	for (const product of legacyProducts) {
		await db
			.update(niscProduct)
			.set({ isActive: false, updatedAt: now })
			.where(eq(niscProduct.id, product.id));
		console.log(`  ⊘ Deactivated legacy product ${product.id} (${product.name})`);
	}

	const stalePlans = await db
		.select({
			id: niscProductPlan.id,
			name: niscProductPlan.name,
		})
		.from(niscProductPlan)
		.innerJoin(niscProduct, eq(niscProductPlan.productId, niscProduct.id))
		.where(
			and(emailMarketingProductMatch(), notInArray(niscProductPlan.id, CANONICAL_PLAN_IDS)),
		);

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
	const planMetadata = {
		billingCurrency: "KES",
		contactLimit: plan.contactLimit,
		emailsPerMonth: plan.emailsPerMonth,
	};

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
			isDefault: plan.isDefault ?? false,
			sortOrder: plan.sortOrder,
			metadata: planMetadata,
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
				isDefault: plan.isDefault ?? false,
				sortOrder: plan.sortOrder,
				metadata: planMetadata,
				updatedAt: now,
			},
		});
}

async function upsertPlanUsage(
	plan: PlanSeed,
	usageKind: string,
	limitValue: number,
) {
	const existing = await db.query.niscProductPlanUsage.findFirst({
		where: and(
			eq(niscProductPlanUsage.productPlanId, plan.id),
			eq(niscProductPlanUsage.usageKind, usageKind),
		),
	});

	const usageId = existing?.id ?? randomUUID();
	const now = new Date();

	await db
		.insert(niscProductPlanUsage)
		.values({
			id: usageId,
			productId: PRODUCT.id,
			productPlanId: plan.id,
			usageKind,
			limitValue: String(limitValue),
			overuse: "HARD",
			period: "MONTHLY",
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: niscProductPlanUsage.id,
			set: {
				usageKind,
				limitValue: String(limitValue),
				overuse: "HARD",
				period: "MONTHLY",
				updatedAt: now,
			},
		});
}

async function main() {
	console.log("Seeding Nisc Email Marketing product…");

	await deactivateLegacyCatalog();

	await upsertProduct();
	console.log(`  ✓ Product ${PRODUCT.id}`);

	for (const plan of PLANS) {
		await upsertPlan(plan);
		await upsertPlanUsage(plan, NISC_EM_CONTACTS_USAGE_KIND, plan.contactLimit);
		await upsertPlanUsage(plan, NISC_EM_EMAILS_MONTHLY_USAGE_KIND, plan.emailsPerMonth);
		console.log(
			`  ✓ Plan ${plan.id} (${plan.contactLimit.toLocaleString()} contacts, ${plan.emailsPerMonth.toLocaleString()} emails/mo, KSh ${plan.priceKes})`,
		);
	}

	await invalidateProductsCache();
	console.log("\nDone. Product cache invalidated.");
	console.log(`Product id: ${PRODUCT.id}`);
}

main()
	.catch((err) => {
		console.error("Seed failed:", err);
		process.exit(1);
	})
	.finally(() => {
		process.exit(0);
	});
