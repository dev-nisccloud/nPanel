"use client";

import CustomTextInput from "@/routes/agency.invoices/create/_components/ui/customTextInput";
import { Input } from "@/routes/agency.invoices/create/_components/ui/input";
import DateInput from "@/routes/agency.invoices/create/_components/ui/dateInput";
import { Controller } from "react-hook-form";

/** Optional SCU / eTIMS fields for backdated invoices (auto-filled after OSCU sync). */
export function ScuInformationFields() {
	return (
		<div className="pt-8">
			<p className="text-lg font-semibold pb-1">SCU Information</p>
			<p className="text-xs text-muted-foreground pb-3">
				Optional. Leave blank for new invoices — KRA fills these after sync. Enter them
				manually for backdated receipts that already exist in eTIMS.
			</p>
			<CustomTextInput
				label="CU ID"
				placeholder="KRACU04XXXXXXXX"
				variableName="scuSdcId"
			/>
			<DateInput label="SCU date" variableName="scuDate" />
			<Controller
				name="scuTime"
				defaultValue=""
				render={({ field: { onChange, value } }) => (
					<Input
						label="SCU time"
						type="time"
						step={1}
						placeholder="hh:mm:ss"
						value={value ?? ""}
						onChange={(event) => onChange(event.target.value)}
					/>
				)}
			/>
			<CustomTextInput
				label="CU receipt no."
				placeholder="1"
				variableName="scuCurRcptNo"
			/>
			<CustomTextInput
				label="Total receipts"
				placeholder="1"
				variableName="scuTotRcptNo"
			/>
			<CustomTextInput
				label="Internal data"
				placeholder="TE68SLA234J5…"
				variableName="scuIntrlData"
			/>
			<CustomTextInput
				label="Receipt signature"
				placeholder="V249J39CFJ48HE2W"
				variableName="scuRcptSign"
			/>
		</div>
	);
}
