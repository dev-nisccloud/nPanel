"use client";

import * as React from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Sheet } from "@nPanel/ui/sheet";
import { InvoiceContent } from "@/components/npanel-ui/invoice-content";
import { FormContext } from "@/app/(main)/agency/_components/invoice/form-context";

import { invoiceSchema } from "./schema";

interface AddInvoiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddInvoice: (invoice: Omit<z.infer<typeof invoiceSchema>, "id" | "createdAt">) => void;
}

export function AddInvoiceSheet({ open, onOpenChange, onAddInvoice }: AddInvoiceSheetProps) {
  const handleInvoiceSubmit = React.useCallback((invoiceData: any) => {
    try {
      // Transform the invoice data to match our schema
      const newInvoice = {
        invoiceNumber: invoiceData.invoiceNumber || `INV-${Date.now()}`,
        clientName: invoiceData.clientName || "New Client",
        clientEmail: invoiceData.clientEmail || "client@example.com",
        amount: invoiceData.total || 0,
        status: "draft" as const,
        dueDate: invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        description: invoiceData.description || "",
      };

      onAddInvoice(newInvoice);
      toast.success("Invoice created successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice", {
        description: "Please try again.",
      });
    }
  }, [onAddInvoice, onOpenChange]);

  // Default settings for new invoice
  const defaultSettings = {
    id: crypto.randomUUID(),
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
      currency: "USD",
      size: "a4" as const,
      dateFormat: "dd/MM/yyyy" as const,
      deliveryType: "create" as const,
    },
    fromDetails: {
      name: "Your Company",
      email: "billing@yourcompany.com",
      address: "123 Business St",
      city: "Business City",
      postCode: "12345",
      country: "USA",
    },
    customerDetails: {
      name: "",
      email: "",
      address: "",
      city: "",
      postCode: "",
      country: "",
    },
    customerId: crypto.randomUUID(),
    customerName: "",
    paymentDetails: {
      bankName: "",
      accountNumber: "",
      routingNumber: "",
    },
    noteDetails: {
      notes: "",
      terms: "",
    },
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    issueDate: new Date().toISOString(),
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
    logoUrl: null,
    vat: null,
    tax: null,
    discount: null,
    subtotal: null,
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
    token: undefined,
    scheduledAt: null,
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FormContext defaultSettings={defaultSettings}>
        <InvoiceContent />
      </FormContext>
    </Sheet>
  );
}
