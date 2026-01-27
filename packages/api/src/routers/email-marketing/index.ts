import { router } from "../../trpc";
import { emailMarketingDomainsRouter } from "./domains";
import { emailMarketingContactsRouter } from "./contacts";
import { emailMarketingTemplatesRouter } from "./templates";
import { emailMarketingCampaignsRouter } from "./campaigns";
import { emailMarketingEmailLogsRouter } from "./email-logs";

/**
 * Email Marketing Router
 * 
 * Comprehensive email marketing system integrated with Resend
 * - Domains: Manage email domains via Resend
 * - Contacts: Store and manage contacts in our database
 * - Templates: Email templates for campaigns
 * - Campaigns: Email campaigns sent via Resend (each campaign maintains its own list of recipient emails)
 * - Email Logs: Track all sent emails and their status
 */
export const emailMarketingRouter = router({
	/**
	 * Email domain management
	 * Add, verify, and manage email domains via Resend
	 */
	domains: emailMarketingDomainsRouter,

	/**
	 * Contact management
	 * Store and manage contacts in our database
	 */
	contacts: emailMarketingContactsRouter,

	/**
	 * Email template management
	 * Create and manage reusable email templates
	 */
	templates: emailMarketingTemplatesRouter,

	/**
	 * Campaign management
	 * Create, send, and manage email campaigns via Resend
	 * Each campaign maintains its own list of recipient emails
	 */
	campaigns: emailMarketingCampaignsRouter,

	/**
	 * Email log tracking
	 * View and track all sent emails and their status
	 */
	emailLogs: emailMarketingEmailLogsRouter,
});
