"use client";

import CustomTextInput from "@/routes/agency.invoices/create/_components/ui/customTextInput";
import CustomNumberInput from "@/routes/agency.invoices/create/_components/ui/customNumberInput";
import PaymentMethodInput from "@/routes/agency.invoices/create/_components/ui/paymentMethodInput";
import { useGetValue } from "@/routes/agency.invoices/create/hooks/useGetValue";
import type { PaymentMethod } from "@/routes/agency.invoices/create/types";

export const PaymentDetailsForm = () => {
  const paymentMethod = useGetValue("paymentMethod", "bank") as PaymentMethod;

  return (
    <div className="pt-24">
      <p className="text-2xl font-semibold pb-3">Payment Details</p>
      <div className="flex flex-col gap-6">
        <div>
          <p className="pt-3 font-medium text-neutral-500">
            Select payment method
          </p>
          <PaymentMethodInput />
        </div>

        {paymentMethod === "bank" && (
          <div className="flex flex-col gap-6">
            <p className="pt-3 font-medium text-sm text-neutral-500">
              Bank Transfer Details
            </p>
            <CustomTextInput
              label="Bank name"
              placeholder="HSBC"
              variableName="bankName"
            />
            <CustomTextInput
              label="Account number"
              placeholder="8920804195"
              variableName="accountNumber"
            />
            <CustomTextInput
              label="Account Name"
              placeholder="Pranav"
              variableName="accountName"
            />
            <CustomTextInput
              label="Branch Name"
              placeholder="Westlands Branch"
              variableName="branchName"
            />
            <CustomTextInput
              label="Branch Code"
              placeholder="001"
              variableName="branchCode"
            />
            <CustomNumberInput
              label="Swift code"
              placeholder="HSBCINAA123"
              variableName="swiftCode"
            />
          </div>
        )}

        {paymentMethod === "mpesa" && (
          <div className="flex flex-col gap-6">
            <p className="pt-3 font-medium text-sm text-neutral-500">
              MPESA Transfer Details
            </p>
            <CustomTextInput
              label="Paybill Number"
              placeholder="123456"
              variableName="mpesaPaybillNumber"
            />
            <CustomTextInput
              label="Account Number"
              placeholder="Account number or reference"
              variableName="mpesaAccountNumber"
            />
            <CustomTextInput
              label="Instructions"
              placeholder="Send payment to the paybill number above and include invoice number as reference"
              variableName="mpesaInstructions"
            />
          </div>
        )}

        {paymentMethod === "cheque" && (
          <div className="flex flex-col gap-6">
            <p className="pt-3 font-medium text-sm text-neutral-500">
              Cheque Delivery Details
            </p>
            <CustomTextInput
              label="Delivery Address"
              placeholder="123 Main Street, City, Country"
              variableName="chequeDeliveryAddress"
            />
            <CustomTextInput
              label="Instructions"
              placeholder="Make cheque payable to [Company Name] and mail to the address above"
              variableName="chequeInstructions"
            />
          </div>
        )}

        <div className="flex flex-col gap-6">
          <p className="pt-3 font-medium text-sm text-neutral-500">
            QR Code
          </p>
          <CustomTextInput
            label="QR Code Value"
            placeholder="Enter value for QR code (e.g., payment link, account number)"
            variableName="qrCodeValue"
          />
        </div>
      </div>
    </div>
  );
};

