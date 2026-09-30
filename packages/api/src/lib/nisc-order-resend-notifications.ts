/**
 * Agency resend of customer-facing Nisc order emails, in checkout flow order.
 * Admin copies are never included.
 */
import { db, eq } from "@npanel/db";
import { invoice as invoiceTable } from "@npanel/db/schema/invoicing";
import { niscOrder, niscOrderItem } from "@npanel/db/schema/nisc-orders";
import { niscProduct, niscProductPlan } from "@npanel/db/schema/products";
import { paymentTransaction } from "@npanel/db/schema/payment-transactions";
import { team } from "@npanel/db/schema/teams";
import { user as userTable } from "@npanel/db/schema/auth";
import { sendEmail, sendEmailWithPdf } from "./email";
import {
	renderInvoiceSuccessEmail,
	renderNiscOrderReceivedEmail,
	renderOrderConfirmationEmail,
	renderPaymentReceiptEmail,
} from "./email-templates";
import { generateInvoicePdfBuffer } from "./generate-invoice-pdf";
import { getInvoiceDetailForPdf } from "./invoice-for-pdf";
import { isInvoiceKraSynced } from "./invoice-kra-status";
import { sanitizeInvoicePdfFilename } from "./invoice-pdf-data";
import { formatNiscDateTime } from "./nisc-datetime-format";
import { buildNiscOrderReceivedEmailItems } from "./nisc-order-received-email";
import { resolveNiscCustomerNotificationRecipient } from "./nisc-order-invoice-billing";
import { joinPublicAppPath } from "./public-app-url";

export const NISC_RESEND_KINDS = [
	"payment_receipt",
	"order_received",
	"invoice",
	"order_confirmation",
] as const;

export type NiscResendKind = (typeof NISC_RESEND_KINDS)[number];

export type NiscResendResult = {
	kind: NiscResendKind;
	sent: boolean;
	message: string;
};

const FLOW_ORDER: NiscResendKind[] = [
	"payment_receipt",
	"order_received",
	"invoice",
	"order_confirmation",
];

function paymentMethodLabel(gateway: string | null | undefined): string {
	const value = (gateway ?? "").toUpperCase();
	if (value === "MPESA") return "M-Pesa";
	if (value === "JENGA") return "Card";
	return gateway?.trim() || "Payment";
}

function formatMoney(amount: string | null | undefined): string {
	const parsed = Number.parseFloat(amount || "0");
	if (!Number.isFinite(parsed)) return amount || "0";
	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(parsed);
}

export async function getNiscOrderNotificationDraft(niscOrderId: string): Promise<{
	to: string;
	name: string;
	hasPayment: boolean;
	invoiceNumber: string | null;
	kraStatus: string | null;
	kraSynced: boolean;
	kraBlocksSend: boolean;
}> {
	const [order] = await db
		.select({
			id: niscOrder.id,
			userId: niscOrder.userId,
			teamId: niscOrder.teamId,
			invoiceId: niscOrder.invoiceId,
			paymentTransactionId: niscOrder.paymentTransactionId,
		})
		.from(niscOrder)
		.where(eq(niscOrder.id, niscOrderId))
		.limit(1);
	if (!order) {
		throw new Error("Nisc order not found");
	}

	const recipient = await resolveNiscCustomerNotificationRecipient({
		teamId: order.teamId,
		userId: order.userId,
	});

	let kraStatus: string | null = null;
	let invoiceNumber: string | null = null;
	if (order.invoiceId) {
		const [invoiceRow] = await db
			.select({
				kraStatus: invoiceTable.kraStatus,
				invoiceNumber: invoiceTable.invoiceNumber,
			})
			.from(invoiceTable)
			.where(eq(invoiceTable.id, order.invoiceId))
			.limit(1);
		kraStatus = invoiceRow?.kraStatus ?? null;
		invoiceNumber = invoiceRow?.invoiceNumber ?? null;
	}

	const kraSynced = isInvoiceKraSynced(kraStatus);
	const kraBlocksSend = Boolean(order.invoiceId) && !kraSynced && kraStatus !== "NOT_APPLICABLE";

	return {
		to: recipient?.email ?? "",
		name: recipient?.name ?? "Customer",
		hasPayment: Boolean(order.paymentTransactionId),
		invoiceNumber,
		kraStatus,
		kraSynced,
		kraBlocksSend,
	};
}

