import React from "react";
import type { PaymentDetails } from "../types";
interface PaymentDetailsPdfProps extends PaymentDetails {
    qrCodeDataUrl?: string;
    /** Match `InvoiceDetailsPdf` line / header typography (e.g. cron compact invoices). */
    compactLineItems?: boolean;
}
export declare const PaymentDetailsPdf: React.FC<PaymentDetailsPdfProps>;
export {};
