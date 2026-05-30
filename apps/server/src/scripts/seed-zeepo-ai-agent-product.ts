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
} from "@npanel/api/lib/zeepo-agent-billing";
import { invalidateProductsCache } from "@npanel/api/lib/products-cache";

const PRODUCT = {
	id: ZEEPO_AI_AGENT_PRODUCT_ID,
	name: "Zeepo AI Agent",
	description:
		"AI assistant for chat, image and video generation, documents, and more. Usage is metered in tokens.",
	category: "AI",
	serviceType: "ZEEPO_AI_AGENT",
	isActive: true,
	sortOrder: 20,
	features: [
		{ key: "chat", label: "AI chat assistant", description: "Multi-turn agent with tools" },
		{ key: "media", label: "Media generation", description: "Images, video, and audio" },
		{ key: "documents", label: "Documents & presentations", description: "Structured outputs" },
		{ key: "web_search", label: "Web search", description: "Included at no token cost" },
		{
			key: "domain_check",
			label: "Domain availability",
			description: "Included at no token cost",
		},
	],
	highlights: [
		"Token-based usage — buy a plan or top up anytime",
		"Web search and domain checks included",
		"Pay-as-you-go or monthly plans",
	],
	isAddOn: false,
	metadata: {
		zeepoProduct: true,
		usageKind: ZEEPO_AGENT_USAGE_KIND,
		billingCurrency: "USD",
		internalUsdPerToken: ZEEPO_INTERNAL_USD_PER_TOKEN,
		freeOperations: ZEEPO_AGENT_FREE_OPERATIONS,
	},
} as const;

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
};

const PLANS: PlanSeed[] = [
	{
		id: ZEEPO_AI_AGENT_PLAN_IDS.starter,
		name: "Starter",
		description: "Monthly plan with 650 tokens — ideal for light use.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceUsd: "9.00",
		tokenGrant: 650,
		zeepoPlanType: "subscription",
		sortOrder: 1,
		usagePeriod: "MONTHLY",
	},
	{
		id: ZEEPO_AI_AGENT_PLAN_IDS.standard,
		name: "Standard",
		description: "Monthly plan with 1,400 tokens — best for regular workflows.",
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
	},
	{
		id: ZEEPO_AI_AGENT_PLAN_IDS.pro,
		name: "Pro",
		description: "Monthly plan with 3,800 tokens — for power users and teams.",
		pricingModel: "FIXED",
		billingCycle: "MONTHLY",
		priceUsd: "49.00",
		tokenGrant: 3800,
		zeepoPlanType: "subscription",
		sortOrder: 3,
		usagePeriod: "MONTHLY",
	},
	{
		id: ZEEPO_AI_AGENT_PLAN_IDS.topUp500,
		name: "Token Top-Up — 500",
		description: "One-time purchase of 500 tokens. Adds to your current balance.",
		pricingModel: "FIXED",
		billingCycle: "CUSTOM",
		priceUsd: "7.00",
		tokenGrant: 500,
		zeepoPlanType: "top_up",
		sortOrder: 10,
		usagePeriod: null,
		accumulateCredits: true,
	},
	{
		id: ZEEPO_AI_AGENT_PLAN_IDS.topUp1500,
		name: "Token Top-Up — 1,500",
		description: "One-time purchase of 1,500 tokens. Adds to your current balance.",
		pricingModel: "FIXED",
		billingCycle: "CUSTOM",
		priceUsd: "18.00",
		tokenGrant: 1500,
		zeepoPlanType: "top_up",
		sortOrder: 11,
		usagePeriod: null,
		accumulateCredits: true,
	},
	{
		id: ZEEPO_AI_AGENT_PLAN_IDS.topUp5000,
		name: "Token Top-Up — 5,000",
		description: "One-time purchase of 5,000 tokens. Adds to your current balance.",
		pricingModel: "FIXED",
		billingCycle: "CUSTOM",
		priceUsd: "55.00",
		tokenGrant: 5000,
		zeepoPlanType: "top_up",
		sortOrder: 12,
		usagePeriod: null,
		accumulateCredits: true,
	},
	{
		id: ZEEPO_AI_AGENT_PLAN_IDS.payAsYouGo,
		name: "Pay As You Go",
		description:
			"No monthly fee. Purchase token top-ups when you need them and pay only for what you use.",
		pricingModel: "FIXED",
		billingCycle: "CUSTOM",
		priceUsd: "0.00",
		tokenGrant: 0,
		zeepoPlanType: "pay_as_you_go",
		sortOrder: 99,
		usagePeriod: null,
		accumulateCredits: true,
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
			planFeatures: [],
			highlights: [`${plan.tokenGrant.toLocaleString()} tokens`],
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
				highlights: [`${plan.tokenGrant.toLocaleString()} tokens`],
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
