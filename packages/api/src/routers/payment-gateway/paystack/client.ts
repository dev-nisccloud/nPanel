import { z } from "zod";

const PAYSTACK_API = "https://api.paystack.co";

export class PaystackError extends Error {
	constructor(
		message: string,
		public readonly retryable = false,
	) {
		super(message);
		this.name = "PaystackError";
	}
}

function secretKey(): string {
	const key = process.env.PAYSTACK_SECRET_KEY?.trim();
	if (!key) throw new PaystackError("Paystack is not configured");
	return key;
}

async function paystackRequest<T>(
	path: string,
	init?: RequestInit,
): Promise<T> {
	let response: Response;
	try {
		response = await fetch(`${PAYSTACK_API}${path}`, {
			...init,
			headers: {
				Authorization: `Bearer ${secretKey()}`,
				"Content-Type": "application/json",
				...(init?.headers ?? {}),
			},
			signal: AbortSignal.timeout(10_000),
		});
	} catch (error) {
		throw new PaystackError(
			error instanceof Error ? error.message : "Paystack network error",
			true,
		);
	}
	const body = (await response.json().catch(() => null)) as {
		status?: boolean;
		message?: string;
		data?: unknown;
	} | null;
	if (!response.ok || !body?.status) {
		throw new PaystackError(
			body?.message || `Paystack returned HTTP ${response.status}`,
			response.status >= 500,
		);
	}
	return body.data as T;
}

const initializeResponseSchema = z.object({
	authorization_url: z.string().url(),
	access_code: z.string().min(1),
	reference: z.string().min(1),
});

const verifyResponseSchema = z.object({
	status: z.string(),
	reference: z.string(),
	amount: z.number().int().nonnegative(),
	currency: z.string().length(3),
	paid_at: z.string().nullable().optional(),
	channel: z.string().optional(),
	gateway_response: z.string().optional(),
	customer: z
		.object({
			email: z.string().email().optional(),
		})
		.optional(),
	authorization: z
		.object({
			country_code: z.string().length(2).optional(),
		})
		.optional(),
});

export type PaystackVerification = z.infer<typeof verifyResponseSchema>;

export async function initializePaystackTransaction(input: {
	email: string;
	amountMinor: number;
	currency: "KES" | "USD";
	reference: string;
	transactionId: string;
}): Promise<z.infer<typeof initializeResponseSchema>> {
	const data = await paystackRequest<unknown>("/transaction/initialize", {
		method: "POST",
		body: JSON.stringify({
			email: input.email,
			amount: input.amountMinor,
			currency: input.currency,
			reference: input.reference,
			channels: ["card"],
			metadata: { niscTransactionId: input.transactionId },
		}),
	});
	return initializeResponseSchema.parse(data);
}

export async function verifyPaystackTransaction(
	reference: string,
): Promise<PaystackVerification> {
	const data = await paystackRequest<unknown>(
		`/transaction/verify/${encodeURIComponent(reference)}`,
	);
	return verifyResponseSchema.parse(data);
}

export function assertPaystackCurrencyEnabled(currency: "KES" | "USD") {
	if (process.env.PAYSTACK_ENABLED !== "true") {
		throw new PaystackError("Paystack checkout is not enabled");
	}
	if (currency === "USD" && process.env.PAYSTACK_USD_ENABLED !== "true") {
		throw new PaystackError("USD card checkout is awaiting merchant activation");
	}
	if (currency === "KES" && process.env.PAYSTACK_KES_ENABLED !== "true") {
		throw new PaystackError("KES Paystack checkout is not enabled");
	}
}
