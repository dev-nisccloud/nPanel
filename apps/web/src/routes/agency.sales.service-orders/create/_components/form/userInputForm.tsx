"use client";

import { YourDetailsForm } from "./yourDetails/YourDetailsForm";
import { ManualCompanyDetailsForm } from "./companyDetails/ManualCompanyDetailsForm";
import { OrderDetailsForm } from "./orderDetails/OrderDetailsForm";
import { OrderTermsForm } from "./orderTerms/OrderTermsForm";
import { SubmitOrderButton } from "./submit/SubmitOrderButton";
import { useGetValue } from "@/routes/agency.quotations/create/hooks/useGetValue";

export const UserInputForm = ({
	mode = "create",
	orderId,
}: {
	mode?: "create" | "edit";
	orderId?: string;
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
				<OrderDetailsForm />
			</div>
			<div className={step === "4" ? "block" : "hidden"}>
				<OrderTermsForm editMode={mode === "edit"} />
			</div>
			{step === "5" && <SubmitOrderButton orderId={mode === "edit" ? orderId : undefined} />}
		</div>
	);
};
