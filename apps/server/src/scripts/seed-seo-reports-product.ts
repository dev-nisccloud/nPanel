/**
 * Idempotent seed for the SEO & AI Search Optimisation product, plans, and plan usage limits.
 *
 * Run from apps/server (env + DATABASE_URL live here):
 *   bun run seed:seo-reports
 */
import { randomUUID } from "node:crypto";
import { and, eq, ilike, inArray, ne, notInArray, or } from "@npanel/db";
import { db } from "@npanel/db";
import {
	niscProduct,
	niscProductPlan,
	niscProductPlanUsage,
} from "@npanel/db/schema/products";
import {
	NISC_SEO_REPORTS_LEGACY_PLAN_IDS,
	NISC_SEO_REPORTS_PLAN_IDS,
	NISC_SEO_REPORTS_PRODUCT_ID,
	SEO_GA4_PROPERTIES_USAGE_KIND,
	SEO_GSC_SITES_USAGE_KIND,
} from "@npanel/api/lib/seo-reports-billing";
import { invalidateProductsCache } from "@npanel/api/lib/products-cache";
import { AGENCY_ONLY_PLAN_METADATA_KEY } from "@npanel/api/lib/enterprise-plans";

type ProductFeature = {
	key: string;
	label: string;
	description: string;
};

/** Pricing-table rows. The website renders these in order, so keep the scope wording customer-facing. */
const PRODUCT_FEATURES = [
	{
		key: "npanel_dashboard",
		label: "Search dashboard in nPanel",
		description: "Your search positions, clicks, queries, top pages and traffic from Google Search Console and GA4",
	},
	{ key: "websites", label: "Websites", description: "Websites included in the monthly work" },
	{
		key: "starting_assessment",
		label: "Starting assessment",
		description: "The baseline we set before the first month of work",
	},
	{
		key: "search_queries",
		label: "Priority search queries tracked",
		description: "Searches we track and work to improve, chosen with you",
	},
	{
		key: "page_improvements",
		label: "Existing pages improved",
		description: "Defined updates to pages you already have, such as clearer answers, headings and internal links",
	},
	{
		key: "new_content",
		label: "New researched articles or service pages",
		description: "New pages written for searches you want to win. Separate from page improvements",
	},
	{
		key: "technical_hours",
		label: "Technical implementation",
		description: "Agreed fixes and changes to your existing site. Not redesigns or rebuilds",
	},
	{
		key: "ai_foundations",
		label: "AI search foundations",
		description: "Work that helps search engines and AI tools read and quote your site",
	},
	{ key: "competitors", label: "Competitors", description: "Who outranks you, and where the gaps are" },
	{
		key: "business_profile",
		label: "Business information and Google Business Profile",
		description: "Accurate business details across search and maps",
	},
	{
		key: "outreach",
		label: "Outreach",
		description: "Researched approaches to relevant sites. Links are earned, never guaranteed",
	},
	{
		key: "ai_visibility",
		label: "AI visibility checks",
		description: "Sampled checks of how AI tools answer a fixed set of buyer questions",
	},
	{ key: "reporting", label: "Reporting", description: "What we did, what changed and what comes next" },
	{ key: "review_call", label: "Review call", description: "Time with your SEO lead to agree priorities" },
] as const satisfies readonly ProductFeature[];

