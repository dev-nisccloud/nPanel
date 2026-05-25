import { trpc } from "@/utils/trpc";
import type { HivelocityProductType } from "@/lib/hivelocity-checkout";
import { HIVELOCITY_SERVICE_TYPE_BY_PRODUCT_TYPE } from "@/lib/hivelocity-checkout";

/**
 * Resolves nisc_product UUIDs for Hivelocity checkout (one product per server type).
 */
export function useHivelocityNiscProducts() {
	const dedicatedQuery = trpc.products.getAll.useQuery({
		serviceType: HIVELOCITY_SERVICE_TYPE_BY_PRODUCT_TYPE.DEDICATED_SERVERS,
		isActive: true,
	});
	const vpsQuery = trpc.products.getAll.useQuery({
		serviceType: HIVELOCITY_SERVICE_TYPE_BY_PRODUCT_TYPE.VPS,
		isActive: true,
	});
	const vdsQuery = trpc.products.getAll.useQuery({
		serviceType: HIVELOCITY_SERVICE_TYPE_BY_PRODUCT_TYPE.VDS,
		isActive: true,
	});

	const productIdByType: Record<HivelocityProductType, string | undefined> = {
		DEDICATED_SERVERS: dedicatedQuery.data?.[0]?.id,
		VPS: vpsQuery.data?.[0]?.id,
		VDS: vdsQuery.data?.[0]?.id,
	};

	return {
		productIdByType,
		isLoading: dedicatedQuery.isLoading || vpsQuery.isLoading || vdsQuery.isLoading,
		isError: dedicatedQuery.isError || vpsQuery.isError || vdsQuery.isError,
	};
}
