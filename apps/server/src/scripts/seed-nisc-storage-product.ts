/**
 * Idempotent seed for Nisc Storage product and plans.
 *
 * Run from apps/server:
 *   bun run seed:nisc-storage
 *
 * Prices are left unset. Set them in the product catalog before selling a plan.
 */
import { and, eq, ne, notInArray } from "@npanel/db";
import { db } from "@npanel/db";
import { niscProduct, niscProductPlan } from "@npanel/db/schema/products";
import { invalidateProductsCache } from "@npanel/api/lib/products-cache";
import {
	NISC_STORAGE_PLAN_SEEDS,
	NISC_STORAGE_PRODUCT_ID,
} from "@npanel/api/lib/nisc-storage-plans";

const PRODUCT_FEATURES = [
	{ key: "quota", label: "Storage quota", description: "Private space measured in decimal gigabytes" },
	{ key: "max_file", label: "File size", description: "Largest single file the plan accepts" },
	{ key: "private", label: "Private bucket", description: "Only the team, and the folders its owner grants, can read files" },
	{ key: "encryption", label: "Encryption", description: "AES-256 on every object" },
	{ key: "folders", label: "Folders", description: "Create folders, move files, and delete files" },
];

const PRODUCT = {
	id: NISC_STORAGE_PRODUCT_ID,
	name: "Object storage",
	description:
		"Private S3-compatible storage for a team. Each plan has a total quota and a maximum size for one file.",
	category: "CLOUD",
	serviceType: "object_storage",
	isActive: true,
	sortOrder: 18,
	features: PRODUCT_FEATURES,
	highlights: [
		"One private bucket for the team",
		"AES-256 encryption",
		"Folder access chosen by the team owner",
		"Plans from 50 GB to 1 TB",
	],
	isAddOn: false,
	metadata: { niscStorageProduct: true, billingCurrency: "KES", pricingStatus: "UNPRICED" },
} as const;

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
				isActive: true,
				sortOrder: PRODUCT.sortOrder,
				features: PRODUCT.features,
				highlights: PRODUCT.highlights,
				isAddOn: false,
				metadata: PRODUCT.metadata,
				updatedAt: now,
			},
		});
}

async function upsertPlan(plan: (typeof NISC_STORAGE_PLAN_SEEDS)[number]) {
	const now = new Date();
	const metadata = {
		niscStoragePlan: true,
		quotaBytes: plan.quotaBytes,
		maxObjectBytes: plan.maxObjectBytes,
		billingCurrency: "KES",
		pricingStatus: "UNPRICED",
	};
	const planFeatures = [
		{ key: "quota", available: true, valueOverride: plan.quotaLabel },
		{ key: "max_file", available: true, valueOverride: plan.fileLabel },
		{ key: "private", available: true },
		{ key: "encryption", available: true, valueOverride: "AES-256" },
		{ key: "folders", available: true },
	];
	await db
		.insert(niscProductPlan)
		.values({
			id: plan.id,
			productId: PRODUCT.id,
			name: plan.name,
			description: plan.description,
			pricingModel: "FIXED",
			billingCycle: "MONTHLY",
			price: null,
			currency: "KES",
			setupFee: null,
			cost: null,
			costCurrency: "KES",
			planFeatures,
			highlights: [`${plan.quotaLabel} total`, `${plan.fileLabel} per file`, "Private bucket"],
			isPopular: plan.isPopular ?? false,
			isRecommended: plan.isRecommended ?? false,
			isActive: true,
			isDefault: false,
			sortOrder: plan.sortOrder,
			metadata,
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: niscProductPlan.id,
			set: {
				productId: PRODUCT.id,
				name: plan.name,
				description: plan.description,
				pricingModel: "FIXED",
				billingCycle: "MONTHLY",
				currency: "KES",
				planFeatures,
				highlights: [`${plan.quotaLabel} total`, `${plan.fileLabel} per file`, "Private bucket"],
				isPopular: plan.isPopular ?? false,
				isRecommended: plan.isRecommended ?? false,
				isActive: true,
				isDefault: false,
				sortOrder: plan.sortOrder,
				metadata,
				updatedAt: now,
			},
		});
}

async function main() {
	console.log("Seeding Nisc Storage product…");
	await upsertProduct();
	console.log(`  ✓ Product ${PRODUCT.id}`);

	for (const plan of NISC_STORAGE_PLAN_SEEDS) {
		await upsertPlan(plan);
		console.log(`  ✓ Plan ${plan.name} (${plan.id})`);
	}

	const canonical = NISC_STORAGE_PLAN_SEEDS.map((plan) => plan.id);
	const stale = await db
		.select({ id: niscProductPlan.id, name: niscProductPlan.name })
		.from(niscProductPlan)
		.where(
			and(eq(niscProductPlan.productId, NISC_STORAGE_PRODUCT_ID), notInArray(niscProductPlan.id, canonical)),
		);
	for (const plan of stale) {
		await db
			.update(niscProductPlan)
			.set({ isActive: false, isDefault: false, updatedAt: new Date() })
			.where(and(eq(niscProductPlan.id, plan.id), ne(niscProductPlan.isActive, false)));
		console.log(`  ⊘ Deactivated extra plan ${plan.id} (${plan.name})`);
	}

	await invalidateProductsCache();
	console.log("\nDone. Product cache invalidated. Plan prices are unset.");
}

main()
	.catch((error) => {
		console.error("Seed failed:", error);
		process.exit(1);
	})
	.finally(() => {
		process.exit(0);
	});
