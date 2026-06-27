import type { HivelocityAddonOption } from "@/lib/vps-plans-api.ts";
import type { HivelocityDefaultHostnameProductType } from "@/lib/hivelocity-default-hostname.ts";
import {
  filterGroupedOptionsExcludingOs,
  filterGroupedOptionsForVpsVdsCheckout,
} from "@/lib/hivelocity-option-compatibility.ts";

/** Filter add-on groups for storefront checkout  mirrors dashboard buy-now dialog. */
export function filterStorefrontHivelocityAddonGroups(
  grouped: Record<string, HivelocityAddonOption[]>,
  productType: HivelocityDefaultHostnameProductType,
): Record<string, HivelocityAddonOption[]> {
  if (productType === "DEDICATED_SERVERS") {
    return grouped;
  }

  const withoutOs = filterGroupedOptionsExcludingOs(grouped);
  return filterGroupedOptionsForVpsVdsCheckout(withoutOs) as Record<string, HivelocityAddonOption[]>;
}
