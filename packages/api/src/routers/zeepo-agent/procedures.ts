import { protectedProcedure } from "../../trpc";
import { zeepoAgentErrorMiddleware } from "../../lib/zeepo-agent-errors";

export const zeepoAgentProcedure = protectedProcedure.use(zeepoAgentErrorMiddleware);
