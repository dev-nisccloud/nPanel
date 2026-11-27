"use client";

import { FormProvider, useForm } from "react-hook-form";
import { ServiceOrderContent } from "./agency.sales.service-orders/create/_components/service-order-content";
import { serviceOrderFormDefaults } from "./agency.sales.service-orders/create/defaults";

export default function CreateServiceOrderPage() {
	const form = useForm({
		defaultValues: serviceOrderFormDefaults,
	});

	return (
		<FormProvider {...form}>
			<ServiceOrderContent />
		</FormProvider>
	);
}
