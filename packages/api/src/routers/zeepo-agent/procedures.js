import { protectedProcedure } from "../../trpc";
import { zeepoAgentErrorMiddleware } from "../../lib/zeepo-agent-errors";
import { zeepoAgentBillingMiddleware } from "../../lib/zeepo-agent-billing-middleware";
export const zeepoAgentProcedure = protectedProcedure
    .use(zeepoAgentErrorMiddleware)
    .use(zeepoAgentBillingMiddleware);
