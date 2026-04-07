import { router } from "../../trpc";
import { niscEmailMarketingAudiencesRouter } from "./audiences";
import { niscEmailMarketingCampaignsRouter } from "./campaigns";
import { niscEmailMarketingDomainsRouter } from "./domains";
import { niscEmailMarketingEmailEventsRouter } from "./email-events";
import { niscEmailMarketingQuotaRouter } from "./quota";
import { niscEmailMarketingSesUsageRouter } from "./ses-usage";
import { niscEmailMarketingSesIdentitiesRouter } from "./ses-identities";
export const niscEmailMarketingRouter = router({
    audiences: niscEmailMarketingAudiencesRouter,
    campaigns: niscEmailMarketingCampaignsRouter,
    domains: niscEmailMarketingDomainsRouter,
    emailEvents: niscEmailMarketingEmailEventsRouter,
    quota: niscEmailMarketingQuotaRouter,
    sesUsage: niscEmailMarketingSesUsageRouter,
    sesIdentities: niscEmailMarketingSesIdentitiesRouter,
});
