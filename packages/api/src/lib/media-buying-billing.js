/**
 * Media Buying — stable product and plan ids (seeded by apps/server).
 */
/** Stable product id — seeded by apps/server/src/scripts/seed-media-buying-product.ts */
export const NISC_MEDIA_BUYING_PRODUCT_ID = "nisc-media-buying";
export const NISC_MEDIA_BUYING_PLAN_IDS = {
    starter: "nisc-media-buying-plan-starter",
    growth: "nisc-media-buying-plan-growth",
    pro: "nisc-media-buying-plan-pro",
};
/** Linked ad accounts (any platform) per team plan. */
export const MEDIA_BUYING_AD_ACCOUNTS_USAGE_KIND = "media_buying_ad_accounts";
/** Standard commission base for all media buying plans. */
export const MEDIA_BUYING_COMMISSION_BASE = "ad_spend";
