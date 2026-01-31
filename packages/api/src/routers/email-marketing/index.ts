import { router } from "../../trpc";
import { emailMarketingDomainsRouter } from "./domains";
import { emailMarketingCampaignsRouter } from "./campaigns";
import { emailMarketingEmailEventsRouter } from "./email-events";

/**
 * Email Marketing Router
 *
 * - Domains: Manage email domains via Resend
 * - Campaigns: Email campaigns with per-campaign recipients (CampaignRecipient)
 * - Email events: Resend webhook events per recipient (EmailEvent)
 */
export const emailMarketingRouter = router({
	domains: emailMarketingDomainsRouter,
	campaigns: emailMarketingCampaignsRouter,
	emailEvents: emailMarketingEmailEventsRouter,
});
