"use client";

import { useZodForm } from "@/hooks/use-zod-form";
import { useEffect } from "react";
import { FormProvider } from "react-hook-form";
import { z } from "zod";

export const invoiceTemplateSchema = z.object({
  title: z.string().optional(),
  customerLabel: z.string().optional(),
  fromLabel: z.string().optional(),
  invoiceNoLabel: z.string().optional(),
  issueDateLabel: z.string().optional(),
  dueDateLabel: z.string().optional(),
  descriptionLabel: z.string().optional(),
  priceLabel: z.string().optional(),
  quantityLabel: z.string().optional(),
  totalLabel: z.string().optional(),
  totalSummaryLabel: z.string().optional(),
  vatLabel: z.string().optional(),
  subtotalLabel: z.string().optional(),
  taxLabel: z.string().optional(),
  discountLabel: z.string().optional(),
  paymentLabel: z.string().optional(),
  noteLabel: z.string().optional(),
  logoUrl: z.string().optional().nullable(),
  currency: z.string().optional(),
  paymentDetails: z.any().nullable().optional(),
  fromDetails: z.any().nullable().optional(),
  size: z.enum(["a4", "letter"]).optional(),
  includeVat: z.boolean().optional(),
  includeTax: z.boolean().optional(),
  includeDiscount: z.boolean().optional(),
  includeDecimals: z.boolean().optional(),
  includePdf: z.boolean().optional(),
  includeUnits: z.boolean().optional(),
  includeQr: z.boolean().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  vatRate: z.number().min(0).max(100).optional(),
  dateFormat: z.enum(["dd-MM-yyyy", "dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "dd.MM.yyyy"]).optional(),
  deliveryType: z.enum(["create", "create_and_send", "scheduled"]).optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
});

export const lineItemSchema = z.object({
  name: z.string().optional(),
  quantity: z.number().min(0, "Quantity must be at least 0").optional(),
  unit: z.string().optional(),
  price: z.number().optional(),
  vat: z.number().min(0, "VAT must be at least 0").optional(),
  tax: z.number().min(0, "Tax must be at least 0").optional(),
});

export const invoiceFormSchema = z.object({
  id: z.string().uuid().optional(),
  status: z.string().optional(),
  template: invoiceTemplateSchema,
  fromDetails: z.any().optional(),
  customerDetails: z.any().optional(),
  customerId: z.string().uuid().optional(),
  customerName: z.string().optional(),
  paymentDetails: z.any().optional(),
  noteDetails: z.any().optional(),
  dueDate: z.string().optional(),
  issueDate: z.string().optional(),
  invoiceNumber: z.string().optional(),
  logoUrl: z.string().nullable().optional(),
  vat: z.number().nullable().optional(),
  tax: z.number().nullable().optional(),
  discount: z.number().nullable().optional(),
  subtotal: z.number().nullable().optional(),
  topBlock: z.any().nullable().optional(),
  bottomBlock: z.any().nullable().optional(),
  amount: z.number().optional(),
  lineItems: z.array(lineItemSchema).optional(),
  token: z.string().optional(),
  scheduledAt: z.string().nullable().optional(),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

type FormContextProps = {
  children: React.ReactNode;
  data?: any; // Replace with proper type when tRPC is integrated
  defaultSettings?: any; // Replace with proper type when tRPC is integrated
};

export function FormContext({
  children,
  data,
  defaultSettings,
}: FormContextProps) {
  const form = useZodForm(invoiceFormSchema, {
    defaultValues: defaultSettings,
    mode: "onBlur",
  });

  useEffect(() => {
    form.reset({
      ...(defaultSettings ?? {}),
      ...(data ?? {}),
      template: {
        ...(defaultSettings?.template ?? {}),
        ...(data?.template ?? {}),
      },
      customerId: data?.customerId ?? defaultSettings?.customerId ?? undefined,
      lineItems: data?.lineItems ?? defaultSettings?.lineItems ?? [
        {
          name: "",
          quantity: 0,
          price: 0,
          unit: "",
          vat: 0,
          tax: 0,
        }
      ],
    });
  }, [data, defaultSettings]);

  return <FormProvider {...form}>{children}</FormProvider>;
}
