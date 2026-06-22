import { Input } from "@/components/ui/input.tsx";
import { cn } from "@/lib/utils.ts";

const READ_ONLY_INPUT_CLASS =
  "bg-muted/50 cursor-default text-foreground disabled:opacity-100";

export type MpesaPaymentFieldsProps = {
  currency: string;
  phoneNumber: string;
  onPhoneNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  phoneError?: string;
  amount: string;
  amountHelperText?: string;
  accountReference: string;
  accountRefHelperText?: string;
  idPrefix?: string;
};

export function MpesaPaymentFields({
  currency,
  phoneNumber,
  onPhoneNumberChange,
  phoneError,
  amount,
  amountHelperText,
  accountReference,
  accountRefHelperText,
  idPrefix = "storefront-mpesa",
}: MpesaPaymentFieldsProps) {
  return (
    <div className="grid max-w-full grid-cols-1 gap-2.5 sm:items-start sm:gap-3 sm:grid-cols-3">
      <div className="min-w-0 space-y-1">
        <label htmlFor={`${idPrefix}-phone`} className="text-xs font-medium text-foreground">
          Phone number <span className="text-destructive">*</span>
        </label>
        <Input
          id={`${idPrefix}-phone`}
          placeholder="0712345678"
          value={phoneNumber}
          onChange={onPhoneNumberChange}
          className={cn("h-9", phoneError && "border-destructive")}
        />
        {phoneError ? (
          <p className="text-[11px] text-destructive">{phoneError}</p>
        ) : (
          <p className="text-[11px] text-muted-foreground">M-Pesa registered number</p>
        )}
      </div>

      <div className="min-w-0 space-y-1">
        <label htmlFor={`${idPrefix}-amount`} className="text-xs font-medium text-foreground">
          Amount ({currency}) <span className="text-destructive">*</span>
        </label>
        <Input
          id={`${idPrefix}-amount`}
          type="number"
          value={amount}
          readOnly
          disabled
          className={cn("h-9", READ_ONLY_INPUT_CLASS)}
        />
        {amountHelperText ? (
          <p className="text-[11px] text-muted-foreground">{amountHelperText}</p>
        ) : null}
      </div>

      <div className="min-w-0 space-y-1">
        <label htmlFor={`${idPrefix}-reference`} className="text-xs font-medium text-foreground">
          Account reference <span className="text-destructive">*</span>
        </label>
        <Input
          id={`${idPrefix}-reference`}
          value={accountReference}
          readOnly
          disabled
          className={cn("h-9", READ_ONLY_INPUT_CLASS)}
          maxLength={12}
        />
        {accountRefHelperText ? (
          <p className="text-[11px] text-muted-foreground">{accountRefHelperText}</p>
        ) : null}
      </div>
    </div>
  );
}
