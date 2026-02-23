import { CompanyDetailsPreview } from "@/app/(main)/agency/invoices/create/_components/form/companyDetails/companyDetailsPreview";
import { InvoiceDetailsPreview } from "@/app/(main)/agency/invoices/create/_components/form/invoiceDetails/invoiceDetailsPreview";
import { InvoiceHeaderPreview } from "@/app/(main)/agency/invoices/create/_components/form/header/invoiceHeaderPreview";
import { QuotationTermsPreview } from "./quotationTerms/QuotationTermsPreview";
import { ChevronDown } from "lucide-react";
import type {
	YourDetails,
	CompanyDetails,
	QuotationItemDetails,
	QuotationTerms,
} from "@/app/(main)/agency/quotations/create/types";

export const QuotationPreviewDetails = ({
	yourDetails,
	companyDetails,
	quotationDetails,
	quotationTerms,
	onClick,
}: {
	yourDetails: YourDetails;
	companyDetails: CompanyDetails;
	quotationDetails: QuotationItemDetails;
	quotationTerms: QuotationTerms;
	onClick?: (step: string) => void;
}) => (
	<div className="overflow-x-auto overflow-y-visible">
		<div className="w-[595px] min-h-[842px] bg-white rounded-2xl border border-dashed justify-center items-center">
			<InvoiceHeaderPreview {...yourDetails} onClick={onClick} title="Quotation" />
			<div className="border-b grid grid-cols-2 justify-between border-dashed">
				<div
					className="py-4 px-10 border-r border-dashed cursor-pointer relative group"
					onClick={() => onClick?.("2")}
				>
					{!!onClick && (
						<>
							<ChevronDown className="animate-pulse w-5 h-5 text-orange-500 rotate-[135deg] group-hover:block hidden absolute top-0 left-0" />
							<ChevronDown className="animate-pulse w-5 h-5 text-orange-500 -rotate-[135deg] group-hover:block hidden absolute top-0 right-0" />
							<ChevronDown className="animate-pulse w-5 h-5 text-orange-500 rotate-45 group-hover:block hidden absolute bottom-0 left-0" />
							<ChevronDown className="animate-pulse w-5 h-5 text-orange-500 -rotate-45 group-hover:block hidden absolute bottom-0 right-0 " />
						</>
					)}
					<CompanyDetailsPreview {...companyDetails} label="Quoted to" />
				</div>
				<div className="py-4 px-10 border-dashed">
					<QuotationTermsPreview {...quotationTerms} onClick={onClick} />
				</div>
			</div>
			<div className="flex flex-col justify-between">
				<div className="border-b justify-between border-dashed">
					<InvoiceDetailsPreview {...quotationDetails} onClick={onClick} />
				</div>
			</div>
		</div>
	</div>
);
