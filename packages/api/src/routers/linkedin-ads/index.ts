import { router } from '../../trpc';
import { linkedInAdsAuthRouter } from './auth';
import { linkedInAdsAccountsRouter } from './accounts';
import { linkedInAdsCampaignGroupsRouter } from './campaign-groups';
import { linkedInAdsCampaignsRouter } from './campaigns';
import { linkedInAdsCreativesRouter } from './creatives';

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
});

