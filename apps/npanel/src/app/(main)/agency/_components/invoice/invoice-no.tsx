"use client";

import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { cn } from "@nPanel/ui/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@nPanel/ui/tooltip";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "./input";
import { LabelInput } from "./label-input";

export function InvoiceNo() {
  const {
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useFormContext();
  const invoiceNumber = watch("invoiceNumber");
  const [isUpdatingTemplate, setIsUpdatingTemplate] = useState(false);

  const { type } = useInvoiceParams();

  // Mock invoice number search
  const [existingInvoiceNumbers] = useState<string[]>([
    "INV-001",
    "INV-002", 
    "INV-003"
  ]);

  const isInvoiceNumberExists = type === "create" && 
    invoiceNumber !== "" && 
    existingInvoiceNumbers.includes(invoiceNumber);

  useEffect(() => {
    if (isInvoiceNumberExists) {
      setError("invoiceNumber", {
        type: "manual",
        message: "Invoice number already exists",
      });
    } else {
      clearErrors("invoiceNumber");
    }
  }, [isInvoiceNumberExists, setError, clearErrors]);

  return (
    <div className="flex space-x-1 items-center">
      <div className="flex items-center flex-shrink-0">
        <LabelInput
          name="template.invoiceNoLabel"
          onSave={(value) => {
            setIsUpdatingTemplate(true);
            console.log("Update template:", { invoiceNoLabel: value });
            setTimeout(() => setIsUpdatingTemplate(false), 500);
          }}
          className="truncate"
        />
        <span className="text-[11px] text-[#878787] font-mono flex-shrink-0">
          :
        </span>
      </div>

      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Input
                name="invoiceNumber"
                className={cn(
                  "w-28 flex-shrink p-0 border-none text-[11px] h-4.5 overflow-hidden",
                  errors.invoiceNumber ? "text-red-500" : "",
                )}
              />
            </div>
          </TooltipTrigger>
          {errors.invoiceNumber && (
            <TooltipContent className="text-xs px-3 py-1.5">
              <p>Invoice number already exists</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
