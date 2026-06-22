import { extractEtimsFiscalFieldsFromInvoice } from "../lib/etims-fiscal-fields";
import { resolveInvoiceEtimsVerificationUrl } from "../lib/etims-receipt-url";
import { formatInvoiceLineItemForPdf } from "../lib/nisc-order-invoice-line-items";
import { COMPANY_LOGO_URL } from "../lib/company-branding";
export { COMPANY_LOGO_URL } from "../lib/company-branding";
export { resolveInvoiceEtimsVerificationUrl } from "../lib/etims-receipt-url";
export function buildInvoicePdfDetails(invoice) {
    const fromDetails = invoice.fromDetails ?? {};
    const customerDetails = invoice.customerDetails ?? {};
    const paymentDetails = invoice.paymentDetails ?? {};
    const yourDetails = {
        yourName: fromDetails?.name,
        yourEmail: fromDetails?.email,
        yourAddress: fromDetails?.address,
        yourCity: fromDetails?.city,
        yourState: fromDetails?.state,
        yourCountry: fromDetails?.country,
        yourZip: fromDetails?.zip,
        yourTaxId: fromDetails?.taxId,
        yourLogo: COMPANY_LOGO_URL,
    };
    const companyDetails = {
        companyName: customerDetails?.name ?? invoice.customerName ?? undefined,
        email: customerDetails?.email ?? invoice.customerEmail ?? undefined,
        companyAddress: customerDetails?.address,
        companyCity: customerDetails?.city,
        companyState: customerDetails?.state,
        companyCountry: customerDetails?.country,
        companyZip: customerDetails?.zip,
        companyTaxId: customerDetails?.taxId,
    };
    const invoiceDetails = {
        note: invoice.note ?? undefined,
        discount: invoice.discount ?? undefined,
        taxRate: invoice.taxPercentage != null ? String(invoice.taxPercentage) : undefined,
        items: (invoice.lineItems ?? []).map((li) => ({
            id: li.id,
            itemDescription: formatInvoiceLineItemForPdf(li.name || "Service", li.description),
            amount: li.price != null ? Number(li.price) : undefined,
            qty: li.quantity ?? undefined,
        })),
        currency: invoice.currency ?? "KES",
        compactLineItems: true,
    };
    const invoiceTerms = {
        invoiceNumber: invoice.invoiceNumber ?? undefined,
        issueDate: invoice.issueDate ?? undefined,
        dueDate: invoice.dueDate ?? undefined,
    };
    const paymentMethodApi = paymentDetails?.paymentMethod;
    let paymentMethod;
    if (paymentMethodApi === "BANK_TRANSFER" ||
        paymentMethodApi === "bank_transfer" ||
        paymentMethodApi === "bank") {
        paymentMethod = "bank";
    }
    else if (paymentMethodApi === "MPESA" || paymentMethodApi === "mpesa") {
        paymentMethod = "mpesa";
    }
    else if (paymentMethodApi === "CHEQUE" || paymentMethodApi === "cheque") {
        paymentMethod = "cheque";
    }
    if (!paymentMethod)
        paymentMethod = "mpesa";
    const paymentDetailsFormatted = {
        paymentMethod,
        currency: invoice.currency || "KES",
        etimsVerificationUrl: resolveInvoiceEtimsVerificationUrl(invoice),
        bankName: paymentMethod === "bank" ? paymentDetails?.bankName : undefined,
        accountNumber: paymentMethod === "bank" ? paymentDetails?.accountNumber : undefined,
        accountName: paymentMethod === "bank" ? paymentDetails?.accountName : undefined,
        branchName: paymentMethod === "bank" ? paymentDetails?.branchName : undefined,
        branchCode: paymentMethod === "bank" ? paymentDetails?.branchCode : undefined,
        swiftCode: paymentMethod === "bank" ? paymentDetails?.swiftCode : undefined,
        mpesaPaybillNumber: paymentMethod === "mpesa"
            ? (paymentDetails?.mpesaPaybillNumber || "303030")
            : undefined,
        mpesaAccountNumber: paymentMethod === "mpesa"
            ? (paymentDetails?.mpesaAccountNumber || "2052676528")
            : undefined,
        mpesaInstructions: paymentMethod === "mpesa"
            ? (paymentDetails?.mpesaInstructions || "Absa Bank Kenya")
            : undefined,
        chequeDeliveryAddress: paymentMethod === "cheque"
            ? paymentDetails?.chequeDeliveryAddress
            : undefined,
        chequeInstructions: paymentMethod === "cheque"
            ? paymentDetails?.chequeInstructions
            : undefined,
    };
    return {
        yourDetails,
        companyDetails,
        invoiceDetails,
        paymentDetails: paymentDetailsFormatted,
        invoiceTerms,
        etimsFiscal: invoice.etimsFiscal ??
            extractEtimsFiscalFieldsFromInvoice(invoice),
    };
}
