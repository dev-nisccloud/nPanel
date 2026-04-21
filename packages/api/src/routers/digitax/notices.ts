import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { DigiTaxClient } from "../../lib/digitax-client";

export const digitaxNoticesRouter = router({
  getAll: protectedProcedure.query(async () => {
    const client = new DigiTaxClient();
    return client.getNotices();
  }),
});
