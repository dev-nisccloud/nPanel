/**
 * Idempotent seed for Zeepo AI Agent product, plans, and plan usage limits.
 *
 * Run from apps/server (env + DATABASE_URL live here):
 *   bun run seed:zeepo-ai-agent
 */
import { randomUUID } from "node:crypto";
import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import {
	niscProduct,
	niscProductPlan,
	niscProductPlanUsage,
} from "@npanel/db/schema/products";
import {
	ZEEPO_AGENT_USAGE_KIND,
	ZEEPO_AI_AGENT_PLAN_IDS,
	ZEEPO_AI_AGENT_PRODUCT_ID,
	ZEEPO_AGENT_FREE_OPERATIONS,
	ZEEPO_INTERNAL_USD_PER_TOKEN,
	ZEEPO_SIGNUP_WELCOME_TOKEN_GRANT,
} from "@npanel/api/lib/zeepo-agent-billing";
import { invalidateProductsCache } from "@npanel/api/lib/products-cache";

type ProductFeature = {
	key: string;
	label: string;
	description: string;
};

const PRODUCT_FEATURES: ProductFeature[] = [
	{
		key: "chat",
		label: "AI chat assistant",
		description: "Multi-turn agent that researches, plans, and executes tasks in one conversation",
	},
	{
		key: "skills",
		label: "Guided workflows",
		description: "Premade flows for strategy, branding, naming, pricing, and quarterly planning",
	},
	{
		key: "attachments",
		label: "Image uploads & vision",
		description: "Attach images for analysis, reference assets, or logo-aware design work",
	},
	{
		key: "web_search",
		label: "Live web research",
		description: "Real-time grounding for markets, competitors, and facts - no token cost",
	},
	{
		key: "media_image",
		label: "Image generation",
		description: "Photorealistic visuals, social creatives, and design-specialist outputs",
	},
	{
		key: "media_video",
		label: "Video generation",
		description: "Cinematic clips and motion content with optional audio",
	},
	{
		key: "media_audio",
		label: "Voice & audio",
		description: "Text-to-speech and spoken content generation",
	},
	{
		key: "background_remover",
		label: "Background removal",
		description: "Clean cutouts from product shots and portraits",
	},
	{
		key: "image_editing",
		label: "Image editing",
		description: "Instruct, style transfer, erase, background swap, upscale, text edit, and variations",
	},
	{
		key: "design_assets",
		label: "Brand & design assets",
		description: "Logos, business cards, flyers, mockups, and campaign-ready creatives",
	},
	{
		key: "documents",
		label: "Strategy documents",
		description: "Long-form documents deliverables - reports, briefs, and analyses with PDF export",
	},
	{
		key: "presentations",
		label: "Slide decks",
		description: "Structured presentations with charts and themes - export PDF, PPTX, or PNG",
	},
	{
		key: "image_presentations",
		label: "Visual slide decks",
		description: "Photorealistic, full-bleed image-based decks for pitches and storytelling",
	},
	{
		key: "platform_resources",
		label: "Your resources in one chat",
		description:
			"Zeepo connects to your live domains, web hosting, and business email - search availability, register names, view your portfolio, browse plans, and inspect subscriptions without leaving the conversation. Domain availability checks are free.",
	},
];

const PRODUCT = {
	id: ZEEPO_AI_AGENT_PRODUCT_ID,
	name: "Zeepo AI Agent",
	description:
		"Your AI copilot for research, strategy, creative production, and everyday business work. Generate images, video, and voice; build documents and slide decks; manage domains, hosting, and email - all in one chat. Usage is metered in tokens with flexible monthly plans or pay-as-you-go top-ups.",
	category: "AI",
	serviceType: "ZEEPO_AI_AGENT",
	isActive: true,
	sortOrder: 20,
	features: PRODUCT_FEATURES,
	highlights: [
		`${ZEEPO_SIGNUP_WELCOME_TOKEN_GRANT} welcome tokens when you sign up`,
		"Web search and domain availability checks at no token cost",
		"Images, video, audio, documents, presentations, and image editing",
		"Domains, hosting, and email - your resources in one chat window",
		"Monthly plans or one-time token top-ups - pay only for what you use",
	],
	isAddOn: false,
	metadata: {
		zeepoProduct: true,
		usageKind: ZEEPO_AGENT_USAGE_KIND,
		billingCurrency: "USD",
		internalUsdPerToken: ZEEPO_INTERNAL_USD_PER_TOKEN,
		freeOperations: ZEEPO_AGENT_FREE_OPERATIONS,
		welcomeTokenGrant: ZEEPO_SIGNUP_WELCOME_TOKEN_GRANT,
	},
} as const;

