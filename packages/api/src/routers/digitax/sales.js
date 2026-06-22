import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { DigiTaxClient } from "../../lib/digitax-client";
const saleItemSchema = z.object({
    id: z.string(),
    quantity: z.number(),
    unit_price: z.number(),
    total_amount: z.number(),
    package_unit_quantity: z.number().optional(),
    discount_rate: z.number().optional(),
    discount_amount: z.number().optional(),
    item_description: z.string().optional(),
});
const saleInputSchema = z.object({
    sale_date: z.string(),
    customer_tin: z.string().optional(),
    customer_name: z.string().optional(),
    customer_id: z.string().optional(),
    trader_invoice_number: z.string(),
    receipt_type_code: z.string(),
    payment_type_code: z.string(),
    invoice_status_code: z.string(),
    callback_url: z.string().url().optional(),
    invoice_auth: z.object({
        type: z.string(),
        issuer: z.string(),
    }).optional(),
    invoice_details: z.string().optional(),
    is_tax_exempt: z.boolean().optional(),
    service_charge_rate: z.number().optional(),
    items: z.array(saleItemSchema),
});
const saleWithItemsInputSchema = saleInputSchema.extend({
    items: z.array(saleItemSchema.extend({
        item_name: z.string(),
        item_class_code: z.string(),
        item_bar_code: z.string(),
        item_tax_type_code: z.string(),
        taxable_amount: z.number().optional(),
        tax_amount: z.number().optional(),
        is_stockable: z.boolean().optional(),
    })),
});
export const digitaxSalesRouter = router({
    getAll: protectedProcedure
        .input(z.object({
        start_date: z.string().optional(),
        end_date: z.string().optional(),
        before: z.string().optional(),
        after: z.string().optional(),
        page_size: z.number().min(1).max(20).optional().default(20),
    }))
        .query(async ({ input }) => {
        const client = new DigiTaxClient();
        return client.getSales(input);
    }),
    getSummary: protectedProcedure
        .input(z.object({
        start_date: z.string(),
        end_date: z.string(),
    }))
        .query(async ({ input }) => {
        const client = new DigiTaxClient();
        return client.getSalesSummary(input.start_date, input.end_date);
    }),
    add: protectedProcedure
        .input(saleInputSchema)
        .mutation(async ({ input }) => {
        const client = new DigiTaxClient();
        return client.addSale(input);
    }),
    addWithItems: protectedProcedure
        .input(saleWithItemsInputSchema)
        .mutation(async ({ input }) => {
        const client = new DigiTaxClient();
        return client.addSaleWithItems(input);
    }),
    getById: protectedProcedure
        .input(z.object({ saleId: z.string() }))
        .query(async ({ input }) => {
        const client = new DigiTaxClient();
        return client.getSaleById(input.saleId);
    }),
    getOfflineUrl: protectedProcedure
        .input(z.object({
        businessId: z.string(),
        traderInvoiceNumber: z.string(),
    }))
        .query(async ({ input }) => {
        const client = new DigiTaxClient();
        return client.getOfflineUrl(input.businessId, input.traderInvoiceNumber);
    }),
    addExpressCreditNote: protectedProcedure
        .input(z.object({
        trader_invoice_number: z.string(),
        return_date: z.string(),
        sale_id: z.string(),
        callback_url: z.string().url().optional(),
        invoice_details: z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const client = new DigiTaxClient();
        return client.addExpressCreditNote(input);
    }),
});
