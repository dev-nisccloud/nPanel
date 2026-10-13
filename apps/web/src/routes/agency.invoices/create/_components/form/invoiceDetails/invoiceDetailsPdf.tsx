import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { currencyList } from "@/lib/currency";
import { pdfTypography, pdfUtils } from "@/lib/pdfStyles";
import type { InvoiceItemDetails, Item } from "@/routes/agency.invoices/create/types";
import { tisTaxRateLabel } from "@npanel/api/agency-invoice-pdf/tis-receipt-totals";

export const InvoiceDetailsPdf: React.FC<InvoiceItemDetails> = ({
  note,
  discount,
  taxPercentage,
  items,
  currency = "KES",
}) => {
  const currencyType = currency;
  const currencyDetails = currencyList.find(
    (currency) => currency.value.toLowerCase() === currencyType.toLowerCase()
  )?.details;
  const subtotal = calculateTotalAmount(items);
  const discountAmount = subtotal - (discount ? +discount : 0);
  const taxAmount = discountAmount * ((taxPercentage || 0) / 100);
  const totalAmount = roundTotalIfExceeds(discountAmount + taxAmount);

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
            paddingLeft: 80,
            paddingRight: 40,
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
      {items.map(({ itemDescription, amount, qty, billingCycle, etimsTaxTyCd }, index) => {
        const taxRateLabel = tisTaxRateLabel(etimsTaxTyCd);
        return (
          <View
            key={index}
            style={[
              { marginHorizontal: 40, paddingVertical: 14 },
              pdfUtils.flexRowItemStart,
              pdfUtils.borderBottom,
              index === 0 ? pdfUtils.borderTop : {},
            ]}
          >
            <View style={{ flex: 1, minWidth: 0, maxWidth: "60%" }}>
              <Text style={pdfTypography.itemDescription} wrap>
                {itemDescription}
              </Text>
              {billingCycle && (
                <Text style={{ ...pdfTypography.itemDescription, fontSize: 9, color: "#666", marginTop: 4 }}>
                  Billing: {formatBillingCycle(billingCycle)}
                </Text>
              )}
              {taxRateLabel && (
                <Text style={{ ...pdfTypography.itemDescription, fontSize: 9, color: "#666", marginTop: 4 }}>
                  Tax rate: {taxRateLabel}
                </Text>
              )}
            </View>
            <View
              style={{
                flex: 1,
                ...pdfUtils.flexRowItemCenter,
                paddingLeft: 80,
                flexShrink: 0,
              }}
            >
              <Text style={{ flex: 1, ...pdfTypography.itemDescription }}>
                {qty ? qty : "-"}
              </Text>
              <Text style={{ flex: 1, ...pdfTypography.itemDescription }} wrap>
                {amount != null ? formatMoney(amount) : ""}
              </Text>
              <Text
                style={{
                  flex: 1,
                  ...pdfTypography.itemDescription,
                  textAlign: "right",
                }}
                wrap
              >
                {currencyDetails?.currencySymbol}
                {amount != null && ` ${formatMoney((qty ? qty : 1) * amount)}`}
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
              wrap
            >
              {currencyDetails?.currencySymbol} {formatMoney(subtotal)}
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
                wrap
              >
                {currencyDetails?.currencySymbol} {discount ? formatMoney(+discount) : ""}
              </Text>
            </View>
          )}
          {taxPercentage && (
            <View
              style={{
                marginHorizontal: 40,
                paddingVertical: 14,
                ...pdfUtils.flexRowItemCenter,
                ...pdfUtils.borderBottom,
              }}
            >
              <Text style={{ ...pdfTypography.itemDescription, flex: 1 }}>
                Tax ({taxPercentage})%
              </Text>
              <Text
                style={{
                  ...pdfTypography.itemDescription,
                  flex: 1,
                  textAlign: "right",
                }}
                wrap
              >
                {currencyDetails?.currencySymbol} {formatMoney(taxAmount)}
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
              wrap
              style={{
                ...pdfTypography.itemDescription,
                flex: 1,
                textAlign: "right",
                fontWeight: "bold",
              }}
            >
              {currencyDetails?.currencySymbol} {formatMoney(totalAmount)}
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
    'biennially': 'Biennially',
  };
  return cycleMap[cycle] || cycle;
};

