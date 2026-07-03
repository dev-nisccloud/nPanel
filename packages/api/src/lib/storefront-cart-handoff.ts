/**
 * Signed storefront cart handoff tokens.
 *
 * Buy-now links carry only `?h=<token>`  no prices, no tamperable amounts.
 * Payload is HMAC-signed with STOREFRONT_JWT_SECRET (same as checkout session tokens).
 */
import * as crypto from "node:crypto";
import { z } from "zod";
import { storefrontBillingCycleSchema } from "./storefront-cart-pricing";

const HANDOFF_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const ALGORITHM = "sha256";

export const storefrontCartHandoffPayloadSchema = z.object({
	v: z.literal(1),
	serviceType: z.string().min(1),
	planId: z.string().optional(),
	productId: z.string().optional(),
	planName: z.string().optional(),
	productName: z.string().optional(),
	billingCycle: storefrontBillingCycleSchema.default("MONTHLY"),
	locationName: z.string().optional(),
	bundleDomains: z.array(z.string().min(1)).optional(),
	/** Domain transfer checkout (signed so prices cannot be tampered). */
	transferProvider: z.enum(["kenic", "openprovider"]).optional(),
	providerPriceAmount: z.number().optional(),
	providerPriceCurrency: z.string().optional(),
	customerPriceAmount: z.number().optional(),
	customerPriceCurrency: z.string().optional(),
	iat: z.number(),
	exp: z.number(),
});

export type StorefrontCartHandoffPayload = z.infer<
	typeof storefrontCartHandoffPayloadSchema
>;

export type StorefrontCartHandoffInput = Omit<
	StorefrontCartHandoffPayload,
	"v" | "iat" | "exp"
>;

function getSecret(): Buffer {
	const secret = process.env.STOREFRONT_JWT_SECRET?.trim();
	if (!secret || secret.length < 32) {
		throw new Error(
			"STOREFRONT_JWT_SECRET must be set and at least 32 characters long",
		);
	}
	return Buffer.from(secret, "utf8");
}

function b64url(buf: Buffer): string {
	return buf.toString("base64url");
}

function sign(data: string, secret: Buffer): string {
	return b64url(crypto.createHmac(ALGORITHM, secret).update(data).digest());
}

export function signStorefrontCartHandoff(
	input: StorefrontCartHandoffInput,
): string {
	const now = Date.now();
	const payload: StorefrontCartHandoffPayload = storefrontCartHandoffPayloadSchema.parse({
		v: 1,
		...input,
		iat: now,
		exp: now + HANDOFF_TTL_MS,
	});

	const header = b64url(
		Buffer.from(JSON.stringify({ alg: "HS256", typ: "SFCH" }), "utf8"),
	);
	const body = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
	const sig = sign(`${header}.${body}`, getSecret());
	return `${header}.${body}.${sig}`;
}

export type VerifyStorefrontCartHandoffResult =
	| { ok: true; payload: StorefrontCartHandoffPayload }
	| { ok: false; reason: "invalid" | "expired" | "malformed" };

export function verifyStorefrontCartHandoff(
	token: string,
): VerifyStorefrontCartHandoffResult {
	try {
		const parts = token.split(".");
		if (parts.length !== 3) return { ok: false, reason: "malformed" };

		const [header, body, sig] = parts as [string, string, string];
		const secret = getSecret();
		const expected = sign(`${header}.${body}`, secret);
		const expectedBuf = Buffer.from(expected, "utf8");
		const actualBuf = Buffer.from(sig, "utf8");
		if (
			expectedBuf.length !== actualBuf.length ||
			!crypto.timingSafeEqual(expectedBuf, actualBuf)
		) {
			return { ok: false, reason: "invalid" };
		}

		const raw = JSON.parse(
			Buffer.from(body, "base64url").toString("utf8"),
		) as unknown;
		const parsed = storefrontCartHandoffPayloadSchema.safeParse(raw);
		if (!parsed.success) return { ok: false, reason: "malformed" };

		if (Date.now() > parsed.data.exp) {
			return { ok: false, reason: "expired" };
		}

		return { ok: true, payload: parsed.data };
	} catch {
		return { ok: false, reason: "malformed" };
	}
}

export function handoffPayloadToQuoteMain(
	payload: StorefrontCartHandoffPayload,
): {
	serviceType: string;
	planId?: string;
	productId?: string;
	planName?: string;
	productName?: string;
	billingCycle: "MONTHLY" | "YEARLY";
	locationName?: string;
	bundleDomains?: string[];
} {
	return {
		serviceType: payload.serviceType,
		planId: payload.planId,
		productId: payload.productId,
		planName: payload.planName,
		productName: payload.productName,
		billingCycle: payload.billingCycle,
		locationName: payload.locationName,
		bundleDomains: payload.bundleDomains,
		transferProvider: payload.transferProvider,
		providerPriceAmount: payload.providerPriceAmount,
		providerPriceCurrency: payload.providerPriceCurrency,
		customerPriceAmount: payload.customerPriceAmount,
		customerPriceCurrency: payload.customerPriceCurrency,
	};
}
