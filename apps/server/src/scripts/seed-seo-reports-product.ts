/**
 * Idempotent seed for SEO Reports product, plans, and plan usage limits.
 *
 * Run from apps/server (env + DATABASE_URL live here):
 *   bun run seed:seo-reports
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
	NISC_SEO_REPORTS_PLAN_IDS,
	NISC_SEO_REPORTS_PRODUCT_ID,
	SEO_GA4_PROPERTIES_USAGE_KIND,
	SEO_GSC_SITES_USAGE_KIND,
} from "@npanel/api/lib/seo-reports-billing";
import { invalidateProductsCache } from "@npanel/api/lib/products-cache";

type ProductFeature = {
	key: string;
	label: string;
	description: string;
};

/** Pricing-table rows — agency deliverables customers expect from SEO (not platform UI). */
const PRODUCT_FEATURES: ProductFeature[] = [
	{
		key: "websites",
		label: "Websites managed",
		description: "Sites we actively optimize and monitor for organic search growth",
	},
	{
		key: "target_keywords",
		label: "Target keywords",
		description: "Priority keywords we research, track, and work to improve rankings for",
	},
	{
		key: "keyword_research",
		label: "Keyword research",
		description: "Ongoing keyword discovery aligned to your products, services, and search intent",
	},
	{
		key: "on_page_seo",
		label: "On-page SEO",
		description: "Title tags, meta descriptions, headings, internal linking, and page structure improvements",
	},
	{
		key: "technical_seo",
		label: "Technical SEO",
		description: "Site audits, crawl issues, indexing, speed, and mobile fixes that block rankings",
	},
	{
		key: "content_optimization",
		label: "Content optimization",
		description: "Existing pages refreshed and new content briefed to match what searchers are looking for",
	},
	{
		key: "local_seo",
		label: "Local SEO",
		description: "Google Business Profile, local listings, and location pages that drive nearby customers",
	},
	{
		key: "link_building",
		label: "Off-page & link building",
		description: "Quality outreach and authority-building to strengthen your domain trust over time",
	},
	{
		key: "competitor_analysis",
		label: "Competitor analysis",
		description: "See where rivals outrank you and close the gaps with a clear action plan",
	},
	{
		key: "performance_reporting",
		label: "Performance reporting",
		description: "Clear reports on rankings, traffic, and conversions — delivered on a regular cadence",
	},
	{
		key: "strategy_reviews",
		label: "Strategy reviews",
		description: "Live check-ins with your SEO manager on progress, priorities, and next steps",
	},
	{
		key: "team_access",
		label: "Team access",
		description: "Invite colleagues to view progress and reports alongside your agency",
	},
];

const PRODUCT = {
	id: NISC_SEO_REPORTS_PRODUCT_ID,
	name: "SEO",
	description:
		"Done-for-you search engine optimization from Nisc Cloud — keyword strategy, on-page and technical fixes, content optimization, and off-page growth. Track rankings, traffic, and results anytime in your SEO Reports portal.",
	category: "MARKETING",
	serviceType: "nisc_seo_reports",
	isActive: true,
	sortOrder: 23,
	features: PRODUCT_FEATURES,
	highlights: [
		"Keyword research and on-page optimization handled for you",
		"Technical SEO audits and fixes that unblock Google visibility",
		"Content and local SEO support as your business grows",
		"Off-page and competitor insights on higher plans",
		"Live performance reports in your portal — see what we delivered",
	],
	isAddOn: false,
	metadata: {
		niscSeoReportsProduct: true,
		billingCurrency: "KES",
		legacyPlanType: "SEO",
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
	gscSites: number;
	ga4Properties: number;
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
	websites: string;
	targetKeywords: string;
	contentOptimization: string;
	technicalSeo: string;
	localSeo: boolean;
	linkBuilding: boolean | string;
	competitorAnalysis: boolean;
	performanceReporting: string;
	strategyReviews: boolean | string;
}): PlanFeatureEntry[] {
	return [
		feature("websites", true, config.websites),
		feature("target_keywords", true, config.targetKeywords),
		feature("keyword_research", true),
		feature("on_page_seo", true),
		feature("technical_seo", true, config.technicalSeo),
		feature("content_optimization", true, config.contentOptimization),
		feature("local_seo", config.localSeo),
		feature(
			"link_building",
			config.linkBuilding !== false,
			typeof config.linkBuilding === "string" ? config.linkBuilding : undefined,
		),
		feature("competitor_analysis", config.competitorAnalysis),
		feature("performance_reporting", true, config.performanceReporting),
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
		id: NISC_SEO_REPORTS_PLAN_IDS.starter,
		name: "Starter",
		description:
			"Essential SEO for one website — keyword research, on-page fixes, and monthly reporting to get you ranking.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceKes: "9999.00",
		gscSites: 1,
		ga4Properties: 1,
		sortOrder: 1,
		highlights: [
			"1 website managed",
			"25 target keywords",
			"On-page & technical SEO fundamentals",
		],
		planFeatures: buildPlanFeatures({
			websites: "1",
			targetKeywords: "25",
			contentOptimization: "5 pages / month",
			technicalSeo: "Quarterly audit",
			localSeo: false,
			linkBuilding: false,
			competitorAnalysis: false,
			performanceReporting: "Monthly",
			strategyReviews: false,
		}),
	},
	{
		id: NISC_SEO_REPORTS_PLAN_IDS.growth,
		name: "Growth",
		description:
			"Scale organic traffic across three sites — content optimization, local SEO, competitor insights, and bi-weekly strategy reviews.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceKes: "24999.00",
		gscSites: 3,
		ga4Properties: 3,
		isPopular: true,
		isRecommended: true,
		isDefault: true,
		sortOrder: 2,
		highlights: [
			"3 websites managed",
			"75 target keywords",
			"Local SEO + competitor analysis",
		],
		planFeatures: buildPlanFeatures({
			websites: "3",
			targetKeywords: "75",
			contentOptimization: "15 pages / month",
			technicalSeo: "Monthly audit",
			localSeo: true,
			linkBuilding: "Basic outreach",
			competitorAnalysis: true,
			performanceReporting: "Bi-weekly",
			strategyReviews: "Bi-weekly",
		}),
	},
	{
		id: NISC_SEO_REPORTS_PLAN_IDS.pro,
		name: "Pro",
		description:
			"Full-service SEO for up to ten websites — aggressive content, advanced link building, weekly strategy, and priority technical support.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceKes: "59999.00",
		gscSites: 10,
		ga4Properties: 10,
		sortOrder: 3,
		highlights: [
			"10 websites managed",
			"200 target keywords",
			"Weekly strategy + advanced link building",
		],
		planFeatures: buildPlanFeatures({
			websites: "10",
			targetKeywords: "200",
			contentOptimization: "40 pages / month",
			technicalSeo: "Priority fixes",
			localSeo: true,
			linkBuilding: "Advanced outreach",
			competitorAnalysis: true,
			performanceReporting: "Weekly",
			strategyReviews: "Weekly",
		}),
	},
];

