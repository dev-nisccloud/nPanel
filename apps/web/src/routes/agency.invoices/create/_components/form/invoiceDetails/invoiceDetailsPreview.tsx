import React from "react";
import { currencyList } from "@/lib/currency";
import { ChevronDown } from "lucide-react";
import type { InvoiceItemDetails, Item } from "@/routes/agency.invoices/create/types";

export const InvoiceDetailsPreview: React.FC<
  InvoiceItemDetails & { onClick?: (step: string) => void }
> = ({ note, discount, taxPercentage, items, currency = "KES", onClick }) => {
  const currencyType = currency;
  const currencyDetails = currencyList.find(
    (currency) => currency.value.toLowerCase() === currencyType.toLowerCase()
  )?.details;
  const subtotal = calculateTotalAmount(items);
  const discountAmount = subtotal - (discount ? +discount : 0);
  const taxAmount = discountAmount * ((taxPercentage || 0) / 100);
  const totalAmount = roundTotalIfExceeds(discountAmount + taxAmount);

  return (
    <div
      className="group cursor-pointer relative"
      onClick={() => onClick && onClick("3")}
    >
      {!!onClick && (
        <>
          <ChevronDown className="animate-pulse w-5 h-5 text-orange-500 rotate-[135deg] group-hover:block hidden absolute top-0 left-0" />
          <ChevronDown className="animate-pulse w-5 h-5 text-orange-500 -rotate-[135deg] group-hover:block hidden absolute top-0 right-0" />
          <ChevronDown className="animate-pulse w-5 h-5 text-orange-500 rotate-45 group-hover:block hidden absolute bottom-0 left-0" />
          <ChevronDown className="animate-pulse w-5 h-5 text-orange-500 -rotate-45 group-hover:block hidden absolute bottom-0 right-0 " />
        </>
      )}
      <div className="grid grid-cols-2 items-center">
        <div className="py-4 px-10">
          <p className="text-[11px] text-neutral-400 font-medium uppercase">
            Description
          </p>
        </div>
        <div className="py-4 px-10 grid grid-cols-3 items-center">
          <div>
            <p className="text-[11px] text-neutral-400 font-medium uppercase">
              QTY
            </p>
          </div>
          <div>
            <p className="text-[11px] text-neutral-400 font-medium uppercase">
              Price
            </p>
          </div>
          <div>
            <p className="text-[11px] text-neutral-400 font-medium uppercase text-right">
              Amount
            </p>
          </div>
        </div>
      </div>
      {items.map(({ itemDescription, amount, qty, billingCycle }, index) => (
        <div
          className={`grid grid-cols-2 items-start border-b ${
            index === 0 ? "border-t" : ""
          } border-dashed mx-10 py-3 gap-x-4`}
          key={index}
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-600 break-words whitespace-normal">
              {itemDescription}
            </p>
            {billingCycle && (
              <p className="text-[10px] text-gray-500 mt-1">
                Billing: {formatBillingCycle(billingCycle)}
              </p>
            )}
          </div>
          <div className="pl-10 grid grid-cols-3 items-center gap-2">
            <p className="text-xs font-medium text-gray-600">
              {qty || "-"}
            </p>
            <p className="text-xs font-medium text-gray-600 break-words">
              {amount != null ? formatMoney(amount) : ""}
            </p>
            <p className="text-xs font-medium text-gray-600 text-right break-words">
              {currencyDetails?.currencySymbol}
              {amount != null && <>&nbsp;{formatMoney((qty ? qty : 1) * amount)}</>}
            </p>
          </div>
        </div>
      ))}
      <div className="grid grid-cols-2">
        {note ? (
          <div className="pt-6 pb-4">
            <p className="flex truncate text-xs font-medium text-neutral-400 pb-1 px-10">
              Note
            </p>
            <p className="text-xs font-medium text-neutral-400 px-10 break-words">
              {note}
            </p>
          </div>
        ) : (
          <div />
        )}
        <div>
          <div className="flex justify-between items-center mx-10 border-b border-dashed py-3 gap-4">
            <p className="text-xs font-medium text-gray-600 flex-shrink-0">
              Subtotal
            </p>
            <p className="text-xs font-medium text-gray-600 text-right break-words">
              {currencyDetails?.currencySymbol}&nbsp;{formatMoney(subtotal)}
            </p>
          </div>
          {discount && (
            <div className="flex justify-between items-center mx-10 border-b border-dashed py-3 gap-4">
              <p className="text-xs font-medium text-gray-600 flex-shrink-0">
                Discount
              </p>
              <p className="text-xs font-medium text-gray-600 text-right break-words">
                {currencyDetails?.currencySymbol}&nbsp;{discount ? formatMoney(+discount) : ""}
              </p>
            </div>
          )}
          {taxPercentage && (
            <div className="flex justify-between items-center mx-10 border-b border-dashed py-3 gap-4">
              <p className="text-xs font-medium text-gray-600 flex-shrink-0">
                Tax ({taxPercentage})%
              </p>
              <p className="text-xs font-medium text-gray-600 text-right break-words">
                {currencyDetails?.currencySymbol}&nbsp;{formatMoney(taxAmount)}
              </p>
            </div>
          )}
          <div className="flex justify-between items-center px-10 py-3 gap-4">
            <div className="flex-shrink-0">
              <p className="text-xs font-medium text-gray-600">
                Amount
              </p>
            </div>
            <p className="text-sm font-semibold text-gray-700 text-right break-words">
              <span>{currencyDetails?.currencySymbol}</span>
              <span>&nbsp;{formatMoney(totalAmount)}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const calculateTotalAmount = (items: Item[]): number =>
  items.reduce((total, item) => {
    const quantity = item.qty ? +item.qty : 1;
    const amount = item.amount ? +item.amount : 0;
    return total + quantity * amount;
  }, 0);

const formatMoney = (value: number): string => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
};

/**
 * Rounds the total amount to 2 decimal places only if it exceeds 2 decimal places
 */
const roundTotalIfExceeds = (amount: number): number => {
  const decimalPlaces = (amount.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    return Math.round(amount * 100) / 100;
  }
  return amount;
};

const formatBillingCycle = (cycle: string): string => {
  const cycleMap: Record<string, string> = {
    '__unset__': 'None',
    'one-time': 'One Time',
    'monthly': 'Monthly',
    'quarterly': 'Quarterly',
    'annually': 'Annually',
  };
  return cycleMap[cycle] || cycle;
};

