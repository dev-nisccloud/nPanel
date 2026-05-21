/**
 * Create invoice and email PDF to customer before Nisc order provisioning starts.
 */
import { db, eq } from "@npanel/db";
import { invoice as invoiceTable } from "@npanel/db/schema/invoicing";
import { niscOrder } from "@npanel/db/schema/nisc-orders";
import { user as userTable } from "@npanel/db/schema/auth";
import { createInvoiceForNiscOrder } from "./nisc-order-auto-invoice";
import type { NiscOrderForInvoice } from "../schemas/nisc-order-invoice";
import { getInvoiceDetailForPdf } from "./invoice-for-pdf";
import { generateInvoicePdfBuffer } from "./generate-invoice-pdf";
import { sanitizeInvoicePdfFilename } from "./invoice-pdf-data";
import { renderInvoiceSuccessEmail } from "./email-templates";
import { sendEmailWithPdf } from "./email";
import { niscLog } from "./nisc-order-logger";
import { formatNiscDateTime } from "./nisc-datetime-format";
import { getNormalizedPublicAppUrl, joinPublicAppPath } from "./public-app-url";
import {
	resolveNiscOrderInvoiceBilling,
	NISC_INVOICE_SKIP_REASON_CODES,
	NISC_INVOICE_SKIP_REASON_MESSAGES,
	type NiscInvoiceSkipReasonCode,
} from "./nisc-order-invoice-billing";
import { persistNiscOrderInvoiceMetadata } from "./nisc-order-invoice-metadata";

export type NiscOrderInvoiceDeliveryResult =
	| {
			ok: true;
			invoiceId: string;
			invoiceNumber: string;
			emailed: boolean;
			source: "team_billing" | "user_profile";
	  }
	| {
			ok: false;
			skipped: true;
			reasonCode: NiscInvoiceSkipReasonCode | string;
			reasonMessage: string;
	  }
	| { ok: false; skipped: false; reason: string };

function formatInvoiceEmailDate(value: Date | null | undefined): string {
	if (!value) return "N/A";
	return formatNiscDateTime(value);
}

export type CreateAndEmailNiscOrderInvoiceInput = {
	niscOrderId: string;
	order: NiscOrderForInvoice & {
		total: string;
		currency: string;
		invoiceId?: string | null;
		invoiceNumber?: string | null;
	};
	teamId: string | null;
	userId: string | null;
	createdBy: string;
	teamSlug?: string | null;
};

/**
 * Creates invoice for a paid Nisc order (if not already created) and emails PDF to billing contact.
 * Never throws — callers should always continue provisioning.
 */
