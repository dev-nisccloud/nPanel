import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import CustomTextInput from "@/routes/agency.invoices/create/_components/ui/customTextInput";
import CustomNumberInput from "@/routes/agency.invoices/create/_components/ui/customNumberInput";
import { DEFAULT_INVOICE_LOGO } from "@/routes/agency.invoices/create/constants";

export const YourDetailsForm = () => {
	const { setValue } = useFormContext();

	useEffect(() => {
		setValue("yourLogo", DEFAULT_INVOICE_LOGO, { shouldDirty: false });
	}, [setValue]);

	return (
		<div className="pt-24">
			<p className="text-2xl font-semibold pb-3">Nisc Cloud details</p>
			<CustomTextInput label="Accounts email" placeholder="accounts@nisccloud.com" variableName="yourEmail" />
			<p className="pb-10 pt-3 text-xs font-medium text-neutral-500">
				These details appear as the issuer on the service order.
			</p>
			<p className="pb-2 text-sm font-medium text-neutral-500">Billing details</p>
			<CustomTextInput label="Registered company" placeholder="Nisc Cloud Limited" variableName="yourName" />
			<p className="text-xs text-muted-foreground">Logo is set automatically for the generated order.</p>
			<CustomTextInput label="Address" placeholder="P.O BOX 21615" variableName="yourAddress" />
			<CustomTextInput label="City" placeholder="Nairobi" variableName="yourCity" />
			<CustomTextInput label="State" placeholder="Nairobi County" variableName="yourState" />
			<CustomNumberInput label="Zip" placeholder="00505" variableName="yourZip" />
			<CustomTextInput label="Country" placeholder="Kenya" variableName="yourCountry" />
			<CustomTextInput label="KRA PIN" placeholder="P052377334H" variableName="yourTaxId" />
			<CustomTextInput label="Prepared by" placeholder="Account Executive — Nisc Cloud" variableName="preparedBy" />
		</div>
	);
};
