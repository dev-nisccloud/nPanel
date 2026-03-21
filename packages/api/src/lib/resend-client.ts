import { Resend } from "resend";

/**
 * Get or create Resend client instance (lazy initialization)
 * This prevents initialization during build time when env vars may not be available
 */
let resendClient: Resend | null = null;

export function getResendClient(): Resend {
	if (!resendClient) {
		const apiKey = process.env.RESEND_API_KEY;
		if (!apiKey) {
			throw new Error("RESEND_API_KEY environment variable is not set");
		}
		resendClient = new Resend(apiKey);
	}
	return resendClient;
}

/**
 * Resend API Error wrapper
 */
export class ResendApiError extends Error {
	constructor(
		public statusCode: number,
		public message: string,
		public cause?: unknown,
	) {
		super(message);
		this.name = "ResendApiError";
	}
}

/**
 * Handle Resend API errors consistently
 */
export function handleResendError(error: unknown): never {
	if (error instanceof ResendApiError) {
		throw error;
	}

	const err = error as { statusCode?: number; message?: string };
	throw new ResendApiError(
		err.statusCode ?? 500,
		err.message ?? "Unknown Resend API error",
		error,
	);
}
