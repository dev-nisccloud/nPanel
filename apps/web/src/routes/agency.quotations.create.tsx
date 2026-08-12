"use client";

import { FormProvider, useForm } from "react-hook-form";
import { QuotationContent } from "./agency.quotations/create/_components/quotation-content";

export default function CreateQuotationPage() {
	const form = useForm({
		defaultValues: {
			step: "1",
			yourEmail: "accounts@nisccloud.com",
			yourName: "Nisc Cloud Limited",
			yourAddress: "P.O BOX 21615",
			yourCity: "Nairobi",
			yourState: "",
			yourCountry: "Kenya",
			yourLogo: "",
			yourTaxId: "P052377334H",
			yourZip: "00505",
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
