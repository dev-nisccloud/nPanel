import { CompanyDetailsPreview } from "@/routes/agency.invoices/create/_components/form/companyDetails/companyDetailsPreview";
import { InvoiceDetailsPreview } from "@/routes/agency.invoices/create/_components/form/invoiceDetails/invoiceDetailsPreview";
import { InvoiceTermsPreview } from "@/routes/agency.invoices/create/_components/form/invoiceTerms/InvoiceTermsPreview";
import { InvoiceHeaderPreview } from "@/routes/agency.invoices/create/_components/form/header/invoiceHeaderPreview";
import { EtimsFiscalFooterPreview } from "@/routes/agency.invoices/create/_components/form/etimsFiscalFooterPreview";
import { ChevronDown } from "lucide-react";
import type { EtimsFiscalFields } from "@npanel/api/lib/etims-fiscal-fields";
import { emptyEtimsFiscalFields } from "@npanel/api/lib/etims-fiscal-fields";
import type {
  YourDetails,
  CompanyDetails,
  InvoiceItemDetails,
  PaymentDetails,
  InvoiceTerms,
} from "@/routes/agency.invoices/create/types";

export const PreviewDetails = ({
  yourDetails,
  companyDetails,
  invoiceDetails,
  invoiceTerms,
  etimsFiscal,
  onClick,
  documentTitle,
  onRegenerateQr,
  regeneratingQr,
}: {
  yourDetails: YourDetails;
  companyDetails: CompanyDetails;
  invoiceDetails: InvoiceItemDetails;
  paymentDetails?: PaymentDetails;
  invoiceTerms: InvoiceTerms;
  etimsFiscal?: EtimsFiscalFields | null;
  onClick?: (step: string) => void;
  documentTitle?: string;
  onRegenerateQr?: () => void;
  regeneratingQr?: boolean;
}) => {
  const title = documentTitle ?? "Invoice";
  const isCreditNote = title.toLowerCase().includes("credit");
  const taxPercentage =
    invoiceDetails.taxPercentage ??
    (invoiceDetails.taxRate != null && String(invoiceDetails.taxRate).trim() !== ""
      ? Number(invoiceDetails.taxRate)
      : undefined);

  return (
  <div className="overflow-x-auto overflow-y-visible">
    <div className="w-[595px] min-h-[842px] bg-white rounded-2xl border border-dashed justify-center items-center">
      <InvoiceHeaderPreview {...yourDetails} onClick={onClick} title={title} />

      {isCreditNote ? (
        <div className="px-10 pb-3 text-[11px] text-gray-700">
          {invoiceTerms.originalCuInvoiceNo ? (
            <p className="mb-1 font-semibold uppercase">
              Original CU invoice no.#: {invoiceTerms.originalCuInvoiceNo}
            </p>
          ) : null}
          <p className="font-semibold uppercase">
            Credit note is approved only for original sales receipt
          </p>
          {invoiceTerms.buyerPin ? (
            <p className="mt-1 text-gray-600">Buyer PIN: {invoiceTerms.buyerPin}</p>
          ) : null}
        </div>
      ) : null}
      
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
          <InvoiceTermsPreview
            {...invoiceTerms}
            scuId={invoiceTerms.scuId || etimsFiscal?.sdcId || undefined}
            onClick={onClick}
          />
        </div>
      </div>
      
      <div className="flex flex-col justify-between">
        <div className="border-b justify-between border-dashed">
          <InvoiceDetailsPreview
            {...invoiceDetails}
            taxPercentage={taxPercentage}
            onClick={onClick}
          />
        </div>
        <EtimsFiscalFooterPreview
          etimsFiscal={
            etimsFiscal ??
            emptyEtimsFiscalFields({
              tisReceiptNumber: invoiceTerms.invoiceNumber ?? null,
              tisIssuedAt: invoiceTerms.issueDate ?? null,
              originalCuInvoiceNo: invoiceTerms.originalCuInvoiceNo ?? null,
              itemCount: invoiceDetails.items?.length ?? 0,
              isCreditNote,
            })
          }
          onClick={onClick}
          onRegenerateQr={onRegenerateQr}
          regeneratingQr={regeneratingQr}
        />
      </div>
    </div>
  </div>
  );
};
