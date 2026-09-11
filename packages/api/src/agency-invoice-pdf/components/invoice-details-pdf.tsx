import React from "react";
import { Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { currencyList } from "../currency-map";
import { pdfTypography, pdfUtils } from "../pdf-styles";
import type { InvoiceItemDetails, Item } from "../types";

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
  const subtotal = roundMoney2(calculateTotalAmount(itemsNormalized));
  const discountAmount = roundMoney2(
    subtotal - (discount ? +discount : 0)
  );
  const taxAmount = roundMoney2(
    discountAmount * ((taxRate ? +taxRate : 0) / 100)
  );
  const totalAmount = roundMoney2(discountAmount + taxAmount);

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
                {hasLineAmount(amount) ? formatPdfMoney(Number(amount)) : ""}
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
                {hasLineAmount(amount) && ` ${formatPdfMoney((qty ? +qty : 1) * Number(amount))}`}
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
            <Text style={{ ...totalsText, flex: 1 }}>
              Subtotal
            </Text>
            <Text
              wrap
              style={{
                ...totalsText,
                flex: 1,
                textAlign: "right",
              }}
            >
              {currencyDetails?.currencySymbol} {formatPdfMoney(subtotal)}
            </Text>
          </View>
          {discount && (
            <View
              style={{
                marginHorizontal: 40,
                paddingVertical: compactLineItems ? 5 : 14,
                ...pdfUtils.flexRowItemCenter,
                ...pdfUtils.borderBottom,
              }}
            >
              <Text style={{ ...totalsText, flex: 1 }}>
                Discount
              </Text>
              <Text
                wrap
                style={{
                  ...totalsText,
                  flex: 1,
                  textAlign: "right",
                }}
              >
                {currencyDetails?.currencySymbol} {discount ? formatPdfMoney(+discount) : ""}
              </Text>
            </View>
          )}
          {taxRate && (
            <View
              style={{
                marginHorizontal: 40,
                paddingVertical: compactLineItems ? 5 : 14,
                ...pdfUtils.flexRowItemCenter,
                ...pdfUtils.borderBottom,
              }}
            >
              <Text style={{ ...totalsText, flex: 1 }}>
                Tax ({taxRate})%
              </Text>
              <Text
                wrap
                style={{
                  ...totalsText,
                  flex: 1,
                  textAlign: "right",
                }}
              >
                {currencyDetails?.currencySymbol} {formatPdfMoney(taxAmount)}
              </Text>
            </View>
          )}
          <View
            style={{
              marginHorizontal: 40,
              paddingVertical: compactLineItems ? 5 : 14,
              ...pdfUtils.flexRowItemCenter,
            }}
          >
            <Text style={{ ...totalsText, flex: 1 }}>
              Amount
            </Text>
            <Text
              wrap
              style={{
                ...totalsText,
                flex: 1,
                textAlign: "right",
                fontWeight: "bold",
                flexWrap: "wrap",
              }}
            >
              {currencyDetails?.currencySymbol} {formatPdfMoney(totalAmount)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const calculateTotalAmount = (items: Item[]): number =>
  items.reduce((total, item) => {
    const quantity = item.qty ? +item.qty : 1;
    const amount = hasLineAmount(item.amount) ? +item.amount : 0;
    return total + quantity * amount;
  }, 0);

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

