/**
 * Idempotent seed for Media Buying product, COMMISSION plans, and plan usage limits.
 *
 * Run from apps/server (env + DATABASE_URL live here):
 *   bun run seed:media-buying
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
	MEDIA_BUYING_AD_ACCOUNTS_USAGE_KIND,
	MEDIA_BUYING_COMMISSION_BASE,
	NISC_MEDIA_BUYING_PLAN_IDS,
	NISC_MEDIA_BUYING_PRODUCT_ID,
} from "@npanel/api/lib/media-buying-billing";
import { invalidateProductsCache } from "@npanel/api/lib/products-cache";

type ProductFeature = {
	key: string;
	label: string;
	description: string;
};

/** Pricing-table rows — agency media buying deliverables (not platform UI). */
const PRODUCT_FEATURES: ProductFeature[] = [
	{
		key: "ad_accounts",
		label: "Ad accounts managed",
		description: "Paid ad accounts we set up, optimize, and report on for your business",
	},
	{
		key: "platform_coverage",
		label: "Meta, Google & LinkedIn",
		description: "Run campaigns across the major ad platforms from one agency team",
	},
	{
		key: "campaign_setup",
		label: "Campaign setup",
		description: "Account structure, campaign objectives, and ad sets built to your goals",
	},
	{
		key: "audience_targeting",
		label: "Audience targeting",
		description: "Research and refine who sees your ads — interests, demographics, and intent",
	},
	{
		key: "budget_management",
		label: "Budget management",
		description: "Daily pacing, bid strategy, and spend allocation to maximize return",
	},
	{
		key: "creative_coordination",
		label: "Creative coordination",
		description: "Briefs, formats, and ad copy aligned with your brand and platform best practices",
	},
	{
		key: "ab_testing",
		label: "A/B testing",
		description: "Systematic tests on creatives, audiences, and placements to improve performance",
	},
	{
		key: "conversion_tracking",
		label: "Conversion tracking",
		description: "Pixels, tags, and events so you know which ads drive leads and sales",
	},
	{
		key: "remarketing",
		label: "Remarketing",
		description: "Re-engage site visitors and warm audiences who did not convert the first time",
	},
	{
		key: "performance_reporting",
		label: "Performance reporting",
		description: "Clear reports on spend, reach, clicks, and conversions on a regular cadence",
	},
	{
		key: "ai_campaign_analysis",
		label: "AI campaign analysis",
		description:
			"AI-powered insights on spend efficiency, creative performance, and audience trends — included on every plan",
	},
	{
		key: "strategy_reviews",
		label: "Strategy reviews",
		description: "Live check-ins with your media buyer on results, budget, and next steps",
	},
	{
		key: "team_access",
		label: "Team access",
		description: "Invite colleagues to view campaign performance alongside your agency",
	},
];

const PRODUCT = {
	id: NISC_MEDIA_BUYING_PRODUCT_ID,
	name: "Media Buying",
	description:
		"Done-for-you paid advertising from Nisc Cloud — Meta, Google, and LinkedIn campaigns managed by our media buying team. Pay a commission on ad spend each month; track live results and AI insights in your ad dashboard.",
	category: "MARKETING",
	serviceType: "media_buying",
	isActive: true,
	sortOrder: 24,
	features: PRODUCT_FEATURES,
	highlights: [
		"Meta, Google & LinkedIn campaigns managed for you",
		"Commission on ad spend — no fixed monthly retainer",
		"Audience targeting, budget pacing, and conversion tracking",
		"AI campaign analysis on every plan",
		"Live performance dashboards for your linked ad accounts",
	],
	isAddOn: false,
	metadata: {
		niscMediaBuyingProduct: true,
		billingCurrency: "KES",
		commissionBase: MEDIA_BUYING_COMMISSION_BASE,
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
	pricingModel: "COMMISSION";
	commissionRate: string;
	commissionBaseDescription: string;
	adAccounts: number;
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
	adAccounts: string;
	creativeCoordination: boolean;
	abTesting: boolean;
	remarketing: boolean;
	performanceReporting: string;
	strategyReviews: boolean | string;
}): PlanFeatureEntry[] {
	return [
		feature("ad_accounts", true, config.adAccounts),
		feature("platform_coverage", true),
		feature("campaign_setup", true),
		feature("audience_targeting", true),
		feature("budget_management", true),
		feature("creative_coordination", config.creativeCoordination),
		feature("ab_testing", config.abTesting),
		feature("conversion_tracking", true),
		feature("remarketing", config.remarketing),
		feature("performance_reporting", true, config.performanceReporting),
		feature("ai_campaign_analysis", true),
		feature(
			"strategy_reviews",
			config.strategyReviews !== false,
			typeof config.strategyReviews === "string" ? config.strategyReviews : undefined,
		),
		feature("team_access", true, "Unlimited"),
	];
}

