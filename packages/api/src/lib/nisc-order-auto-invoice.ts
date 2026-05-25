/**
 * Auto-create invoice for a Nisc order before provisioning (team billing or user profile).
 * Used by the process-nisc-order worker via nisc-order-invoice-delivery.
 */
import * as crypto from "crypto";
import { eq, sql } from "@npanel/db";
import type { TeamBillingSettings } from "../schemas/team-billing";
import { isTeamBillingComplete } from "../schemas/team-billing";
import type { NiscOrderForInvoice } from "../schemas/nisc-order-invoice";
import type { InvoiceLineItemCreate } from "../schemas/invoice";
import { db } from "@npanel/db";
import {
	invoice,
	invoiceActivityLog,
	invoiceCounter,
	invoiceLineItem,
} from "@npanel/db/schema/invoicing";
import { niscOrder } from "@npanel/db/schema/nisc-orders";
import { buildNiscOrderInvoiceLineItemCopy } from "./nisc-order-invoice-line-items";
import { hivelocityInvoiceLineSchema, type HivelocityInvoiceLine } from "../routers/nisc-service-orders-schemas";
import { NISC_ORDER_VAT_PERCENTAGE, computeNiscOrderTotalsWithTax } from "./nisc-order-tax";

const COMPANY_LOGO_URL = "https://res.cloudinary.com/df5ntv9gb/image/upload/v1758621603/Nisc_Logo_Original_im5pgk.png";

const FROM_DETAILS = {
	name: "Nisc Cloud Limited",
	email: "accounts@nisccloud.com",
	address: "P.O BOX 21615 - 00505",
	city: "Nairobi",
	country: "Kenya",
	taxId: "P052377334H",
	logoUrl: COMPANY_LOGO_URL,
};

const BANK_PAYMENT_DETAILS = {
	paymentMethod: "BANK_TRANSFER",
	method: "BANK_TRANSFER",
	bankName: "Absa Bank Plc",
	branchName: "Hurlingham",
	branchCode: "045",
	accountNumber: "2052676528",
	accountName: "Nisc Cloud Limited",
	swiftCode: "BARCKENX",
	qrCodeValue: "www.nisccloud.com",
};

const TAX_PERCENTAGE = NISC_ORDER_VAT_PERCENTAGE;

export { isTeamBillingComplete };

export async function createInvoiceForNiscOrder(
	_prisma: unknown,
	order: NiscOrderForInvoice,
	billing: TeamBillingSettings,
	createdBy: string,
): Promise<{ invoiceId: string; invoiceNumber: string } | null> {
	const now = new Date();
	const issueDate = now;
	const dueDate = null; // Already paid; schema allows null

	const subtotalNum = order.orderItems.reduce((sum, i) => sum + parseFloat(i.itemSubtotal || "0"), 0);
	const { subtotal: subtotalRounded, tax: taxAmount, total: totalNum } =
		computeNiscOrderTotalsWithTax(subtotalNum);
	const subtotal = subtotalRounded.toFixed(2);
	const tax = taxAmount.toFixed(2);
	const total = totalNum.toFixed(2);
	const currency = order.currency || "KES";

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

	let qrCodeDataUrl: string | undefined;
	try {
		const QRCodeUtil = await import("qrcode");
		qrCodeDataUrl = await QRCodeUtil.toDataURL(BANK_PAYMENT_DETAILS.qrCodeValue, {
			width: 120,
			margin: 1,
		});
	} catch {
		// optional
	}

	const paymentDetails = {
		...BANK_PAYMENT_DETAILS,
		...(qrCodeDataUrl && { qrCodeDataUrl }),
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

	await db.insert(invoice).values({
		id: newInvoiceId,
		token,
		teamId: order.teamId,
		customerName: billing.legalName,
		customerEmail: billing.billingEmail,
		invoiceNumber: generatedInvoiceNumber,
		status: "SENT",
		amount: total,
		subtotal,
		tax,
		taxPercentage: TAX_PERCENTAGE,
		currency,
		issueDate,
		dueDate,
		fromDetails: FROM_DETAILS,
		customerDetails,
		paymentDetails,
		template: { logoUrl: COMPANY_LOGO_URL },
		createdBy,
		updatedBy: createdBy,
		createdAt: now,
		updatedAt: now,
	});

	const subscriptionDate = order.createdAt ?? now;
	const lineItems: InvoiceLineItemCreate[] = [];
	let position = 0;

	for (const item of order.orderItems) {
		const rawMeta = item.metadata;
		const invoiceLinesRaw =
			rawMeta &&
			typeof rawMeta === "object" &&
			"invoiceLines" in rawMeta &&
			Array.isArray((rawMeta as { invoiceLines?: unknown }).invoiceLines)
				? (rawMeta as { invoiceLines: unknown[] }).invoiceLines
				: null;

		const hivelocityLines = invoiceLinesRaw
			?.map((line) => hivelocityInvoiceLineSchema.safeParse(line))
			.filter((r): r is { success: true; data: HivelocityInvoiceLine } => r.success)
			.map((r) => r.data);

		if (hivelocityLines && hivelocityLines.length > 0) {
			const { description: subscriptionPeriod } = buildNiscOrderInvoiceLineItemCopy(
				{
					...item,
					product: {
						name: item.product.name,
						serviceType: item.product.serviceType ?? null,
					},
				},
				subscriptionDate,
			);
			for (const line of hivelocityLines) {
				const amount = line.amountExVat.toFixed(2);
				lineItems.push({
					id: crypto.randomUUID(),
					invoiceId: newInvoiceId,
					position: position++,
					name: line.name,
					description:
						line.description?.trim() ||
						(line.kind === "base" ? subscriptionPeriod : undefined),
					quantity: 1,
					price: amount,
					total: amount,
				});
			}
			continue;
		}

		const { name, description } = buildNiscOrderInvoiceLineItemCopy(
			{
				...item,
				product: {
					name: item.product.name,
					serviceType: item.product.serviceType ?? null,
				},
			},
			subscriptionDate,
		);
		lineItems.push({
			id: crypto.randomUUID(),
			invoiceId: newInvoiceId,
			position: position++,
			name,
			description,
			quantity: 1,
			price: item.itemPrice,
			total: item.itemSubtotal,
		});
	}

	for (const item of lineItems) {
		await db.insert(invoiceLineItem).values({
			id: item.id,
			invoiceId: item.invoiceId,
			position: item.position,
			name: item.name,
			description: item.description ?? null,
			quantity: item.quantity,
			price: item.price,
			total: item.total,
			createdAt: now,
			updatedAt: now,
		});
	}

	await db.insert(invoiceActivityLog).values({
		id: crypto.randomUUID(),
		invoiceId: newInvoiceId,
		userId: createdBy,
		action: "CREATE",
		description: "Auto-generated invoice from Nisc order",
		metadata: { niscOrderId: order.id, orderNumber: order.orderNumber },
		createdAt: now,
	});

	await db
		.update(niscOrder)
		.set({ invoiceId: newInvoiceId, invoiceNumber: generatedInvoiceNumber, updatedAt: now })
		.where(eq(niscOrder.id, order.id));

	return { invoiceId: newInvoiceId, invoiceNumber: generatedInvoiceNumber };
}
