import { CompanyDetailsPreview } from "@/app/(main)/agency/invoices/create/_components/form/companyDetails/companyDetailsPreview";
import { InvoiceDetailsPreview } from "@/app/(main)/agency/invoices/create/_components/form/invoiceDetails/invoiceDetailsPreview";
import { InvoiceTermsPreview } from "@/app/(main)/agency/invoices/create/_components/form/invoiceTerms/InvoiceTermsPreview";
import { PaymentDetailsPreview } from "@/app/(main)/agency/invoices/create/_components/form/paymentDetails/paymentDetailsPreview";
import { InvoiceHeaderPreview } from "@/app/(main)/agency/invoices/create/_components/form/header/invoiceHeaderPreview";
import { ChevronDown } from "lucide-react";
import type {
  YourDetails,
  CompanyDetails,
  InvoiceItemDetails,
  PaymentDetails,
  InvoiceTerms,
} from "@/app/(main)/agency/invoices/create/types";

export const PreviewDetails = ({
  yourDetails,
  companyDetails,
  invoiceDetails,
  paymentDetails,
  invoiceTerms,
  onClick,
}: {
  yourDetails: YourDetails;
  companyDetails: CompanyDetails;
  invoiceDetails: InvoiceItemDetails;
  paymentDetails: PaymentDetails;
  invoiceTerms: InvoiceTerms;
  onClick?: (step: string) => void;
}) => (
  <div className="overflow-x-auto overflow-y-visible">
    <div className="w-[595px] min-h-[842px] bg-white rounded-2xl border border-dashed justify-center items-center">
      {/* New header: Logo on left, From on right, then INVOICE separator */}
      <InvoiceHeaderPreview {...yourDetails} onClick={onClick} />
      
      {/* Bill To section on left, Invoice number and dates on right */}
      <div className="border-b grid grid-cols-2 justify-between border-dashed">
        <div
          className="py-4 px-10 border-r border-dashed cursor-pointer relative group"
          onClick={() => onClick && onClick("2")}
        >
          {!!onClick && (
            <>
              <ChevronDown className="animate-pulse w-5 h-5 text-orange-500 rotate-[135deg] group-hover:block hidden absolute top-0 left-0" />
              <ChevronDown className="animate-pulse w-5 h-5 text-orange-500 -rotate-[135deg] group-hover:block hidden absolute top-0 right-0" />
              <ChevronDown className="animate-pulse w-5 h-5 text-orange-500 rotate-45 group-hover:block hidden absolute bottom-0 left-0" />
              <ChevronDown className="animate-pulse w-5 h-5 text-orange-500 -rotate-45 group-hover:block hidden absolute bottom-0 right-0 " />
            </>
          )}
          <CompanyDetailsPreview {...companyDetails} />
        </div>
        <div className="py-4 px-10 border-dashed">
          <InvoiceTermsPreview {...invoiceTerms} onClick={onClick} />
        </div>
      </div>
      
      {/* Invoice details and payment details remain the same */}
      <div className="flex flex-col justify-between">
        <div className="border-b justify-between border-dashed">
          <InvoiceDetailsPreview {...invoiceDetails} onClick={onClick} />
        </div>
        <div className="">
          <PaymentDetailsPreview {...paymentDetails} onClick={onClick} />
        </div>
      </div>
    </div>
  </div>
);
