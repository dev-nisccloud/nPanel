import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { DigiTaxClient } from "../../lib/digitax-client";

export const digitaxVerificationsRouter = router({
  getAll: protectedProcedure
    .input(z.object({
      before: z.string().optional(),
      after: z.string().optional(),
      page_size: z.number().min(1).max(20).optional().default(20),
    }))
    .query(async ({ input }) => {
      const client = new DigiTaxClient();
      return client.getVerifications(input);
    }),

  verify: protectedProcedure
    .input(z.object({
      invoice_number: z.string(),
      amount: z.number().optional(),
      supplier_pin: z.string().optional(),
      reference_number: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const client = new DigiTaxClient();
      return client.verifyInvoice(input);
    }),
});
