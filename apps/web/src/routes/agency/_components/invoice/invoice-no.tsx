"use client";

import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { cn } from "@npanel/ui/components/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@npanel/ui/components/tooltip";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { trpc } from "@/utils/trpc";
import { Input } from "./input";
import { LabelInput } from "./label-input";

export function InvoiceNo() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();
  const invoiceNumber = watch("invoiceNumber");
  const [isUpdatingTemplate, setIsUpdatingTemplate] = useState(false);

  const { type } = useInvoiceParams();

  // Fetch next invoice number when creating a new invoice
  const { data: nextInvoiceData, isLoading: isLoadingNextNumber } = trpc.invoicing.getNextInvoiceNumber.useQuery(
    undefined,
    {
      enabled: type === "create",
      staleTime: 5 * 60 * 1000, // 5 minutes - invoice numbers don't change frequently
      gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
      refetchOnWindowFocus: false, // Don't refetch on window focus
    }
  );

  // Auto-populate invoice number when creating and data is available
  useEffect(() => {
    if (type === "create" && nextInvoiceData?.invoiceNumber && !invoiceNumber) {
      setValue("invoiceNumber", nextInvoiceData.invoiceNumber, { shouldValidate: false });
    }
  }, [type, nextInvoiceData?.invoiceNumber, invoiceNumber, setValue]);

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
            <div className="relative">
              {isLoadingNextNumber && type === "create" ? (
                <div className="flex items-center gap-1.5 w-28 h-4.5">
                  <Spinner variant="ellipsis" size={12} className="text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <Input
                  name="invoiceNumber"
                  className={cn(
                    "w-28 flex-shrink p-0 border-none text-[11px] h-4.5 overflow-hidden",
                    errors.invoiceNumber ? "text-red-500" : "",
                  )}
                />
              )}
            </div>
          </TooltipTrigger>
          {errors.invoiceNumber && (
            <TooltipContent className="text-xs px-3 py-1.5">
              <p>{errors.invoiceNumber.message as string || "Invalid invoice number"}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

