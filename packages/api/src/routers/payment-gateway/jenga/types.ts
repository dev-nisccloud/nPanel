import { z } from "zod";

export const JENGA_CURRENCIES = ["KES", "TZS", "UGX", "USD", "EUR", "GBP"] as const;
export type JengaCurrency = (typeof JENGA_CURRENCIES)[number];

export type JengaEnvironment = "test" | "live";

export interface JengaConfig {
	apiKey: string;
	merchantCode: string;
	consumerSecret: string;
	/**
	 * Local/dev: filesystem path to RSA private key PEM.
	 * Prefer `privateKeyPem` on Cloud Run (Secret Manager → env).
	 */
	privateKeyPath?: string;
	/** Production-friendly: full PEM string (supports `\n` escaped newlines). */
	privateKeyPem?: string;
	environment: JengaEnvironment;
	defaultCallbackUrl: string;
	ipnUsername?: string;
	ipnPassword?: string;
	paymentTimeLimit?: string;
	defaultCountryCode?: string;
	defaultCurrency?: string;
}

export interface JengaAuthResponse {
	accessToken: string;
	refreshToken: string;
	expiresIn: string;
	issuedAt: string;
	tokenType: "Bearer";
}

export const jengaCustomerFieldsSchema = z.object({
	customerFirstName: z.string().min(1).max(100),
	customerLastName: z.string().min(1).max(100),
	customerEmail: z.string().email().max(200),
	customerPhone: z
		.string()
		.min(10)
		.max(20)
		.regex(/^[+\d\s()-]+$/, "Invalid phone number"),
	customerAddress: z.string().min(1).max(200),
	customerPostalCodeZip: z.string().min(1).max(20),
	countryCode: z
		.string()
		.length(2)
		.regex(/^[A-Z]{2}$/, "Country code must be Alpha-2 (e.g. KE)"),
});

export const jengaOrderReferenceSchema = z
	.string()
	.min(8)
	.max(32)
	.regex(/^[a-zA-Z0-9]+$/, "Order reference must be alphanumeric");

export const jengaOrderIntentSchema = z.object({
	source: z.enum(["buy_now", "global_buy_now", "storefront"]),
	/** Where to send the browser after Jenga (path on returnOrigin). */
	returnPath: z.string().optional(),
	/** Origin of the app that started checkout (window.location.origin). */
	returnOrigin: z.string().url(),
	items: z.array(z.unknown()).optional(),
	currency: z.string().optional(),
	teamId: z.string().optional(),
	billedForUserId: z.string().optional(),
	skipInvoice: z.boolean().optional(),
	/** Storefront cart snapshot for createFromPayment */
	cart: z.unknown().optional(),
	planId: z.string().optional(),
	productId: z.string().optional(),
	billingCycle: z.string().optional(),
	primaryDomain: z.string().optional(),
});

export const initiateCardPaymentInputSchema = jengaCustomerFieldsSchema.extend({
	amount: z.number().positive(),
	currency: z.enum(JENGA_CURRENCIES).default("KES"),
	productType: z.enum(["Product", "Service"]).default("Service"),
	productDescription: z.string().min(1).max(200),
	paymentTimeLimit: z.string().min(1).max(20).optional(),
	teamId: z.string().optional(),
	/** Order intent for post-redirect createFromPayment */
	orderIntent: jengaOrderIntentSchema.optional(),
});

export type InitiateCardPaymentInput = z.infer<typeof initiateCardPaymentInputSchema>;

export const getJengaPaymentStatusInputSchema = z.object({
	orderReference: jengaOrderReferenceSchema,
});

export interface JengaPaymentRequest {
	orderAmount: number;
	orderReference: string;
	currency: string;
	productType: "Product" | "Service";
	productDescription: string;
	paymentTimeLimit: string;
	customerFirstName: string;
	customerLastName: string;
	customerEmail: string;
	customerPhone: string;
	customerAddress: string;
	customerPostalCodeZip: string;
	countryCode: string;
	callbackUrl?: string;
	extraData?: string;
	secondaryReference?: string;
}

export interface JengaPaymentInitResult {
	checkoutUrl: string;
	paymentData: Record<string, string>;
}

export const jengaCallbackQuerySchema = z.object({
	transactionId: z.string().optional(),
	status: z.string().optional(),
	date: z.string().optional(),
	desc: z.string().optional(),
	amount: z.string().optional(),
	orderReference: z.string().optional(),
	hash: z.string().optional(),
	extraData: z.string().optional(),
});

export type JengaCallbackQuery = z.infer<typeof jengaCallbackQuerySchema>;

/**
 * Real Jenga IPN shape (from JengaHQ sample)  currency fields are often omitted;
 * bank.account may be the string "null".
 */
export const jengaIpnPayloadSchema = z.object({
	callbackType: z.literal("IPN"),
	customer: z.object({
		name: z.string(),
		mobileNumber: z.string(),
		reference: z.string(),
	}),
	transaction: z.object({
		date: z.string(),
		reference: z.string(),
		paymentMode: z.string(),
		amount: z.union([z.number(), z.string()]),
		currency: z.string().optional(),
		billNumber: z.string(),
		servedBy: z.string().optional(),
		additionalInfo: z.string().optional(),
		orderAmount: z.union([z.number(), z.string()]).optional(),
		serviceCharge: z.union([z.number(), z.string()]).optional(),
		orderCurrency: z.string().optional(),
		status: z.enum(["SUCCESS", "FAILED"]),
		remarks: z.string().optional(),
	}),
	bank: z.object({
		reference: z.string(),
		transactionType: z.string(),
		/** Jenga sometimes sends the literal string "null" */
		account: z.union([z.string(), z.null()]).optional(),
	}),
});

export type JengaIpnPayload = z.infer<typeof jengaIpnPayloadSchema>;

export type JengaPaymentMetadata = {
	source?: "buy_now" | "global_buy_now" | "storefront";
	returnPath?: string;
	/** Origin of the app that started checkout  used for post-Jenga redirect */
	returnOrigin?: string;
	orderReference: string;
	customer?: {
		firstName: string;
		lastName: string;
		email: string;
		phone: string;
		address: string;
		postalCode: string;
		countryCode: string;
	};
	items?: unknown[];
	currency?: string;
	teamId?: string;
	billedForUserId?: string;
	skipInvoice?: boolean;
	cart?: unknown;
	planId?: string;
	productId?: string;
	billingCycle?: string;
	primaryDomain?: string;
};
