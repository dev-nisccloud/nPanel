import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { DigiTaxClient } from "../../lib/digitax-client";

export const digitaxBranchesRouter = router({
  getETimsInfo: protectedProcedure.query(async () => {
    const client = new DigiTaxClient();
    return client.getETimsInfo();
  }),
  getBranches: protectedProcedure.query(async () => {
    const client = new DigiTaxClient();
    return client.getBranches();
  }),
});
