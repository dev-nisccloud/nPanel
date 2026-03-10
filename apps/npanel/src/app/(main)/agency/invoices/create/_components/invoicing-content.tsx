"use client";

import { useFormContext } from "react-hook-form";
import { UserInputForm } from "./form/userInputForm";
import { FormSteps } from "./form/step/fromSteps";
import { PreviewDetails } from "./form/previewDetails";
import { useData } from "../hooks/useData";

export const InvoicingContent = () => {
  const form = useFormContext();
  const { companyDetails, yourDetails, invoiceDetails, paymentDetails, invoiceTerms } = useData();
  const step = form.watch("step");

  const handleStepClick = (newStep: string) => {
    form.setValue("step", newStep);
  };

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-base font-semibold tracking-tight">Create Invoice</h1>
        <p className="text-xs text-muted-foreground">
          Create and customize your invoice with a step-by-step process.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <UserInputForm />
          {step !== "6" && <FormSteps />}
        </div>
        <div className="hidden lg:block sticky top-6 h-fit">
          <PreviewDetails
            yourDetails={yourDetails}
            companyDetails={companyDetails}
            invoiceDetails={invoiceDetails}
            paymentDetails={paymentDetails}
            invoiceTerms={invoiceTerms}
            onClick={handleStepClick}
          />
        </div>
      </div>
    </div>
  );
};

