import type { ServiceOrderDetail } from "@npanel/api/routers/sales-service-orders/schemas";
import { COMPANY_LOGO_URL } from "@npanel/api/lib/company-branding";
import { serviceOrderFormDefaults } from "./defaults";

function record(value: unknown): Record<string, unknown> | undefined {
	if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
	return value as Record<string, unknown>;
}

function text(value: unknown) {
	return typeof value === "string" ? value : "";
}

function iso(value: Date | string | null | undefined) {
	if (!value) return "";
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export function formValuesToPreview(values: ReturnType<typeof orderToFormValues>) {
	return {
		yourDetails: {
			yourName: values.yourName,
			yourAddress: values.yourAddress,
			yourCity: values.yourCity,
			yourState: values.yourState,
			yourCountry: values.yourCountry,
			yourLogo: values.yourLogo,
			yourEmail: values.yourEmail,
			yourTaxId: values.yourTaxId,
			yourZip: values.yourZip,
			preparedBy: values.preparedBy,
		},
		companyDetails: {
			companyName: values.companyName,
			companyAddress: values.companyAddress,
			companyCity: values.companyCity,
			companyState: values.companyState,
			companyCountry: values.companyCountry,
			companyTaxId: values.companyTaxId,
			companyZip: values.companyZip,
			email: values.email,
			contactPerson: values.contactPerson,
			billingEmail: values.billingEmail,
			phone: values.phone,
		},
		orderDetails: {
			note: values.note,
			discount: values.discount,
			taxPercentage: values.taxPercentage ?? 16,
			items: values.items,
			currency: values.currency || "KES",
		},
		orderTerms: {
			orderNumber: values.orderNo,
			issueDate: values.issueDate,
			validUntil: values.validUntil,
			paymentTerms: values.paymentTerms,
			clientSignatoryName: values.clientSignatoryName,
			clientSignatoryTitle: values.clientSignatoryTitle,
			clientSignatoryDate: values.clientSignatoryDate,
			niscSignatoryName: values.niscSignatoryName,
			niscSignatoryTitle: values.niscSignatoryTitle,
			niscSignatoryDate: values.niscSignatoryDate,
		},
	};
}

export function orderToFormValues(order: ServiceOrderDetail) {
	const from = record(order.fromDetails);
	const customer = record(order.customerDetails);
	const authorization = record(order.authorization);
	return {
		...serviceOrderFormDefaults,
		step: "1",
		yourEmail: text(from?.email) || serviceOrderFormDefaults.yourEmail,
		yourName: text(from?.name) || serviceOrderFormDefaults.yourName,
		yourAddress: text(from?.address) || serviceOrderFormDefaults.yourAddress,
		yourCity: text(from?.city) || serviceOrderFormDefaults.yourCity,
		yourState: text(from?.state),
		yourCountry: text(from?.country) || serviceOrderFormDefaults.yourCountry,
		yourLogo: text(from?.logoUrl) || COMPANY_LOGO_URL,
		yourTaxId: text(from?.taxId) || serviceOrderFormDefaults.yourTaxId,
		yourZip: text(from?.zip) || serviceOrderFormDefaults.yourZip,
		preparedBy: order.preparedBy || text(from?.preparedBy) || serviceOrderFormDefaults.preparedBy,
		email: order.customerEmail || text(customer?.email),
		companyName: order.customerName || text(customer?.name),
		companyAddress: text(customer?.address),
		companyCity: text(customer?.city),
		companyState: text(customer?.state),
		companyCountry: text(customer?.country),
		companyTaxId: text(customer?.taxId),
		companyZip: text(customer?.zip),
		contactPerson: order.contactPerson || text(customer?.contactPerson),
		billingEmail: order.billingEmail || text(customer?.billingEmail),
		phone: order.phone || text(customer?.phone),
		linkedUserId: order.linkedUserId ?? "",
		note: order.note ?? "",
		discount: order.discount ?? "",
		taxPercentage: order.taxPercentage ?? 16,
		items:
			order.lineItems.length > 0
				? order.lineItems.map((item) => {
						const meta = record(item.metadata);
						const price = item.price != null ? Number(item.price) : undefined;
						return {
							id: item.id,
							itemDescription: item.name ?? "",
							serviceCategory: item.category ?? "",
							primaryDomain: item.primaryDomain ?? "",
							amount: price != null && Number.isFinite(price) ? price : undefined,
							qty: item.quantity ?? undefined,
							billingCycle: item.billingCycle ?? undefined,
							productId: text(meta?.productId) || undefined,
							productPlanId: text(meta?.productPlanId) || undefined,
						};
					})
				: [{ itemDescription: "" }],
		orderNo: order.orderNumber ?? "",
		issueDate: iso(order.issueDate),
		validUntil: iso(order.validUntil),
		paymentTerms: order.paymentTerms ?? "",
		clientSignatoryName: text(authorization?.clientName),
		clientSignatoryTitle: text(authorization?.clientTitle),
		clientSignatoryDate: text(authorization?.clientDate),
		niscSignatoryName: text(authorization?.niscName),
		niscSignatoryTitle: text(authorization?.niscTitle),
		niscSignatoryDate: text(authorization?.niscDate),
		currency: order.currency || "KES",
	};
}
