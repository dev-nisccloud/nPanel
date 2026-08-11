import { paymentTotalString } from "@npanel/api/lib/convert-price";

export type ResolveMpesaCheckoutPaymentInput = {
	isAgencyUser: boolean;
	formAmount: string;
	formAccountReference: string;
	/** Order total including VAT  always used for customer M-Pesa charges. */
	checkoutTotalIncVat: number;
	intendedAccountReference: string;
};

/** Customers always pay the checkout total (service + tax), never tampered form values. */
export function resolveMpesaCheckoutPayment(input: ResolveMpesaCheckoutPaymentInput): {
	amount: number;
	accountReference: string;
	amountString: string;
} {
	if (input.isAgencyUser) {
		const accountReference = input.formAccountReference.trim();
		const formAmount = parseFloat(input.formAmount.trim());
		// Agency may overpay for testing, but never underpay vs checkout total.
		const amount = Number.isFinite(formAmount)
			? Math.max(Math.ceil(formAmount), Math.ceil(input.checkoutTotalIncVat))
			: Math.ceil(input.checkoutTotalIncVat);
		const amountString = paymentTotalString(amount);
		return {
			amountString,
			accountReference,
			amount,
		};
	}

	const amountString = canonicalMpesaPaymentAmount(input.checkoutTotalIncVat);
	const accountReference = input.intendedAccountReference.trim();

	return {
		amountString,
		accountReference,
		amount: parseFloat(amountString),
	};
}

export function canonicalMpesaPaymentAmount(total: number): string {
	return paymentTotalString(total);
}
