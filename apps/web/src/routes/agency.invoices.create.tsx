"use client";

import { FormProvider, useForm } from "react-hook-form";
import { InvoicingContent } from "./agency.invoices/create/_components/invoicing-content";

export default function InvoicingPage() {
  const form = useForm({
    defaultValues: {
      step: "1",
      yourEmail: "accounts@nisccloud.com",
      yourName: "Nisc Cloud Limited",
      yourAddress: "P.O BOX 21615",
      yourCity: "Nairobi",
      yourState: "",
      yourCountry: "Kenya",
      yourLogo: "",
      yourTaxId: "P052377334H",
      yourZip: "00505",
      email: "",
      companyName: "",
      companyAddress: "",
      companyCity: "",
      companyState: "",
      companyCountry: "",
      companyTaxId: "",
      companyZip: "",
      note: "",
      discount: "",
      taxPercentage: 16,
      items: [{ itemDescription: "" }],
      paymentMethod: "bank",
      bankName: "Absa Bank Limited",
      accountNumber: "2052676528",
      accountName: "Nisc Cloud Limited",
      branchName: "Hurlingham",
      branchCode: "045",
      swiftCode: "BARCKENX",
      mpesaPaybillNumber: "",
      mpesaAccountNumber: "",
      mpesaInstructions: "",
      chequeDeliveryAddress: "",
      chequeInstructions: "",
      qrCodeValue: "",
      invoiceNo: "",
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: "",
      currency: "KES",
    },
  });

  return (
    <FormProvider {...form}>
      <InvoicingContent />
    </FormProvider>
  );
}
