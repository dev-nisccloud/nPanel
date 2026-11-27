import type { ServiceOrderItem } from "@/routes/agency.sales.service-orders/create/hooks/useData";
import type { useData } from "@/routes/agency.sales.service-orders/create/hooks/useData";

type FormData = ReturnType<typeof useData>;

function roundTotalIfExceeds(amount: number): number {
	const decimalPlaces = (amount.toString().split(".")[1] ?? "").length;
	if (decimalPlaces > 2) return Math.round(amount * 100) / 100;
	return amount;
}

function dateOrUndefined(value: string | undefined) {
	if (!value) return undefined;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function buildServiceOrderInput(data: FormData, linkedUserId?: string) {
	const items = data.orderDetails.items ?? [];
	const subtotal = items.reduce((sum: number, item: ServiceOrderItem) => {
		const amount = item.amount ?? 0;
		const qty = item.qty ?? 1;
		return sum + amount * qty;
	}, 0);
	const discountValue = parseFloat(data.orderDetails.discount ?? "0") || 0;
	const taxPercentage = data.orderDetails.taxPercentage ?? 16;
	const taxAmount = Math.max(0, subtotal - discountValue) * (taxPercentage / 100);
	const totalAmount = roundTotalIfExceeds(subtotal - discountValue + taxAmount);

	return {
		orderNumber: data.orderTerms.orderNumber || undefined,
		customerName: data.companyDetails.companyName || undefined,
		customerEmail: data.companyDetails.email || undefined,
		billingEmail: data.companyDetails.billingEmail || undefined,
		phone: data.companyDetails.phone || undefined,
		contactPerson: data.companyDetails.contactPerson || undefined,
		linkedUserId: linkedUserId || undefined,
		issueDate: dateOrUndefined(data.orderTerms.issueDate),
		validUntil: dateOrUndefined(data.orderTerms.validUntil),
		paymentTerms: data.orderTerms.paymentTerms || undefined,
		preparedBy: data.yourDetails.preparedBy || undefined,
		amount: String(totalAmount),
		subtotal: String(subtotal),
		discount: data.orderDetails.discount || undefined,
		tax: String(taxAmount),
		taxPercentage,
		vat: String(taxAmount),
		currency: data.orderDetails.currency || "KES",
		note: data.orderDetails.note || undefined,
		status: "DRAFT" as const,
		fromDetails: {
			name: data.yourDetails.yourName,
			email: data.yourDetails.yourEmail,
			address: data.yourDetails.yourAddress,
			city: data.yourDetails.yourCity,
			state: data.yourDetails.yourState,
			country: data.yourDetails.yourCountry,
			zip: data.yourDetails.yourZip,
			taxId: data.yourDetails.yourTaxId,
			logoUrl: data.yourDetails.yourLogo,
			preparedBy: data.yourDetails.preparedBy,
		},
		customerDetails: {
			name: data.companyDetails.companyName,
			email: data.companyDetails.email,
			address: data.companyDetails.companyAddress,
			city: data.companyDetails.companyCity,
			state: data.companyDetails.companyState,
			country: data.companyDetails.companyCountry,
			zip: data.companyDetails.companyZip,
			taxId: data.companyDetails.companyTaxId,
			contactPerson: data.companyDetails.contactPerson,
			billingEmail: data.companyDetails.billingEmail,
			phone: data.companyDetails.phone,
		},
		authorization: {
			clientName: data.orderTerms.clientSignatoryName,
			clientTitle: data.orderTerms.clientSignatoryTitle,
			clientDate: data.orderTerms.clientSignatoryDate,
			niscName: data.orderTerms.niscSignatoryName,
			niscTitle: data.orderTerms.niscSignatoryTitle,
			niscDate: data.orderTerms.niscSignatoryDate,
		},
		lineItems: items
			.filter((item) => (item.itemDescription ?? "").trim())
			.map((item, index) => ({
				id: item.id,
				position: index,
				category: item.serviceCategory || undefined,
				name: item.itemDescription || "Service",
				primaryDomain: item.primaryDomain || undefined,
				quantity: item.qty ?? 1,
				billingCycle: item.billingCycle && item.billingCycle !== "__unset__" ? item.billingCycle : undefined,
				price: String(item.amount ?? 0),
				total: String((item.amount ?? 0) * (item.qty ?? 1)),
				metadata:
					item.productId || item.productPlanId
						? {
								...(item.productId ? { productId: item.productId } : {}),
								...(item.productPlanId ? { productPlanId: item.productPlanId } : {}),
							}
						: undefined,
			})),
	};
}
