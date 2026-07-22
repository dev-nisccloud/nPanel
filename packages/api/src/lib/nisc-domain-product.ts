/**
 * SQL helpers to identify real Domains product subscriptions.
 * Hosting/email rows may set primaryDomain for Plesk — those must not appear in Domains portfolio.
 */
import { and, ilike, inArray, not, or, type SQL } from "@npanel/db";
import { niscProduct } from "@npanel/db/schema/products";

export const DOMAIN_PRODUCT_SERVICE_TYPES = [
	"domain_registration",
	"domain_transfer",
	"domains",
] as const;

/** True for Domains products only — excludes hosting/email even if primaryDomain ends in .ke. */
export function domainProductSqlFilter(): SQL | undefined {
	return and(
		or(
			inArray(niscProduct.serviceType, [...DOMAIN_PRODUCT_SERVICE_TYPES]),
			ilike(niscProduct.name, "%domains%"),
		),
		not(ilike(niscProduct.serviceType, "%hosting%")),
		not(ilike(niscProduct.name, "%hosting%")),
	);
}
