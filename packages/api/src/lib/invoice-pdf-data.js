import { COMPANY_LOGO_URL } from "./company-branding";
function formatPdfDate(value) {
    if (!value)
        return "N/A";
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime()))
        return "N/A";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function formatMoney(currency, amount) {
    const n = Number.parseFloat(amount);
    if (Number.isNaN(n))
        return `${currency} ${amount}`;
    return `${currency} ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
export function convertInvoiceDetailToPdfRenderData(invoice) {
    const from = (invoice.fromDetails ?? {});
    const customer = (invoice.customerDetails ?? {});
    const payment = (invoice.paymentDetails ?? {});
    const currency = invoice.currency ?? "KES";
    const lineItems = invoice.lineItems.map((item) => ({
        name: item.name ?? "Service",
        description: item.description ?? undefined,
        quantity: item.quantity ?? 1,
        price: item.price ?? "0",
        total: item.total ?? item.price ?? "0",
    }));
    const paymentMethodRaw = String(payment.paymentMethod ?? payment.method ?? "BANK_TRANSFER");
    const paymentMethod = paymentMethodRaw === "MPESA"
        ? "M-Pesa"
        : paymentMethodRaw === "CHEQUE"
            ? "Cheque"
            : "Bank transfer";
    return {
        logoUrl: COMPANY_LOGO_URL,
        fromName: String(from.name ?? "Nisc Cloud Limited"),
        fromEmail: String(from.email ?? "accounts@nisccloud.com"),
        fromAddress: String(from.address ?? ""),
        fromCity: String(from.city ?? "Nairobi"),
        fromCountry: String(from.country ?? "Kenya"),
        fromTaxId: from.taxId ? String(from.taxId) : undefined,
        customerName: String(customer.name ?? invoice.customerName ?? "Customer"),
        customerEmail: customer.email ? String(customer.email) : undefined,
        customerAddress: customer.address ? String(customer.address) : undefined,
        customerCity: customer.city ? String(customer.city) : undefined,
        customerCountry: customer.country ? String(customer.country) : undefined,
        customerTaxId: customer.taxId ? String(customer.taxId) : undefined,
        invoiceNumber: invoice.invoiceNumber ?? "Invoice",
        issueDate: formatPdfDate(invoice.issueDate),
        dueDate: formatPdfDate(invoice.dueDate),
        currency,
        lineItems,
        subtotal: invoice.subtotal ?? "0",
        tax: invoice.tax ?? "0",
        taxPercentage: invoice.taxPercentage ?? 16,
        total: invoice.amount ?? "0",
        paymentMethod,
        bankName: payment.bankName ? String(payment.bankName) : undefined,
        branchName: payment.branchName ? String(payment.branchName) : undefined,
        branchCode: payment.branchCode ? String(payment.branchCode) : undefined,
        accountNumber: payment.accountNumber ? String(payment.accountNumber) : undefined,
        accountName: payment.accountName ? String(payment.accountName) : undefined,
        swiftCode: payment.swiftCode ? String(payment.swiftCode) : undefined,
    };
}
export function sanitizeInvoicePdfFilename(invoiceNumber) {
    return `${invoiceNumber.replace(/[^a-zA-Z0-9._-]/g, "_")}.pdf`;
}
export { formatMoney };
