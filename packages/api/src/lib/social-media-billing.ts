/**
 * Social Media Management - stable product and plan ids (seeded by apps/server).
 */

/** Stable product id - seeded by apps/server/src/scripts/seed-social-media-product.ts */
export const NISC_SOCIAL_MEDIA_PRODUCT_ID = "nisc-social-media";

export const NISC_SOCIAL_MEDIA_SERVICE_TYPE = "social_media";

/** Plans on sale. Enterprise is hidden and priced per client by agency staff. */
export const NISC_SOCIAL_MEDIA_PLAN_IDS = {
	pulse: "nisc-social-media-plan-pulse",
	momentum: "nisc-social-media-plan-momentum",
	enterprise: "nisc-social-media-plan-enterprise",
} as const;
