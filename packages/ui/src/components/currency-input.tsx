import { NumericFormat, type NumericFormatProps } from "react-number-format";
import { Input } from "@npanel/ui/components/input";

export function CurrencyInput({
  thousandSeparator = true,
  ...props
}: NumericFormatProps) {
  return (
    <NumericFormat
      thousandSeparator={thousandSeparator}
      customInput={Input}
      {...props}
    />
  );
}
