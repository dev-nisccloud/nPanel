"use client";

import { useParams, useNavigate } from "react-router";
import { FormProvider, useForm } from "react-hook-form";
import { useEffect } from "react";
import { QuotationContent } from "@/routes/agency.quotations/create/_components/quotation-content";
import { quotationToFormDefaultValues } from "./agency.quotations/$id/_utils/transformQuotationData";
import { trpc } from "@/utils/trpc";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const emptyDefaultValues = {
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
	note: "",
	discount: "",
	taxPercentage: undefined as number | undefined,
	items: [{ itemDescription: "" }],
	quotationNo: "",
	issueDate: "",
	currency: "KES",
};

export default function EditQuotationPage() {
	const params = useParams();
	const navigate = useNavigate();
	const quotationId = params.id as string;

	const { data: quotation, isLoading, error } = trpc.quotations.getById.useQuery(
		{ id: quotationId },
		{ enabled: !!quotationId },
	);

	const form = useForm({
		defaultValues: emptyDefaultValues,
	});

	useEffect(() => {
		if (quotation) {
			form.reset(quotationToFormDefaultValues(quotation) as typeof emptyDefaultValues);
		}
	}, [quotation, form]);

	if (isLoading) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 min-h-screen items-center justify-center">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	if (error || !quotation) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 min-h-screen items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-semibold mb-2">Quotation Not Found</h1>
					<p className="text-muted-foreground mb-4">
						{error?.message ?? "The quotation you're looking for doesn't exist."}
					</p>
					<Button onClick={() => navigate("/agency/quotations")} variant="outline">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Quotations
					</Button>
				</div>
			</div>
		);
	}

	return (
		<FormProvider {...form}>
			<QuotationContent mode="edit" quotationId={quotationId} />
		</FormProvider>
	);
}
