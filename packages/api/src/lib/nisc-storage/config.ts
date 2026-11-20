import { env } from "@npanel/env/server";

import { NISC_STORAGE_COMMERCIAL_CAPACITY_BYTES } from "../nisc-storage-plans";
import { StorageOperationError } from "./errors";
import { parseByteCount } from "./keys";

export type NiscStorageConfig = {
	endpoint: string;
	region: string;
	accessKey: string;
	secretKey: string;
	clusterId: string | null;
	commercialCapacityBytes: bigint;
};

export function readNiscStorageConfig(): NiscStorageConfig {
	const endpoint = env.NISC_STORAGE_ENDPOINT?.trim();
	const accessKey = env.NISC_STORAGE_ACCESS_KEY?.trim();
	const secretKey = env.NISC_STORAGE_SECRET_KEY?.trim();
	const region = env.NISC_STORAGE_REGION?.trim() || "us-east-1";
	const clusterId = env.NISC_STORAGE_CLUSTER_ID?.trim() || null;
	const capacityRaw = env.NISC_STORAGE_COMMERCIAL_CAPACITY_BYTES?.trim() || NISC_STORAGE_COMMERCIAL_CAPACITY_BYTES;
	const commercialCapacityBytes = parseByteCount(capacityRaw);

	if (!endpoint || !accessKey || !secretKey || !commercialCapacityBytes) {
		throw new StorageOperationError(
			"Nisc Storage is not configured on this server.",
			"NOT_CONFIGURED",
		);
	}

	let parsed: URL;
	try {
		parsed = new URL(endpoint);
	} catch {
		throw new StorageOperationError(
			"Nisc Storage is not configured on this server.",
			"NOT_CONFIGURED",
		);
	}
	if (parsed.protocol !== "https:") {
		throw new StorageOperationError(
			"Nisc Storage is not configured on this server.",
			"NOT_CONFIGURED",
		);
	}

	return {
		endpoint: parsed.origin,
		region,
		accessKey,
		secretKey,
		clusterId,
		commercialCapacityBytes,
	};
}
