"use client";

import { YourDetailsForm } from "@/app/(main)/agency/invoices/create/_components/form/yourDetails/yourDetailsForm";
import { ManualCompanyDetailsForm } from "./companyDetails/ManualCompanyDetailsForm";
import { QuotationDetailsForm } from "./quotationDetails/QuotationDetailsForm";
import { QuotationTermsForm } from "./quotationTerms/QuotationTermsForm";
import { DownloadQuotationButton } from "./downloadQuotation/DownloadQuotationButton";
import { UpdateQuotationButton } from "./updateQuotation/UpdateQuotationButton";
import { useGetValue } from "@/app/(main)/agency/quotations/create/hooks/useGetValue";

export const UserInputForm = ({
	mode = "create",
	quotationId,
}: {
	mode?: "create" | "edit";
	quotationId?: string;
} = {}) => {
	const step = useGetValue("step", "1");

	return (
		<div>
			<div className={step === "1" ? "block" : "hidden"}>
				<YourDetailsForm />
			</div>
			<div className={step === "2" ? "block" : "hidden"}>
				<ManualCompanyDetailsForm />
			</div>
			<div className={step === "3" ? "block" : "hidden"}>
				<QuotationDetailsForm />
			</div>
			<div className={step === "4" ? "block" : "hidden"}>
				<QuotationTermsForm editMode={mode === "edit"} />
			</div>
			{step === "5" &&
				(mode === "edit" && quotationId ? (
					<UpdateQuotationButton quotationId={quotationId} />
				) : (
					<DownloadQuotationButton />
				))}
		</div>
	);
};
