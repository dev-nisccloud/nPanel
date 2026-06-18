import { trpc } from "@/utils/trpc";
import type { HivelocityProductType } from "@/lib/hivelocity-checkout";
import { HIVELOCITY_SERVICE_TYPE_BY_PRODUCT_TYPE } from "@/lib/hivelocity-checkout";
import {
	HIVELOCITY_NISC_PRODUCT_ID_BY_TYPE,
	pickActivePlanlessProductId,
} from "@npanel/api/lib/planless-services-billing";

/**
 * Resolves active nisc_product ids for Hivelocity checkout.
 * Prefers canonical seed ids when present among active catalog rows.
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
		DEDICATED_SERVERS:
			pickActivePlanlessProductId(
				dedicatedQuery.data,
				HIVELOCITY_NISC_PRODUCT_ID_BY_TYPE.DEDICATED_SERVERS,
			) ?? HIVELOCITY_NISC_PRODUCT_ID_BY_TYPE.DEDICATED_SERVERS,
		VPS:
			pickActivePlanlessProductId(vpsQuery.data, HIVELOCITY_NISC_PRODUCT_ID_BY_TYPE.VPS) ??
			HIVELOCITY_NISC_PRODUCT_ID_BY_TYPE.VPS,
		VDS:
			pickActivePlanlessProductId(vdsQuery.data, HIVELOCITY_NISC_PRODUCT_ID_BY_TYPE.VDS) ??
			HIVELOCITY_NISC_PRODUCT_ID_BY_TYPE.VDS,
	};

	return {
		productIdByType,
		isLoading: dedicatedQuery.isLoading || vpsQuery.isLoading || vdsQuery.isLoading,
		isError: dedicatedQuery.isError || vpsQuery.isError || vdsQuery.isError,
	};
}
