import { router } from '../../trpc';
import { instagramAdsAccountsRouter } from './accounts';
import { instagramAdsCampaignsRouter } from './campaigns';
import { instagramAdsAdSetsRouter } from './ad-sets';
import { instagramAdsAdsRouter } from './ads';
import { instagramAdsInsightsRouter } from './insights';

/**
 * Instagram Ads Router
 * This router specifically uses the Instagram standalone integration token
 * to access the Meta Marketing API for Instagram-related advertising data.
 */
export const instagramAdsRouter = router({
	/**
	 * Ad accounts management endpoints specifically for Instagram
	 */
	accounts: instagramAdsAccountsRouter,

	/**
	 * Campaigns management endpoints specifically for Instagram
	 */
	campaigns: instagramAdsCampaignsRouter,

	/**
	 * Ad sets management endpoints specifically for Instagram
	 */
	adSets: instagramAdsAdSetsRouter,

	/**
	 * Ads management endpoints specifically for Instagram
	 */
	ads: instagramAdsAdsRouter,

	/**
	 * Insights and reporting endpoints specifically for Instagram
	 */
	insights: instagramAdsInsightsRouter,
});


