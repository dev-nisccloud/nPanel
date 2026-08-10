/**
 * Idempotent seed for Zeepo AI product  PAYG / token top-ups only (no fixed plans).
 *
 * Run from apps/server:
 *   bun run seed:zeepo-ai
 */
import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import {
	niscProduct,
	niscProductPlan,
	niscProductPlanUsage,
} from "@npanel/db/schema/products";
import {
	ZEEPO_AI_INTERNAL_USD_PER_TOKEN,
	ZEEPO_AI_PLAN_IDS,
	ZEEPO_AI_PRODUCT_ID,
	ZEEPO_AI_USAGE_KIND,
	ZEEPO_AI_WELCOME_TOKEN_GRANT,
} from "@npanel/api/lib/zeepo-ai-billing";
import { invalidateProductsCache } from "@npanel/api/lib/products-cache";

const PRODUCT_FEATURES = [
	{
		key: "chat",
		label: "AI chat",
		description: "Streaming conversations with visible reasoning",
	},
	{
		key: "web_research",
		label: "Live web research",
		description: "Optional search and page fetch for current information",
	},
	{
		key: "documents",
		label: "Documents",
		description: "Long-form markdown reports, briefs, and strategies",
	},
	{
		key: "presentations",
		label: "Presentations",
		description: "Structured slide decks you can open in the side panel",
	},
	{
		key: "skills",
		label: "Guided skills",
		description: "Strategy and brand workflows to jump-start work",
	},
	{
		key: "attachments",
		label: "File attachments",
		description: "Upload images and PDFs into the conversation",
	},
] as const;

const PRODUCT = {
	id: ZEEPO_AI_PRODUCT_ID,
	name: "Zeepo AI",
	description:
		"Chat with Zeepo  research, write documents and presentations, and move work forward. Pay as you go: buy tokens when you need them.",
	category: "AI",
	serviceType: "ZEEPO_AI",
	isActive: true,
	sortOrder: 19,
	features: PRODUCT_FEATURES,
	highlights: [
		"Pay as you go  no monthly plan required",
		"Streaming replies with visible reasoning",
		"Documents and presentations in-chat",
		"Optional live web research",
		`${ZEEPO_AI_WELCOME_TOKEN_GRANT} welcome tokens on first activation`,
	],
	isAddOn: false,
	metadata: {
		zeepoProduct: true,
		zeepoAi: true,
		usageKind: ZEEPO_AI_USAGE_KIND,
		billingCurrency: "USD",
		internalUsdPerToken: ZEEPO_AI_INTERNAL_USD_PER_TOKEN,
		welcomeTokenGrant: ZEEPO_AI_WELCOME_TOKEN_GRANT,
		billingMode: "pay_as_you_go",
	},
} as const;

type PlanSeed = {
	id: string;
	name: string;
	description: string;
	priceUsd: string;
	tokenGrant: number;
	zeepoPlanType: "top_up" | "pay_as_you_go";
	sortOrder: number;
	isPopular?: boolean;
	isRecommended?: boolean;
	isDefault?: boolean;
	highlights: string[];
};

const PLANS: PlanSeed[] = [
	{
		id: ZEEPO_AI_PLAN_IDS.topUp500,
		name: "Token Top-Up  500",
		description: "One-time purchase of 500 tokens. Adds to your balance whenever you need a boost.",
		priceUsd: "7.00",
		tokenGrant: 500,
		zeepoPlanType: "top_up",
		sortOrder: 10,
		highlights: ["500 tokens", "Adds to your balance", "No monthly commitment"],
	},
	{
		id: ZEEPO_AI_PLAN_IDS.topUp1500,
		name: "Token Top-Up  1,500",
		description: "One-time purchase of 1,500 tokens for campaigns and heavier work.",
		priceUsd: "18.00",
		tokenGrant: 1500,
		zeepoPlanType: "top_up",
		sortOrder: 11,
		isPopular: true,
		isRecommended: true,
		highlights: ["1,500 tokens", "Adds to your balance", "Best everyday top-up"],
	},
	{
		id: ZEEPO_AI_PLAN_IDS.topUp5000,
		name: "Token Top-Up  5,000",
		description: "One-time purchase of 5,000 tokens for sustained production.",
		priceUsd: "55.00",
		tokenGrant: 5000,
		zeepoPlanType: "top_up",
		sortOrder: 12,
		highlights: ["5,000 tokens", "Adds to your balance", "Best top-up value"],
	},
	{
		id: ZEEPO_AI_PLAN_IDS.payAsYouGo,
		name: "Pay As You Go",
		description:
			"No monthly fee. Activate your wallet, then buy token packs whenever you need more.",
		priceUsd: "0.00",
		tokenGrant: ZEEPO_AI_WELCOME_TOKEN_GRANT,
		zeepoPlanType: "pay_as_you_go",
		sortOrder: 1,
		isDefault: true,
		highlights: [
			"No monthly subscription",
			`${ZEEPO_AI_WELCOME_TOKEN_GRANT} welcome tokens`,
			"Top up on demand",
		],
	},
];

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
			features: [...PRODUCT.features],
			highlights: [...PRODUCT.highlights],
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
				features: [...PRODUCT.features],
				highlights: [...PRODUCT.highlights],
				isAddOn: PRODUCT.isAddOn,
				metadata: PRODUCT.metadata,
				updatedAt: now,
			},
		});
}

