import type { ServiceOrderDetail } from "@npanel/api/routers/sales-service-orders/schemas";

export const SERVICE_ORDER_BASE = "/hq/sales/service-orders";
export const VAT_RATE = 0.16;

export const SERVICE_CATEGORIES = [
	"Website Hosting",
	"Server Hosting",
	"Productivity & Email",
	"Security",
	"Domains",
	"Onboarding & Migration",
] as const;

export const BILLING_CYCLES = [
	{ value: "one-time", label: "One time" },
	{ value: "monthly", label: "Monthly" },
	{ value: "quarterly", label: "Quarterly" },
	{ value: "annually", label: "Annually" },
	{ value: "biennially", label: "Biennially" },
] as const;

export const ORDER_STATUSES = [
	{ value: "DRAFT", label: "Draft" },
	{ value: "SENT", label: "Sent" },
	{ value: "ACCEPTED", label: "Accepted" },
	{ value: "DECLINED", label: "Declined" },
	{ value: "EXPIRED", label: "Expired" },
	{ value: "CANCELLED", label: "Cancelled" },
] as const;

const PLAN_CYCLE_MONTHS: Record<string, number> = {
	MONTHLY: 1,
	YEARLY: 12,
	BIENNIALLY: 24,
};

const ORDER_CYCLE_MONTHS: Record<string, number> = {
	monthly: 1,
	quarterly: 3,
	annually: 12,
	biennially: 24,
};

export type ServiceOrderLine = {
	id?: string;
	serviceCategory: string;
	description: string;
	primaryDomain: string;
	qty?: number;
	billingCycle?: string;
	unitPrice?: number;
	productId?: string;
	productPlanId?: string;
};

export type ServiceOrderFormValues = {
	orderNumber: string;
	issueDate: string;
	validUntil: string;
	preparedBy: string;
	niscName: string;
	niscTaxId: string;
	niscEmail: string;
	niscAddress: string;
	companyName: string;
	contactPerson: string;
	email: string;
	billingEmail: string;
	phone: string;
	companyAddress: string;
	companyTaxId: string;
	currency: "KES" | "USD";
	linkedUserId: string;
	items: ServiceOrderLine[];
	discount: string;
	paymentTerms: string;
	clientSignatoryName: string;
	clientSignatoryTitle: string;
	clientSignatoryDate: string;
	niscSignatoryName: string;
	niscSignatoryTitle: string;
	niscSignatoryDate: string;
};

export type ServiceOrderDocument = {
	orderNumber: string;
	issueDate: string;
	validUntil: string;
	preparedBy: string;
	niscName: string;
	niscTaxId: string;
	niscEmail: string;
	niscAddress: string;
	companyName: string;
	contactPerson: string;
	email: string;
	billingEmail: string;
	phone: string;
	companyAddress: string;
	companyTaxId: string;
	currency: string;
	lines: Array<{
		category: string;
		description: string;
		domain: string;
		qty: string;
		cycle: string;
		unitPrice: string;
		subtotal: string;
	}>;
	subtotal: number;
	discount: number;
	vat: number;
	total: number;
	paymentTerms: string;
	clientSignatoryName: string;
	clientSignatoryTitle: string;
	clientSignatoryDate: string;
	niscSignatoryName: string;
	niscSignatoryTitle: string;
	niscSignatoryDate: string;
};

