import React from "react";
import { Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { currencyList } from "@/lib/currency";
import { pdfTypography, pdfUtils } from "@/lib/pdfStyles";
import type { InvoiceItemDetails, Item } from "@/routes/agency.invoicing/types";
import { buildTisReceiptTotals, formatTisMoney } from "@npanel/api/agency-invoice-pdf/tis-receipt-totals";

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
  });
  const symbol = currencyDetails?.currencySymbol ?? "";

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
      {itemsNormalized.map(({ itemDescription, amount, qty }, index) => {
        const containerStyle = {
          marginHorizontal: 40,
          paddingVertical: compactLineItems ? 5 : 14,
          ...pdfUtils.borderBottom,
          ...pdfUtils.flexRowItemCenter,
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
                style={{
                  flex: 1,
                  ...lineText,
                  flexWrap: "wrap",
                  maxWidth: 80,
                }}
              >
                {amount ? formatPdfMoney(Number(amount)) : ""}
              </Text>
              <Text
                style={{
                  flex: 1,
                  ...lineText,
                  textAlign: "right",
                  flexWrap: "wrap",
                  maxWidth: 120,
                }}
              >
                {currencyDetails?.currencySymbol}
                {amount
                  ? formatPdfMoney((qty ? +qty : 1) * Number(amount))
                  : ""}
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
          <View
            style={{
              marginHorizontal: 40,
              paddingVertical: compactLineItems ? 5 : 14,
              ...pdfUtils.flexRowItemCenter,
              ...pdfUtils.borderBottom,
            }}
          >
            <Text style={{ ...totalsText, flex: 1 }}>Total before discount</Text>
            <Text style={{ ...totalsText, flex: 1, textAlign: "right" }}>
              {symbol} {formatTisMoney(totals.totalBeforeDiscount)}
            </Text>
          </View>
          {totals.discountAwarded ? (
            <View
              style={{
                marginHorizontal: 40,
                paddingVertical: compactLineItems ? 5 : 14,
                ...pdfUtils.flexRowItemCenter,
                ...pdfUtils.borderBottom,
              }}
            >
              <Text style={{ ...totalsText, flex: 1 }}>Total discount awarded</Text>
              <Text style={{ ...totalsText, flex: 1, textAlign: "right" }}>
                ({formatTisMoney(totals.discountAwarded)})
              </Text>
            </View>
          ) : null}
          <View
            style={{
              marginHorizontal: 40,
              paddingVertical: compactLineItems ? 5 : 14,
              ...pdfUtils.flexRowItemCenter,
              ...pdfUtils.borderBottom,
            }}
          >
            <Text style={{ ...totalsText, flex: 1 }}>Sub total</Text>
            <Text style={{ ...totalsText, flex: 1, textAlign: "right" }}>
              {symbol} {formatTisMoney(totals.subTotal)}
            </Text>
          </View>
          <View
            style={{
              marginHorizontal: 40,
              paddingVertical: compactLineItems ? 5 : 14,
              ...pdfUtils.flexRowItemCenter,
              ...pdfUtils.borderBottom,
            }}
          >
            <Text style={{ ...totalsText, flex: 1 }}>VAT</Text>
            <Text style={{ ...totalsText, flex: 1, textAlign: "right" }}>
              {symbol} {formatTisMoney(totals.vat)}
            </Text>
          </View>
          <View
            style={{
              marginHorizontal: 40,
              paddingVertical: compactLineItems ? 5 : 14,
              ...pdfUtils.flexRowItemCenter,
              ...pdfUtils.borderBottom,
            }}
          >
            <Text style={{ ...totalsText, flex: 1 }}>Total</Text>
            <Text style={{ ...totalsText, flex: 1, textAlign: "right", fontWeight: "bold" }}>
              {symbol} {formatTisMoney(totals.total)}
            </Text>
          </View>
          <View
            style={{
              marginHorizontal: 40,
              paddingVertical: compactLineItems ? 5 : 14,
              ...pdfUtils.flexRowItemCenter,
            }}
          >
            <Text style={{ ...totalsText, flex: 1 }}>Items Number</Text>
            <Text style={{ ...totalsText, flex: 1, textAlign: "right" }}>
              {totals.itemCount}
            </Text>
          </View>
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
              <Text style={{ ...totalsText, fontSize: compactLineItems ? 7 : 8, flex: 1.1, padding: 4 }}>Rate</Text>
              <Text style={{ ...totalsText, fontSize: compactLineItems ? 7 : 8, flex: 1.4, padding: 4, textAlign: "right" }}>Taxable Amount</Text>
              <Text style={{ ...totalsText, fontSize: compactLineItems ? 7 : 8, flex: 1, padding: 4, textAlign: "right" }}>VAT</Text>
            </View>
            {totals.taxTable.map((row) => (
              <View
                key={row.band}
                style={{ ...pdfUtils.flexRowItemCenter, borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "#e5e7eb" }}
              >
                <Text style={{ ...totalsText, fontSize: compactLineItems ? 7 : 8, flex: 1.1, padding: 4 }}>{row.rateLabel}</Text>
                <Text style={{ ...totalsText, fontSize: compactLineItems ? 7 : 8, flex: 1.4, padding: 4, textAlign: "right" }}>
                  {symbol} {formatTisMoney(row.taxable)}
                </Text>
                <Text style={{ ...totalsText, fontSize: compactLineItems ? 7 : 8, flex: 1, padding: 4, textAlign: "right" }}>
                  {symbol} {formatTisMoney(row.vat)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

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

