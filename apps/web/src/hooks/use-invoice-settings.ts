"use client";

import { useQuery } from "@tanstack/react-query";
import type { InvoiceFormValues } from "@/routes/agency/_components/invoice/form-context";

// Mock default invoice settings based on the form schema
const mockDefaultSettings: Partial<InvoiceFormValues> = {
  id: "invoice-draft-1",
  status: "draft",
  template: {
    title: "Invoice",
    customerLabel: "Bill To",
    fromLabel: "From",
    invoiceNoLabel: "Invoice #",
    issueDateLabel: "Issue Date",
    dueDateLabel: "Due Date",
    descriptionLabel: "Description",
    priceLabel: "Price",
    quantityLabel: "Qty",
    totalLabel: "Total",
    totalSummaryLabel: "Total",
    vatLabel: "VAT",
    subtotalLabel: "Subtotal",
    taxLabel: "Tax",
    discountLabel: "Discount",
    paymentLabel: "Payment Details",
    noteLabel: "Notes",
    logoUrl: null,
    currency: "USD",
    paymentDetails: null,
    fromDetails: null,
    size: "a4",
    includeVat: false,
    includeTax: false,
    includeDiscount: false,
    includeDecimals: true,
    includePdf: true,
    includeUnits: true,
    includeQr: false,
    taxRate: 0,
    vatRate: 0,
    dateFormat: "dd-MM-yyyy",
    deliveryType: "create",
    locale: "en-US",
    timezone: "UTC",
  },
  fromDetails: {
    name: "Your Company Name",
    address: "123 Your Street\nYour City, State 12345",
    email: "billing@yourcompany.com",
    phone: "+1-555-0123",
  },
  customerDetails: null,
  customerId: "",
  customerName: "",
  paymentDetails: {
    bankName: "Your Bank",
    accountNumber: "****1234",
    routingNumber: "123456789",
  },
  noteDetails: null,
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  issueDate: new Date().toISOString(),
  invoiceNumber: "INV-001",
  logoUrl: null,
  vat: 0,
  tax: 0,
  discount: 0,
  subtotal: 0,
  topBlock: null,
  bottomBlock: null,
  amount: 0,
  lineItems: [
    {
      name: "",
      quantity: 1,
      unit: "",
      price: 0,
      vat: 0,
      tax: 0,
    },
  ],
  token: "",
  scheduledAt: null,
};

export function useInvoiceDefaultSettings() {
  return useQuery({
    queryKey: ["invoice-default-settings"],
    queryFn: () => Promise.resolve(mockDefaultSettings),
    staleTime: Infinity, // Mock data doesn't change
  });
}
