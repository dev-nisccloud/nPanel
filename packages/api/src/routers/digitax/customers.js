import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { DigiTaxClient } from "../../lib/digitax-client";
const customerInputSchema = z.object({
    customer_name: z.string(),
    customer_tin: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
});
export const digitaxCustomersRouter = router({
    getAll: protectedProcedure
        .input(z.object({
        before: z.string().optional(),
        after: z.string().optional(),
        page_size: z.number().min(1).max(20).optional().default(20),
    }))
        .query(async ({ input }) => {
        const client = new DigiTaxClient();
        return client.getCustomers(input);
    }),
    create: protectedProcedure
        .input(customerInputSchema)
        .mutation(async ({ input }) => {
        const client = new DigiTaxClient();
        return client.saveCustomer(input);
    }),
    getById: protectedProcedure
        .input(z.object({ customerId: z.string() }))
        .query(async ({ input }) => {
        const client = new DigiTaxClient();
        return client.getCustomer(input.customerId);
    }),
    update: protectedProcedure
        .input(z.object({
        customerId: z.string(),
        data: z.object({
            customer_name: z.string(),
            email: z.string().email().optional(),
            phone: z.string().optional(),
        }),
    }))
        .mutation(async ({ input }) => {
        const client = new DigiTaxClient();
        return client.updateCustomer(input.customerId, input.data);
    }),
    delete: protectedProcedure
        .input(z.object({ customerId: z.string() }))
        .mutation(async ({ input }) => {
        const client = new DigiTaxClient();
        return client.deleteCustomer(input.customerId);
    }),
});
