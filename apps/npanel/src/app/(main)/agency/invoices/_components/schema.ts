import { z } from "zod";

export const invoiceSchema = z.object({
  id: z.number(),
  invoiceNumber: z.string(),
  clientName: z.string(),
  clientEmail: z.string().email(),
  amount: z.number(),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
  dueDate: z.string(),
  createdAt: z.string(),
  description: z.string().nullable().optional(),
});

export type Invoice = z.infer<typeof invoiceSchema>;
