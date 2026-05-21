/**
 * Builds "order received" email line items and totals (aligned with invoice line copy + VAT).
 */
import type { NiscOrderItemForInvoice } from "../schemas/nisc-order-invoice";
import { buildNiscOrderInvoiceLineItemCopy } from "./nisc-order-invoice-line-items";
import {
	allocateLineTotalWithTax,
	computeNiscOrderTotalsWithTax,
	formatNiscMoney,
} from "./nisc-order-tax";

export type NiscOrderReceivedEmailLineItem = {
	name: string;
	description?: string;
	quantity?: number;
	price: string;
};

export type NiscOrderForReceivedEmail = {
	createdAt: Date;
	currency: string;
	subtotal: string;
	orderItems: Array<
		NiscOrderItemForInvoice & {
			product: { name: string; serviceType?: string | null };
			productPlan?: { name: string } | null;
		}
	>;
};

export function buildNiscOrderReceivedEmailItems(
	order: NiscOrderForReceivedEmail,
): { orderItems: NiscOrderReceivedEmailLineItem[]; totalAmount: string; totalWithTax: number } {
	const subscriptionStart = order.createdAt;
	const subtotalNum = order.orderItems.reduce(
		(sum, i) => sum + parseFloat(i.itemSubtotal || "0"),
		0,
	);
	const { total: orderTotalWithTax } = computeNiscOrderTotalsWithTax(subtotalNum);
	const currency = order.currency || "KES";

	const orderItems: NiscOrderReceivedEmailLineItem[] = order.orderItems.map((item) => {
		const lineSubtotal = parseFloat(item.itemSubtotal || "0");
		const lineTotalWithTax = allocateLineTotalWithTax(lineSubtotal, subtotalNum, orderTotalWithTax);
		const { name, description } = buildNiscOrderInvoiceLineItemCopy(
			{
				...item,
				product: {
					name: item.product.name,
					serviceType: item.product.serviceType ?? null,
				},
				productPlan: item.productPlan ?? null,
			},
			subscriptionStart,
		);

		return {
			name,
			description: description || undefined,
			quantity: 1,
			price: formatNiscMoney(lineTotalWithTax, currency),
		};
	});

	return {
		orderItems,
		totalAmount: orderTotalWithTax.toFixed(2),
		totalWithTax: orderTotalWithTax,
	};
}
