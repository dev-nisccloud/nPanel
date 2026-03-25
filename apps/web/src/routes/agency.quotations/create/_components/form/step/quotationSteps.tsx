"use client";

import StepButton from "@/routes/agency.invoices/create/_components/ui/stepButton";
import { useGetValue } from "@/routes/agency.quotations/create/hooks/useGetValue";

export const QuotationFormSteps = () => {
	const stepValue = useGetValue("step", "1");
	const stepDetails = getStepDetails(stepValue);

	return (
		<div className="flex gap-9 justify-between">
			{stepDetails.previous ? (
				<StepButton
					step={stepDetails.previous.step}
					title={stepDetails.previous.title}
					isPrevious
				/>
			) : (
				<div className="flex-1" />
			)}
			{stepDetails.nextStep ? (
				<StepButton
					step={stepDetails.nextStep.step}
					title={stepDetails.nextStep.title}
				/>
			) : (
				<div className="flex-1" />
			)}
		</div>
	);
};

const step1 = {
	previous: null as { title: string; step: string } | null,
	nextStep: { title: "Company Details", step: "2" },
};
const step2 = {
	previous: { title: "Your Details", step: "1" },
	nextStep: { title: "Quotation Details", step: "3" },
};
const step3 = {
	previous: { title: "Company Details", step: "2" },
	nextStep: { title: "Terms", step: "4" },
};
const step4 = {
	previous: { title: "Quotation Details", step: "3" },
	nextStep: { title: "Review & Submit", step: "5" },
};
const step5 = {
	previous: { title: "Terms", step: "4" },
	nextStep: null as { title: string; step: string } | null,
};

function getStepDetails(step: string) {
	if (step === "1") return step1;
	if (step === "2") return step2;
	if (step === "3") return step3;
	if (step === "4") return step4;
	if (step === "5") return step5;
	return step1;
}

