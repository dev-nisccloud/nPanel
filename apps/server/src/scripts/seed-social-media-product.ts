/**
 * Idempotent seed for the Social Media Management product and plans.
 *
 * Run from apps/server (env + DATABASE_URL live here):
 *   bun run seed:social-media
 */
import { db } from "@npanel/db";
import { niscProduct, niscProductPlan } from "@npanel/db/schema/products";
import {
	NISC_SOCIAL_MEDIA_PLAN_IDS,
	NISC_SOCIAL_MEDIA_PRODUCT_ID,
	NISC_SOCIAL_MEDIA_SERVICE_TYPE,
} from "@npanel/api/lib/social-media-billing";
import { AGENCY_ONLY_PLAN_METADATA_KEY } from "@npanel/api/lib/enterprise-plans";
import { invalidateProductsCache } from "@npanel/api/lib/products-cache";

type ProductFeature = {
	key: string;
	label: string;
	description: string;
};

/** Pricing-table rows. The website renders these in order. */
const PRODUCT_FEATURES = [
	{ key: "platforms", label: "Platforms", description: "Social channels we plan and publish on" },
	{ key: "posts", label: "Branded posts", description: "Designed posts published each month" },
	{ key: "videos", label: "Short-form videos", description: "Reels, TikToks and other short videos each month" },
	{ key: "content_calendar", label: "Content calendar", description: "A forward plan shared for review before posts go out" },
	{ key: "community", label: "Community management", description: "Comments and messages triaged within agreed coverage" },
	{ key: "reach_strategy", label: "Hashtag and reach strategy", description: "Topics, hashtags and posting times tested against your data" },
	{ key: "account_lead", label: "Social media manager", description: "One person who owns your calendar, feedback and reporting" },
	{ key: "influencers", label: "Influencer campaigns", description: "Creator collaborations planned and managed with you" },
	{ key: "paid_boosting", label: "Paid social boosting strategy", description: "Boosting plans for your best posts. Ad spend is billed separately" },
	{ key: "reporting", label: "Reporting", description: "Reach, engagement and what we will change next" },
] as const satisfies readonly ProductFeature[];

type FeatureKey = (typeof PRODUCT_FEATURES)[number]["key"];

type PlanFeatureEntry = {
	key: string;
	available: boolean;
	valueOverride?: string;
};

type PlanSeed = {
	id: string;
	name: string;
	description: string;
	priceKes: string;
	isPopular?: boolean;
	isRecommended?: boolean;
	isDefault?: boolean;
	/** Hidden from the website and cart; agency staff set the agreed price on the order. */
	agencyOnly?: boolean;
	sortOrder: number;
	highlights: string[];
	planFeatures: PlanFeatureEntry[];
};

function buildPlanFeatures(values: Record<FeatureKey, string | false>): PlanFeatureEntry[] {
	return PRODUCT_FEATURES.map(({ key }) => {
		const value = values[key];
		return value === false ? { key, available: false } : { key, available: true, valueOverride: value };
	});
}

const AGREED = "Agreed with you";

const PRODUCT = {
	id: NISC_SOCIAL_MEDIA_PRODUCT_ID,
	name: "Social Media Management",
	description:
		"Planned, designed and published social content from Nisc Cloud, with community management and monthly reporting on the channels in your plan.",
	category: "MARKETING",
	serviceType: NISC_SOCIAL_MEDIA_SERVICE_TYPE,
	isActive: true,
	sortOrder: 24,
	features: PRODUCT_FEATURES,
	highlights: [
		"Content calendar shared for review before anything posts",
		"Branded posts and short-form video on the channels in your plan",
		"Community management within agreed coverage",
		"Monthly reporting on what worked and what changes next",
	],
	isAddOn: false,
	metadata: { billingCurrency: "KES" },
} as const;

