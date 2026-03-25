"use client";

import CustomTextInput from "@/routes/agency.invoices/create/_components/ui/customTextInput";
import DateInput from "@/routes/agency.invoices/create/_components/ui/dateInput";
import { useFormContext } from "react-hook-form";
import { useEffect } from "react";
import { trpc } from "@/utils/trpc";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export const QuotationTermsForm = ({ editMode = false }: { editMode?: boolean } = {}) => {
	const { setValue, watch } = useFormContext();
	const quotationNumber = watch("quotationNo");

	const { data: nextQuotationData, isLoading: isLoadingNextNumber } =
		trpc.quotations.getNextQuotationNumber.useQuery(undefined, {
			enabled: !editMode,
			staleTime: 0,
			gcTime: 0,
			refetchOnMount: true,
			refetchOnWindowFocus: true,
			refetchOnReconnect: true,
		});

	useEffect(() => {
		if (editMode) return;
		if (nextQuotationData?.quotationNumber && !quotationNumber) {
			setValue("quotationNo", nextQuotationData.quotationNumber, { shouldValidate: false });
		}
	}, [editMode, nextQuotationData?.quotationNumber, quotationNumber, setValue]);

	return (
		<div className="pt-24">
			<p className="text-2xl font-semibold pb-3">Quotation terms</p>
			<div className="relative">
				{!editMode && isLoadingNextNumber ? (
					<div className="flex items-center gap-2 h-[52px]">
						<label className="block text-sm font-medium leading-6 text-gray-900 whitespace-nowrap">
							Quotation number
						</label>
						<div className="flex items-center gap-2 flex-1 justify-end">
							<Spinner variant="ellipsis" size={16} className="text-muted-foreground" />
							<span className="text-sm text-muted-foreground">Generating...</span>
						</div>
					</div>
				) : (
					<CustomTextInput
						label="Quotation number"
						placeholder="QUOT-0001"
						variableName="quotationNo"
						readOnly
					/>
				)}
			</div>
			<DateInput label="Issue date" variableName="issueDate" />
		</div>
	);
};

