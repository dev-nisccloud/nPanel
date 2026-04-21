import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { DigiTaxClient } from "../../lib/digitax-client";

export const digitaxPurchasesRouter = router({
  getAll: protectedProcedure
    .input(z.object({
      before: z.string().optional(),
      after: z.string().optional(),
      page_size: z.number().min(1).max(20).optional().default(20),
    }))
    .query(async ({ input }) => {
      const client = new DigiTaxClient();
      return client.getPurchases(input);
    }),

  linkItems: protectedProcedure
    .input(z.object({
      purchaseId: z.string(),
      items: z.array(z.object({
        purchase_item_id: z.string(),
        item_id: z.string(),
      })),
    }))
    .mutation(async ({ input }) => {
      const client = new DigiTaxClient();
      return client.linkItems(input.purchaseId, input.items);
    }),
});