const PRODUCT = {
	id: NISC_SEO_REPORTS_PRODUCT_ID,
	name: "SEO & AI Search Optimisation",
	description:
		"Done-for-you search work from Nisc Cloud across Google Search, Maps and AI answers. Search positions, clicks, top pages, queries, traffic and reports show in nPanel automatically.",
	category: "MARKETING",
	serviceType: "nisc_seo_reports",
	isActive: true,
	sortOrder: 23,
	features: PRODUCT_FEATURES,
	highlights: [
		"Search positions, clicks, top pages, queries and traffic in nPanel",
		"Page improvements and technical fixes every month",
		"AI search foundations for answer engines",
		"Monthly report with next priorities",
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
	/** Hidden from the website and cart; agency staff set the agreed price on the order. */
	agencyOnly?: boolean;
	sortOrder: number;
	highlights: string[];
	planFeatures: PlanFeatureEntry[];
};

type FeatureKey = (typeof PRODUCT_FEATURES)[number]["key"];

function buildPlanFeatures(values: Record<FeatureKey, string | false>): PlanFeatureEntry[] {
	return PRODUCT_FEATURES.map(({ key }) => {
		const value = values[key];
		return value === false ? { key, available: false } : { key, available: true, valueOverride: value };
	});
}

const AGREED = "Agreed with you";

const PLANS: PlanSeed[] = [
	{
		id: NISC_SEO_REPORTS_PLAN_IDS.essentials,
		name: "Search Essentials",
		description: "One business website establishing search visibility.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceKes: "25000.00",
		gscSites: 1,
		ga4Properties: 1,
		sortOrder: 1,
		highlights: [
			"Up to 25 priority search queries tracked",
			"Up to 3 existing pages improved each month",
			"Up to 2 hours of technical implementation each month",
			"AI search foundations",
			"Monthly report with next priorities",
		],
		planFeatures: buildPlanFeatures({
			npanel_dashboard: "Included",
			websites: "1",
			starting_assessment: "Technical, content and search baseline",
			search_queries: "Up to 25",
			page_improvements: "Up to 3 a month",
			new_content: "Quoted separately",
			technical_hours: "Up to 2 hours a month",
			ai_foundations: "Crawl-access review, clear answer content, relevant structured data, accurate business information",
			competitors: "Initial benchmark",
			business_profile: "Consistency check",
			outreach: false,
			ai_visibility: "Baseline, then quarterly sample checks",
			reporting: "Monthly report: work, observations, next priorities",
			review_call: false,
		}),
	},
	{
		id: NISC_SEO_REPORTS_PLAN_IDS.growth,
		name: "Search Growth",
		description: "One business website competing for more enquiries and sales.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceKes: "65000.00",
		gscSites: 1,
		ga4Properties: 1,
		isPopular: true,
		isRecommended: true,
		isDefault: true,
		sortOrder: 2,
		highlights: [
			"Up to 75 priority search queries tracked",
			"Up to 6 page improvements and 2 new pages each month",
			"Up to 4 hours of technical implementation each month",
			"1 Google Business Profile or location",
			"Monthly AI visibility checks and a 30-minute review",
		],
		planFeatures: buildPlanFeatures({
			npanel_dashboard: "Included",
			websites: "1",
			starting_assessment: "Deeper technical and content assessment",
			search_queries: "Up to 75",
			page_improvements: "Up to 6 a month",
			new_content: "2 a month",
			technical_hours: "Up to 4 hours a month",
			ai_foundations: "Foundations plus deeper topic and comparison content",
			competitors: "Quarterly review of up to 3",
			business_profile: "1 eligible profile or location",
			outreach: "Up to 5 researched approaches a month",
			ai_visibility: "Monthly, using a fixed set of buyer questions",
			reporting: "Monthly performance report",
			review_call: "One 30-minute review a month",
		}),
	},
	{
		id: NISC_SEO_REPORTS_PLAN_IDS.enterprise,
		name: "Enterprise",
		description:
			"Ecommerce, large websites, high keyword volumes, several brands, locations, languages or markets. Priced per client.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceKes: "0.00",
		gscSites: 10,
		ga4Properties: 10,
		agencyOnly: true,
		sortOrder: 3,
		highlights: [
			"Several websites, brands or locations",
			"Technical capacity agreed with you",
			"Content production with your approval workflow",
			"International and multi-market strategy",
			"Custom reporting and an assigned account lead",
		],
		planFeatures: buildPlanFeatures({
			npanel_dashboard: "Included",
			websites: "Several sites and locations",
			starting_assessment: AGREED,
			search_queries: AGREED,
			page_improvements: AGREED,
			new_content: "Content production and approval workflow",
			technical_hours: "Custom capacity",
			ai_foundations: AGREED,
			competitors: AGREED,
			business_profile: "Several locations",
			outreach: "Agreed authority-building programme",
			ai_visibility: AGREED,
			reporting: "Custom reporting and integrations",
			review_call: "Agreed cadence with an account lead",
		}),
	},
];

const LEGACY_PLAN_IDS = Object.values(NISC_SEO_REPORTS_LEGACY_PLAN_IDS);
const CANONICAL_PLAN_IDS = [...PLANS.map((plan) => plan.id), ...LEGACY_PLAN_IDS];

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
		...(plan.agencyOnly ? { [AGENCY_ONLY_PLAN_METADATA_KEY]: true } : {}),
	};
	const hidden = plan.agencyOnly ?? false;

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
			hidden,
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
				hidden,
				isDefault: plan.isDefault ?? false,
				sortOrder: plan.sortOrder,
				metadata: planMetadata,
				updatedAt: now,
			},
		});
}

/** Hide retired plans from sale without touching their price, so renewals continue unchanged. */
async function retireLegacyPlans() {
	const now = new Date();
	const updated = await db
		.update(niscProductPlan)
		.set({ hidden: true, isPopular: false, isRecommended: false, isDefault: false, updatedAt: now })
		.where(inArray(niscProductPlan.id, LEGACY_PLAN_IDS))
		.returning({ id: niscProductPlan.id });
	for (const { id } of updated) console.log(`  ⊘ Hid retired plan ${id} (still renews)`);
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

	await retireLegacyPlans();

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
