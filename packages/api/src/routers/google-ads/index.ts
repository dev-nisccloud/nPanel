import { router } from '../../trpc';
import { googleAdsAuthRouter } from './auth';
import { googleAdsAccountsRouter } from './accounts';
import { googleAdsCampaignsRouter } from './campaigns';
import { googleAdsAdGroupsRouter } from './ad-groups';
import { googleAdsAdsRouter } from './ads';

export const googleAdsRouter = router({
	auth: googleAdsAuthRouter,
	accounts: googleAdsAccountsRouter,
	campaigns: googleAdsCampaignsRouter,
	adGroups: googleAdsAdGroupsRouter,
	ads: googleAdsAdsRouter,
});


