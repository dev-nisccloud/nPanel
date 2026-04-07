import { protectedProcedure, router } from "../../trpc";
import { z } from "zod";
import { getQuotaStatus } from "../../lib/quota-reservation";
import { niscEmailQuotaStatusSchema } from "./schemas";

export const niscEmailMarketingQuotaRouter = router({
  status: protectedProcedure
    .input(z.object({}).default({}))
    .query(async () => {
      const quota = await getQuotaStatus(new Date());
      return niscEmailQuotaStatusSchema.parse(quota);
    }),
});
