/**
 * Idempotent seed for planless Nisc services (product only — no plans).
 *
 * Services: Domains, VPS Hosting, VDS Hosting, Dedicated Servers.
 *
 * Run from apps/server:
 *   bun run seed:planless-services
 */
import { and, eq, ilike, ne, or } from "@npanel/db";
import { db } from "@npanel/db";
import { niscProduct } from "@npanel/db/schema/products";
import {
	NISC_DEDICATED_SERVERS_PRODUCT_ID,
	NISC_DOMAINS_PRODUCT_ID,
	NISC_VDS_HOSTING_PRODUCT_ID,
	NISC_VPS_HOSTING_PRODUCT_ID,
	PLANLESS_SERVICE_TYPES,
} from "@npanel/api/lib/planless-services-billing";
import { invalidateProductsCache } from "@npanel/api/lib/products-cache";

type ProductFeature = {
	key: string;
	label: string;
	description: string;
};

type PlanlessProductSeed = {
	id: string;
	name: string;
	description: string;
	serviceType: string;
	sortOrder: number;
	features: ProductFeature[];
	highlights: string[];
	metadata: Record<string, unknown>;
	legacyMatch: () => ReturnType<typeof or> | ReturnType<typeof ilike> | ReturnType<typeof eq>;
};

const PRODUCTS: PlanlessProductSeed[] = [
	{
		id: NISC_DOMAINS_PRODUCT_ID,
		name: "Domains",
		description:
			"Register, transfer, and manage domain names — .co.ke, .com, .africa, and hundreds of extensions with DNS management from Nisc Cloud.",
		serviceType: PLANLESS_SERVICE_TYPES.domains,
		sortOrder: 1,
		features: [
			{
				key: "registration",
				label: "Domain registration",
				description: "Search availability and register new domains instantly",
			},
			{
				key: "transfer",
				label: "Domain transfer",
				description: "Move existing domains to Nisc Cloud with guided transfer",
			},
			{
				key: "dns_management",
				label: "DNS management",
				description: "Manage nameservers and DNS records from your panel",
			},
			{
				key: "local_tlds",
				label: "Kenyan & African TLDs",
				description: ".co.ke, .ke, .africa, and regional extensions",
			},
			{
				key: "global_tlds",
				label: "Global TLDs",
				description: ".com, .net, .org, and hundreds of international extensions",
			},
			{
				key: "portfolio",
				label: "Domain portfolio",
				description: "View and manage all domains in one customer portal",
			},
		],
		highlights: [
			".co.ke and global TLDs in one place",
			"Instant availability search",
			"DNS and nameserver management included",
		],
		metadata: {
			planlessService: true,
			billingCurrency: "KES",
			legacyPlanType: "DOMAIN",
		},
		legacyMatch: () =>
			or(
				eq(niscProduct.serviceType, PLANLESS_SERVICE_TYPES.domains),
				eq(niscProduct.serviceType, "domain_registration"),
				ilike(niscProduct.name, "%domain%"),
			),
	},
	{
		id: NISC_VPS_HOSTING_PRODUCT_ID,
		name: "VPS Hosting",
		description:
			"Scalable virtual private servers — root access, SSD storage, and flexible billing terms from Nisc Cloud.",
		serviceType: PLANLESS_SERVICE_TYPES.vpsHosting,
		sortOrder: 20,
		features: [
			{
				key: "root_access",
				label: "Full root access",
				description: "Complete control over your virtual server environment",
			},
			{
				key: "ssd_storage",
				label: "SSD storage",
				description: "High-performance SSD-backed virtual servers",
			},
			{
				key: "flexible_billing",
				label: "Flexible billing terms",
				description: "Monthly, quarterly, annual, and multi-year options",
			},
			{
				key: "os_choice",
				label: "Operating system choice",
				description: "Deploy with your preferred Linux distribution",
			},
			{
				key: "addons",
				label: "Configurable add-ons",
				description: "Extra storage, bandwidth, and control-panel options",
			},
		],
		highlights: [
			"Plans sourced from live inventory",
			"Root access and SSD performance",
			"Flexible monthly to triennial billing",
		],
		metadata: {
			planlessService: true,
			hivelocityProductType: "VPS",
			billingCurrency: "KES",
			legacyPlanType: "VPS_HOSTING",
		},
		legacyMatch: () =>
			or(
				eq(niscProduct.serviceType, PLANLESS_SERVICE_TYPES.vpsHosting),
				ilike(niscProduct.name, "%vps%"),
			),
	},
	{
		id: NISC_VDS_HOSTING_PRODUCT_ID,
		name: "VDS Hosting",
		description:
			"Virtual dedicated servers with dedicated resources — more power than VPS, more flexibility than bare metal.",
		serviceType: PLANLESS_SERVICE_TYPES.vdsHosting,
		sortOrder: 21,
		features: [
			{
				key: "dedicated_resources",
				label: "Dedicated resources",
				description: "Guaranteed CPU, RAM, and storage allocation",
			},
			{
				key: "root_access",
				label: "Full root access",
				description: "Complete server administration control",
			},
			{
				key: "flexible_billing",
				label: "Flexible billing terms",
				description: "Monthly through triennial billing options",
			},
			{
				key: "os_choice",
				label: "Operating system choice",
				description: "Wide selection of Linux images and add-ons",
			},
		],
		highlights: [
			"Dedicated resources without bare-metal cost",
			"Live inventory pricing",
			"Root access with Nisc Cloud support",
		],
		metadata: {
			planlessService: true,
			hivelocityProductType: "VDS",
			billingCurrency: "KES",
			legacyPlanType: "VPS_HOSTING",
		},
		legacyMatch: () =>
			or(
				eq(niscProduct.serviceType, PLANLESS_SERVICE_TYPES.vdsHosting),
				ilike(niscProduct.name, "%vds%"),
			),
	},
	{
		id: NISC_DEDICATED_SERVERS_PRODUCT_ID,
		name: "Dedicated Servers",
		description:
			"Bare-metal dedicated servers — maximum performance, full hardware control, and enterprise-grade reliability.",
		serviceType: PLANLESS_SERVICE_TYPES.dedicatedServers,
		sortOrder: 22,
		features: [
			{
				key: "bare_metal",
				label: "Bare metal hardware",
				description: "Dedicated physical servers with no noisy neighbours",
			},
			{
				key: "full_control",
				label: "Full hardware control",
				description: "Root access and custom OS deployment",
			},
			{
				key: "global_locations",
				label: "Global data centres",
				description: "Deploy in facilities worldwide via Nisc Cloud",
			},
			{
				key: "flexible_billing",
				label: "Flexible billing terms",
				description: "Monthly through triennial billing options",
			},
			{
				key: "custom_configs",
				label: "Custom configurations",
				description: "Build-to-order hardware where available",
			},
		],
		highlights: [
			"Maximum performance for high-traffic workloads",
			"Live dedicated server inventory",
			"Enterprise support from Nisc Cloud",
		],
		metadata: {
			planlessService: true,
			hivelocityProductType: "DEDICATED_SERVERS",
			billingCurrency: "KES",
			legacyPlanType: "DEDICATED_HOSTING",
		},
		legacyMatch: () =>
			or(
				eq(niscProduct.serviceType, PLANLESS_SERVICE_TYPES.dedicatedServers),
				ilike(niscProduct.name, "%dedicated%"),
			),
	},
];