function buildPlanFeatures(): Array<{ key: string; available: boolean }> {
	return PRODUCT_FEATURES.map((feature) => ({
		key: feature.key,
		available: true,
	}));
}

const PLAN_FEATURES = buildPlanFeatures();

type PlanSeed = {
	id: string;
	name: string;
	description: string;
	pricingModel: "FIXED";
	billingCycle: "MONTHLY" | "CUSTOM";
	priceUsd: string;
	tokenGrant: number;
	zeepoPlanType: "subscription" | "top_up" | "pay_as_you_go";
	isPopular?: boolean;
	isRecommended?: boolean;
	isDefault?: boolean;
	sortOrder: number;
	usagePeriod?: string | null;
	accumulateCredits?: boolean;
	highlights: string[];
};

const PLANS: PlanSeed[] = [
	{
		id: ZEEPO_AI_AGENT_PLAN_IDS.starter,
		name: "Starter",
		description:
			"650 tokens each month - ideal for light creative work, research, and occasional generations.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceUsd: "9.00",
		tokenGrant: 650,
		zeepoPlanType: "subscription",
		sortOrder: 1,
		usagePeriod: "MONTHLY",
		highlights: [
			"650 tokens per month",
			"Full access to every Zeepo feature",
			"Web search & domain checks included",
		],
	},
	{
		id: ZEEPO_AI_AGENT_PLAN_IDS.standard,
		name: "Standard",
		description:
			"1,400 tokens each month - the sweet spot for regular content, design, and business workflows.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceUsd: "19.00",
		tokenGrant: 1400,
		zeepoPlanType: "subscription",
		isPopular: true,
		isRecommended: true,
		isDefault: true,
		sortOrder: 2,
		usagePeriod: "MONTHLY",
		highlights: [
			"1,400 tokens per month",
			"Full access to every Zeepo feature",
			"Best value for everyday use",
		],
	},
	{
		id: ZEEPO_AI_AGENT_PLAN_IDS.pro,
		name: "Pro",
		description:
			"3,800 tokens each month - for power users, heavy creative output, and growing teams.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceUsd: "49.00",
		tokenGrant: 3800,
		zeepoPlanType: "subscription",
		sortOrder: 3,
		usagePeriod: "MONTHLY",
		highlights: [
			"3,800 tokens per month",
			"Full access to every Zeepo feature",
			"Highest monthly token allowance",
		],
	},
	{
		id: ZEEPO_AI_AGENT_PLAN_IDS.topUp500,
		name: "Token Top-Up - 500",
		description: "One-time purchase of 500 tokens. Adds to your current balance whenever you need a boost.",
		pricingModel: "FIXED",
		billingCycle: "CUSTOM",
		priceUsd: "7.00",
		tokenGrant: 500,
		zeepoPlanType: "top_up",
		sortOrder: 10,
		usagePeriod: null,
		accumulateCredits: true,
		highlights: ["500 tokens", "Adds to your balance", "No monthly commitment"],
	},
	{
		id: ZEEPO_AI_AGENT_PLAN_IDS.topUp1500,
		name: "Token Top-Up - 1,500",
		description: "One-time purchase of 1,500 tokens. Ideal when you need extra runway for a campaign or project.",
		pricingModel: "FIXED",
		billingCycle: "CUSTOM",
		priceUsd: "18.00",
		tokenGrant: 1500,
		zeepoPlanType: "top_up",
		sortOrder: 11,
		usagePeriod: null,
		accumulateCredits: true,
		highlights: ["1,500 tokens", "Adds to your balance", "No monthly commitment"],
	},
	{
		id: ZEEPO_AI_AGENT_PLAN_IDS.topUp5000,
		name: "Token Top-Up - 5,000",
		description: "One-time purchase of 5,000 tokens. For sustained production sprints without upgrading your plan.",
		pricingModel: "FIXED",
		billingCycle: "CUSTOM",
		priceUsd: "55.00",
		tokenGrant: 5000,
		zeepoPlanType: "top_up",
		sortOrder: 12,
		usagePeriod: null,
		accumulateCredits: true,
		highlights: ["5,000 tokens", "Adds to your balance", "Best top-up value"],
	},
	{
		id: ZEEPO_AI_AGENT_PLAN_IDS.payAsYouGo,
		name: "Pay As You Go",
		description:
			"No monthly fee. Start with welcome tokens, then top up whenever you need more - pay only for what you use.",
		pricingModel: "FIXED",
		billingCycle: "CUSTOM",
		priceUsd: "0.00",
		tokenGrant: 0,
		zeepoPlanType: "pay_as_you_go",
		sortOrder: 99,
		usagePeriod: null,
		accumulateCredits: true,
		highlights: [
			"No monthly subscription",
			"Top up tokens on demand",
			"Full access to every Zeepo feature",
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
			price: plan.priceUsd,
			currency: "USD",
			setupFee: null,
			cost: plan.priceUsd,
			costCurrency: "USD",
			planFeatures: PLAN_FEATURES,
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
				freeOperations: ZEEPO_AGENT_FREE_OPERATIONS,
				...(plan.accumulateCredits ? { accumulateCredits: true } : {}),
				...(plan.zeepoPlanType === "pay_as_you_go"
					? { requiresTopUp: true, minimumTopUpUsd: "5.00" }
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
				pricingModel: plan.pricingModel,
				billingCycle: plan.billingCycle,
				price: plan.priceUsd,
				currency: "USD",
				cost: plan.priceUsd,
				costCurrency: "USD",
				planFeatures: PLAN_FEATURES,
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
					freeOperations: ZEEPO_AGENT_FREE_OPERATIONS,
					...(plan.accumulateCredits ? { accumulateCredits: true } : {}),
					...(plan.zeepoPlanType === "pay_as_you_go"
						? { requiresTopUp: true, minimumTopUpUsd: "5.00" }
						: {}),
				},
				updatedAt: now,
			},
		});
}

