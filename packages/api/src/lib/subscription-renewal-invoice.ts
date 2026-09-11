/**
 * Create-or-reuse an unpaid renewal invoice for a due subscription.
 * Mirrors Nisc order invoice creation (numbering, VAT, billing, from-details)
 * with line copy `{product name} - {subscription name}` and period dates.
 */
import * as crypto from "crypto";
import { and, asc, db, eq, sql } from "@npanel/db";
import {
	invoice,
	invoiceActivityLog,
	invoiceCounter,
	invoiceLineItem,
} from "@npanel/db/schema/invoicing";
import { niscClientSubscription } from "@npanel/db/schema/products";
import { COMPANY_LOGO_URL } from "./company-branding";
import { reverseCeilVatToExVat } from "./convert-price";
import { getInvoiceDetailForPdf } from "./invoice-for-pdf";
import { generateInvoicePdfBuffer } from "./generate-invoice-pdf";
import { buildInvoiceKraInsertFields } from "./invoice-kra-db-fields";
import { isInvoiceKraSynced } from "./invoice-kra-status";
import { buildNiscInvoiceLineMetadata } from "./invoice-kra-mapper";
import { ensureInvoiceKraSyncedForDelivery } from "./invoice-kra-sync";
import { sanitizeInvoicePdfFilename } from "./invoice-pdf-data";
import { computeInvoicePaymentState } from "./invoice-payment-state";
import { resolveNiscOrderInvoiceBilling } from "./nisc-order-invoice-billing";
import {
	NISC_INVOICE_FROM_DETAILS,
	paymentDetailsForPaidOrder,
} from "./nisc-order-auto-invoice";
import {
	addBillingCycleToDate,
	buildRenewalReminderInvoiceLineCopy,
	isDomainOrderItem,
} from "./nisc-order-invoice-line-items";
import { NISC_ORDER_VAT_PERCENTAGE, computeNiscOrderTotalsWithTax } from "./nisc-order-tax";
import { resolveDomainBillingCycle, DOMAIN_DEFAULT_BILLING_CYCLE } from "./nisc-domain-billing-cycle";

export const SUBSCRIPTION_RENEWAL_INVOICE_SOURCE = "subscription-renewal-reminder";

export type RenewalInvoiceEnsureInput = {
	subscriptionId: string;
	teamId: string | null;
	userId: string | null;
	createdBy: string | null;
	productId: string;
	productName: string;
	serviceType: string | null;
	subscriptionName: string | null;
	primaryDomain: string | null;
	agreedPrice: string | null;
	agreedCurrency: string | null;
	billingCycle: string | null;
	periodStart: Date;
};

export type RenewalInvoiceEnsureResult =
	| {
			ok: true;
			created: boolean;
			invoiceId: string;
			invoiceNumber: string;
			billingPeriodStart: string;
			billingPeriodEnd: string | null;
			lineName: string;
			lineDescription: string;
	  }
	| {
			ok: false;
			skipped: true;
			reasonCode: string;
			reasonMessage: string;
	  };