const CANONICAL_PLAN_IDS = PLANS.map((plan) => plan.id);

function seoReportsProductMatch() {
	return or(
		eq(niscProduct.id, NISC_SEO_REPORTS_PRODUCT_ID),
		ilike(niscProduct.name, "%seo report%"),
		ilike(niscProduct.name, "%seo reports%"),
		ilike(niscProduct.name, "%search engine optimization%"),
		eq(niscProduct.serviceType, "nisc_seo_reports"),
		eq(niscProduct.serviceType, "seo"),
		eq(niscProduct.serviceType, "seo_reports"),
	);
}

async function deactivateLegacyCatalog() {
	const now = new Date();

	const legacyProducts = await db
		.select({ id: niscProduct.id, name: niscProduct.name })
		.from(niscProduct)
		.where(and(ne(niscProduct.id, PRODUCT.id), seoReportsProductMatch()));

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
		.where(and(seoReportsProductMatch(), notInArray(niscProductPlan.id, CANONICAL_PLAN_IDS)));

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
		gscSites: plan.gscSites,
		ga4Properties: plan.ga4Properties,
		legacyPlanType: "SEO",
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

async function upsertPlanUsage(plan: PlanSeed) {
	const now = new Date();

	for (const [usageKind, limitValue] of [
		[SEO_GSC_SITES_USAGE_KIND, String(plan.gscSites)],
		[SEO_GA4_PROPERTIES_USAGE_KIND, String(plan.ga4Properties)],
	] as const) {
		const existing = await db.query.niscProductPlanUsage.findFirst({
			where: and(
				eq(niscProductPlanUsage.productPlanId, plan.id),
				eq(niscProductPlanUsage.usageKind, usageKind),
			),
		});

		const usageId = existing?.id ?? randomUUID();

		await db
			.insert(niscProductPlanUsage)
			.values({
				id: usageId,
				productId: PRODUCT.id,
				productPlanId: plan.id,
				usageKind,
				limitValue,
				overuse: "HARD",
				period: "MONTHLY",
				createdAt: now,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: niscProductPlanUsage.id,
				set: {
					usageKind,
					limitValue,
					overuse: "HARD",
					period: "MONTHLY",
					updatedAt: now,
				},
			});
	}
}

async function main() {
	console.log("Seeding SEO Reports product…");

	await deactivateLegacyCatalog();

	await upsertProduct();
	console.log(`  ✓ Product ${PRODUCT.id}`);

	for (const plan of PLANS) {
		await upsertPlan(plan);
		await upsertPlanUsage(plan);
		console.log(
			`  ✓ Plan ${plan.id} (${plan.gscSites} GSC / ${plan.ga4Properties} GA4, KSh ${plan.priceKes})`,
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
