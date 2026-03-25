import { ChevronDown } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { PaymentDetails } from "@/routes/agency.invoices/create/types";

export const PaymentDetailsPreview: React.FC<
  PaymentDetails & { onClick?: (step: string) => void }
> = ({
  paymentMethod = "bank",
  bankName,
  accountNumber,
  accountName,
  branchName,
  branchCode,
  swiftCode,
  mpesaPaybillNumber,
  mpesaAccountNumber,
  mpesaInstructions,
  chequeDeliveryAddress,
  chequeInstructions,
  qrCodeValue,
  onClick,
}) => {

  const renderPaymentDetails = () => {
    if (paymentMethod === "bank") {
      return (
        <div className="space-y-1">
          <div className="grid grid-cols-2 items-center">
            <p className="truncate text-xs font-medium text-gray-500">
              Bank Name
            </p>
            {bankName ? (
              <p className="flex truncate text-xs font-medium text-gray-600">
                {bankName}
              </p>
            ) : (
              <div className="rounded-[3.5px] bg-neutral-100 h-4 w-full animate-pulse" />
            )}
          </div>
          <div className="mb-2 grid grid-cols-2 items-center">
            <p className="truncate text-xs font-medium text-gray-500">
              Account Number
            </p>
            {accountNumber ? (
              <p className="flex truncate text-xs font-medium text-gray-600">
                {accountNumber}
              </p>
            ) : (
              <div className="rounded-[3.5px] bg-neutral-100 h-4 w-full animate-pulse" />
            )}
          </div>
          <div className="mb-2 grid grid-cols-2 items-center">
            <p className="truncate text-xs font-medium text-gray-500">
              Account Name
            </p>
            {accountName ? (
              <p className="flex truncate text-xs font-medium text-gray-600">
                {accountName}
              </p>
            ) : (
              <div className="rounded-[3.5px] bg-neutral-100 h-4 w-full animate-pulse" />
            )}
          </div>
          {branchName && (
            <div className="mb-2 grid grid-cols-2 items-center">
              <p className="truncate text-xs font-medium text-gray-500">
                Branch Name
              </p>
              <p className="flex truncate text-xs font-medium text-gray-600">
                {branchName}
              </p>
            </div>
          )}
          {branchCode && (
            <div className="mb-2 grid grid-cols-2 items-center">
              <p className="truncate text-xs font-medium text-gray-500">
                Branch Code
              </p>
              <p className="flex truncate text-xs font-medium text-gray-600">
                {branchCode}
              </p>
            </div>
          )}
          {swiftCode && (
            <div className="mb-2 grid grid-cols-2 items-center">
              <p className="truncate text-xs font-medium text-gray-500">
                Swift Code
              </p>
              <p className="flex truncate text-xs font-medium text-gray-600">
                {swiftCode}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (paymentMethod === "mpesa") {
      return (
        <div className="space-y-1">
          <div className="grid grid-cols-2 items-center">
            <p className="truncate text-xs font-medium text-gray-500">
              Paybill Number
            </p>
            {mpesaPaybillNumber ? (
              <p className="flex truncate text-xs font-medium text-gray-600">
                {mpesaPaybillNumber}
              </p>
            ) : (
              <div className="rounded-[3.5px] bg-neutral-100 h-4 w-full animate-pulse" />
            )}
          </div>
          {mpesaAccountNumber && (
            <div className="mb-2 grid grid-cols-2 items-center">
              <p className="truncate text-xs font-medium text-gray-500">
                Account Number
              </p>
              <p className="flex truncate text-xs font-medium text-gray-600">
                {mpesaAccountNumber}
              </p>
            </div>
          )}
          {mpesaInstructions && (
            <div className="mb-2">
              <p className="truncate text-xs font-medium text-gray-500 mb-1">
                Instructions
              </p>
              <p className="text-xs font-medium text-gray-600 break-words">
                {mpesaInstructions}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (paymentMethod === "cheque") {
      return (
        <div className="space-y-1">
          {chequeDeliveryAddress && (
            <div className="mb-2">
              <p className="truncate text-xs font-medium text-gray-500 mb-1">
                Delivery Address
              </p>
              <p className="text-xs font-medium text-gray-600 break-words">
                {chequeDeliveryAddress}
              </p>
            </div>
          )}
          {chequeInstructions && (
            <div className="mb-2">
              <p className="truncate text-xs font-medium text-gray-500 mb-1">
                Instructions
              </p>
              <p className="text-xs font-medium text-gray-600 break-words">
                {chequeInstructions}
              </p>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const getPaymentTitle = () => {
    switch (paymentMethod) {
      case "bank":
        return "Bank Details";
      case "mpesa":
        return "MPESA Details";
      case "cheque":
        return "Cheque Details";
      default:
        return "Payment Details";
    }
  };

  return (
    <div
      className="grid grid-cols-2 group cursor-pointer relative"
      onClick={() => onClick && onClick("4")}
    >
      {!!onClick && (
        <>
          <ChevronDown className="animate-pulse w-5 h-5 text-orange-500 rotate-[135deg] group-hover:block hidden absolute top-0 left-0" />
          <ChevronDown className="animate-pulse w-5 h-5 text-orange-500 -rotate-[135deg] group-hover:block hidden absolute top-0 right-0" />
          <ChevronDown className="animate-pulse w-5 h-5 text-orange-500 rotate-45 group-hover:block hidden absolute bottom-0 left-0" />
          <ChevronDown className="animate-pulse w-5 h-5 text-orange-500 -rotate-45 group-hover:block hidden absolute bottom-0 right-0 " />
        </>
      )}
      <div className="py-4 pl-10 pr-3">
        <p className="text-[11px] text-neutral-400 font-medium uppercase mb-3">
          {getPaymentTitle()}
        </p>
        {renderPaymentDetails()}
      </div>
      <div className="py-4 px-10 flex flex-col items-end justify-center">
        <div className="w-full flex justify-end mb-3">
          <p className="text-[11px] text-neutral-400 font-medium uppercase">
            eTIMS verification
          </p>
        </div>
        {qrCodeValue ? (
          <QRCodeSVG
            value={qrCodeValue}
            size={96}
            level="M"
            includeMargin={false}
          />
        ) : (
          <div className="w-[96px] h-[96px] rounded-md bg-neutral-100 animate-pulse flex items-center justify-center">
            <p className="text-xs text-neutral-400">QR Code</p>
          </div>
        )}
      </div>
    </div>
  );
};

