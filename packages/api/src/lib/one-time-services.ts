import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import { niscProduct } from "@npanel/db/schema/products";

/** Catch-all catalog product for custom, non-renewable agency services. */
export const NISC_ONE_TIME_SERVICES_PRODUCT_ID = "nisc-one-time-services";
export const ONE_TIME_SERVICE_TYPE = "one_time_service";

export const ONE_TIME_PROGRESS_STATUSES = [
	"NOT_STARTED",
	"IN_PROGRESS",
	"ON_HOLD",
	"COMPLETED",
	"BLOCKED",
] as const;

export type OneTimeProgressStatus = (typeof ONE_TIME_PROGRESS_STATUSES)[number];

const PRODUCT = {
	id: NISC_ONE_TIME_SERVICES_PRODUCT_ID,
	name: "One-time services",
	description:
		"Non-renewable custom work such as website design, branding, and other project-based services. Each subscription can use any name.",
	category: "SERVICES",
	serviceType: ONE_TIME_SERVICE_TYPE,
	sortOrder: 90,
	features: [
		{
			key: "custom_name",
			label: "Custom service name",
			description: "Record any one-off service with a name you choose",
		},
		{
			key: "progress",
			label: "Progress tracking",
			description: "Track delivery status and percent complete",
		},
		{
			key: "notes",
			label: "Delivery notes",
			description: "Share progress updates with the client",
		},
	],
	highlights: [
		"Any service name",
		"Optional start and end dates",
		"Progress tracker and notes",
	],
	metadata: {
		oneTimeService: true,
		planlessService: true,
		billingCycle: "ONE_TIME",
	},
};

/** Insert or reactivate the catch-all one-time services product. */
export async function ensureOneTimeServicesProduct(): Promise<string> {
	const now = new Date();
	const [existing] = await db
		.select({ id: niscProduct.id, isActive: niscProduct.isActive })
		.from(niscProduct)
		.where(eq(niscProduct.id, PRODUCT.id))
		.limit(1);

	if (existing) {
		if (!existing.isActive) {
			await db
				.update(niscProduct)
				.set({ isActive: true, updatedAt: now })
				.where(eq(niscProduct.id, PRODUCT.id));
		}
		return PRODUCT.id;
	}

	await db.insert(niscProduct).values({
		id: PRODUCT.id,
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
		createdAt: now,
		updatedAt: now,
	});

	return PRODUCT.id;
}
