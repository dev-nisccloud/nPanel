import React from "react";
import type { EtimsFiscalFields } from "../types";
type EtimsFiscalFooterPdfProps = {
    fields: EtimsFiscalFields;
    /** When true, repeats on every PDF page (react-pdf `fixed` prop). */
    fixed?: boolean;
};
/**
 * KRA eTIMS fiscal text block  fixed footer on synced invoices (QR lives beside payment details).
 */
export declare const EtimsFiscalFooterPdf: React.FC<EtimsFiscalFooterPdfProps>;
export {};
