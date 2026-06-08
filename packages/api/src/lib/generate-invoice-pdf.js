import { generateAgencyInvoicePdfBuffer } from "../agency-invoice-pdf/generate-invoice-pdf-buffer";
export async function generateInvoicePdfBuffer(invoice) {
    return generateAgencyInvoicePdfBuffer(invoice);
}
