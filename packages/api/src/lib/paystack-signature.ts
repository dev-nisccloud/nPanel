import * as crypto from "node:crypto";

export function verifyPaystackWebhookSignature(
	rawBody: string,
	signature: string | null,
	secret: string | undefined = process.env.PAYSTACK_SECRET_KEY,
): boolean {
	const normalizedSecret = secret?.trim();
	if (!normalizedSecret || !signature) return false;
	const expected = crypto
		.createHmac("sha512", normalizedSecret)
		.update(rawBody)
		.digest("hex");
	const expectedBuffer = Buffer.from(expected, "utf8");
	const signatureBuffer = Buffer.from(signature.trim().toLowerCase(), "utf8");
	return (
		expectedBuffer.length === signatureBuffer.length &&
		crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
	);
}
