import { router } from '../../trpc';
import { metaAdsAuthRouter } from './auth';
import { metaAdsAccountsRouter } from './accounts';
import { metaAdsCampaignsRouter } from './campaigns';
import { metaAdsAdSetsRouter } from './ad-sets';
import { metaAdsAdsRouter } from './ads';

export const metaAdsRouter = router({
	/**
	 * Authentication endpoints
	 * Reuses existing SocialMediaIntegration
	 */
	auth: metaAdsAuthRouter,

	/**
	 * Ad accounts management endpoints
	 */
	accounts: metaAdsAccountsRouter,

	/**
	 * Campaigns management endpoints
	 */
	campaigns: metaAdsCampaignsRouter,

	/**
	 * Ad sets management endpoints
	 */
	adSets: metaAdsAdSetsRouter,

	/**
	 * Ads management endpoints
	 */
	ads: metaAdsAdsRouter,

	/**
	 * Insights and reporting endpoints
	 * TODO: Implement in Phase 3
	 */
	// insights: metaAdsInsightsRouter,
});


