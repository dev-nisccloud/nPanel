/**
 * Order details saved on a payment_transaction at the moment payment starts.
 *
 * The browser sends the cart once, before any money moves. The server checks it against the
 * catalogue, charges its own total, and keeps the lines on the payment. After that:
 *  - createFromPayment uses the stored lines (not whatever the browser sends later), so a changed
 *    catalogue price or a closed tab cannot strand a paid order;
 *  - staff can finish any paid-but-unmatched order from the Unmatched payments list.
 *
 * Card (Jenga) payments already stored the same shape; M-Pesa now does too.
 */

import type { z } from "zod";
import {
	createFromPaymentInputSchema,
	type CreateFromPaymentInput,
} from "../routers/nisc-service-orders-schemas";

export const storedOrderIntentSchema = createFromPaymentInputSchema.pick({
	items: true,
	currency: true,
	teamId: true,
	billedForUserId: true,
	skipInvoice: true,
});

export type StoredOrderIntent = z.infer<typeof storedOrderIntentSchema>;

/** The order intent saved on a payment, or null when none (or an unreadable one) was stored. */
export function readStoredOrderIntent(metadata: unknown): StoredOrderIntent | null {
	if (!metadata || typeof metadata !== "object") return null;
	const raw = metadata as Record<string, unknown>;
	if (!Array.isArray(raw.items) || raw.items.length === 0) return null;
	const parsed = storedOrderIntentSchema.safeParse({
		items: raw.items,
		currency: typeof raw.currency === "string" ? raw.currency : undefined,
		teamId: typeof raw.teamId === "string" ? raw.teamId : undefined,
		billedForUserId: typeof raw.billedForUserId === "string" ? raw.billedForUserId : undefined,
		skipInvoice: typeof raw.skipInvoice === "boolean" ? raw.skipInvoice : undefined,
	});
	return parsed.success ? parsed.data : null;
}

/** Ex-VAT subtotal of the stored lines. */
export function storedOrderSubtotalExVat(items: CreateFromPaymentInput["items"]): number {
	return items.reduce(
		(sum, i) => sum + (Number.parseFloat(i.itemSubtotal || i.itemPrice || "0") || 0),
		0,
	);
}

export type UnmatchedResolution = {
	action: "COMPLETED" | "REFUND_NEEDED" | "DISMISSED";
	by: string;
	at: string;
	note?: string;
};

export function readUnmatchedResolution(metadata: unknown): UnmatchedResolution | null {
	if (!metadata || typeof metadata !== "object") return null;
	const value = (metadata as Record<string, unknown>).unmatchedResolution;
	if (!value || typeof value !== "object") return null;
	const v = value as Record<string, unknown>;
	if (typeof v.action !== "string" || typeof v.by !== "string" || typeof v.at !== "string") {
		return null;
	}
	return v as unknown as UnmatchedResolution;
}
