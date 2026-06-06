/**
 * Idempotent seed for Creatives & Design product, plans, and plan usage limits.
 *
 * Run from apps/server (env + DATABASE_URL live here):
 *   bun run seed:creatives-design
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
	CREATIVES_DESIGN_ASSETS_MONTHLY_USAGE_KIND,
	CREATIVES_DESIGN_PLAN_IDS,
	CREATIVES_DESIGN_PRODUCT_ID,
} from "@npanel/api/lib/creatives-design-billing";
import { invalidateProductsCache } from "@npanel/api/lib/products-cache";

type ProductFeature = {
	key: string;
	label: string;
	description: string;
};

/** Pricing-table rows - order defines column order in getCreativesDesignPlansForPricing. */
const PRODUCT_FEATURES: ProductFeature[] = [
	{
		key: "monthly_assets",
		label: "Creative deliverables per month",
		description: "Finished designs produced by the Nisc Cloud team each month",
	},
	{
		key: "revision_rounds",
		label: "Revision rounds",
		description: "How many rounds of feedback and refinement each asset includes",
	},
	{
		key: "turnaround",
		label: "Standard turnaround",
		description: "Typical production time from brief approval to first draft",
	},
	{
		key: "asset_library",
		label: "Creative asset library",
		description: "All deliverables stored, previewed, and downloaded in one place",
	},
	{
		key: "version_control",
		label: "Version history",
		description: "Every revision tracked - never lose an earlier draft",
	},
	{
		key: "client_approval",
		label: "Online approval",
		description: "Review designs and approve or request changes in your portal",
	},
	{
		key: "comments_feedback",
		label: "Comments & feedback",
		description: "Pin feedback to any version and track it to completion",
	},
	{
		key: "creative_briefs",
		label: "Creative briefs",
		description: "Submit structured briefs with goals, references, and deadlines",
	},
	{
		key: "ai_creative_review",
		label: "AI creative review",
		description: "Every visual scored for quality, clarity, and channel fit before you see it",
	},
	{
		key: "team_access",
		label: "Team access",
		description: "Invite teammates to review, comment, and approve creatives",
	},
	{
		key: "social_creatives",
		label: "Social media designs",
		description: "Feed, story, and platform-sized posts ready to publish",
	},
	{
		key: "ad_creatives",
		label: "Paid ad creatives",
		description: "Meta, Google, LinkedIn, and display ad formats",
	},
	{
		key: "print_design",
		label: "Print design",
		description: "Flyers, posters, brochures, and print-ready PDFs",
	},
	{
		key: "brand_identity",
		label: "Brand identity",
		description: "Logos, business cards, letterheads, and brand assets",
	},
	{
		key: "video_graphics",
		label: "Video & motion graphics",
		description: "Thumbnails, cover art, and short motion pieces",
	},
	{
		key: "creative_direction",
		label: "Creative direction",
		description: "Concept and art direction from Nisc Cloud before production starts",
	},
	{
		key: "priority_support",
		label: "Priority production queue",
		description: "Your jobs jump ahead of standard turnaround clients",
	},
	{
		key: "dedicated_contact",
		label: "Dedicated account contact",
		description: "One point of contact at Nisc Cloud for briefs and campaigns",
	},
];

const PRODUCT = {
	id: CREATIVES_DESIGN_PRODUCT_ID,
	name: "Creatives & Design",
	description:
		"Professional creative production from Nisc Cloud - social posts, ad creatives, print, and brand assets delivered through your own review portal. Submit briefs, approve online, and keep every version in one library with AI quality scoring built in.",
	category: "MARKETING",
	serviceType: "creatives_design",
	isActive: true,
	sortOrder: 22,
	features: PRODUCT_FEATURES,
	highlights: [
		"Done-for-you designs from the Nisc Cloud creative team",
		"Review, comment, and approve every version in your portal",
		"Social, ad, print, and brand identity formats",
		"AI creative review on every visual before delivery",
		"Unlimited team access on every plan",
	],
	isAddOn: false,
	metadata: {
		creativesDesignProduct: true,
		billingCurrency: "KES",
		legacyPlanType: "VISUAL_CREATIVE",
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
	monthlyAssets: number;
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
	monthlyAssets: string;
	revisionRounds: string;
	turnaround: string;
	socialCreatives: boolean;
	adCreatives: boolean;
	printDesign: boolean;
	brandIdentity: boolean;
	videoGraphics: boolean;
	creativeDirection: boolean;
	prioritySupport: boolean;
	dedicatedContact: boolean;
}): PlanFeatureEntry[] {
	return [
		feature("monthly_assets", true, config.monthlyAssets),
		feature("revision_rounds", true, config.revisionRounds),
		feature("turnaround", true, config.turnaround),
		feature("asset_library", true),
		feature("version_control", true),
		feature("client_approval", true),
		feature("comments_feedback", true),
		feature("creative_briefs", true),
		feature("ai_creative_review", true),
		feature("team_access", true, "Unlimited"),
		feature("social_creatives", config.socialCreatives),
		feature("ad_creatives", config.adCreatives),
		feature("print_design", config.printDesign),
		feature("brand_identity", config.brandIdentity),
		feature("video_graphics", config.videoGraphics),
		feature("creative_direction", config.creativeDirection),
		feature("priority_support", config.prioritySupport),
		feature("dedicated_contact", config.dedicatedContact),
	];
}