async function upsertPlanUsage(plan: PlanSeed) {
	const existing = await db.query.niscProductPlanUsage.findFirst({
		where: eq(niscProductPlanUsage.productPlanId, plan.id),
	});

	const usageId = existing?.id ?? randomUUID();
	const now = new Date();

	await db
		.insert(niscProductPlanUsage)
		.values({
			id: usageId,
			productId: PRODUCT.id,
			productPlanId: plan.id,
			usageKind: ZEEPO_AGENT_USAGE_KIND,
			limitValue: String(plan.tokenGrant),
			overuse: "HARD",
			period: plan.usagePeriod ?? null,
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: niscProductPlanUsage.id,
			set: {
				usageKind: ZEEPO_AGENT_USAGE_KIND,
				limitValue: String(plan.tokenGrant),
				overuse: "HARD",
				period: plan.usagePeriod ?? null,
				updatedAt: now,
			},
		});
}

async function main() {
	console.log("Seeding Zeepo AI Agent product…");

	await upsertProduct();
	console.log(`  ✓ Product ${PRODUCT.id}`);

	for (const plan of PLANS) {
		await upsertPlan(plan);
		await upsertPlanUsage(plan);
		console.log(
			`  ✓ Plan ${plan.id} (${plan.zeepoPlanType}, ${plan.tokenGrant} tokens, $${plan.priceUsd} USD)`,
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
