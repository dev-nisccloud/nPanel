import React from "react";
import { Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { currencyList } from "../currency-map";
import { pdfTypography, pdfUtils } from "../pdf-styles";
import type { InvoiceItemDetails, Item } from "../types";
import {
  buildTisReceiptTotals,
  formatTisMoney,
  tisCreditNoteBandLines,
  type TisReceiptTotals,
} from "../tis-receipt-totals";

const hasLineAmount = (amount: unknown): amount is number =>
  amount !== undefined && amount !== null && `${amount}` !== "";

function LineItemDescriptionCell({
  text,
  lineStyle,
  compactLineItems,
}: {
  text: string;
  lineStyle: Style;
  compactLineItems: boolean;
}) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const body = lines.length > 0 ? lines : [text];

  return (
    <View style={{ width: "100%", minWidth: 0 }}>
      {body.map((line, index) => (
        <View
          key={`${index}-${line.slice(0, 24)}`}
          wrap
          style={{
            width: "100%",
            marginTop: index > 0 ? (compactLineItems ? 2 : 4) : 0,
          }}
        >
          <Text wrap style={{ ...lineStyle, width: "100%" }}>
            {line}
          </Text>
        </View>
      ))}
    </View>
  );
}

export const InvoiceDetailsPdf: React.FC<InvoiceItemDetails> = ({
  note,
  discount,
  taxRate,
  items,
  currency = "KES",
  compactLineItems = false,
  negateAmounts = false,
  taxBuckets,
}) => {
  const lineText = compactLineItems
    ? pdfTypography.itemLineCompact
    : pdfTypography.itemDescription;
  const headerText = compactLineItems
    ? pdfTypography.itemLineHeaderCompact
    : pdfTypography.title;
  const totalsText = compactLineItems
    ? { ...pdfTypography.itemDescription, fontSize: 8, fontWeight: "medium" as const }
    : pdfTypography.itemDescription;

  const currencyType = currency;
  const currencyDetails = currencyList.find(
    (currency) => currency.value.toLowerCase() === currencyType.toLowerCase()
  )?.details;
  const symbol = currencyDetails?.currencySymbol ?? "";
  const itemsNormalized: Item[] = items.map((item) => ({
    ...item,
    amount:
      item.amount !== undefined &&
      item.amount !== null &&
      `${item.amount}` !== ""
        ? roundMoney2(Number(item.amount))
        : item.amount,
  }));
  const totals = buildTisReceiptTotals({
    items: itemsNormalized,
    discount,
    taxRate,
    taxBuckets,
  });
  const sign = negateAmounts ? -1 : 1;

  return (
    <View>
      <View style={pdfUtils.flexRowItemCenter}>
        <View
          style={{
            flex: 1,
            paddingHorizontal: 40,
            paddingVertical: compactLineItems ? 6 : 16,
          }}
        >
          <Text style={headerText}>Description</Text>
        </View>
        <View
          style={{
            flex: 1,
            ...pdfUtils.flexRowItemCenter,
            // Match body rows: numeric block uses the same left inset so QTY lines up.
            paddingLeft: compactLineItems ? 48 : 80,
            paddingRight: 40,
            paddingVertical: compactLineItems ? 6 : 16,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={headerText}>QTY</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={headerText}>Price</Text>
          </View>
          <View style={{ flex: 1, textAlign: "right" }}>
            <Text style={headerText}>Amount</Text>
          </View>
        </View>
      </View>
      {itemsNormalized.map(({ itemDescription, amount, qty, billingCycle }, index) => {
        const containerStyle = {
          marginHorizontal: 40,
          paddingVertical: compactLineItems ? 5 : 14,
          ...pdfUtils.borderBottom,
          ...pdfUtils.flexRowItemStart,
        };
        const borderStyle = index === 0 ? pdfUtils.borderTop : {};

        return (
          <View
            key={index}
            style={{
              ...containerStyle,
              ...borderStyle,
            }}
          >
            <View style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
              <LineItemDescriptionCell
                text={itemDescription ?? ""}
                lineStyle={lineText}
                compactLineItems={!!compactLineItems}
              />
              {billingCycle && (
                <Text style={{ ...lineText, fontSize: compactLineItems ? 7 : 9, color: "#666", marginTop: compactLineItems ? 2 : 4 }}>
                  Billing: {formatBillingCycle(billingCycle)}
                </Text>
              )}
            </View>
            <View
              style={{
                flex: 1,
                ...pdfUtils.flexRowItemCenter,
                paddingLeft: compactLineItems ? 48 : 80,
              }}
            >
              <Text style={{ flex: 1, ...lineText }}>
                {qty ? qty : "-"}
              </Text>
              <Text
                wrap
                style={{
                  flex: 1,
                  ...lineText,
                  flexWrap: "wrap",
                }}
              >
                {hasLineAmount(amount) ? formatPdfMoney(sign * Number(amount)) : ""}
              </Text>
              <Text
                wrap
                style={{
                  flex: 1,
                  ...lineText,
                  textAlign: "right",
                  flexWrap: "wrap",
                }}
              >
                {currencyDetails?.currencySymbol}
                {hasLineAmount(amount) && ` ${formatPdfMoney(sign * (qty ? +qty : 1) * Number(amount))}`}
              </Text>
            </View>
          </View>
        );
      })}
      <View style={pdfUtils.flexRowItemCenter}>
        <View style={{ flex: 1, paddingTop: 24 }}>
          {note && (
            <View style={{ paddingHorizontal: 40 }}>
              <Text style={headerText}>Note</Text>
              <Text style={lineText}>{note}</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <TisTotalsBlock
            totals={totals}
            symbol={symbol}
            sign={sign}
            negateAmounts={negateAmounts}
            compactLineItems={compactLineItems}
            totalsText={totalsText}
          />
        </View>
      </View>
    </View>
  );
};

function money(symbol: string, n: number): string {
  return `${symbol} ${formatTisMoney(n)}`;
}

function TotalsRow({
  label,
  value,
  compactLineItems,
  totalsText,
  bold,
  border = true,
}: {
  label: string;
  value: string;
  compactLineItems: boolean;
  totalsText: Style;
  bold?: boolean;
  border?: boolean;
}) {
  return (
    <View
      style={{
        marginHorizontal: 40,
        paddingVertical: compactLineItems ? 5 : 14,
        ...pdfUtils.flexRowItemCenter,
        ...(border ? pdfUtils.borderBottom : {}),
      }}
    >
      <Text style={{ ...totalsText, flex: 1 }}>{label}</Text>
      <Text
        wrap
        style={{
          ...totalsText,
          flex: 1,
          textAlign: "right",
          fontWeight: bold ? "bold" : totalsText.fontWeight,
          flexWrap: "wrap",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function TisTotalsBlock({
  totals,
  symbol,
  sign,
  negateAmounts,
  compactLineItems,
  totalsText,
}: {
  totals: TisReceiptTotals;
  symbol: string;
  sign: number;
  negateAmounts: boolean;
  compactLineItems: boolean;
  totalsText: Style;
}) {
  const row = (label: string, amount: number, opts?: { bold?: boolean; border?: boolean; parens?: boolean; count?: boolean }) => (
    <TotalsRow
      key={label}
      label={label}
      value={
        opts?.count
          ? String(amount)
          : opts?.parens
            ? `(${formatTisMoney(Math.abs(amount))})`
            : money(symbol, sign * amount)
      }
      compactLineItems={compactLineItems}
      totalsText={totalsText}
      bold={opts?.bold}
      border={opts?.border}
    />
  );

  if (negateAmounts) {
    const bands = tisCreditNoteBandLines(totals);
    return (
      <View>
        {row("Total", totals.total)}
        {bands.map((band) => (
          <View key={band.taxableLabel}>
            {row(band.taxableLabel, band.taxable)}
            {row(band.taxLabel, band.vat)}
          </View>
        ))}
        {row("Total Tax", totals.vat)}
        {row("Items Number", totals.itemCount, { border: false, count: true })}
      </View>
    );
  }

  return (
    <View>
      {row("Total before discount", totals.totalBeforeDiscount)}
      {totals.discountAwarded
        ? row("Total discount awarded", totals.discountAwarded, { parens: true })
        : null}
      {row("Sub total", totals.subTotal)}
      {row("VAT", totals.vat)}
      {row("Total", totals.total, { bold: true })}
      {row("Items Number", totals.itemCount, { count: true })}
      <TisTaxTablePdf
        totals={totals}
        symbol={symbol}
        sign={sign}
        compactLineItems={compactLineItems}
        totalsText={totalsText}
      />
    </View>
  );
}

function TisTaxTablePdf({
  totals,
  symbol,
  sign,
  compactLineItems,
  totalsText,
}: {
  totals: TisReceiptTotals;
  symbol: string;
  sign: number;
  compactLineItems: boolean;
  totalsText: Style;
}) {
  const cell = { ...totalsText, fontSize: compactLineItems ? 7 : 8 };
  return (
    <View
      style={{
        marginHorizontal: 40,
        marginTop: compactLineItems ? 6 : 10,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "#9ca3af",
      }}
    >
      <View style={{ ...pdfUtils.flexRowItemCenter, borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "#9ca3af" }}>
        <Text style={{ ...cell, flex: 1.1, padding: 4 }}>Rate</Text>
        <Text style={{ ...cell, flex: 1.4, padding: 4, textAlign: "right" }}>Taxable Amount</Text>
        <Text style={{ ...cell, flex: 1, padding: 4, textAlign: "right" }}>VAT</Text>
      </View>
      {totals.taxTable.map((row) => (
        <View
          key={row.band}
          style={{ ...pdfUtils.flexRowItemCenter, borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "#e5e7eb" }}
        >
          <Text style={{ ...cell, flex: 1.1, padding: 4 }}>{row.rateLabel}</Text>
          <Text style={{ ...cell, flex: 1.4, padding: 4, textAlign: "right" }}>
            {money(symbol, sign * row.taxable)}
          </Text>
          <Text style={{ ...cell, flex: 1, padding: 4, textAlign: "right" }}>
            {money(symbol, sign * row.vat)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const roundMoney2 = (n: number): number =>
  Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const addCommasToNumber = (number: number): string => {
  const fixed = roundMoney2(number);
  let numberString = fixed.toFixed(2);
  const parts = numberString.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

const formatPdfMoney = (n: number): string => addCommasToNumber(n);

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

