import type { db } from "@npanel/db";
import type { InvoiceDetail } from "../routers/invoicing/schemas";
export type PreparedInvoiceEmailDelivery = {
    invoiceDetail: InvoiceDetail;
    pdfBuffer: Buffer;
    pdfFilename: string;
    kraSynced: boolean;
};
type DbLike = typeof db;
export declare function prepareInvoiceEmailDelivery(dbClient: DbLike, invoiceId: string): Promise<PreparedInvoiceEmailDelivery>;
export declare function sendInvoiceReminderEmail(params: {
    to: string;
    cc?: string[];
    bcc?: string[];
    subject: string;
    html: string;
    pdfBuffer: Buffer;
    pdfFilename: string;
}): Promise<void>;
export {};
