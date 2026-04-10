import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { currencyList } from "@/lib/currency";
import { pdfTypography, pdfUtils } from "@/lib/pdfStyles";
import type { InvoiceItemDetails, Item } from "@/routes/agency.invoicing/types";

export const InvoiceDetailsPdf: React.FC<InvoiceItemDetails> = ({
  note,
  discount,
  taxRate,
  items,
  currency = "KES",
}) => {
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
        <View style={{ flex: 1, paddingHorizontal: 40, paddingVertical: 16 }}>
          <Text style={pdfTypography.title}>Description</Text>
        </View>
        <View
          style={{
            flex: 1,
            ...pdfUtils.flexRowItemCenter,
            paddingHorizontal: 40,
            paddingVertical: 16,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={pdfTypography.title}>QTY</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={pdfTypography.title}>Price</Text>
          </View>
          <View style={{ flex: 1, textAlign: "right" }}>
            <Text style={pdfTypography.title}>Amount</Text>
          </View>
        </View>
      </View>
      {itemsNormalized.map(({ itemDescription, amount, qty }, index) => {
        const containerStyle = {
          marginHorizontal: 40,
          paddingVertical: 14,
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
            <Text
              style={{
                flex: 1,
                ...pdfTypography.itemDescription,
                // Ensure long descriptions wrap cleanly instead of overflowing.
                flexWrap: "wrap",
                paddingRight: 12,
              }}
            >
              {itemDescription}
            </Text>
            <View
              style={{
                flex: 1,
                ...pdfUtils.flexRowItemCenter,
                paddingLeft: 80,
              }}
            >
              <Text style={{ flex: 1, ...pdfTypography.itemDescription }}>
                {qty ? qty : "-"}
              </Text>
              <Text
                style={{
                  flex: 1,
                  ...pdfTypography.itemDescription,
                  flexWrap: "wrap",
                  maxWidth: 80,
                }}
              >
                {amount ? formatPdfMoney(Number(amount)) : ""}
              </Text>
              <Text
                style={{
                  flex: 1,
                  ...pdfTypography.itemDescription,
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
              <Text style={pdfTypography.title}>Note</Text>
              <Text style={pdfTypography.itemDescription}>{note}</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View
            style={{
              marginHorizontal: 40,
              paddingVertical: 14,
              ...pdfUtils.flexRowItemCenter,
              ...pdfUtils.borderBottom,
            }}
          >
            <Text style={{ ...pdfTypography.itemDescription, flex: 1 }}>
              Subtotal
            </Text>
            <Text
              style={{
                ...pdfTypography.itemDescription,
                flex: 1,
                textAlign: "right",
              }}
            >
              {currencyDetails?.currencySymbol}
              {formatPdfMoney(subtotal)}
            </Text>
          </View>
          {discount && (
            <View
              style={{
                marginHorizontal: 40,
                paddingVertical: 14,
                ...pdfUtils.flexRowItemCenter,
                ...pdfUtils.borderBottom,
              }}
            >
              <Text style={{ ...pdfTypography.itemDescription, flex: 1 }}>
                Discount
              </Text>
              <Text
                style={{
                  ...pdfTypography.itemDescription,
                  flex: 1,
                  textAlign: "right",
                }}
              >
                {currencyDetails?.currencySymbol}
                {discount ? formatPdfMoney(+discount) : ""}
              </Text>
            </View>
          )}
          {taxRate && (
            <View
              style={{
                marginHorizontal: 40,
                paddingVertical: 14,
                ...pdfUtils.flexRowItemCenter,
                ...pdfUtils.borderBottom,
              }}
            >
              <Text style={{ ...pdfTypography.itemDescription, flex: 1 }}>
                Tax ({taxRate})%
              </Text>
              <Text
                style={{
                  ...pdfTypography.itemDescription,
                  flex: 1,
                  textAlign: "right",
                }}
              >
                {currencyDetails?.currencySymbol}
                {formatPdfMoney(taxAmount)}
              </Text>
            </View>
          )}
          <View
            style={{
              marginHorizontal: 40,
              paddingVertical: 14,
              ...pdfUtils.flexRowItemCenter,
            }}
          >
            <Text style={{ ...pdfTypography.itemDescription, flex: 1 }}>
              Amount
            </Text>
            <Text
              style={{
                ...pdfTypography.itemDescription,
                flex: 1,
                textAlign: "right",
                fontWeight: "bold",
                flexWrap: "wrap",
              }}
            >
              {currencyDetails?.currencySymbol}
              {formatPdfMoney(totalAmount)}
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
    const amount = item.amount ? +item.amount : 0;
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

