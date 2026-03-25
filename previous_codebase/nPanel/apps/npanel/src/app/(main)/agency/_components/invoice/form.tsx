import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { formatRelativeTime } from "@/utils/format";
import { ScrollArea } from "@nPanel/ui/scroll-area";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useDebounceValue } from "usehooks-ts";
import { CustomerDetails } from "./customer-details";
import { EditBlock } from "./edit-block";
import type { InvoiceFormValues } from "./form-context";
import { FromDetails } from "./from-details";
import { LineItems } from "./line-items";
import { Logo } from "./logo";
import { Meta } from "./meta";
import { NoteDetails } from "./note-details";
import { PaymentDetails } from "./payment-details";
import { SubmitButton } from "./submit-button";
import { Summary } from "./summary";

export function Form() {
  const { invoiceId, setParams } = useInvoiceParams();
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>();
  const [lastEditedText, setLastEditedText] = useState("");
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const form = useFormContext();
  const token = form.watch("token");

  // Only watch the fields that are used in the upsert action
  const formValues = useWatch({
    control: form.control,
    name: [
      "customerDetails",
      "customerId",
      "customerName",
      "template",
      "lineItems",
      "amount",
      "vat",
      "tax",
      "discount",
      "dueDate",
      "issueDate",
      "noteDetails",
      "paymentDetails",
      "fromDetails",
      "invoiceNumber",
      "topBlock",
      "bottomBlock",
      "scheduledAt",
    ],
  });

  const isDirty = form.formState.isDirty;
  const invoiceNumberValid = !form.getFieldState("invoiceNumber").error;
  const [debouncedValue] = useDebounceValue(formValues, 500);

  useEffect(() => {
    if (isDirty && form.watch("customerId") && invoiceNumberValid) {
      const currentFormValues = form.getValues();
      
      // Simulate draft saving with local state
      setIsDraftSaving(true);
      setTimeout(() => {
        setLastUpdated(new Date());
        setIsDraftSaving(false);
        
        // Generate a token for preview if not exists
        if (!token) {
          form.setValue("token", `preview-${Date.now()}`);
        }
      }, 500);
    }
  }, [debouncedValue, isDirty, invoiceNumberValid, token, form]);

  useEffect(() => {
    const updateLastEditedText = () => {
      if (!lastUpdated) {
        setLastEditedText("");
        return;
      }

      setLastEditedText(`Edited ${formatRelativeTime(lastUpdated)}`);
    };

    updateLastEditedText();
    const intervalId = setInterval(updateLastEditedText, 1000);

    return () => clearInterval(intervalId);
  }, [lastUpdated]);

  // Submit the form and create invoice
  const handleSubmit = (values: InvoiceFormValues) => {
    setIsCreating(true);
    
    // Simulate invoice creation
    setTimeout(() => {
      setIsCreating(false);
      toast.success("Invoice created successfully!");
      setParams({ type: "success", invoiceId: values.id });
    }, 1000);
  };

  // Prevent form from submitting when pressing enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  return (
    <form
      // @ts-expect-error
      onSubmit={form.handleSubmit(handleSubmit)}
      className="relative h-full"
      onKeyDown={handleKeyDown}
    >
      <ScrollArea className="h-[calc(100vh-200px)] bg-background">
        <div className="p-8 pb-4 h-full flex flex-col">
          <div className="flex justify-between">
            <Meta />
            <Logo />
          </div>

          <div className="grid grid-cols-2 gap-6 mt-8 mb-4">
            <div>
              <FromDetails />
            </div>
            <div>
              <CustomerDetails />
            </div>
          </div>

          <EditBlock name="topBlock" />

          <div className="mt-4">
            <LineItems />
          </div>

          <div className="mt-12 flex justify-end mb-8">
            <Summary />
          </div>

          <div className="flex flex-col mt-auto">
            <div className="grid grid-cols-2 gap-6 mb-4 overflow-hidden">
              <PaymentDetails />
              <NoteDetails />
            </div>

            <EditBlock name="bottomBlock" />
          </div>
        </div>
      </ScrollArea>

      <div className="absolute bottom-14 w-full h-9">
        <div className="flex justify-between items-center mt-auto">
          <div className="flex space-x-2 items-center text-xs text-[#808080]">
            {(isDraftSaving || lastEditedText) && (
              <span>
                {isDraftSaving ? "Saving" : lastEditedText}
              </span>
            )}
          </div>

          <SubmitButton
            isSubmitting={isCreating}
            disabled={isCreating || isDraftSaving}
          />
        </div>
      </div>
    </form>
  );
}
