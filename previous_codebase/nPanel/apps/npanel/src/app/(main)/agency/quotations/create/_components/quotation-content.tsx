"use client";

import { useFormContext } from "react-hook-form";
import { UserInputForm } from "./form/userInputForm";
import { QuotationFormSteps } from "./form/step/quotationSteps";
import { QuotationPreviewDetails } from "./form/previewDetails";
import { useData } from "../hooks/useData";

export const QuotationContent = ({
	mode = "create",
	quotationId,
}: {
	mode?: "create" | "edit";
	quotationId?: string;
} = {}) => {
	const form = useFormContext();
	const { companyDetails, yourDetails, quotationDetails, quotationTerms } = useData();
	const step = form.watch("step");

	const handleStepClick = (newStep: string) => {
		form.setValue("step", newStep);
	};

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6">
			<div className="flex flex-col gap-2">
				<h1 className="text-2xl font-semibold tracking-tight">
					{mode === "edit" ? "Edit Quotation" : "Create Quotation"}
				</h1>
				<p className="text-muted-foreground">
					{mode === "edit"
						? "Update quotation details. The quotation number cannot be changed."
						: "Create a quotation with manual company details."}
				</p>
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="flex flex-col gap-6">
					<UserInputForm mode={mode} quotationId={quotationId} />
					{step !== "5" && <QuotationFormSteps />}
				</div>
				<div className="hidden lg:block sticky top-6 h-fit">
					<QuotationPreviewDetails
						yourDetails={yourDetails}
						companyDetails={companyDetails}
						quotationDetails={quotationDetails}
						quotationTerms={quotationTerms}
						onClick={handleStepClick}
					/>
				</div>
			</div>
		</div>
	);
};