export function todayInput(offsetDays = 0) {
	const date = new Date();
	date.setDate(date.getDate() + offsetDays);
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${date.getFullYear()}-${month}-${day}`;
}

export function emptyServiceOrderForm(): ServiceOrderFormValues {
	return {
		orderNumber: "",
		issueDate: todayInput(),
		validUntil: todayInput(30),
		preparedBy: "Account Executive — Nisc Cloud",
		niscName: "Nisc Cloud Limited",
		niscTaxId: "P052377334H",
		niscEmail: "accounts@nisccloud.com",
		niscAddress: "P.O BOX 21615, Nairobi, 00505, Kenya",
		companyName: "",
		contactPerson: "",
		email: "",
		billingEmail: "",
		phone: "",
		companyAddress: "",
		companyTaxId: "",
		currency: "KES",
		linkedUserId: "",
		items: [emptyLine()],
		discount: "",
		paymentTerms: "Due on receipt",
		clientSignatoryName: "",
		clientSignatoryTitle: "",
		clientSignatoryDate: "",
		niscSignatoryName: "",
		niscSignatoryTitle: "Account Executive",
		niscSignatoryDate: "",
	};
}

export function emptyLine(): ServiceOrderLine {
	return {
		serviceCategory: "",
		description: "",
		primaryDomain: "",
		qty: 1,
		billingCycle: "monthly",
	};
}

export function cycleLabel(value: string | undefined) {
	return BILLING_CYCLES.find((cycle) => cycle.value === value)?.label ?? value ?? "";
}

export function orderCycleFromPlan(planCycle: string | null | undefined) {
	switch ((planCycle ?? "").toUpperCase()) {
		case "MONTHLY":
			return "monthly";
		case "YEARLY":
			return "annually";
		case "BIENNIALLY":
			return "biennially";
		default:
			return undefined;
	}
}

export function amountForOrderCycle(
	plan: { pricingModel: string; price: string | null; billingCycle?: string | null },
	orderCycle: string | undefined,
) {
	if (plan.pricingModel !== "FIXED" || !plan.price) return undefined;
	const price = Number.parseFloat(plan.price);
	if (!Number.isFinite(price)) return undefined;
	const planMonths = PLAN_CYCLE_MONTHS[(plan.billingCycle ?? "").toUpperCase()];
	const targetMonths = orderCycle ? ORDER_CYCLE_MONTHS[orderCycle] : undefined;
	if (!planMonths || !targetMonths) return price;
	return Math.round((price / planMonths) * targetMonths * 100) / 100;
}

export function lineSubtotal(line: ServiceOrderLine) {
	const qty = line.qty ?? 0;
	const price = line.unitPrice ?? 0;
	if (!Number.isFinite(qty) || !Number.isFinite(price)) return 0;
	return Math.round(qty * price * 100) / 100;
}

export function orderFinancials(values: Pick<ServiceOrderFormValues, "items" | "discount">) {
	const subtotal = (values.items ?? []).reduce((sum, line) => sum + lineSubtotal(line), 0);
	const discountRaw = Number.parseFloat(values.discount || "0");
	const discount = Number.isFinite(discountRaw) ? Math.max(0, discountRaw) : 0;
	const taxable = Math.max(0, Math.round((subtotal - discount) * 100) / 100);
	const vat = Math.round(taxable * VAT_RATE * 100) / 100;
	const total = Math.round((taxable + vat) * 100) / 100;
	return { subtotal, discount, vat, total };
}

export function formatMoney(amount: number, currency: string) {
	if (!Number.isFinite(amount)) return "";
	try {
		return new Intl.NumberFormat("en-KE", {
			style: "currency",
			currency: currency || "KES",
			minimumFractionDigits: 2,
		}).format(amount);
	} catch {
		return `${currency} ${amount.toFixed(2)}`;
	}
}

export function formatDisplayDate(value: string | Date | null | undefined) {
	if (!value) return "";
	if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
		const [year, month, day] = value.split("-").map(Number);
		return new Date(year, (month ?? 1) - 1, day ?? 1).toLocaleDateString("en-GB", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	}
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function toDateInput(value: string | Date | null | undefined) {
	if (!value) return "";
	if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${date.getFullYear()}-${month}-${day}`;
}

export function dateInputToIso(value: string) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
	return `${value}T12:00:00.000Z`;
}

export function isEmail(value: string) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function record(value: unknown): Record<string, unknown> | undefined {
	if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
	return value as Record<string, unknown>;
}

function text(value: unknown) {
	return typeof value === "string" ? value : "";
}

export function toDocument(values: ServiceOrderFormValues): ServiceOrderDocument {
	const money = orderFinancials(values);
	const described = (values.items ?? []).filter(
		(line) => (line.description ?? "").trim() || (line.serviceCategory ?? "").trim(),
	);
	return {
		orderNumber: values.orderNumber,
		issueDate: values.issueDate,
		validUntil: values.validUntil,
		preparedBy: values.preparedBy,
		niscName: values.niscName,
		niscTaxId: values.niscTaxId,
		niscEmail: values.niscEmail,
		niscAddress: values.niscAddress,
		companyName: values.companyName,
		contactPerson: values.contactPerson,
		email: values.email,
		billingEmail: values.billingEmail,
		phone: values.phone,
		companyAddress: values.companyAddress,
		companyTaxId: values.companyTaxId,
		currency: values.currency,
		lines: described.map((line) => ({
			category: line.serviceCategory,
			description: line.description,
			domain: line.primaryDomain,
			qty: line.qty != null ? String(line.qty) : "",
			cycle: cycleLabel(line.billingCycle),
			unitPrice: line.unitPrice != null ? formatMoney(line.unitPrice, values.currency) : "",
			subtotal: formatMoney(lineSubtotal(line), values.currency),
		})),
		...money,
		paymentTerms: values.paymentTerms,
		clientSignatoryName: values.clientSignatoryName,
		clientSignatoryTitle: values.clientSignatoryTitle,
		clientSignatoryDate: values.clientSignatoryDate,
		niscSignatoryName: values.niscSignatoryName,
		niscSignatoryTitle: values.niscSignatoryTitle,
		niscSignatoryDate: values.niscSignatoryDate,
	};
}

