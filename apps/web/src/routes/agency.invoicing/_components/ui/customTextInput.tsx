"use client";

import { Input } from "@/routes/agency.invoicing/_components/ui/input";
import { Controller } from "react-hook-form";

type CustomInputProps = {
	label?: string;
	placeholder: string;
	variableName: string;
	disabled?: boolean;
	readOnly?: boolean;
};

const CustomTextInput = ({
	label,
	placeholder,
	variableName,
	disabled,
	readOnly,
}: CustomInputProps) => (
	<Controller
		name={variableName}
		defaultValue=""
		render={({ field: { onChange, value } }) => (
			<Input
				label={label}
				placeholder={placeholder}
				value={value ?? ""}
				type="text"
				disabled={disabled}
				readOnly={readOnly}
				onChange={(event) => {
					onChange(event.target.value);
				}}
			/>
		)}
	/>
);

export default CustomTextInput;

