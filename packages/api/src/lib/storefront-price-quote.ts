import * as crypto from "node:crypto";
import { z } from "zod";
import type {
	StorefrontCartQuote,
	StorefrontCartQuoteInput,
} from "./storefront-cart-pricing";

const QUOTE_TTL_MS = 15 * 60 * 1000;
const ALGORITHM = "sha256";

const quotePayloadSchema = z.object({
	v: z.literal(1),
	cartHash: z.string().length(64),
	currency: z.enum(["KES", "USD"]),
	sourceCurrency: z.literal("KES"),
	sourceSubtotal: z.number().positive(),
	sourceTaxAmount: z.number().nonnegative(),
	sourceTotal: z.number().positive(),
	subtotal: z.number().positive(),
	taxAmount: z.number().nonnegative(),
	total: z.number().positive(),
	fxRate: z.number().positive(),
	fxProvider: z.enum(["ExchangeRate-API", "IDENTITY"]),
	fxTimestamp: z.number().int().positive(),
	taxPolicyId: z.enum(["STANDARD_VAT", "EXPORT_ZERO_RATED"]),
	taxRate: z.number().min(0).max(1),
	taxEvidenceMismatch: z.boolean(),
	iat: z.number().int().positive(),
	exp: z.number().int().positive(),
});

export type StorefrontPriceQuotePayload = z.infer<typeof quotePayloadSchema>;

function secret(): Buffer {
	const value = process.env.STOREFRONT_JWT_SECRET?.trim();
	if (!value || value.length < 32) {
		throw new Error("STOREFRONT_JWT_SECRET must be at least 32 characters");
	}
	return Buffer.from(value, "utf8");
}

function hashCart(cart: StorefrontCartQuoteInput): string {
	return crypto.createHash("sha256").update(JSON.stringify(cart)).digest("hex");
}

function sign(data: string): string {
	return crypto.createHmac(ALGORITHM, secret()).update(data).digest("base64url");
}

export function signStorefrontPriceQuote(
	cart: StorefrontCartQuoteInput,
	quote: StorefrontCartQuote,
): string {
	const now = Date.now();
	const payload: StorefrontPriceQuotePayload = {
		v: 1,
		cartHash: hashCart(cart),
		currency: quote.currency,
		sourceCurrency: quote.sourceCurrency,
		sourceSubtotal: quote.sourceSubtotal,
		sourceTaxAmount: quote.sourceTaxAmount,
		sourceTotal: quote.sourceTotal,
		subtotal: quote.subtotal,
		taxAmount: quote.taxAmount,
		total: quote.total,
		fxRate: quote.fxRate,
		fxProvider: quote.fxProvider,
		fxTimestamp: quote.fxTimestamp,
		taxPolicyId: quote.taxPolicyId,
		taxRate: quote.taxRate,
		taxEvidenceMismatch: quote.taxEvidenceMismatch,
		iat: now,
		exp: Math.min(now + QUOTE_TTL_MS, quote.fxExpiresAt),
	};
	const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
	return `${body}.${sign(body)}`;
}

export type VerifyStorefrontPriceQuoteResult =
	| { ok: true; payload: StorefrontPriceQuotePayload }
	| { ok: false; reason: "invalid" | "expired" | "cart_mismatch" };

export function verifyStorefrontPriceQuote(
	token: string,
	cart: StorefrontCartQuoteInput,
	options?: { allowExpired?: boolean },
): VerifyStorefrontPriceQuoteResult {
	try {
		const [body, signature] = token.split(".");
		if (!body || !signature) return { ok: false, reason: "invalid" };
		const expected = Buffer.from(sign(body), "utf8");
		const actual = Buffer.from(signature, "utf8");
		if (
			expected.length !== actual.length ||
			!crypto.timingSafeEqual(expected, actual)
		) {
			return { ok: false, reason: "invalid" };
		}
		const parsed = quotePayloadSchema.safeParse(
			JSON.parse(Buffer.from(body, "base64url").toString("utf8")),
		);
		if (!parsed.success) return { ok: false, reason: "invalid" };
		if (!options?.allowExpired && Date.now() > parsed.data.exp) {
			return { ok: false, reason: "expired" };
		}
		if (parsed.data.cartHash !== hashCart(cart)) {
			return { ok: false, reason: "cart_mismatch" };
		}
		return { ok: true, payload: parsed.data };
	} catch {
		return { ok: false, reason: "invalid" };
	}
}
