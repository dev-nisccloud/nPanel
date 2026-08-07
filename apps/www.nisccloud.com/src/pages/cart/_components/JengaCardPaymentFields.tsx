import * as React from "react";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import type { StorefrontJengaCustomer } from "@/lib/storefront-checkout-api.ts";

export type JengaCardPaymentFieldsProps = {
  value: StorefrontJengaCustomer;
  onChange: (next: StorefrontJengaCustomer) => void;
  errors?: Partial<Record<keyof StorefrontJengaCustomer, string>>;
  disabled?: boolean;
};

export function JengaCardPaymentFields({
  value,
  onChange,
  errors,
  disabled,
}: JengaCardPaymentFieldsProps) {
  const set =
    (key: keyof StorefrontJengaCustomer) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue =
        key === "countryCode" ? e.target.value.toUpperCase() : e.target.value;
      onChange({ ...value, [key]: nextValue });
    };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        You will enter card details on a secure payment page. Confirm billing details below.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="sf-jenga-first">First name</Label>
          <Input
            id="sf-jenga-first"
            value={value.customerFirstName}
            onChange={set("customerFirstName")}
            disabled={disabled}
            className={errors?.customerFirstName ? "border-destructive" : undefined}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sf-jenga-last">Last name</Label>
          <Input
            id="sf-jenga-last"
            value={value.customerLastName}
            onChange={set("customerLastName")}
            disabled={disabled}
            className={errors?.customerLastName ? "border-destructive" : undefined}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sf-jenga-email">Email</Label>
        <Input
          id="sf-jenga-email"
          type="email"
          value={value.customerEmail}
          onChange={set("customerEmail")}
          disabled={disabled}
          className={errors?.customerEmail ? "border-destructive" : undefined}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sf-jenga-phone">Phone</Label>
        <Input
          id="sf-jenga-phone"
          value={value.customerPhone}
          onChange={set("customerPhone")}
          disabled={disabled}
          className={errors?.customerPhone ? "border-destructive" : undefined}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sf-jenga-address">Address</Label>
        <Input
          id="sf-jenga-address"
          value={value.customerAddress}
          onChange={set("customerAddress")}
          disabled={disabled}
          className={errors?.customerAddress ? "border-destructive" : undefined}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="sf-jenga-postal">Postal code</Label>
          <Input
            id="sf-jenga-postal"
            value={value.customerPostalCodeZip}
            onChange={set("customerPostalCodeZip")}
            disabled={disabled}
            className={errors?.customerPostalCodeZip ? "border-destructive" : undefined}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sf-jenga-country">Country</Label>
          <Input
            id="sf-jenga-country"
            value={value.countryCode}
            onChange={set("countryCode")}
            maxLength={2}
            disabled={disabled}
            className={errors?.countryCode ? "border-destructive" : undefined}
          />
        </div>
      </div>
    </div>
  );
}
