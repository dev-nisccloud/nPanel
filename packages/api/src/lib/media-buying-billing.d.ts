/**
 * Media Buying - stable product and plan ids (seeded by apps/server).
 */
/** Stable product id - seeded by apps/server/src/scripts/seed-media-buying-product.ts */
export declare const NISC_MEDIA_BUYING_PRODUCT_ID = "nisc-media-buying";
export declare const NISC_MEDIA_BUYING_PLAN_IDS: {
    readonly starter: "nisc-media-buying-plan-starter";
    readonly growth: "nisc-media-buying-plan-growth";
    readonly pro: "nisc-media-buying-plan-pro";
};
/** Linked ad accounts (any platform) per team plan. */
export declare const MEDIA_BUYING_AD_ACCOUNTS_USAGE_KIND = "media_buying_ad_accounts";
/** Standard commission base for all media buying plans. */
export declare const MEDIA_BUYING_COMMISSION_BASE = "ad_spend";
