import { paymentTotalString } from "@npanel/api/lib/convert-price";

export type ResolveMpesaCheckoutPaymentInput = {
	isAgencyUser: boolean;
	formAmount: string;
	formAccountReference: string;
	intendedAmount: string;
	intendedAccountReference: string;
};

/** Customers always pay the intended checkout amount/reference, never tampered form values. */
export function resolveMpesaCheckoutPayment(input: ResolveMpesaCheckoutPaymentInput): {
	amount: number;
	accountReference: string;
	amountString: string;
} {
	if (input.isAgencyUser) {
		const amountString = input.formAmount.trim();
		const accountReference = input.formAccountReference.trim();
		return {
			amountString,
			accountReference,
			amount: parseFloat(amountString),
		};
	}

	const amountString = input.intendedAmount.trim();
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
