/**
 * Submit a Jenga hosted checkout form in the same tab (docs: auto-submit POST).
 */
export function submitJengaPaymentForm(
	checkoutUrl: string,
	paymentData: Record<string, string>,
): void {
	const form = document.createElement("form");
	form.method = "POST";
	form.action = checkoutUrl;
	form.style.display = "none";

	for (const [key, value] of Object.entries(paymentData)) {
		const input = document.createElement("input");
		input.type = "hidden";
		input.name = key;
		input.value = value;
		form.appendChild(input);
	}

	document.body.appendChild(form);
	form.submit();
}

export type JengaCustomerFormState = {
	customerFirstName: string;
	customerLastName: string;
	customerEmail: string;
	customerPhone: string;
	customerAddress: string;
	customerPostalCodeZip: string;
	countryCode: string;
};

export function validateJengaCustomerForm(
	state: JengaCustomerFormState,
): Partial<Record<keyof JengaCustomerFormState, string>> {
	const errors: Partial<Record<keyof JengaCustomerFormState, string>> = {};
	if (!state.customerFirstName.trim()) errors.customerFirstName = "First name is required";
	if (!state.customerLastName.trim()) errors.customerLastName = "Last name is required";
	if (!state.customerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.customerEmail)) {
		errors.customerEmail = "Valid email is required";
	}
	const phoneDigits = state.customerPhone.replace(/\D/g, "");
	if (phoneDigits.length < 10) errors.customerPhone = "Valid phone number is required";
	if (!state.customerAddress.trim()) errors.customerAddress = "Address is required";
	if (!state.customerPostalCodeZip.trim()) errors.customerPostalCodeZip = "Postal code is required";
	if (!/^[A-Z]{2}$/.test(state.countryCode)) errors.countryCode = "Country code must be KE, etc.";
	return errors;
}
