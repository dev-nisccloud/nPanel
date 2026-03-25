import { calculateTotal } from "@npanel/invoice/calculate";
import { useCallback, useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { AnimatedNumber } from "@/components/npanel-ui/animated-number";
import { FormatAmount } from "@/components/npanel-ui/format-amount";
import { AmountInput } from "./amount-input";
import { LabelInput } from "./label-input";
import { TaxInput } from "./tax-input";
import { VATInput } from "./vat-input";

export function Summary() {
  const { control, setValue } = useFormContext();
  const [isUpdatingTemplate, setIsUpdatingTemplate] = useState(false);

  const includeDecimals = useWatch({
    control,
    name: "template.includeDecimals",
  });

  const maximumFractionDigits = includeDecimals ? 2 : 0;

  const currency = useWatch({
    control,
    name: "template.currency",
  });

  const locale = useWatch({
    control,
    name: "template.locale",
  });

  const includeTax = useWatch({
    control,
    name: "template.includeTax",
  });

  const taxRate = useWatch({
    control,
    name: "template.taxRate",
  });

  const vatRate = useWatch({
    control,
    name: "template.vatRate",
  });

  const includeVat = useWatch({
    control,
    name: "template.includeVat",
  });

  const includeDiscount = useWatch({
    control,
    name: "template.includeDiscount",
  });

  const lineItems = useWatch({
    control,
    name: "lineItems",
  });

  const discount = useWatch({
    control,
    name: "discount",
  });

  const {
    subTotal,
    total,
    vat: totalVAT,
    tax: totalTax,
  } = calculateTotal({
    lineItems,
    taxRate,
    vatRate,
    includeVat,
    includeTax,
    discount: discount ?? 0,
  });

  const updateFormValues = useCallback(() => {
    setValue("amount", total, { shouldValidate: false });
    setValue("vat", totalVAT, { shouldValidate: false });
    setValue("tax", totalTax, { shouldValidate: false });
    setValue("subtotal", subTotal, { shouldValidate: false });
    setValue("discount", discount ?? 0, { shouldValidate: false });
  }, [total, totalVAT, totalTax, subTotal, discount]);

  useEffect(() => {
    updateFormValues();
  }, [updateFormValues]);

  useEffect(() => {
    if (!includeTax) {
      setValue("template.taxRate", 0, {
        shouldValidate: false,
        shouldDirty: true,
      });
    }
  }, [includeTax]);

  useEffect(() => {
    if (!includeVat) {
      setValue("template.vatRate", 0, {
        shouldValidate: false,
        shouldDirty: true,
      });
    }
  }, [includeVat]);

  useEffect(() => {
    if (!includeDiscount) {
      setValue("discount", 0, { shouldValidate: false, shouldDirty: true });
    }
  }, [includeDiscount]);

  return (
    <div className="w-[320px] flex flex-col">
      <div className="flex justify-between items-center py-1">
        <LabelInput
          className="flex-shrink-0 min-w-6"
          name="template.subtotalLabel"
          onSave={(value) => {
            setIsUpdatingTemplate(true);
            console.log("Update template:", { subtotalLabel: value });
            setTimeout(() => setIsUpdatingTemplate(false), 500);
          }}
        />
        <span className="text-right font-mono text-[11px] text-[#878787]">
          <FormatAmount
            amount={subTotal}
            maximumFractionDigits={maximumFractionDigits}
            currency={currency}
            locale={locale}
          />
        </span>
      </div>

      {includeDiscount && (
        <div className="flex justify-between items-center py-1">
          <LabelInput
            name="template.discountLabel"
            onSave={(value) => {
              console.log("Update template:", { discountLabel: value });
            }}
          />

          <AmountInput
            placeholder="0"
            allowNegative={false}
            name="discount"
            className="text-right font-mono text-[11px] text-[#878787] border-none"
          />
        </div>
      )}

      {includeVat && (
        <div className="flex justify-between items-center py-1">
          <div className="flex items-center gap-1">
            <LabelInput
              className="flex-shrink-0 min-w-5"
              name="template.vatLabel"
              onSave={(value) => {
                console.log("Update template:", { vatLabel: value });
              }}
            />

            <VATInput />
          </div>

          <span className="text-right font-mono text-[11px] text-[#878787]">
            <FormatAmount
              amount={totalVAT}
              maximumFractionDigits={2}
              currency={currency}
              locale={locale}
            />
          </span>
        </div>
      )}

      {includeTax && (
        <div className="flex justify-between items-center py-1">
          <div className="flex items-center gap-1">
            <LabelInput
              className="flex-shrink-0 min-w-5"
              name="template.taxLabel"
              onSave={(value) => {
                console.log("Update template:", { taxLabel: value });
              }}
            />

            <TaxInput />
          </div>

          <span className="text-right font-mono text-[11px] text-[#878787]">
            <FormatAmount
              amount={totalTax}
              maximumFractionDigits={2}
              currency={currency}
              locale={locale}
            />
          </span>
        </div>
      )}

      <div className="flex justify-between items-center py-4 mt-2 border-t border-border">
        <LabelInput
          name="template.totalSummaryLabel"
          onSave={(value) => {
            console.log("Update template:", { totalSummaryLabel: value });
          }}
        />
        <span className="text-right font-mono font-medium text-[21px]">
          <AnimatedNumber
            value={total}
            currency={currency}
            maximumFractionDigits={
              includeTax || includeVat ? 2 : maximumFractionDigits
            }
          />
        </span>
      </div>
    </div>
  );
}
