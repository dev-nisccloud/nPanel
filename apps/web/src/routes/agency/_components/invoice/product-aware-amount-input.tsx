"use client";

import { useFormContext } from "react-hook-form";
import type { NumericFormatProps } from "react-number-format";
import { AmountInput } from "./amount-input";

type Props = Omit<NumericFormatProps, "value" | "onChange"> & {
  name: string;
  lineItemIndex: number;
};

export function ProductAwareAmountInput({
  lineItemIndex,
  name,
  ...props
}: Props) {
  const { watch } = useFormContext();

  // Get current line item data
  const lineItemName = watch(`lineItems.${lineItemIndex}.name`);
  const currentUnit = watch(`lineItems.${lineItemIndex}.unit`);
  const currentProductId = watch(`lineItems.${lineItemIndex}.productId`);
  const currentPrice = watch(`lineItems.${lineItemIndex}.price`);
  const currency = watch("template.currency");

  const handleAmountBlur = () => {
    // Only save if we have a productId (meaning this line item references an existing product)
    if (currentProductId && lineItemName && lineItemName.trim().length > 0) {
      console.log("Save line item as product:", {
        name: lineItemName.trim(),
        price: currentPrice !== undefined ? currentPrice : null,
        unit: currentUnit || null,
        productId: currentProductId,
        currency: currency || null,
      });
    }
  };

  return (
    <AmountInput
      {...props}
      name={name}
      onBlur={(e) => {
        // Call original onBlur if it exists
        props.onBlur?.(e);
        // Update product with new price
        handleAmountBlur();
      }}
    />
  );
}
