import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { DigiTaxClient } from "../../lib/digitax-client";

const itemInputSchema = z.object({
  item_class_code: z.string(),
  item_type_code: z.string(),
  item_name: z.string(),
  origin_nation_code: z.string(),
  package_unit_code: z.string(),
  quantity_unit_code: z.string(),
  tax_type_code: z.string(),
  default_unit_price: z.number(),
  stock_quantity: z.number().optional(),
  callback_url: z.string().url().optional(),
  item_bar_code: z.string().optional(),
  levies: z.array(z.string()).optional(),
});

export const digitaxItemsRouter = router({
  getAll: protectedProcedure
    .input(z.object({
      before: z.string().optional(),
      after: z.string().optional(),
      page_size: z.number().min(1).max(20).optional().default(20),
    }))
    .query(async ({ input }) => {
      const client = new DigiTaxClient();
      return client.getItems(input);
    }),

  create: protectedProcedure
    .input(itemInputSchema)
    .mutation(async ({ input }) => {
      const client = new DigiTaxClient();
      return client.createItem(input);
    }),

  update: protectedProcedure
    .input(z.object({
      itemId: z.string(),
      data: itemInputSchema.partial(),
    }))
    .mutation(async ({ input }) => {
      const client = new DigiTaxClient();
      return client.updateItem(input.itemId, input.data);
    }),

  delete: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ input }) => {
      const client = new DigiTaxClient();
      return client.deleteItem(input.itemId);
    }),

  getById: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .query(async ({ input }) => {
      const client = new DigiTaxClient();
      return client.getItem(input.itemId);
    }),
});
