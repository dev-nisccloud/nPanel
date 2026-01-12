import { request } from "undici";
import type {
	MpesaConfig,
	MpesaTokenResponse,
	MpesaStkPushResponse,
	MpesaStkPushQueryResponse,
} from "./types";
import {
	getMpesaErrorInfo,
	isRetryableError,
	getRetryDelay,
	type MpesaErrorInfo,
} from "./error-codes";

/**
 * Custom error class for M-Pesa API errors
 */
export class MpesaApiError extends Error {
	public errorInfo?: MpesaErrorInfo;
	public retryable: boolean;
	public retryAfter?: number;

	constructor(
		public code: string | number,
		public description: string,
		public originalError?: Error,
		errorInfo?: MpesaErrorInfo
	) {
		super(`M-Pesa API Error ${code}: ${description}`);
		this.name = "MpesaApiError";
		this.errorInfo = errorInfo;
		this.retryable = errorInfo?.retryable || false;
		this.retryAfter = errorInfo?.retryAfter;
	}
}

/**
 * M-Pesa API client
 */
export class MpesaClient {
	private config: MpesaConfig;
	private baseUrl: string;
	private tokenCache: { token: string; expiresAt: number } | null = null;

	constructor(config: MpesaConfig) {
		this.config = config;
		this.baseUrl =
			config.environment === "live"
				? "https://api.safaricom.co.ke"
				: "https://sandbox.safaricom.co.ke";
	}

