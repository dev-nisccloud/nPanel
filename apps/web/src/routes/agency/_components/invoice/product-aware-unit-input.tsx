"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "./input";

type Props = {
  name: string;
  lineItemIndex: number;
};

export function ProductAwareUnitInput({
  lineItemIndex,
  name,
  ...props
}: Props) {
  const { watch } = useFormContext();

  // Get current line item data
  const lineItemName = watch(`lineItems.${lineItemIndex}.name`);
  const currentPrice = watch(`lineItems.${lineItemIndex}.price`);
  const currentProductId = watch(`lineItems.${lineItemIndex}.productId`);
  const currentUnit = watch(`lineItems.${lineItemIndex}.unit`);
  const currency = watch("template.currency");

  const handleUnitBlur = () => {
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
    <Input
      {...props}
      name={name}
      onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
        // Update product with new unit
        handleUnitBlur();
      }}
    />
  );
}