const PLANS: PlanSeed[] = [
	{
		id: CREATIVES_DESIGN_PLAN_IDS.starter,
		name: "Starter",
		description:
			"5 social creatives per month - ideal for small businesses building a consistent online presence.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceKes: "5999.00",
		monthlyAssets: 5,
		sortOrder: 1,
		highlights: [
			"5 creative deliverables per month",
			"Social media designs",
			"Online review portal with AI scoring",
		],
		planFeatures: buildPlanFeatures({
			monthlyAssets: "5",
			revisionRounds: "2 rounds",
			turnaround: "5 business days",
			socialCreatives: true,
			adCreatives: false,
			printDesign: false,
			brandIdentity: false,
			videoGraphics: false,
			creativeDirection: false,
			prioritySupport: false,
			dedicatedContact: false,
		}),
	},
	{
		id: CREATIVES_DESIGN_PLAN_IDS.growth,
		name: "Growth",
		description:
			"15 deliverables per month with ad creatives, creative direction, and faster turnaround - built for active campaigns.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceKes: "14999.00",
		monthlyAssets: 15,
		isPopular: true,
		isRecommended: true,
		isDefault: true,
		sortOrder: 2,
		highlights: [
			"15 creative deliverables per month",
			"Social + paid ad formats",
			"Creative direction included",
		],
		planFeatures: buildPlanFeatures({
			monthlyAssets: "15",
			revisionRounds: "Unlimited minor",
			turnaround: "3 business days",
			socialCreatives: true,
			adCreatives: true,
			printDesign: false,
			brandIdentity: false,
			videoGraphics: false,
			creativeDirection: true,
			prioritySupport: false,
			dedicatedContact: false,
		}),
	},
	{
		id: CREATIVES_DESIGN_PLAN_IDS.pro,
		name: "Pro",
		description:
			"40 deliverables per month across social, ads, print, brand, and video - with priority production and a dedicated contact.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceKes: "34999.00",
		monthlyAssets: 40,
		sortOrder: 3,
		highlights: [
			"40 creative deliverables per month",
			"Full format suite including print & video",
			"48-hour turnaround and priority queue",
		],
		planFeatures: buildPlanFeatures({
			monthlyAssets: "40",
			revisionRounds: "Unlimited",
			turnaround: "48 hours",
			socialCreatives: true,
			adCreatives: true,
			printDesign: true,
			brandIdentity: true,
			videoGraphics: true,
			creativeDirection: true,
			prioritySupport: true,
			dedicatedContact: true,
		}),
	},
];

const CANONICAL_PLAN_IDS = PLANS.map((plan) => plan.id);

function creativesDesignProductMatch() {
	return or(
		ilike(niscProduct.name, "%creatives & design%"),
		ilike(niscProduct.name, "%creatives design%"),
		ilike(niscProduct.name, "%creative design%"),
		ilike(niscProduct.name, "%creatives_design%"),
		ilike(niscProduct.name, "%creative assets%"),
		ilike(niscProduct.name, "%visual creative%"),
		eq(niscProduct.serviceType, "creatives_design"),
		eq(niscProduct.serviceType, "visual_creative"),
		eq(niscProduct.serviceType, "creative_assets"),
	);
}

async function deactivateLegacyCatalog() {
	const now = new Date();

	const legacyProducts = await db
		.select({ id: niscProduct.id, name: niscProduct.name })
		.from(niscProduct)
		.where(and(ne(niscProduct.id, PRODUCT.id), creativesDesignProductMatch()));

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
			and(creativesDesignProductMatch(), notInArray(niscProductPlan.id, CANONICAL_PLAN_IDS)),
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
		monthlyAssets: plan.monthlyAssets,
		legacyPlanType: "VISUAL_CREATIVE",
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
	const existing = await db.query.niscProductPlanUsage.findFirst({
		where: and(
			eq(niscProductPlanUsage.productPlanId, plan.id),
			eq(niscProductPlanUsage.usageKind, CREATIVES_DESIGN_ASSETS_MONTHLY_USAGE_KIND),
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
			usageKind: CREATIVES_DESIGN_ASSETS_MONTHLY_USAGE_KIND,
			limitValue: String(plan.monthlyAssets),
			overuse: "HARD",
			period: "MONTHLY",
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: niscProductPlanUsage.id,
			set: {
				usageKind: CREATIVES_DESIGN_ASSETS_MONTHLY_USAGE_KIND,
				limitValue: String(plan.monthlyAssets),
				overuse: "HARD",
				period: "MONTHLY",
				updatedAt: now,
			},
		});
}

async function main() {
	console.log("Seeding Creatives & Design product…");

	await deactivateLegacyCatalog();

	await upsertProduct();
	console.log(`  ✓ Product ${PRODUCT.id}`);

	for (const plan of PLANS) {
		await upsertPlan(plan);
		await upsertPlanUsage(plan);
		console.log(
			`  ✓ Plan ${plan.id} (${plan.monthlyAssets} assets/mo, KSh ${plan.priceKes})`,
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
