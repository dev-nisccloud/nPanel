/**
 * Auto-create invoice for a completed Nisc order when team has complete billing settings.
 * Used by the process-nisc-order worker.
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

const TAX_PERCENTAGE = 16;

export { isTeamBillingComplete };

function formatDateForInvoice(d: Date): string {
	return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function addBillingCycleToDate(start: Date, billingCycle: string | null): Date | null {
	if (!billingCycle) return null;
	const end = new Date(start);
	if (billingCycle === "MONTHLY") {
		end.setMonth(end.getMonth() + 1);
		return end;
	}
	if (billingCycle === "YEARLY") {
		end.setFullYear(end.getFullYear() + 1);
		return end;
	}
	if (billingCycle === "BIENNIALLY") {
		end.setFullYear(end.getFullYear() + 2);
		return end;
	}
	return null;
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
	const taxAmount = Math.round(subtotalNum * (TAX_PERCENTAGE / 100) * 100) / 100;
	const totalNum = subtotalNum + taxAmount;
	const subtotal = subtotalNum.toFixed(2);
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
	const lineItems: InvoiceLineItemCreate[] = order.orderItems.map((item, index) => {
		const itemDesc = (item.description ?? "").trim().toLowerCase();
		const isDomainRegistration = itemDesc === "registration";
		const isDomainTransfer = itemDesc === "transfer";
		const isDomainItem = isDomainRegistration || isDomainTransfer;

		const name = isDomainItem
			? `Domains - (${isDomainRegistration ? "Registration" : "Transfer"})`
			: `${item.product.name}${item.productPlan ? ` - ${item.productPlan.name}` : ""}`;

		const domainBrackets = item.primaryDomain?.trim() ? `(${item.primaryDomain})` : "";
		const expiryDate = addBillingCycleToDate(subscriptionDate, item.billingCycle ?? null);
		const subStartStr = formatDateForInvoice(subscriptionDate);
		const subEndStr = expiryDate ? formatDateForInvoice(expiryDate) : "";
		const subscriptionPart =
			subEndStr !== "" ? `Subscription: ${subStartStr} - ${subEndStr}` : `Subscription: ${subStartStr} -`;
		const description = [domainBrackets, subscriptionPart].filter(Boolean).join(". ");
		return {
			id: crypto.randomUUID(),
			invoiceId: newInvoiceId,
			position: index,
			name,
			description: description || undefined,
			quantity: 1,
			price: item.itemPrice,
			total: item.itemSubtotal,
		};
	});

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
