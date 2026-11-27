"use client";

import { useFormContext } from "react-hook-form";
import { UserInputForm } from "./form/userInputForm";
import { ServiceOrderFormSteps } from "./form/step/serviceOrderSteps";
import { ServiceOrderPreviewDetails } from "./form/previewDetails";
import { useData } from "../hooks/useData";

export const ServiceOrderContent = ({
	mode = "create",
	orderId,
}: {
	mode?: "create" | "edit";
	orderId?: string;
} = {}) => {
	const form = useFormContext();
	const data = useData();
	const step = form.watch("step");

	const handleStepClick = (newStep: string) => {
		form.setValue("step", newStep);
	};

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6">
			<div className="flex flex-col gap-2">
				<h1 className="text-2xl font-semibold tracking-tight">
					{mode === "edit" ? "Edit Service Order" : "Create Service Order"}
				</h1>
				<p className="text-muted-foreground">
					{mode === "edit"
						? "Update service order details. The order number cannot be changed."
						: "Create a service order with manual client details."}
				</p>
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="flex flex-col gap-6">
					<UserInputForm mode={mode} orderId={orderId} />
					{step !== "5" && <ServiceOrderFormSteps />}
				</div>
				<div className="hidden lg:block sticky top-6 h-fit">
					<ServiceOrderPreviewDetails {...data} onClick={handleStepClick} />
				</div>
			</div>
		</div>
	);
};
