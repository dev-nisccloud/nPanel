import * as crypto from "node:crypto";
import { afterEach, describe, expect, test } from "bun:test";
import {
	getTrustedCountryCodeSync,
	storefrontCurrencyForCountry,
} from "@npanel/location";
import { convertWithFxSnapshot } from "./fx-rates";
import {
	signStorefrontPriceQuote,
	verifyStorefrontPriceQuote,
} from "./storefront-price-quote";
import type {
	StorefrontCartQuote,
	StorefrontCartQuoteInput,
} from "./storefront-cart-pricing";
import { computeTaxTotals, resolveTaxPolicy } from "./tax-policy";
import { verifyPaystackWebhookSignature } from "./paystack-signature";

const originalSecret = process.env.STOREFRONT_JWT_SECRET;
const originalZeroRating = process.env.FOREIGN_SERVICE_ZERO_RATING_ENABLED;
const originalVatRate = process.env.STOREFRONT_DEFAULT_VAT_RATE;

afterEach(() => {
	process.env.STOREFRONT_JWT_SECRET = originalSecret;
	process.env.FOREIGN_SERVICE_ZERO_RATING_ENABLED = originalZeroRating;
	process.env.STOREFRONT_DEFAULT_VAT_RATE = originalVatRate;
});

describe("currency location defaults", () => {
	test("Kenya resolves to KES and known foreign countries to USD", () => {
		expect(storefrontCurrencyForCountry("KE")).toBe("KES");
		expect(storefrontCurrencyForCountry("US")).toBe("USD");
		expect(storefrontCurrencyForCountry(null)).toBe("KES");
	});

	test("only valid ISO country values are accepted from trusted headers", () => {
		expect(
			getTrustedCountryCodeSync(new Headers({ "cf-ipcountry": "ke" })),
		).toBe("KE");
		expect(
			getTrustedCountryCodeSync(new Headers({ "cf-ipcountry": "ZZ" })),
		).toBeNull();
	});
});

describe("tax policy", () => {
	test("defaults every country to configured 16 percent VAT", () => {
		delete process.env.FOREIGN_SERVICE_ZERO_RATING_ENABLED;
		delete process.env.STOREFRONT_DEFAULT_VAT_RATE;
		expect(
			resolveTaxPolicy({
				billingCountry: "US",
				paymentCountry: "US",
				ipCountry: "US",
			}),
		).toMatchObject({ id: "STANDARD_VAT", rate: 0.16 });
	});

	test("foreign zero rating requires explicit activation and matching evidence", () => {
		process.env.FOREIGN_SERVICE_ZERO_RATING_ENABLED = "true";
		expect(
			resolveTaxPolicy({
				billingCountry: "US",
				paymentCountry: "US",
				ipCountry: "KE",
			}),
		).toMatchObject({
			id: "EXPORT_ZERO_RATED",
			rate: 0,
			evidenceMismatch: true,
		});
		expect(
			resolveTaxPolicy({
				billingCountry: "US",
				paymentCountry: "KE",
			}).id,
		).toBe("STANDARD_VAT");
	});

	test("USD rounds to cents while KES VAT rounds up to a shilling", () => {
		expect(computeTaxTotals(10.01, 0.16, "USD")).toEqual({
			subtotal: 10.01,
			taxAmount: 1.6,
			total: 11.61,
		});
		expect(computeTaxTotals(10.01, 0.16, "KES").taxAmount).toBe(2);
	});
});

describe("signed price quotes", () => {
	const cart: StorefrontCartQuoteInput = {
		currency: "USD",
		main: {
			serviceType: "web_hosting",
			planId: "plan-1",
			productId: "product-1",
			billingCycle: "MONTHLY",
		},
	};
	const now = Date.now();
	const quote: StorefrontCartQuote = {
		currency: "USD",
		sourceCurrency: "KES",
		sourceSubtotal: 1_000,
		sourceTaxAmount: 160,
		sourceTotal: 1_160,
		fxRate: 0.0077,
		fxProvider: "ExchangeRate-API",
		fxTimestamp: now,
		fxExpiresAt: now + 60 * 60 * 1000,
		taxPolicyId: "STANDARD_VAT",
		taxRate: 0.16,
		taxEvidenceMismatch: false,
		monthlyPrice: 7.7,
		yearlyPrice: 92.4,
		planName: "Launch",
		productName: "Hosting",
		serviceType: "web_hosting",
		planId: "plan-1",
		productId: "product-1",
		billingCycle: "MONTHLY",
		subtotal: 7.7,
		taxAmount: 1.23,
		total: 8.93,
	};

	test("detects token tampering and cart substitution", () => {
		process.env.STOREFRONT_JWT_SECRET = "test-secret-that-is-at-least-32-characters";
		const token = signStorefrontPriceQuote(cart, quote);
		expect(verifyStorefrontPriceQuote(token, cart).ok).toBe(true);
		expect(verifyStorefrontPriceQuote(`${token}x`, cart).ok).toBe(false);
		expect(
			verifyStorefrontPriceQuote(token, {
				...cart,
				main: { ...cart.main, planId: "other-plan" },
			}),
		).toEqual({ ok: false, reason: "cart_mismatch" });
	});

	test("rejects a quote whose FX snapshot has expired", () => {
		process.env.STOREFRONT_JWT_SECRET = "test-secret-that-is-at-least-32-characters";
		const token = signStorefrontPriceQuote(cart, {
			...quote,
			fxExpiresAt: Date.now() - 1,
		});
		expect(verifyStorefrontPriceQuote(token, cart)).toEqual({
			ok: false,
			reason: "expired",
		});
	});
});

describe("FX and Paystack integrity", () => {
	test("converts only with an explicit positive snapshot", () => {
		expect(
			convertWithFxSnapshot(1_000, {
				sourceCurrency: "KES",
				targetCurrency: "USD",
				rate: 0.0077,
				provider: "ExchangeRate-API",
				retrievedAt: Date.now(),
				expiresAt: Date.now() + 1_000,
			}),
		).toBe(7.7);
		expect(() =>
			convertWithFxSnapshot(-1, {
				sourceCurrency: "KES",
				targetCurrency: "USD",
				rate: 0.0077,
				provider: "ExchangeRate-API",
				retrievedAt: Date.now(),
				expiresAt: Date.now() + 1_000,
			}),
		).toThrow("Invalid amount");
	});

	test("accepts only the exact Paystack HMAC", () => {
		const secret = "paystack-test-secret";
		const body = JSON.stringify({ event: "charge.success" });
		const signature = crypto
			.createHmac("sha512", secret)
			.update(body)
			.digest("hex");
		expect(verifyPaystackWebhookSignature(body, signature, secret)).toBe(true);
		expect(verifyPaystackWebhookSignature(`${body} `, signature, secret)).toBe(
			false,
		);
	});
});
