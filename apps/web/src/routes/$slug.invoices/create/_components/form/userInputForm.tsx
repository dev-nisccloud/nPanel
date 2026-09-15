"use client";

import { DownloadInvoiceButton } from "@/routes/agency.invoices/create/_components/form/downloadInvoice/downloadInvoiceButton";
import { InvoiceDetailsForm } from "@/routes/agency.invoices/create/_components/form/invoiceDetails/invoiceDetailsForm";
import { InvoiceTermsForm } from "@/routes/agency.invoices/create/_components/form/invoiceTerms/invoiceTermsForm";
import { PaymentDetailsForm } from "@/routes/agency.invoices/create/_components/form/paymentDetails/paymentDetailsForm";
import { CompanyDetailsForm } from "@/routes/agency.invoices/create/_components/form/companyDetails/companyDetailsForm";
import { YourDetailsForm } from "@/routes/agency.invoices/create/_components/form/yourDetails/yourDetailsForm";
import { useGetValue } from "@/routes/agency.invoices/create/hooks/useGetValue";

export const UserInputForm = () => {
  const step = useGetValue("step", "1");

  return (
    <div>
      <div className={step === "1" ? "block" : "hidden"}>
        <YourDetailsForm />
      </div>
      <div className={step === "2" ? "block pt-24" : "hidden"}>
        <CompanyDetailsForm />
      </div>
      <div className={step === "3" ? "block" : "hidden"}>
        <InvoiceDetailsForm />
      </div>
      <div className={step === "4" ? "block" : "hidden"}>
        <PaymentDetailsForm />
      </div>
      <div className={step === "5" ? "block" : "hidden"}>
        <InvoiceTermsForm />
      </div>
      {step === "6" && <DownloadInvoiceButton />}
    </div>
  );
};

