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
import { buildNiscOrderInvoiceLineItemCopy, resolveHostingServiceLabel } from "./nisc-order-invoice-line-items";
import {
	buildHivelocityCollapsedInvoiceLineCopy,
	isHivelocityOrderItem,
} from "./hivelocity-billing-utils";
import { buildInvoiceKraInsertFields } from "./invoice-kra-db-fields";
import { NISC_ORDER_VAT_PERCENTAGE, computeNiscOrderTotalsWithTax } from "./nisc-order-tax";
import {
	buildDomainBundleInvoiceLineDescription,
	buildDomainBundleInvoiceLineName,
	buildDomainBundleKraItemName,
	groupDomainBundleItemsForInvoice,
} from "./domain-bundle-order";
import { buildNiscInvoiceLineMetadata } from "./invoice-kra-mapper";
import { COMPANY_LOGO_URL } from "./company-branding";

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
};

const TAX_PERCENTAGE = NISC_ORDER_VAT_PERCENTAGE;

export { isTeamBillingComplete };

function resolveOrderItemProductId(item: {
	productId?: string;
	product: { id?: string };
}): string | null {
	return item.productId?.trim() || item.product.id?.trim() || null;
}

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

	const paymentDetails = { ...BANK_PAYMENT_DETAILS };

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
		...buildInvoiceKraInsertFields(),
	});

	const subscriptionDate = order.createdAt ?? now;
	const lineItems: InvoiceLineItemCreate[] = [];
	let position = 0;

	const { bundleGroups, nonBundleItems } = groupDomainBundleItemsForInvoice(order.orderItems);

	for (const group of bundleGroups) {
		const lead = group.leadItem;
		const { description: subscriptionPeriod } = buildNiscOrderInvoiceLineItemCopy(
			{
				...lead,
				product: {
					name: lead.product.name,
					serviceType: lead.product.serviceType ?? null,
				},
			},
			subscriptionDate,
		);
		const bundleSubtotal =
			parseFloat(lead.itemSubtotal || "0") > 0
				? lead.itemSubtotal
				: String(group.bundlePrice);
		const bundleMeta = buildNiscInvoiceLineMetadata({
			productId: resolveOrderItemProductId(lead) ?? "",
			serviceType: lead.product.serviceType,
			kraItemNm: buildDomainBundleKraItemName(group.domains),
			isDomainBundle: true,
			bundleDomains: group.domains,
		});
		lineItems.push({
			id: crypto.randomUUID(),
			invoiceId: newInvoiceId,
			position: position++,
			name: buildDomainBundleInvoiceLineName(group.domains),
			description: buildDomainBundleInvoiceLineDescription(group.domains, subscriptionPeriod),
			quantity: 1,
			price: bundleSubtotal,
			total: bundleSubtotal,
			...(bundleMeta ? { metadata: bundleMeta } : {}),
		});
	}

	for (const item of nonBundleItems) {
		if (isHivelocityOrderItem(item)) {
			const { name, description } = buildHivelocityCollapsedInvoiceLineCopy({
				product: {
					name: item.product.name,
					serviceType: item.product.serviceType ?? null,
				},
				metadata: item.metadata,
				billingCycle: item.billingCycle,
				subscriptionStart: subscriptionDate,
			});
			const hivelocityMeta = buildNiscInvoiceLineMetadata({
				productId: resolveOrderItemProductId(item) ?? "",
				serviceType: item.product.serviceType,
				kraItemNm: resolveHostingServiceLabel(
					item.product.serviceType,
					item.product.name,
				),
			});
			lineItems.push({
				id: crypto.randomUUID(),
				invoiceId: newInvoiceId,
				position: position++,
				name,
				description,
				quantity: 1,
				price: item.itemSubtotal,
				total: item.itemSubtotal,
				...(hivelocityMeta ? { metadata: hivelocityMeta } : {}),
			});
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
		const lineMeta = buildNiscInvoiceLineMetadata({
			productId: resolveOrderItemProductId(item) ?? "",
			serviceType: item.product.serviceType,
		});
		lineItems.push({
			id: crypto.randomUUID(),
			invoiceId: newInvoiceId,
			position: position++,
			name,
			description,
			quantity: 1,
			price: item.itemPrice,
			total: item.itemSubtotal,
			...(lineMeta ? { metadata: lineMeta } : {}),
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
			metadata: item.metadata ?? null,
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
