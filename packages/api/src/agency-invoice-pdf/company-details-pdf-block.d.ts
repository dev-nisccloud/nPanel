export type PdfCompanyDetailsFields = {
    email?: string;
    companyName?: string;
    companyAddress?: string;
    companyCity?: string;
    companyState?: string;
    companyCountry?: string;
    companyTaxId?: string;
    companyZip?: string;
};
export type PdfCompanyDetailsBlockProps = PdfCompanyDetailsFields & {
    /** Optional section title (e.g. quotations: “Quoted to”). */
    label?: string;
};
export declare function PdfCompanyDetailsBlock(props: PdfCompanyDetailsBlockProps): import("react/jsx-runtime").JSX.Element | null;
