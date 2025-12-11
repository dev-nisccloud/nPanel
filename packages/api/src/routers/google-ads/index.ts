import { router } from '../../trpc';
import { googleAdsAuthRouter } from './auth';
import { googleAdsAccountsRouter } from './accounts';

export const googleAdsRouter = router({
	auth: googleAdsAuthRouter,
	accounts: googleAdsAccountsRouter,
});


