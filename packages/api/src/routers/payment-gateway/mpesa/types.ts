import { z } from "zod";

/**
 * M-Pesa environment configuration
 */
export type MpesaEnvironment = "sandbox" | "live";

/**
 * M-Pesa API configuration
 */
export interface MpesaConfig {
	consumerKey: string;
	consumerSecret: string;
	shortcode: string;
	passkey: string;
	partyB: string;
	transactionType: "CustomerPayBillOnline" | "CustomerBuyGoodsOnline";
	accountReference?: string; // Optional - should be provided per transaction
	environment: MpesaEnvironment;
	callbackUrl: string;
}

/**
 * STK Push request parameters
 */
export const StkPushRequestSchema = z.object({
	phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
	amount: z.number().positive("Amount must be positive").min(1, "Amount must be at least 1"),
	accountReference: z
		.string()
		.min(1, "Account reference is required")
		.max(12, "Account reference must be at most 12 characters")
		.regex(/^[a-zA-Z0-9]+$/, "Account reference must be alphanumeric only"), // Max 12 chars, alphanumeric
	transactionDesc: z
		.string()
		.max(13, "Transaction description must be at most 13 characters")
		.optional(), // Max 13 chars
	callbackUrl: z.string().url("Invalid callback URL").optional(),
	teamId: z.string().optional(), // Optional team ID for team payments
});

export type StkPushRequest = z.infer<typeof StkPushRequestSchema>;

/**
 * STK Push Query request parameters
 */
export const StkPushQueryRequestSchema = z.object({
	checkoutRequestId: z.string().min(1, "Checkout Request ID is required"),
});

export type StkPushQueryRequest = z.infer<typeof StkPushQueryRequestSchema>;

/**
 * M-Pesa OAuth token response
 */
export interface MpesaTokenResponse {
	access_token: string;
	expires_in: string;
}

/**
 * M-Pesa STK Push response
 */
export interface MpesaStkPushResponse {
	MerchantRequestID: string;
	CheckoutRequestID: string;
	ResponseCode: string;
	ResponseDescription: string;
	CustomerMessage: string;
}

/**
 * M-Pesa STK Push Query response
 */
export interface MpesaStkPushQueryResponse {
	ResponseCode: string;
	ResponseDescription: string;
	MerchantRequestID: string;
	CheckoutRequestID: string;
	ResultCode: string;
	ResultDesc: string;
}

/**
 * M-Pesa callback payload (STK Push result)
 * 
 * M-Pesa sends callbacks in this structure:
 * {
 *   Body: {
 *     stkCallback: {
 *       MerchantRequestID: string,
 *       CheckoutRequestID: string,
 *       ResultCode: number,
 *       ResultDesc: string,
 *       CallbackMetadata?: {
 *         Item: Array<{ Name: string, Value: string | number }>
 *       }
 *     }
 *   }
 * }
 */
export const MpesaCallbackSchema = z.object({
	Body: z.object({
		stkCallback: z.object({
			MerchantRequestID: z.string(),
			CheckoutRequestID: z.string(),
			ResultCode: z.union([z.number(), z.string()]).transform((val) => {
				// Handle both string and number ResultCode
				return typeof val === "string" ? parseInt(val, 10) : val;
			}),
			ResultDesc: z.string(),
			CallbackMetadata: z
				.object({
					Item: z.array(
						z.object({
							Name: z.string(),
							Value: z.union([z.string(), z.number()]).optional(), // Value is optional (e.g., Balance may not have value)
						})
					),
				})
				.optional()
				.nullable(),
		}),
	}),
});

export type MpesaCallback = z.infer<typeof MpesaCallbackSchema>;

/**
 * Parsed callback metadata
 */
export interface ParsedCallbackMetadata {
	amount?: number;
	mpesaReceiptNumber?: string;
	transactionDate?: string;
	phoneNumber?: string;
	balance?: number; // Balance of the account for the shortcode used as PartyB
}
