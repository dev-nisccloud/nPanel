/**
 * SQL helpers to identify real Domains product subscriptions.
 * Hosting/email rows may set primaryDomain for Plesk  those must not appear in Domains portfolio.
 */
import { type SQL } from "@npanel/db";
export declare const DOMAIN_PRODUCT_SERVICE_TYPES: readonly ["domain_registration", "domain_transfer", "domains"];
/** True for Domains products only  excludes hosting/email even if primaryDomain ends in .ke. */
export declare function domainProductSqlFilter(): SQL | undefined;
