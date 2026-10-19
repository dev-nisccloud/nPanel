"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Controller, useFormContext } from "react-hook-form";

export const INVOICE_STATUS_OPTIONS = [
	{ value: "DRAFT", label: "Draft" },
	{ value: "SENT", label: "Sent" },
	{ value: "UNPAID", label: "Unpaid" },
	{ value: "PARTIALLY_PAID", label: "Partially paid" },
	{ value: "PAID", label: "Paid" },
	{ value: "OVERDUE", label: "Overdue" },
	{ value: "CANCELLED", label: "Cancelled" },
	{ value: "WRITTEN_OFF", label: "Written off" },
	{ value: "REFUNDED", label: "Refunded" },
] as const;

export type InvoiceStatusOption = (typeof INVOICE_STATUS_OPTIONS)[number]["value"];

export function InvoiceStatusSelect({
	name = "invoiceStatus",
	className,
}: {
	name?: string;
	className?: string;
}) {
	const { control } = useFormContext();

	return (
		<Controller
			name={name}
			control={control}
			defaultValue="DRAFT"
			render={({ field }) => (
				<Select value={field.value || "DRAFT"} onValueChange={field.onChange}>
					<SelectTrigger className={className ?? "w-full min-w-[180px]"}>
						<SelectValue placeholder="Select status" />
					</SelectTrigger>
					<SelectContent>
						{INVOICE_STATUS_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
		/>
	);
}
