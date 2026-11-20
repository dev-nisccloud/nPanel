/** Stable catalog ids for the Nisc Storage product. Quota bytes are decimal. File caps are 1024-based. */
export const NISC_STORAGE_PRODUCT_ID = "nisc_storage";

export const NISC_STORAGE_PLAN_IDS = {
	gb50: "nisc_storage_50gb",
	gb500: "nisc_storage_500gb",
	tb1: "nisc_storage_1tb",
} as const;

export const NISC_STORAGE_COMMERCIAL_CAPACITY_BYTES = "11000000000000";

export type NiscStoragePlanSeed = {
	id: string;
	name: string;
	description: string;
	quotaBytes: string;
	maxObjectBytes: string;
	quotaLabel: string;
	fileLabel: string;
	sortOrder: number;
	isPopular?: boolean;
	isRecommended?: boolean;
};

export const NISC_STORAGE_PLAN_SEEDS: readonly NiscStoragePlanSeed[] = [
	{
		id: NISC_STORAGE_PLAN_IDS.gb50,
		name: "50 GB",
		description: "50 GB of private object storage. Each file can be up to 100 MB.",
		quotaBytes: "50000000000",
		maxObjectBytes: String(100 * 1024 * 1024),
		quotaLabel: "50 GB",
		fileLabel: "100 MB",
		sortOrder: 1,
	},
	{
		id: NISC_STORAGE_PLAN_IDS.gb500,
		name: "500 GB",
		description: "500 GB of private object storage. Each file can be up to 500 MB.",
		quotaBytes: "500000000000",
		maxObjectBytes: String(500 * 1024 * 1024),
		quotaLabel: "500 GB",
		fileLabel: "500 MB",
		sortOrder: 2,
		isRecommended: true,
	},
	{
		id: NISC_STORAGE_PLAN_IDS.tb1,
		name: "1 TB",
		description: "1 TB of private object storage. Each file can be up to 1 GB.",
		quotaBytes: "1000000000000",
		maxObjectBytes: String(1024 * 1024 * 1024),
		quotaLabel: "1 TB",
		fileLabel: "1 GB",
		sortOrder: 3,
		isPopular: true,
	},
];

export const NISC_STORAGE_LIVE_STATUSES = [
	"PROVISIONING",
	"PROVISIONING_FAILED",
	"ACTIVE",
	"SUSPENDED",
	"PENDING_DELETION",
] as const;

export const NISC_STORAGE_STATUSES = [...NISC_STORAGE_LIVE_STATUSES, "DELETED"] as const;

export type NiscStorageStatus = (typeof NISC_STORAGE_STATUSES)[number];
