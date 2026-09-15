"use client";

import { FormProvider, useForm } from "react-hook-form";
import { InvoicingContent } from "./$slug.invoices/create/_components/invoicing-content";

export default function InvoicingPage() {
  const form = useForm({
    defaultValues: {
      step: "1",
      yourEmail: "",
      yourName: "",
      yourAddress: "",
      yourCity: "",
      yourState: "",
      yourCountry: "",
      yourLogo: "",
      yourTaxId: "",
      yourZip: "",
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
      taxPercentage: undefined,
      items: [{ itemDescription: "" }],
      paymentMethod: "bank",
      bankName: "",
      accountNumber: "",
      accountName: "",
      branchName: "",
      branchCode: "",
      swiftCode: "",
      mpesaPaybillNumber: "",
      mpesaAccountNumber: "",
      mpesaInstructions: "",
      chequeDeliveryAddress: "",
      chequeInstructions: "",
      qrCodeValue: "",
      invoiceNo: "",
      issueDate: "",
      dueDate: "",
      currency: "KES",
      invoiceStatus: "DRAFT",
      scuSdcId: "",
      scuDate: "",
      scuTime: "",
      scuCurRcptNo: "",
      scuTotRcptNo: "",
      scuIntrlData: "",
      scuRcptSign: "",
    },
  });

  return (
    <FormProvider {...form}>
      <InvoicingContent />
    </FormProvider>
  );
}

