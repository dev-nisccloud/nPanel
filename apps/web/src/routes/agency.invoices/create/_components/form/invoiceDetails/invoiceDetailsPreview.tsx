import React from "react";
import { currencyList } from "@/lib/currency";
import { ChevronDown } from "lucide-react";
import type { InvoiceItemDetails } from "@/routes/agency.invoices/create/types";
import {
  buildTisReceiptTotals,
  formatTisMoney,
  tisCreditNoteBandLines,
  tisTaxRateLabel,
  type TisReceiptTotals,
} from "@npanel/api/agency-invoice-pdf/tis-receipt-totals";

export const InvoiceDetailsPreview: React.FC<
  InvoiceItemDetails & { onClick?: (step: string) => void }
> = ({
  note,
  discount,
  taxPercentage,
  taxRate,
  items,
  currency = "KES",
  negateAmounts = false,
  taxBuckets,
  onClick,
}) => {
  const currencyType = currency;
  const currencyDetails = currencyList.find(
    (currency) => currency.value.toLowerCase() === currencyType.toLowerCase()
  )?.details;
  const symbol = currencyDetails?.currencySymbol ?? "";
  const tax = taxPercentage ?? (taxRate != null && String(taxRate).trim() !== "" ? Number(taxRate) : undefined);
  const totals = buildTisReceiptTotals({
    items,
    discount,
    taxRate: tax,
    taxBuckets,
  });
  const sign = negateAmounts ? -1 : 1;

  const money = (n: number) => `${symbol} ${formatTisMoney(sign * n)}`;

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
      {items.map(({ itemDescription, amount, qty, billingCycle, etimsTaxTyCd }, index) => {
        const taxRateLabel = tisTaxRateLabel(etimsTaxTyCd);
        return (
        <div
          className={`grid grid-cols-2 items-start border-b ${
            index === 0 ? "border-t" : ""
          } border-dashed mx-10 py-3 gap-x-4`}
          key={index}
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-600 break-words whitespace-pre-wrap">
              {itemDescription}
            </p>
            {billingCycle && (
              <p className="text-[10px] text-gray-500 mt-1">
                Billing: {formatBillingCycle(billingCycle)}
              </p>
            )}
            {taxRateLabel && (
              <p className="text-[10px] text-gray-500 mt-1">
                Tax rate: {taxRateLabel}
              </p>
            )}
          </div>
          <div className="pl-10 grid grid-cols-3 items-center gap-2">
            <p className="text-xs font-medium text-gray-600">
              {qty || "-"}
            </p>
            <p className="text-xs font-medium text-gray-600 break-words">
              {amount != null ? formatTisMoney(sign * amount) : ""}
            </p>
            <p className="text-xs font-medium text-gray-600 text-right break-words">
              {currencyDetails?.currencySymbol}
              {amount != null && <>&nbsp;{formatTisMoney(sign * (qty ? qty : 1) * amount)}</>}
            </p>
          </div>
        </div>
        );
      })}
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
          {negateAmounts ? (
            <>
              <PreviewTotalsRow label="Total" value={money(totals.total)} bold />
              {tisCreditNoteBandLines(totals).map((band) => (
                <React.Fragment key={band.taxableLabel}>
                  <PreviewTotalsRow label={band.taxableLabel} value={money(band.taxable)} />
                  <PreviewTotalsRow label={band.taxLabel} value={money(band.vat)} />
                </React.Fragment>
              ))}
              <PreviewTotalsRow label="Total Tax" value={money(totals.vat)} />
              <PreviewTotalsRow label="Items Number" value={String(totals.itemCount)} last />
              <PreviewTaxTable totals={totals} money={money} />
            </>
          ) : (
            <>
              <PreviewTotalsRow label="Total before discount" value={money(totals.totalBeforeDiscount)} />
              {totals.discountAwarded ? (
                <PreviewTotalsRow
                  label="Total discount awarded"
                  value={`(${formatTisMoney(totals.discountAwarded)})`}
                />
              ) : null}
              <PreviewTotalsRow label="Sub total" value={money(totals.subTotal)} />
              <PreviewTotalsRow label="VAT" value={money(totals.vat)} />
              <PreviewTotalsRow label="Total" value={money(totals.total)} bold />
              <PreviewTotalsRow label="Items Number" value={String(totals.itemCount)} />
              <PreviewTaxTable totals={totals} money={money} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function PreviewTaxTable({
  totals,
  money,
}: {
  totals: TisReceiptTotals;
  money: (n: number) => string;
}) {
  return (
    <table className="mx-10 mt-2 w-[calc(100%-5rem)] border-collapse border border-gray-400 text-[10px] text-gray-600">
      <thead>
        <tr>
          <th className="border border-gray-300 px-2 py-1 text-left font-medium">Rate</th>
          <th className="border border-gray-300 px-2 py-1 text-right font-medium">Taxable Amount</th>
          <th className="border border-gray-300 px-2 py-1 text-right font-medium">VAT</th>
        </tr>
      </thead>
      <tbody>
        {totals.taxTable.map((row) => (
          <tr key={row.band}>
            <td className="border border-gray-300 px-2 py-1">{row.rateLabel}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.taxable)}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.vat)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PreviewTotalsRow({
  label,
  value,
  bold,
  last,
}: {
  label: string;
  value: string;
  bold?: boolean;
  last?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center mx-10 py-3 gap-4 ${last ? "" : "border-b border-dashed"}`}>
      <p className={`text-xs font-medium text-gray-600 flex-shrink-0 ${bold ? "font-semibold" : ""}`}>
        {label}
      </p>
      <p className={`text-xs text-gray-600 text-right break-words ${bold ? "text-sm font-semibold text-gray-700" : ""}`}>
        {value}
      </p>
    </div>
  );
}

const formatBillingCycle = (cycle: string): string => {
  const cycleMap: Record<string, string> = {
    '__unset__': 'None',
    'one-time': 'One Time',
    'monthly': 'Monthly',
    'quarterly': 'Quarterly',
    'annually': 'Annually',
    'biennially': 'Biennially',
  };
  return cycleMap[cycle] || cycle;
};