export async function resendNiscOrderNotifications(params: {
	niscOrderId: string;
	kinds: NiscResendKind[];
	to: string;
	cc: string[];
	bcc: string[];
	sendInvoiceAnyway: boolean;
	customerName?: string;
}): Promise<NiscResendResult[]> {
	const selected = new Set(params.kinds);
	const ordered = FLOW_ORDER.filter((kind) => selected.has(kind));
	const results: NiscResendResult[] = [];

	const [order] = await db
		.select({
			id: niscOrder.id,
			orderNumber: niscOrder.orderNumber,
			userId: niscOrder.userId,
			teamId: niscOrder.teamId,
			invoiceId: niscOrder.invoiceId,
			invoiceNumber: niscOrder.invoiceNumber,
			paymentTransactionId: niscOrder.paymentTransactionId,
			subtotal: niscOrder.subtotal,
			total: niscOrder.total,
			currency: niscOrder.currency,
			createdAt: niscOrder.createdAt,
		})
		.from(niscOrder)
		.where(eq(niscOrder.id, params.niscOrderId))
		.limit(1);
	if (!order) {
		throw new Error("Nisc order not found");
	}

	const [userRow] = order.userId
		? await db
				.select({ name: userTable.name })
				.from(userTable)
				.where(eq(userTable.id, order.userId))
				.limit(1)
		: [];
	const [teamRow] = order.teamId
		? await db
				.select({ slug: team.slug })
				.from(team)
				.where(eq(team.id, order.teamId))
				.limit(1)
		: [];

	const customerName = params.customerName?.trim() || userRow?.name?.trim() || "Customer";
	const cc = params.cc.length > 0 ? params.cc : undefined;
	const bcc = params.bcc.length > 0 ? params.bcc : undefined;

	const items = await db
		.select({
			itemPrice: niscOrderItem.itemPrice,
			itemSubtotal: niscOrderItem.itemSubtotal,
			primaryDomain: niscOrderItem.primaryDomain,
			billingCycle: niscOrderItem.billingCycle,
			description: niscOrderItem.description,
			status: niscOrderItem.status,
			productName: niscProduct.name,
			serviceType: niscProduct.serviceType,
			planName: niscProductPlan.name,
		})
		.from(niscOrderItem)
		.leftJoin(niscProduct, eq(niscProduct.id, niscOrderItem.productId))
		.leftJoin(niscProductPlan, eq(niscProductPlan.id, niscOrderItem.productPlanId))
		.where(eq(niscOrderItem.niscOrderId, order.id));

	const emailItems = buildNiscOrderReceivedEmailItems({
		createdAt: order.createdAt,
		currency: order.currency,
		subtotal: order.subtotal,
		orderItems: items.map((item) => ({
			itemPrice: item.itemPrice,
			itemSubtotal: item.itemSubtotal,
			primaryDomain: item.primaryDomain,
			billingCycle: item.billingCycle,
			description: item.description,
			product: {
				name: item.productName ?? "Service",
				serviceType: item.serviceType,
			},
			productPlan: item.planName ? { name: item.planName } : null,
		})),
	});

	for (const kind of ordered) {
		try {
			if (kind === "payment_receipt") {
				if (!order.paymentTransactionId) {
					results.push({
						kind,
						sent: false,
						message: "No payment is recorded on this order.",
					});
					continue;
				}
				const [tx] = await db
					.select({
						receiptNumber: paymentTransaction.receiptNumber,
						amount: paymentTransaction.amount,
						paidAmount: paymentTransaction.paidAmount,
						currency: paymentTransaction.currency,
						gateway: paymentTransaction.gateway,
						createdAt: paymentTransaction.createdAt,
					})
					.from(paymentTransaction)
					.where(eq(paymentTransaction.id, order.paymentTransactionId))
					.limit(1);
				if (!tx) {
					results.push({
						kind,
						sent: false,
						message: "The payment record for this order was not found.",
					});
					continue;
				}
				const receiptNumber = tx.receiptNumber?.trim() || "N/A";
				const html = await renderPaymentReceiptEmail({
					customerName,
					receiptNumber,
					transactionDate: formatNiscDateTime(tx.createdAt),
					amount: formatMoney(tx.paidAmount || tx.amount),
					currency: tx.currency || order.currency || "KES",
					paymentMethod: paymentMethodLabel(tx.gateway),
					supportEmail: "support@nisccloud.com",
					supportPhone: "+254 748 777 666",
				});
				await sendEmail({
					to: params.to,
					cc,
					bcc,
					subject: `Payment Receipt - ${receiptNumber}`,
					html,
				});
				results.push({ kind, sent: true, message: "Payment receipt sent." });
				continue;
			}

			if (kind === "order_received") {
				const html = await renderNiscOrderReceivedEmail({
					customerName,
					orderNumber: order.orderNumber,
					orderDate: formatNiscDateTime(order.createdAt),
					totalAmount: emailItems.totalAmount,
					currency: order.currency,
					orderItems: emailItems.orderItems,
				});
				await sendEmail({
					to: params.to,
					cc,
					bcc,
					subject: `Order ${order.orderNumber} received`,
					html,
				});
				results.push({ kind, sent: true, message: "Order received email sent." });
				continue;
			}

			if (kind === "invoice") {
				if (!order.invoiceId) {
					results.push({
						kind,
						sent: false,
						message: "This order has no invoice to send.",
					});
					continue;
				}
				const [invoiceRow] = await db
					.select({
						invoiceNumber: invoiceTable.invoiceNumber,
						kraStatus: invoiceTable.kraStatus,
					})
					.from(invoiceTable)
					.where(eq(invoiceTable.id, order.invoiceId))
					.limit(1);
				const kraStatus = invoiceRow?.kraStatus ?? null;
				const synced = isInvoiceKraSynced(kraStatus);
				const blocksSend = !synced && kraStatus !== "NOT_APPLICABLE";
				if (blocksSend && !params.sendInvoiceAnyway) {
					results.push({
						kind,
						sent: false,
						message: `Invoice was not sent. KRA status is ${kraStatus ?? "not synced"}. Send anyway to email it before KRA sync.`,
					});
					continue;
				}
				const invoiceNumber = invoiceRow?.invoiceNumber || order.invoiceNumber;
				if (!invoiceNumber) {
					results.push({
						kind,
						sent: false,
						message: "This order's invoice has no invoice number.",
					});
					continue;
				}
				const invoiceDetail = await getInvoiceDetailForPdf(db, order.invoiceId);
				const pdfBuffer = await generateInvoicePdfBuffer(invoiceDetail);
				const html = await renderInvoiceSuccessEmail({
					customerName,
					invoiceNumber,
					orderNumber: order.orderNumber,
					totalAmount: order.total,
					currency: order.currency,
					supportEmail: "accounts@nisccloud.com",
					supportPhone: "+254 748 777 666",
					invoiceLink: teamRow?.slug
						? joinPublicAppPath(`/${teamRow.slug}/invoices`)
						: undefined,
				});
				await sendEmailWithPdf({
					to: params.to,
					cc,
					bcc,
					subject: `Your invoice ${invoiceNumber} from Nisc Cloud®`,
					html,
					attachmentFilename: sanitizeInvoicePdfFilename(invoiceNumber),
					attachment: pdfBuffer,
				});
				results.push({ kind, sent: true, message: "Invoice sent." });
				continue;
			}

			const html = await renderOrderConfirmationEmail({
				customerName,
				orderNumber: order.orderNumber,
				orderDate: formatNiscDateTime(order.createdAt),
				totalAmount: emailItems.totalAmount,
				currency: order.currency,
				orderItems: emailItems.orderItems.map((line, index) => ({
					...line,
					status: items[index]?.status,
				})),
				supportEmail: "accounts@nisccloud.com",
				supportPhone: "+254 748 777 666",
				orderLink: teamRow?.slug
					? joinPublicAppPath(`/${teamRow.slug}/subscriptions`)
					: joinPublicAppPath("/dashboard"),
			});
			await sendEmail({
				to: params.to,
				cc,
				bcc,
				subject: `Order Confirmation - ${order.orderNumber} from Nisc Cloud®`,
				html,
			});
			results.push({ kind, sent: true, message: "Order confirmation sent." });
		} catch (error) {
			const message = error instanceof Error ? error.message : "Failed to send email.";
			results.push({ kind, sent: false, message });
		}
	}

	return results;
}
