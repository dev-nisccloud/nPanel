declare module "@paystack/inline-js" {
	type PaystackCallbacks = {
		onSuccess?: (transaction: {
			id: number;
			reference: string;
			message: string;
		}) => void;
		onCancel?: () => void;
		onError?: (error: { message?: string }) => void;
		onLoad?: (transaction: {
			id: number;
			customer: Record<string, unknown>;
			accessCode: string;
		}) => void;
	};

	export default class PaystackPop {
		resumeTransaction(
			accessCode: string,
			callbacks?: PaystackCallbacks,
		): unknown;
	}
}
