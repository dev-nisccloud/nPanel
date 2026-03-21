"use client";

import CustomTextInput from "@/app/(main)/agency/invoices/create/_components/ui/customTextInput";
import CustomNumberInput from "@/app/(main)/agency/invoices/create/_components/ui/customNumberInput";

export const ManualCompanyDetailsForm = () => (
	<div className="pt-24 space-y-6">
		<div>
			<p className="text-2xl font-semibold pb-3">Company Details (Quoted to)</p>
			<p className="pb-4 text-xs font-medium text-neutral-500">
				Enter the customer or company details manually. No team selection.
			</p>
		</div>
		<CustomTextInput
			label="Company / Customer Name"
			placeholder="Acme Ltd"
			variableName="companyName"
		/>
		<CustomTextInput
			label="Email"
			placeholder="billing@acme.com"
			variableName="email"
		/>
		<CustomTextInput
			label="Address"
			placeholder="Street, Building"
			variableName="companyAddress"
		/>
		<CustomTextInput label="City" placeholder="Nairobi" variableName="companyCity" />
		<CustomTextInput label="State" placeholder="County" variableName="companyState" />
		<CustomNumberInput label="Zip" placeholder="00100" variableName="companyZip" />
		<CustomTextInput label="Country" placeholder="Kenya" variableName="companyCountry" />
		<CustomTextInput label="Tax ID" placeholder="Optional" variableName="companyTaxId" />
	</div>
);