export function billingPeriodDateKey(d: Date): string {
	const y = d.getUTCFullYear();
	const m = String(d.getUTCMonth() + 1).padStart(2, "0");
	const day = String(d.getUTCDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

function isDomainSubscription(input: {
	serviceType: string | null;
	productName: string;
	primaryDomain: string | null;
}): boolean {
	if (
		isDomainOrderItem({
			description: null,
			primaryDomain: input.primaryDomain,
			product: { serviceType: input.serviceType },
		})
	) {
		return true;
	}
	return input.productName.toLowerCase().includes("domain");
}

function resolveRenewalBillingCycle(input: RenewalInvoiceEnsureInput): string | null {
	if (isDomainSubscription(input)) {
		const cycle = resolveDomainBillingCycle(input.billingCycle);
		if (addBillingCycleToDate(input.periodStart, cycle)) return cycle;
		return DOMAIN_DEFAULT_BILLING_CYCLE;
	}
	const cycle = input.billingCycle?.trim() || null;
	if (!cycle) return null;
	if (!addBillingCycleToDate(input.periodStart, cycle)) return null;
	return cycle;
}

async function findExistingRenewalInvoice(
	subscriptionId: string,
	billingPeriodStart: string,
): Promise<{
	invoiceId: string;
	invoiceNumber: string;
	lineName: string | null;
	lineDescription: string | null;
	billingPeriodEnd: string | null;
} | null> {
	const [row] = await db
		.select({
			id: invoice.id,
			invoiceNumber: invoice.invoiceNumber,
			metadata: invoice.metadata,
		})
		.from(invoice)
		.where(
			and(
				sql`${invoice.metadata}->>'source' = ${SUBSCRIPTION_RENEWAL_INVOICE_SOURCE}`,
				sql`${invoice.metadata}->>'subscriptionId' = ${subscriptionId}`,
				sql`${invoice.metadata}->>'billingPeriodStart' = ${billingPeriodStart}`,
			),
		)
		.orderBy(asc(invoice.createdAt))
		.limit(1);

	if (!row?.id || !row.invoiceNumber) return null;

	const [line] = await db
		.select({
			name: invoiceLineItem.name,
			description: invoiceLineItem.description,
		})
		.from(invoiceLineItem)
		.where(eq(invoiceLineItem.invoiceId, row.id))
		.orderBy(asc(invoiceLineItem.position))
		.limit(1);

	const meta =
		row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
			? (row.metadata as Record<string, unknown>)
			: {};
	const billingPeriodEnd =
		typeof meta.billingPeriodEnd === "string" ? meta.billingPeriodEnd : null;

	return {
		invoiceId: row.id,
		invoiceNumber: row.invoiceNumber,
		lineName: line?.name ?? null,
		lineDescription: line?.description ?? null,
		billingPeriodEnd,
	};
}

async function deleteOrphanInvoice(invoiceId: string) {
	await db.delete(invoiceActivityLog).where(eq(invoiceActivityLog.invoiceId, invoiceId));
	await db.delete(invoiceLineItem).where(eq(invoiceLineItem.invoiceId, invoiceId));
	await db.delete(invoice).where(eq(invoice.id, invoiceId));
}

/**
 * Find an existing renewal invoice for this subscription + billing date, or create one.
 * Skips when billing details, agreed price, actor, or billing cycle are incomplete.
 */
export async function ensureSubscriptionRenewalInvoice(
	input: RenewalInvoiceEnsureInput,
): Promise<RenewalInvoiceEnsureResult> {
	const billingPeriodStart = billingPeriodDateKey(input.periodStart);

	const existing = await findExistingRenewalInvoice(input.subscriptionId, billingPeriodStart);
	if (existing) {
		await db
			.update(niscClientSubscription)
			.set({ invoiceId: existing.invoiceId, updatedAt: new Date() })
			.where(eq(niscClientSubscription.id, input.subscriptionId));

		const cycle = resolveRenewalBillingCycle(input);
		const copy = buildRenewalReminderInvoiceLineCopy({
			productName: input.productName,
			subscriptionName: input.subscriptionName,
			periodStart: input.periodStart,
			billingCycle: cycle,
		});
		const periodEnd = cycle
			? (addBillingCycleToDate(input.periodStart, cycle)
					?.toISOString()
					.slice(0, 10) ?? null)
			: existing.billingPeriodEnd;

		return {
			ok: true,
			created: false,
			invoiceId: existing.invoiceId,
			invoiceNumber: existing.invoiceNumber,
			billingPeriodStart,
			billingPeriodEnd: existing.billingPeriodEnd ?? periodEnd,
			lineName: existing.lineName ?? copy.name,
			lineDescription: existing.lineDescription ?? copy.description,
		};
	}

	const createdBy = input.createdBy?.trim() || null;
	if (!createdBy) {
		return {
			ok: false,
			skipped: true,
			reasonCode: "incomplete_details",
			reasonMessage:
				"Invoice skipped: no user id available to stamp as invoice creator.",
		};
	}

	const billingResolution = await resolveNiscOrderInvoiceBilling({
		teamId: input.teamId,
		userId: input.userId,
	});
	if (!billingResolution.ok) {
		return {
			ok: false,
			skipped: true,
			reasonCode: billingResolution.reasonCode,
			reasonMessage: billingResolution.reasonMessage,
		};
	}

	const agreedIncVat = Number.parseFloat(String(input.agreedPrice ?? ""));
	if (!Number.isFinite(agreedIncVat) || agreedIncVat <= 0) {
		return {
			ok: false,
			skipped: true,
			reasonCode: "incomplete_details",
			reasonMessage:
				"Invoice skipped: subscription agreedPrice is missing or not a positive amount.",
		};
	}

	const billingCycle = resolveRenewalBillingCycle(input);
	if (!billingCycle) {
		return {
			ok: false,
			skipped: true,
			reasonCode: "incomplete_details",
			reasonMessage:
				"Invoice skipped: billing cycle is missing or unsupported for this subscription.",
		};
	}

	const periodEndDate = addBillingCycleToDate(input.periodStart, billingCycle);
	const billingPeriodEnd = periodEndDate ? billingPeriodDateKey(periodEndDate) : null;
	const { name: lineName, description: lineDescription } = buildRenewalReminderInvoiceLineCopy({
		productName: input.productName,
		subscriptionName: input.subscriptionName,
		periodStart: input.periodStart,
		billingCycle,
	});

	const subtotalNum = reverseCeilVatToExVat(agreedIncVat, NISC_ORDER_VAT_PERCENTAGE / 100);
	const { subtotal: subtotalRounded, tax: taxAmount, total: totalNum } =
		computeNiscOrderTotalsWithTax(subtotalNum);
	const subtotal = subtotalRounded.toFixed(2);
	const tax = taxAmount.toFixed(2);
	const total = totalNum.toFixed(2);
	const lineExVat = subtotalRounded.toFixed(2);
	const currency = input.agreedCurrency?.trim() || "KES";
	const now = new Date();

	const paymentState = computeInvoicePaymentState({
		amount: totalNum,
		amountPaid: 0,
		status: "SENT",
	});
	const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

	const billing = billingResolution.resolved.billing;
	const customerDetails = {
		name: billing.legalName,
		email: billing.billingEmail,
		phone: billing.billingPhone ?? null,
		address: billing.addressLine1,
		addressLine2: billing.addressLine2 ?? null,
		city: billing.city,
		state: billing.state ?? null,
		zip: billing.postalCode ?? null,
		country: billing.country,
		taxId: billing.taxId ?? null,
	};

	const newInvoiceId = crypto.randomUUID();
	const token = crypto.randomUUID();

	const generatedInvoiceNumber = await db.transaction(async (tx) => {
		const [counter] = await tx
			.insert(invoiceCounter)
			.values({ id: "invoice-counter", lastNumber: 1 })
			.onConflictDoUpdate({
				target: invoiceCounter.id,
				set: { lastNumber: sql`${invoiceCounter.lastNumber} + 1` },
			})
			.returning({ lastNumber: invoiceCounter.lastNumber });

		const n = counter?.lastNumber ?? 1;
		return `INV-${n.toString().padStart(4, "0")}`;
	});

	const invoiceMetadata = {
		source: SUBSCRIPTION_RENEWAL_INVOICE_SOURCE,
		subscriptionId: input.subscriptionId,
		billingPeriodStart,
		billingPeriodEnd,
		billingCycle,
		productId: input.productId,
	};

	await db.insert(invoice).values({
		id: newInvoiceId,
		token,
		teamId: input.teamId,
		customerName: billing.legalName,
		customerEmail: billing.billingEmail,
		invoiceNumber: generatedInvoiceNumber,
		status: paymentState.status,
		amount: total,
		subtotal,
		tax,
		taxPercentage: NISC_ORDER_VAT_PERCENTAGE,
		currency,
		issueDate: now,
		dueDate,
		paidAt: null,
		amountPaid: paymentState.amountPaid,
		amountRemaining: paymentState.amountRemaining,
		creditBalance: paymentState.creditBalance,
		fromDetails: NISC_INVOICE_FROM_DETAILS,
		customerDetails,
		paymentDetails: paymentDetailsForPaidOrder(null),
		template: { logoUrl: COMPANY_LOGO_URL },
		metadata: invoiceMetadata,
		createdBy,
		updatedBy: createdBy,
		createdAt: now,
		updatedAt: now,
		...buildInvoiceKraInsertFields(),
	});

	const lineMeta = {
		...(buildNiscInvoiceLineMetadata({
			productId: input.productId,
			serviceType: input.serviceType,
		}) ?? {}),
		subscriptionId: input.subscriptionId,
		billingPeriodStart,
		billingPeriodEnd,
		source: SUBSCRIPTION_RENEWAL_INVOICE_SOURCE,
	};

	await db.insert(invoiceLineItem).values({
		id: crypto.randomUUID(),
		invoiceId: newInvoiceId,
		position: 0,
		name: lineName,
		description: lineDescription,
		quantity: 1,
		price: lineExVat,
		total: lineExVat,
		metadata: lineMeta,
		createdAt: now,
		updatedAt: now,
	});

	await db.insert(invoiceActivityLog).values({
		id: crypto.randomUUID(),
		invoiceId: newInvoiceId,
		userId: createdBy,
		action: "CREATE",
		description: "Auto-generated invoice from subscription renewal reminder",
		metadata: invoiceMetadata,
		createdAt: now,
	});

	const raced = await findExistingRenewalInvoice(input.subscriptionId, billingPeriodStart);
	if (raced && raced.invoiceId !== newInvoiceId) {
		await deleteOrphanInvoice(newInvoiceId);
		await db
			.update(niscClientSubscription)
			.set({ invoiceId: raced.invoiceId, updatedAt: new Date() })
			.where(eq(niscClientSubscription.id, input.subscriptionId));
		return {
			ok: true,
			created: false,
			invoiceId: raced.invoiceId,
			invoiceNumber: raced.invoiceNumber,
			billingPeriodStart,
			billingPeriodEnd: raced.billingPeriodEnd ?? billingPeriodEnd,
			lineName: raced.lineName ?? lineName,
			lineDescription: raced.lineDescription ?? lineDescription,
		};
	}

	await db
		.update(niscClientSubscription)
		.set({ invoiceId: newInvoiceId, updatedAt: now })
		.where(eq(niscClientSubscription.id, input.subscriptionId));

	return {
		ok: true,
		created: true,
		invoiceId: newInvoiceId,
		invoiceNumber: generatedInvoiceNumber,
		billingPeriodStart,
		billingPeriodEnd,
		lineName,
		lineDescription,
	};
}

export async function buildRenewalInvoicePdf(invoiceId: string): Promise<{
	buffer: Buffer;
	filename: string;
	invoiceNumber: string;
	kraSynced: boolean;
}> {
	try {
		await ensureInvoiceKraSyncedForDelivery(invoiceId);
	} catch {
		// Reminder still goes out with the invoice PDF even if eTIMS is unavailable.
	}

	const invoiceDetail = await getInvoiceDetailForPdf(db, invoiceId);
	const buffer = await generateInvoicePdfBuffer(invoiceDetail);
	const invoiceNumber = invoiceDetail.invoiceNumber ?? "Invoice";
	return {
		buffer,
		filename: sanitizeInvoicePdfFilename(invoiceNumber),
		invoiceNumber,
		kraSynced: isInvoiceKraSynced(invoiceDetail.kraStatus),
	};
}

export function serializeRenewalInvoiceResult(
	result: RenewalInvoiceEnsureResult,
): Record<string, unknown> {
	if (result.ok) {
		return {
			ok: true,
			created: result.created,
			invoiceId: result.invoiceId,
			invoiceNumber: result.invoiceNumber,
			billingPeriodStart: result.billingPeriodStart,
			billingPeriodEnd: result.billingPeriodEnd,
			lineName: result.lineName,
			lineDescription: result.lineDescription,
		};
	}
	return {
		ok: false,
		skipped: true,
		reasonCode: result.reasonCode,
		reasonMessage: result.reasonMessage,
	};
}
