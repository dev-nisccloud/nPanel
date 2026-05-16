"use client";

import { FormProvider, useForm } from "react-hook-form";
import { QuotationContent } from "./agency.quotations/create/_components/quotation-content";

export default function CreateQuotationPage() {
	const form = useForm({
		defaultValues: {
			step: "1",
			yourEmail: "",
			yourName: "",
			yourAddress: "",
			yourCity: "",
			yourState: "",
			yourCountry: "",
			yourLogo: "",
			yourTaxId: "",
			yourZip: "",
			email: "",
			companyName: "",
			companyAddress: "",
			companyCity: "",
			companyState: "",
			companyCountry: "",
			companyTaxId: "",
			companyZip: "",
			linkedUserId: "",
			note: "",
			discount: "",
			taxPercentage: undefined,
			items: [{ itemDescription: "" }],
			quotationNo: "",
			issueDate: "",
			currency: "KES",
		},
	});

	return (
		<FormProvider {...form}>
			<QuotationContent />
		</FormProvider>
	);
}
