"use client";
import CustomTextInput from "@/routes/agency.invoices/create/_components/ui/customTextInput";
import DateInput from "@/routes/agency.invoices/create/_components/ui/dateInput";
import { useFormContext } from "react-hook-form";
import { useEffect } from "react";
import { trpc } from "@/utils/trpc";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { ScuInformationFields } from "@/routes/agency.invoices/create/_components/form/invoiceTerms/scuInformationFields";

export const InvoiceTermsForm = () => {
  const { setValue, watch } = useFormContext();
  const invoiceNumber = watch("invoiceNo");

  // Fetch next invoice number when creating a new invoice
  // Always fetch fresh data to ensure we get the latest counter value
  const { data: nextInvoiceData, isLoading: isLoadingNextNumber } = trpc.invoicing.getNextInvoiceNumber.useQuery(
    undefined,
    {
      staleTime: 0, // Always consider data stale - fetch fresh on every mount
      gcTime: 0, // Don't cache - we need the absolute latest value
      refetchOnMount: true, // Always refetch when component mounts
      refetchOnWindowFocus: true, // Refetch when window regains focus
      refetchOnReconnect: true, // Refetch on reconnect
    }
  );

  // Auto-populate invoice number when data is available
  useEffect(() => {
    if (nextInvoiceData?.invoiceNumber && !invoiceNumber) {
      setValue("invoiceNo", nextInvoiceData.invoiceNumber, { shouldValidate: false });
    }
  }, [nextInvoiceData?.invoiceNumber, invoiceNumber, setValue]);

  return (
    <div className="pt-24">
      <p className="text-2xl font-semibold pb-3">Invoice terms</p>
      <div className="relative">
        {isLoadingNextNumber ? (
          <div className="flex items-center gap-2 h-[52px]">
            <label className="block text-sm font-medium leading-6 text-gray-900 whitespace-nowrap">
              Invoice number
            </label>
            <div className="flex items-center gap-2 flex-1 justify-end">
              <Spinner variant="ellipsis" size={16} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Generating...</span>
            </div>
          </div>
        ) : (
          <CustomTextInput
            label="Invoice number"
            placeholder="INVOICE-01"
            variableName="invoiceNo"
            readOnly={true}
          />
        )}
      </div>
      <DateInput label="Issue date" variableName="issueDate" />
      <DateInput label="Due date" variableName="dueDate" />
      <ScuInformationFields />
    </div>
  );
};