async function upsertPlan(plan: PlanSeed) {
	const now = new Date();
	const planFeatures = PRODUCT_FEATURES.map((f) => ({ key: f.key, available: true }));

	await db
		.insert(niscProductPlan)
		.values({
			id: plan.id,
			productId: PRODUCT.id,
			name: plan.name,
			description: plan.description,
			pricingModel: "FIXED",
			billingCycle: "CUSTOM",
			price: plan.priceUsd,
			currency: "USD",
			setupFee: null,
			cost: plan.priceUsd,
			costCurrency: "USD",
			planFeatures,
			highlights: plan.highlights,
			isPopular: plan.isPopular ?? false,
			isRecommended: plan.isRecommended ?? false,
			isActive: true,
			isDefault: plan.isDefault ?? false,
			sortOrder: plan.sortOrder,
			metadata: {
				zeepoPlanType: plan.zeepoPlanType,
				tokenGrant: plan.tokenGrant,
				billingCurrency: "USD",
				usdPrice: plan.priceUsd,
				displayAsTokens: true,
				accumulateCredits: true,
				...(plan.zeepoPlanType === "pay_as_you_go"
					? { requiresTopUp: true, welcomeTokenGrant: ZEEPO_AI_WELCOME_TOKEN_GRANT }
					: {}),
			},
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: niscProductPlan.id,
			set: {
				productId: PRODUCT.id,
				name: plan.name,
				description: plan.description,
				price: plan.priceUsd,
				cost: plan.priceUsd,
				planFeatures,
				highlights: plan.highlights,
				isPopular: plan.isPopular ?? false,
				isRecommended: plan.isRecommended ?? false,
				isActive: true,
				isDefault: plan.isDefault ?? false,
				sortOrder: plan.sortOrder,
				metadata: {
					zeepoPlanType: plan.zeepoPlanType,
					tokenGrant: plan.tokenGrant,
					billingCurrency: "USD",
					usdPrice: plan.priceUsd,
					displayAsTokens: true,
					accumulateCredits: true,
					...(plan.zeepoPlanType === "pay_as_you_go"
						? { requiresTopUp: true, welcomeTokenGrant: ZEEPO_AI_WELCOME_TOKEN_GRANT }
						: {}),
				},
				updatedAt: now,
			},
		});

	const existingUsage = await db.query.niscProductPlanUsage.findFirst({
		where: eq(niscProductPlanUsage.productPlanId, plan.id),
	});

	if (!existingUsage) {
		await db.insert(niscProductPlanUsage).values({
			id: `${plan.id}-usage`,
			productId: PRODUCT.id,
			productPlanId: plan.id,
			usageKind: ZEEPO_AI_USAGE_KIND,
			limitValue: String(plan.tokenGrant),
			overuse: "HARD",
			period: null,
			createdAt: now,
			updatedAt: now,
		});
	} else {
		await db
			.update(niscProductPlanUsage)
			.set({
				productId: PRODUCT.id,
				usageKind: ZEEPO_AI_USAGE_KIND,
				limitValue: String(plan.tokenGrant),
				overuse: "HARD",
				period: null,
				updatedAt: now,
			})
			.where(eq(niscProductPlanUsage.id, existingUsage.id));
	}
}

async function main() {
	console.log("[seed:zeepo-ai] Upserting product…");
	await upsertProduct();
	for (const plan of PLANS) {
		console.log(`[seed:zeepo-ai] Upserting plan ${plan.id}…`);
		await upsertPlan(plan);
	}
	await invalidateProductsCache();
	console.log("[seed:zeepo-ai] Done.");
	process.exit(0);
}

main().catch((err) => {
	console.error("[seed:zeepo-ai] Failed:", err);
	process.exit(1);
});