const PLANS: PlanSeed[] = [
	{
		id: NISC_SOCIAL_MEDIA_PLAN_IDS.pulse,
		name: "Social Pulse",
		description: "A steady, on-brand presence on Facebook and Instagram.",
		priceKes: "25000.00",
		sortOrder: 1,
		highlights: [
			"Facebook and Instagram management",
			"12 branded posts a month",
			"Monthly content calendar",
			"Community management",
			"Hashtag and reach strategy",
			"Monthly analytics report",
		],
		planFeatures: buildPlanFeatures({
			platforms: "Facebook and Instagram",
			posts: "12 a month",
			videos: false,
			content_calendar: "Monthly",
			community: "Included",
			reach_strategy: "Included",
			account_lead: false,
			influencers: false,
			paid_boosting: false,
			reporting: "Monthly analytics report",
		}),
	},
	{
		id: NISC_SOCIAL_MEDIA_PLAN_IDS.momentum,
		name: "Social Momentum",
		description: "Every major platform, video every week and a dedicated manager.",
		priceKes: "75000.00",
		isPopular: true,
		isRecommended: true,
		isDefault: true,
		sortOrder: 2,
		highlights: [
			"All major platforms, including TikTok",
			"Posts per your content calendar, plus 8 videos a month",
			"Dedicated social media manager",
			"Influencer campaign management",
			"Paid social boosting strategy",
			"Weekly reporting and strategy calls",
		],
		planFeatures: buildPlanFeatures({
			platforms: "All major platforms, including TikTok",
			posts: "Per your content calendar",
			videos: "8 a month",
			content_calendar: "Included",
			community: "Included",
			reach_strategy: "Included",
			account_lead: "Dedicated",
			influencers: "Included",
			paid_boosting: "Included",
			reporting: "Weekly reporting and strategy calls",
		}),
	},
	{
		id: NISC_SOCIAL_MEDIA_PLAN_IDS.enterprise,
		name: "Enterprise",
		description: "Several brands, locations or markets, with channels, volume and coverage agreed per client.",
		priceKes: "0.00",
		agencyOnly: true,
		sortOrder: 3,
		highlights: [
			"Several brands, locations or markets",
			"Channels, content volume and coverage agreed with you",
			"WhatsApp Business scoped on request",
			"Approval workflow built around your team",
			"Custom reporting and an assigned account lead",
		],
		planFeatures: buildPlanFeatures({
			platforms: AGREED,
			posts: AGREED,
			videos: AGREED,
			content_calendar: "Included",
			community: AGREED,
			reach_strategy: "Included",
			account_lead: "Assigned account lead",
			influencers: AGREED,
			paid_boosting: AGREED,
			reporting: "Custom reporting",
		}),
	},
];

async function upsertProduct() {
	const now = new Date();
	const values = {
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
	};
	await db
		.insert(niscProduct)
		.values({ id: PRODUCT.id, ...values, createdAt: now, updatedAt: now })
		.onConflictDoUpdate({ target: niscProduct.id, set: { ...values, updatedAt: now } });
}

async function upsertPlan(plan: PlanSeed) {
	const now = new Date();
	const values = {
		productId: PRODUCT.id,
		name: plan.name,
		description: plan.description,
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		price: plan.priceKes,
		currency: "KES",
		cost: plan.priceKes,
		costCurrency: "KES",
		planFeatures: plan.planFeatures,
		highlights: plan.highlights,
		isPopular: plan.isPopular ?? false,
		isRecommended: plan.isRecommended ?? false,
		isActive: true,
		hidden: plan.agencyOnly ?? false,
		isDefault: plan.isDefault ?? false,
		sortOrder: plan.sortOrder,
		metadata: {
			billingCurrency: "KES",
			...(plan.agencyOnly ? { [AGENCY_ONLY_PLAN_METADATA_KEY]: true } : {}),
		},
	};
	await db
		.insert(niscProductPlan)
		.values({ id: plan.id, ...values, setupFee: null, createdAt: now, updatedAt: now })
		.onConflictDoUpdate({ target: niscProductPlan.id, set: { ...values, updatedAt: now } });
}

async function main() {
	console.log("Seeding Social Media Management product…");

	await upsertProduct();
	console.log(`  ✓ Product ${PRODUCT.id}`);

	for (const plan of PLANS) {
		await upsertPlan(plan);
		console.log(`  ✓ Plan ${plan.id} (${plan.agencyOnly ? "agency-only" : `KSh ${plan.priceKes}`})`);
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