async function deactivateLegacyProducts(product: PlanlessProductSeed) {
	const now = new Date();
	const legacyProducts = await db
		.select({ id: niscProduct.id, name: niscProduct.name })
		.from(niscProduct)
		.where(and(ne(niscProduct.id, product.id), product.legacyMatch()));

	for (const legacy of legacyProducts) {
		await db
			.update(niscProduct)
			.set({ isActive: false, updatedAt: now })
			.where(eq(niscProduct.id, legacy.id));
		console.log(`  ⊘ Deactivated legacy product ${legacy.id} (${legacy.name})`);
	}
}

async function upsertProduct(product: PlanlessProductSeed) {
	const now = new Date();
	await db
		.insert(niscProduct)
		.values({
			id: product.id,
			name: product.name,
			description: product.description,
			category: "CLOUD",
			serviceType: product.serviceType,
			isActive: true,
			sortOrder: product.sortOrder,
			features: product.features,
			highlights: product.highlights,
			isAddOn: false,
			metadata: product.metadata,
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: niscProduct.id,
			set: {
				name: product.name,
				description: product.description,
				category: "CLOUD",
				serviceType: product.serviceType,
				isActive: true,
				sortOrder: product.sortOrder,
				features: product.features,
				highlights: product.highlights,
				isAddOn: false,
				metadata: product.metadata,
				updatedAt: now,
			},
		});
}

async function main() {
	console.log("Seeding planless Nisc services…");

	for (const product of PRODUCTS) {
		console.log(`\n${product.name} (${product.serviceType})`);
		await deactivateLegacyProducts(product);
		await upsertProduct(product);
		console.log(`  ✓ Product ${product.id}`);
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