export async function createAndEmailNiscOrderInvoice(
	input: CreateAndEmailNiscOrderInvoiceInput,
): Promise<NiscOrderInvoiceDeliveryResult> {
	const { niscOrderId, order, teamId, userId, createdBy, teamSlug } = input;

	const billingResolution = await resolveNiscOrderInvoiceBilling({ teamId, userId });
	if (!billingResolution.ok) {
		await niscLog("invoice_not_created", {
			niscOrderId,
			reason: billingResolution.reasonCode,
			reasonMessage: billingResolution.reasonMessage,
		});
		await persistNiscOrderInvoiceMetadata(niscOrderId, {
			status: "skipped",
			reasonCode: billingResolution.reasonCode,
			reasonMessage: billingResolution.reasonMessage,
		});
		return {
			ok: false,
			skipped: true,
			reasonCode: billingResolution.reasonCode,
			reasonMessage: billingResolution.reasonMessage,
		};
	}

	const { billing, source } = billingResolution.resolved;

	let invoiceId = order.invoiceId ?? null;
	let invoiceNumber = order.invoiceNumber ?? null;

	if (!invoiceId) {
		try {
			const created = await createInvoiceForNiscOrder(db, order, billing, createdBy);
			if (!created) {
				const reasonCode = NISC_INVOICE_SKIP_REASON_CODES.INVOICE_CREATION_FAILED;
				const reasonMessage = NISC_INVOICE_SKIP_REASON_MESSAGES[reasonCode];
				await persistNiscOrderInvoiceMetadata(niscOrderId, {
					status: "skipped",
					reasonCode,
					reasonMessage,
				});
				return { ok: false, skipped: true, reasonCode, reasonMessage };
			}
			invoiceId = created.invoiceId;
			invoiceNumber = created.invoiceNumber;
		} catch (err) {
			const errMsg = err instanceof Error ? err.message : String(err);
			await niscLog("worker_invoice_creation_failed", {
				niscOrderId,
				error: errMsg,
				phase: "pre_provisioning",
			});
			const reasonCode = NISC_INVOICE_SKIP_REASON_CODES.INVOICE_CREATION_FAILED;
			await persistNiscOrderInvoiceMetadata(niscOrderId, {
				status: "skipped",
				reasonCode,
				reasonMessage: `${NISC_INVOICE_SKIP_REASON_MESSAGES[reasonCode]} ${errMsg}`,
			});
			return {
				ok: false,
				skipped: true,
				reasonCode,
				reasonMessage: `${NISC_INVOICE_SKIP_REASON_MESSAGES[reasonCode]} ${errMsg}`,
			};
		}
	} else if (!invoiceNumber) {
		const row = await db.query.invoice.findFirst({
			where: eq(invoiceTable.id, invoiceId),
			columns: { invoiceNumber: true },
		});
		invoiceNumber = row?.invoiceNumber ?? null;
	}

	if (!invoiceId || !invoiceNumber) {
		const reasonCode = NISC_INVOICE_SKIP_REASON_CODES.INVOICE_MISSING_AFTER_CREATE;
		const reasonMessage = NISC_INVOICE_SKIP_REASON_MESSAGES[reasonCode];
		await persistNiscOrderInvoiceMetadata(niscOrderId, {
			status: "skipped",
			reasonCode,
			reasonMessage,
		});
		return { ok: false, skipped: true, reasonCode, reasonMessage };
	}

	const toEmail = billing.billingEmail?.trim();
	if (!toEmail) {
		await niscLog("worker_invoice_email_skipped", {
			niscOrderId,
			reason: "billing_email_empty",
		});
		await persistNiscOrderInvoiceMetadata(niscOrderId, {
			status: "created",
			invoiceId,
			invoiceNumber,
			source,
			emailed: false,
			reasonCode: NISC_INVOICE_SKIP_REASON_CODES.BILLING_EMAIL_EMPTY,
			reasonMessage: NISC_INVOICE_SKIP_REASON_MESSAGES.billing_email_empty,
		});
		return { ok: true, invoiceId, invoiceNumber, emailed: false, source };
	}

	const ccList: string[] = [];
	const initiator = await db.query.user.findFirst({
		where: eq(userTable.id, createdBy),
		columns: { email: true },
	});
	if (initiator?.email?.trim()) {
		const initiatorEmail = initiator.email.trim();
		if (initiatorEmail.toLowerCase() !== toEmail.toLowerCase()) {
			ccList.push(initiatorEmail);
		}
	}

	try {
		const invoiceDetail = await getInvoiceDetailForPdf(db, invoiceId);
		const pdfBuffer = await generateInvoicePdfBuffer(invoiceDetail);
		const pdfFilename = sanitizeInvoicePdfFilename(invoiceNumber);

		const baseUrl = getNormalizedPublicAppUrl();
		const invoiceDashboardUrl =
			baseUrl && teamSlug ? joinPublicAppPath(`/${teamSlug}/invoices`) : undefined;

		const emailHtml = await renderInvoiceSuccessEmail({
			customerName: billing.legalName ?? undefined,
			invoiceNumber,
			orderNumber: order.orderNumber,
			totalAmount: order.total,
			currency: order.currency,
			supportEmail: "accounts@nisccloud.com",
			supportPhone: "+254 748 777 666",
			invoiceLink: invoiceDashboardUrl,
		});

		await sendEmailWithPdf({
			to: toEmail,
			subject: `Your invoice ${invoiceNumber} from Nisc Cloud Limited`,
			html: emailHtml,
			cc: ccList.length > 0 ? ccList : undefined,
			attachmentFilename: pdfFilename,
			attachment: pdfBuffer,
		});

		await niscLog("worker_invoice_created_and_sent", {
			niscOrderId,
			invoiceId,
			invoiceNumber,
			ccCount: ccList.length,
			phase: "pre_provisioning",
			source,
			issueDate: formatInvoiceEmailDate(invoiceDetail.issueDate),
		});

		await persistNiscOrderInvoiceMetadata(niscOrderId, {
			status: "created",
			invoiceId,
			invoiceNumber,
			source,
			emailed: true,
		});

		return { ok: true, invoiceId, invoiceNumber, emailed: true, source };
	} catch (err) {
		const errMsg = err instanceof Error ? err.message : String(err);
		await niscLog("worker_invoice_creation_failed", {
			niscOrderId,
			error: errMsg,
			phase: "pre_provisioning",
		});
		const reasonCode = NISC_INVOICE_SKIP_REASON_CODES.EMAIL_SEND_FAILED;
		await persistNiscOrderInvoiceMetadata(niscOrderId, {
			status: "created",
			invoiceId,
			invoiceNumber,
			source,
			emailed: false,
			reasonCode,
			reasonMessage: `${NISC_INVOICE_SKIP_REASON_MESSAGES[reasonCode]} ${errMsg}`,
		});
		return { ok: true, invoiceId, invoiceNumber, emailed: false, source };
	}
}

/**
 * Loads order data and runs pre-provisioning invoice + email. Safe to call from QStash workers.
 */
export async function runPreProvisioningInvoiceForOrder(niscOrderId: string): Promise<void> {
	const order = await db.query.niscOrder.findFirst({
		where: eq(niscOrder.id, niscOrderId),
		with: {
			team: { columns: { slug: true } },
			orderItems: {
				with: {
					product: { columns: { name: true, serviceType: true } },
					productPlan: { columns: { name: true } },
				},
			},
		},
	});

	const createdBy = order?.createdBy ?? order?.userId ?? null;
	const userId = order?.userId ?? order?.createdBy ?? createdBy;

	if (!order || !createdBy) {
		await niscLog("invoice_not_created", {
			niscOrderId,
			reason: "missing_order_actor",
		});
		return;
	}

	try {
		await createAndEmailNiscOrderInvoice({
			niscOrderId,
			order: {
				id: order.id,
				teamId: order.teamId,
				currency: order.currency,
				orderNumber: order.orderNumber,
				createdAt: order.createdAt,
				total: order.total,
				invoiceId: order.invoiceId,
				invoiceNumber: order.invoiceNumber,
				orderItems: order.orderItems.map((i) => ({
					itemPrice: i.itemPrice,
					itemSubtotal: i.itemSubtotal,
					primaryDomain: i.primaryDomain,
					billingCycle: i.billingCycle,
					description: i.description,
					product: {
						name: i.product?.name ?? "Service",
						serviceType: i.product?.serviceType ?? null,
					},
					productPlan: i.productPlan,
				})),
			},
			teamId: order.teamId,
			userId,
			createdBy,
			teamSlug: order.team?.slug ?? null,
		});
	} catch (err) {
		const errMsg = err instanceof Error ? err.message : String(err);
		await niscLog("worker_invoice_creation_failed", {
			niscOrderId,
			error: errMsg,
			phase: "pre_provisioning",
		});
	}
}
