"use client";

import CustomTextInput from "@/routes/agency.invoices/create/_components/ui/customTextInput";
import DateInput from "@/routes/agency.invoices/create/_components/ui/dateInput";
import { useFormContext } from "react-hook-form";
import { useEffect } from "react";
import { trpc } from "@/utils/trpc";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export const OrderTermsForm = ({ editMode = false }: { editMode?: boolean } = {}) => {
	const { setValue, watch } = useFormContext();
	const orderNumber = watch("orderNo");

	const { data: nextOrder, isLoading } = trpc.salesServiceOrders.getNextOrderNumber.useQuery(undefined, {
		enabled: !editMode,
		staleTime: 0,
		gcTime: 0,
		refetchOnMount: true,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
	});

	useEffect(() => {
		if (editMode) return;
		if (nextOrder?.orderNumber && !orderNumber) {
			setValue("orderNo", nextOrder.orderNumber, { shouldValidate: false });
		}
	}, [editMode, nextOrder?.orderNumber, orderNumber, setValue]);

	return (
		<div className="pt-24">
			<p className="text-2xl font-semibold pb-3">Order terms</p>
			<div className="relative">
				{!editMode && isLoading ? (
					<div className="flex items-center gap-2 h-[52px]">
						<label className="block text-sm font-medium leading-6 text-gray-900 whitespace-nowrap">
							Order number
						</label>
						<div className="flex items-center gap-2 flex-1 justify-end">
							<Spinner variant="ellipsis" size={16} className="text-muted-foreground" />
							<span className="text-sm text-muted-foreground">Generating...</span>
						</div>
					</div>
				) : (
					<CustomTextInput label="Order number" placeholder="SO-0001" variableName="orderNo" readOnly />
				)}
			</div>
			<DateInput label="Issue date" variableName="issueDate" />
			<DateInput label="Valid until" variableName="validUntil" />
			<CustomTextInput label="Payment terms" placeholder="Due on receipt" variableName="paymentTerms" />
			<p className="pb-2 pt-6 text-sm font-medium text-neutral-500">Client signatory</p>
			<CustomTextInput label="Name" placeholder="Authorized signatory" variableName="clientSignatoryName" />
			<CustomTextInput label="Title" placeholder="Title / role" variableName="clientSignatoryTitle" />
			<DateInput label="Date" variableName="clientSignatoryDate" />
			<p className="pb-2 pt-6 text-sm font-medium text-neutral-500">Nisc Cloud signatory</p>
			<CustomTextInput label="Name" placeholder="Authorized signatory" variableName="niscSignatoryName" />
			<CustomTextInput label="Title" placeholder="Title / role" variableName="niscSignatoryTitle" />
			<DateInput label="Date" variableName="niscSignatoryDate" />
		</div>
	);
};
