import { z } from "zod";

export const orderSchema = z.object({
  id: z.number(),
  orderNumber: z.string(),
  companyName: z.string(),
  date: z.string(),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
  totalAmount: z.number(),
  status: z.enum(["pending", "processing", "active", "suspended", "cancelled"]),
});

export type Order = z.infer<typeof orderSchema>;