	/**
	 * Generate OAuth access token
	 */
	private async getAccessToken(): Promise<string> {
		// Check if we have a valid cached token
		if (this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
			return this.tokenCache.token;
		}

		try {
			const auth = Buffer.from(
				`${this.config.consumerKey}:${this.config.consumerSecret}`
			).toString("base64");

			const response = await request(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
				method: "GET",
				headers: {
					authorization: `Basic ${auth}`,
				},
			});

			if (response.statusCode !== 200) {
				const errorText = await response.body.text();
				throw new MpesaApiError(
					response.statusCode,
					`Failed to get access token: ${errorText}`
				);
			}

			const data = (await response.body.json()) as MpesaTokenResponse;

			if (!data.access_token) {
				throw new MpesaApiError("NO_TOKEN", "Access token not found in response");
			}

			// Cache the token (expires_in is in seconds, convert to milliseconds)
			const expiresIn = parseInt(data.expires_in || "3600", 10) * 1000;
			this.tokenCache = {
				token: data.access_token,
				expiresAt: Date.now() + expiresIn - 60000, // Subtract 1 minute for safety
			};

			return data.access_token;
		} catch (error) {
			if (error instanceof MpesaApiError) {
				throw error;
			}
			throw new MpesaApiError(
				"TOKEN_ERROR",
				`Failed to get access token: ${error instanceof Error ? error.message : "Unknown error"}`,
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * Generate timestamp in M-Pesa format (YYYYMMDDHHmmss)
	 */
	private generateTimestamp(): string {
		const date = new Date();
		return (
			date.getFullYear() +
			("0" + (date.getMonth() + 1)).slice(-2) +
			("0" + date.getDate()).slice(-2) +
			("0" + date.getHours()).slice(-2) +
			("0" + date.getMinutes()).slice(-2) +
			("0" + date.getSeconds()).slice(-2)
		);
	}

	/**
	 * Generate password for STK Push (Base64 encoded shortcode + passkey + timestamp)
	 */
	private generatePassword(timestamp: string): string {
		return Buffer.from(`${this.config.shortcode}${this.config.passkey}${timestamp}`).toString(
			"base64"
		);
	}

	/**
	 * Format phone number to M-Pesa format (254XXXXXXXXX)
	 */
	private formatPhoneNumber(phoneNumber: string): string {
		// Remove all non-digit characters
		const cleaned = phoneNumber.replace(/\D/g, "");

		// If it starts with 254, return as is
		if (cleaned.startsWith("254")) {
			return cleaned;
		}

		// If it starts with 0, replace with 254
		if (cleaned.startsWith("0")) {
			return `254${cleaned.slice(1)}`;
		}

		// If it's 9 digits, assume it's missing the country code
		if (cleaned.length === 9) {
			return `254${cleaned}`;
		}

		// Otherwise, assume it's already in the correct format or add 254
		return cleaned.length > 9 ? cleaned : `254${cleaned}`;
	}

	/**
	 * Initiate STK Push payment request
	 */
	async initiateStkPush(params: {
		phoneNumber: string;
		amount: number;
		accountReference: string; // Required - must be provided by the calling service
		transactionDesc?: string;
		callbackUrl?: string;
	}): Promise<MpesaStkPushResponse> {
		try {
			const token = await this.getAccessToken();
			const timestamp = this.generateTimestamp();
			const password = this.generatePassword(timestamp);
			const formattedPhone = this.formatPhoneNumber(params.phoneNumber);

			// Validate accountReference is provided (required for all transactions)
			if (!params.accountReference || params.accountReference.trim().length === 0) {
				throw new MpesaApiError(
					"MISSING_ACCOUNT_REFERENCE",
					"Account reference is required. It should be provided by the calling service (e.g., order number, invoice number)."
				);
			}

			// Validate accountReference length (max 12 characters per M-Pesa API)
			if (params.accountReference.length > 12) {
				throw new MpesaApiError(
					"INVALID_ACCOUNT_REFERENCE",
					"Account reference must be at most 12 characters (alphanumeric only)"
				);
			}

			// Validate transactionDesc length (max 13 characters per M-Pesa API)
			const transactionDesc = params.transactionDesc || "Payment";
			if (transactionDesc.length > 13) {
				throw new MpesaApiError(
					"INVALID_TRANSACTION_DESC",
					"Transaction description must be at most 13 characters"
				);
			}

			// Ensure amount is at least 1 (M-Pesa minimum)
			const amount = Math.floor(params.amount);
			if (amount < 1) {
				throw new MpesaApiError(
					"INVALID_AMOUNT",
					"Amount must be at least 1 KES"
				);
			}

			const payload = {
				BusinessShortCode: this.config.shortcode,
				Password: password,
				Timestamp: timestamp,
				TransactionType: "CustomerPayBillOnline",
				Amount: amount.toString(), // M-Pesa accepts string or numeric
				PartyA: formattedPhone,
				PartyB: this.config.partyB,
				PhoneNumber: formattedPhone,
				CallBackURL: params.callbackUrl || this.config.callbackUrl,
				AccountReference: params.accountReference,
				TransactionDesc: transactionDesc,
			};

			const response = await request(
				`${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
				}
			);

			const responseData = (await response.body.json()) as
				| MpesaStkPushResponse
				| { errorCode?: string; errorMessage?: string; requestId?: string };

			// Handle non-200 HTTP status codes
			if (response.statusCode !== 200) {
				// Check if response contains M-Pesa error code
				if ("errorCode" in responseData && responseData.errorCode) {
					const errorInfo = getMpesaErrorInfo(responseData.errorCode);
					if (errorInfo) {
						throw new MpesaApiError(
							responseData.errorCode,
							`${errorInfo.message}. ${errorInfo.mitigation}`,
							undefined,
							errorInfo
						);
					}
				}

				const errorMessage =
					"errorMessage" in responseData
						? responseData.errorMessage
						: `HTTP ${response.statusCode}: Unknown error`;
				throw new MpesaApiError(
					String(response.statusCode),
					`STK Push failed: ${errorMessage}`
				);
			}

			// Check if response indicates an error (M-Pesa error format)
			if ("errorCode" in responseData && responseData.errorCode) {
				const errorInfo = getMpesaErrorInfo(responseData.errorCode);
				if (errorInfo) {
					throw new MpesaApiError(
						responseData.errorCode,
						`${errorInfo.message}. ${errorInfo.mitigation}`,
						undefined,
						errorInfo
					);
				}
				throw new MpesaApiError(
					responseData.errorCode,
					responseData.errorMessage || "STK Push request failed"
				);
			}

			// Type guard: ensure we have a valid MpesaStkPushResponse
			if (!("CheckoutRequestID" in responseData) || !("MerchantRequestID" in responseData)) {
				throw new MpesaApiError(
					"INVALID_RESPONSE",
					"Invalid response structure from M-Pesa API: missing CheckoutRequestID or MerchantRequestID"
				);
			}

			// Now TypeScript knows this is MpesaStkPushResponse
			const mpesaResponse = responseData as MpesaStkPushResponse;

			// Validate response structure
			if (!mpesaResponse.CheckoutRequestID || !mpesaResponse.MerchantRequestID) {
				throw new MpesaApiError(
					"INVALID_RESPONSE",
					"Invalid response structure from M-Pesa API: missing CheckoutRequestID or MerchantRequestID"
				);
			}

			// Check ResponseCode (0 means success, any other code indicates an error)
			if (mpesaResponse.ResponseCode !== "0") {
				throw new MpesaApiError(
					mpesaResponse.ResponseCode,
					`STK Push request failed: ${mpesaResponse.ResponseDescription || mpesaResponse.CustomerMessage}`
				);
			}

			return mpesaResponse;
		} catch (error) {
			if (error instanceof MpesaApiError) {
				throw error;
			}
			throw new MpesaApiError(
				"STK_PUSH_ERROR",
				`Failed to initiate STK Push: ${error instanceof Error ? error.message : "Unknown error"}`,
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * Query STK Push payment status
	 */
	async queryStkPush(checkoutRequestId: string): Promise<MpesaStkPushQueryResponse> {
		try {
			const token = await this.getAccessToken();
			const timestamp = this.generateTimestamp();
			const password = this.generatePassword(timestamp);

			const payload = {
				BusinessShortCode: this.config.shortcode,
				Password: password,
				Timestamp: timestamp,
				CheckoutRequestID: checkoutRequestId,
			};

			const response = await request(`${this.baseUrl}/mpesa/stkpushquery/v1/query`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			const responseData = (await response.body.json()) as
				| MpesaStkPushQueryResponse
				| { errorCode?: string; errorMessage?: string };

			if (response.statusCode !== 200) {
				const errorMessage =
					"errorMessage" in responseData
						? responseData.errorMessage
						: "Unknown error";
				throw new MpesaApiError(
					response.statusCode,
					`STK Push Query failed: ${errorMessage}`
				);
			}

			// Check if response indicates an error
			if ("errorCode" in responseData) {
				throw new MpesaApiError(
					responseData.errorCode || "UNKNOWN",
					responseData.errorMessage || "STK Push Query failed"
				);
			}

			// Type guard: ensure we have a valid MpesaStkPushQueryResponse
			if (
				!("ResponseCode" in responseData) ||
				!("CheckoutRequestID" in responseData) ||
				!("MerchantRequestID" in responseData)
			) {
				throw new MpesaApiError(
					"INVALID_RESPONSE",
					"Invalid response structure from M-Pesa API"
				);
			}

			// Now TypeScript knows this is MpesaStkPushQueryResponse
			return responseData as MpesaStkPushQueryResponse;
		} catch (error) {
			if (error instanceof MpesaApiError) {
				throw error;
			}
			throw new MpesaApiError(
				"STK_QUERY_ERROR",
				`Failed to query STK Push: ${error instanceof Error ? error.message : "Unknown error"}`,
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * Get M-Pesa configuration (for validation purposes)
	 */
	getConfig(): Omit<MpesaConfig, "consumerKey" | "consumerSecret" | "passkey"> {
		return {
			shortcode: this.config.shortcode,
			partyB: this.config.partyB,
			accountReference: this.config.accountReference, // May be undefined
			environment: this.config.environment,
			callbackUrl: this.config.callbackUrl,
		};
	}
}

/**
 * Create M-Pesa client from environment variables
 */
export function createMpesaClientFromEnv(): MpesaClient {
	const environment = (process.env.MPESA_ENVIRONMENT || "sandbox") as "sandbox" | "live";

	const requiredEnvVars = [
		"MPESA_CONSUMER_KEY",
		"MPESA_CONSUMER_SECRET",
		"MPESA_SHORTCODE",
		"MPESA_PASSKEY",
		"MPESA_PARTY_B",
		"MPESA_CALLBACK_URL",
	];

	const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

	if (missingVars.length > 0) {
		throw new Error(
			`Missing required M-Pesa environment variables: ${missingVars.join(", ")}`
		);
	}

	const config: MpesaConfig = {
		consumerKey: process.env.MPESA_CONSUMER_KEY!,
		consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
		shortcode: process.env.MPESA_SHORTCODE!,
		passkey: process.env.MPESA_PASSKEY!,
		partyB: process.env.MPESA_PARTY_B!,
		accountReference: process.env.MPESA_ACCOUNT_REFERENCE, // Optional - for backward compatibility only
		environment,
		callbackUrl: process.env.MPESA_CALLBACK_URL!,
	};

	return new MpesaClient(config);
}
