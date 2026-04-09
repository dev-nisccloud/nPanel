import { router } from '../../trpc';
import { linkedInAdsAuthRouter } from './auth';
import { linkedInAdsAccountsRouter } from './accounts';
import { linkedInAdsCampaignGroupsRouter } from './campaign-groups';
import { linkedInAdsCampaignsRouter } from './campaigns';
import { linkedInAdsCreativesRouter } from './creatives';
import { linkedInAdsInsightsRouter } from './insights';
import { linkedInAdsStandardizedDataRouter } from './standardized-data';

export const linkedInAdsRouter = router({
	/**
	 * Authentication endpoints
	 * Reuses existing SocialMediaIntegration
	 */
	auth: linkedInAdsAuthRouter,

	/**
	 * Ad accounts management endpoints
	 */
	accounts: linkedInAdsAccountsRouter,

	/**
	 * Campaign groups management endpoints (Campaigns in UI)
	 */
	campaignGroups: linkedInAdsCampaignGroupsRouter,

	/**
	 * Campaigns management endpoints (Ad Sets in UI)
	 */
	campaigns: linkedInAdsCampaignsRouter,

	/**
	 * Creatives management endpoints (Ads in UI)
	 */
	creatives: linkedInAdsCreativesRouter,

	/**
	 * Reporting endpoints (adAnalytics)
	 */
	insights: linkedInAdsInsightsRouter,

	/**
	 * Public standardized-data endpoints (reference lists for targeting labels).
	 * No session required – pass an accessToken in the input.
	 * Use from Postman to harvest complete lists for building static maps.
	 */
	standardizedData: linkedInAdsStandardizedDataRouter,
});