export function toWriteInput(values: ServiceOrderFormValues) {
	const money = orderFinancials(values);
	const lines = values.items.filter((line) => line.description.trim());
	return {
		orderNumber: values.orderNumber || undefined,
		customerName: values.companyName || undefined,
		customerEmail: values.email || undefined,
		billingEmail: values.billingEmail || undefined,
		phone: values.phone || undefined,
		contactPerson: values.contactPerson || undefined,
		linkedUserId: values.linkedUserId || undefined,
		issueDate: dateInputToIso(values.issueDate),
		validUntil: dateInputToIso(values.validUntil),
		paymentTerms: values.paymentTerms || undefined,
		preparedBy: values.preparedBy || undefined,
		amount: money.total.toFixed(2),
		subtotal: money.subtotal.toFixed(2),
		discount: money.discount ? money.discount.toFixed(2) : undefined,
		tax: money.vat.toFixed(2),
		taxPercentage: 16,
		vat: money.vat.toFixed(2),
		currency: values.currency,
		status: "DRAFT" as const,
		fromDetails: {
			name: values.niscName,
			taxId: values.niscTaxId,
			email: values.niscEmail,
			address: values.niscAddress,
			preparedBy: values.preparedBy,
		},
		customerDetails: {
			name: values.companyName,
			contactPerson: values.contactPerson,
			email: values.email,
			billingEmail: values.billingEmail,
			phone: values.phone,
			address: values.companyAddress,
			taxId: values.companyTaxId,
		},
		authorization: {
			clientName: values.clientSignatoryName,
			clientTitle: values.clientSignatoryTitle,
			clientDate: values.clientSignatoryDate,
			niscName: values.niscSignatoryName,
			niscTitle: values.niscSignatoryTitle,
			niscDate: values.niscSignatoryDate,
		},
		lineItems: lines.map((line, index) => ({
			id: line.id,
			position: index,
			category: line.serviceCategory || undefined,
			name: line.description,
			primaryDomain: line.primaryDomain || undefined,
			quantity: line.qty ?? 1,
			billingCycle: line.billingCycle || undefined,
			price: String(line.unitPrice ?? 0),
			total: lineSubtotal({ ...line, qty: line.qty ?? 1 }).toFixed(2),
			metadata:
				line.productId || line.productPlanId
					? {
							...(line.productId ? { productId: line.productId } : {}),
							...(line.productPlanId ? { productPlanId: line.productPlanId } : {}),
						}
					: undefined,
		})),
	};
}

export function recordToForm(order: ServiceOrderDetail): ServiceOrderFormValues {
	const from = record(order.fromDetails);
	const customer = record(order.customerDetails);
	const authorization = record(order.authorization);
	const blank = emptyServiceOrderForm();
	return {
		...blank,
		orderNumber: order.orderNumber ?? "",
		issueDate: toDateInput(order.issueDate) || blank.issueDate,
		validUntil: toDateInput(order.validUntil),
		preparedBy: order.preparedBy || text(from?.preparedBy) || blank.preparedBy,
		niscName: text(from?.name) || blank.niscName,
		niscTaxId: text(from?.taxId) || blank.niscTaxId,
		niscEmail: text(from?.email) || blank.niscEmail,
		niscAddress: text(from?.address) || blank.niscAddress,
		companyName: order.customerName || text(customer?.name),
		contactPerson: order.contactPerson || text(customer?.contactPerson),
		email: order.customerEmail || text(customer?.email),
		billingEmail: order.billingEmail || text(customer?.billingEmail),
		phone: order.phone || text(customer?.phone),
		companyAddress: text(customer?.address),
		companyTaxId: text(customer?.taxId),
		currency: order.currency === "USD" ? "USD" : "KES",
		linkedUserId: order.linkedUserId ?? "",
		discount: order.discount ?? "",
		paymentTerms: order.paymentTerms || blank.paymentTerms,
		clientSignatoryName: text(authorization?.clientName),
		clientSignatoryTitle: text(authorization?.clientTitle),
		clientSignatoryDate: text(authorization?.clientDate),
		niscSignatoryName: text(authorization?.niscName),
		niscSignatoryTitle: text(authorization?.niscTitle) || blank.niscSignatoryTitle,
		niscSignatoryDate: text(authorization?.niscDate),
		items:
			order.lineItems.length > 0
				? order.lineItems.map((item) => {
						const meta = record(item.metadata);
						const price = item.price != null ? Number(item.price) : undefined;
						return {
							id: item.id,
							serviceCategory: item.category ?? "",
							description: item.name ?? "",
							primaryDomain: item.primaryDomain ?? "",
							qty: item.quantity ?? 1,
							billingCycle: item.billingCycle ?? undefined,
							unitPrice: price != null && Number.isFinite(price) ? price : undefined,
							productId: text(meta?.productId) || undefined,
							productPlanId: text(meta?.productPlanId) || undefined,
						};
					})
				: [emptyLine()],
	};
}

export function recordToDocument(order: ServiceOrderDetail) {
	return toDocument(recordToForm(order));
}

export function customerGroupKey(name?: string | null, email?: string | null) {
	const normalizedEmail = email?.trim().toLowerCase();
	if (normalizedEmail) return `email:${normalizedEmail}`;
	const normalizedName = name?.trim().replace(/\s+/g, " ").toLowerCase();
	if (normalizedName) return `name:${normalizedName}`;
	return "unassigned";
}

export function customerGroupPath(name?: string | null, email?: string | null) {
	return `${SERVICE_ORDER_BASE}/customers/${encodeURIComponent(customerGroupKey(name, email))}`;
}
