import { router } from "../../trpc";
import type { AnyRouter } from "@trpc/server";
import { domainsRouter } from "./domains";
import { audiencesRouter } from "./audiences";
import { contactsRouter } from "./contacts";
import { campaignsRouter } from "./campaigns";
import { logsRouter } from "./logs";
import { webhooksRouter } from "./webhooks";

const _emailMarketingRouter = router({
  domains: domainsRouter,
  audiences: audiencesRouter,
  contacts: contactsRouter,
  campaigns: campaignsRouter,
  logs: logsRouter,
  webhooks: webhooksRouter,
});

export const emailMarketingRouter: AnyRouter = _emailMarketingRouter;
