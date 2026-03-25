"use client";

import { Input } from "@/app/(main)/agency/invoices/create/_components/ui/input";
import { Controller } from "react-hook-form";

type CustomNumberProps = {
	label?: string;
	placeholder: string;
	variableName: string;
};

export const CustomNumberInput = ({
	label,
	placeholder,
	variableName,
}: CustomNumberProps) => (
	<Controller
		name={variableName}
		defaultValue=""
		render={({ field: { onChange, value } }) => (
			<Input
				label={label}
				placeholder={placeholder}
				value={value ?? ""}
				type="text"
				pattern="[0-9]*"
				onChange={(event) => {
					const updatedValue = event.target.value;
					onChange(updatedValue);
				}}
			/>
		)}
	/>
);

export default CustomNumberInput;