const PLANS: PlanSeed[] = [
	{
		id: NISC_MEDIA_BUYING_PLAN_IDS.starter,
		name: "Starter",
		description:
			"One ad account on Meta, Google, or LinkedIn — ideal for businesses launching their first paid campaigns.",
		pricingModel: "COMMISSION",
		commissionRate: "10.0000",
		commissionBaseDescription: "Total monthly ad spend across linked accounts",
		adAccounts: 1,
		sortOrder: 1,
		highlights: ["1 ad account", "10% of ad spend", "AI campaign analysis included"],
		planFeatures: buildPlanFeatures({
			adAccounts: "1",
			creativeCoordination: false,
			abTesting: false,
			remarketing: false,
			performanceReporting: "Monthly",
			strategyReviews: false,
		}),
	},
	{
		id: NISC_MEDIA_BUYING_PLAN_IDS.growth,
		name: "Growth",
		description:
			"Up to three ad accounts with creative coordination, A/B testing, remarketing, and bi-weekly strategy reviews.",
		pricingModel: "COMMISSION",
		commissionRate: "12.0000",
		commissionBaseDescription: "Total monthly ad spend across linked accounts",
		adAccounts: 3,
		isPopular: true,
		isRecommended: true,
		isDefault: true,
		sortOrder: 2,
		highlights: ["3 ad accounts", "12% of ad spend", "Remarketing & A/B testing"],
		planFeatures: buildPlanFeatures({
			adAccounts: "3",
			creativeCoordination: true,
			abTesting: true,
			remarketing: true,
			performanceReporting: "Bi-weekly",
			strategyReviews: "Bi-weekly",
		}),
	},
	{
		id: NISC_MEDIA_BUYING_PLAN_IDS.pro,
		name: "Pro",
		description:
			"Up to ten ad accounts with full-service media buying, weekly strategy reviews, and priority optimization.",
		pricingModel: "COMMISSION",
		commissionRate: "15.0000",
		commissionBaseDescription: "Total monthly ad spend across linked accounts",
		adAccounts: 10,
		sortOrder: 3,
		highlights: ["10 ad accounts", "15% of ad spend", "Weekly strategy reviews"],
		planFeatures: buildPlanFeatures({
			adAccounts: "10",
			creativeCoordination: true,
			abTesting: true,
			remarketing: true,
			performanceReporting: "Weekly",
			strategyReviews: "Weekly",
		}),
	},
];

const CANONICAL_PLAN_IDS = PLANS.map((plan) => plan.id);

function mediaBuyingProductMatch() {
	return or(
		eq(niscProduct.id, NISC_MEDIA_BUYING_PRODUCT_ID),
		ilike(niscProduct.name, "%media buying%"),
		eq(niscProduct.serviceType, "media_buying"),
	);
}

async function deactivateLegacyCatalog() {
	const now = new Date();

	const legacyProducts = await db
		.select({ id: niscProduct.id, name: niscProduct.name })
		.from(niscProduct)
		.where(and(ne(niscProduct.id, PRODUCT.id), mediaBuyingProductMatch()));

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
		.where(and(mediaBuyingProductMatch(), notInArray(niscProductPlan.id, CANONICAL_PLAN_IDS)));

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
		adAccounts: plan.adAccounts,
		commissionBase: MEDIA_BUYING_COMMISSION_BASE,
	};

	await db
		.insert(niscProductPlan)
		.values({
			id: plan.id,
			productId: PRODUCT.id,
			name: plan.name,
			description: plan.description,
			pricingModel: plan.pricingModel,
			billingCycle: null,
			price: null,
			currency: "KES",
			setupFee: null,
			cost: null,
			costCurrency: "KES",
			commissionRate: plan.commissionRate,
			commissionBase: MEDIA_BUYING_COMMISSION_BASE,
			commissionBaseDescription: plan.commissionBaseDescription,
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
				billingCycle: null,
				price: null,
				currency: "KES",
				cost: null,
				costCurrency: "KES",
				commissionRate: plan.commissionRate,
				commissionBase: MEDIA_BUYING_COMMISSION_BASE,
				commissionBaseDescription: plan.commissionBaseDescription,
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

async function upsertPlanUsage(plan: PlanSeed) {
	const existing = await db.query.niscProductPlanUsage.findFirst({
		where: and(
			eq(niscProductPlanUsage.productPlanId, plan.id),
			eq(niscProductPlanUsage.usageKind, MEDIA_BUYING_AD_ACCOUNTS_USAGE_KIND),
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
			usageKind: MEDIA_BUYING_AD_ACCOUNTS_USAGE_KIND,
			limitValue: String(plan.adAccounts),
			overuse: "HARD",
			period: "MONTHLY",
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: niscProductPlanUsage.id,
			set: {
				usageKind: MEDIA_BUYING_AD_ACCOUNTS_USAGE_KIND,
				limitValue: String(plan.adAccounts),
				overuse: "HARD",
				period: "MONTHLY",
				updatedAt: now,
			},
		});
}

async function main() {
	console.log("Seeding Media Buying product…");

	await deactivateLegacyCatalog();

	await upsertProduct();
	console.log(`  ✓ Product ${PRODUCT.id}`);

	for (const plan of PLANS) {
		await upsertPlan(plan);
		await upsertPlanUsage(plan);
		console.log(
			`  ✓ Plan ${plan.id} (${plan.adAccounts} accounts, ${parseFloat(plan.commissionRate)}% commission)`,
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
