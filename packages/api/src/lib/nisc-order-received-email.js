import { buildNiscOrderInvoiceLineItemCopy } from "./nisc-order-invoice-line-items";
import { allocateLineTotalWithTax, computeNiscOrderTotalsWithTax, formatNiscMoney, } from "./nisc-order-tax";
export function buildNiscOrderReceivedEmailItems(order) {
    const subscriptionStart = order.createdAt;
    const subtotalNum = order.orderItems.reduce((sum, i) => sum + parseFloat(i.itemSubtotal || "0"), 0);
    const { total: orderTotalWithTax } = computeNiscOrderTotalsWithTax(subtotalNum);
    const currency = order.currency || "KES";
    const orderItems = order.orderItems.map((item) => {
        const lineSubtotal = parseFloat(item.itemSubtotal || "0");
        const lineTotalWithTax = allocateLineTotalWithTax(lineSubtotal, subtotalNum, orderTotalWithTax);
        const { name, description } = buildNiscOrderInvoiceLineItemCopy({
            ...item,
            product: {
                name: item.product.name,
                serviceType: item.product.serviceType ?? null,
            },
            productPlan: item.productPlan ?? null,
        }, subscriptionStart);
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
