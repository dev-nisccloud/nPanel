export declare const pdfTypography: {
    title: {
        fontSize: number;
        fontWeight: string;
        textTransform: "uppercase";
        color: string;
    };
    subTitle: {
        fontSize: number;
        fontWeight: string;
    };
    text2xl: {
        fontSize: number;
        fontWeight: string;
    };
    description: {
        color: string;
        fontSize: number;
    };
    itemDescription: {
        color: string;
        fontSize: number;
        fontWeight: string;
        flexWrap: "wrap";
    };
    /** Tighter table body for long descriptions (cron media-buying invoices). */
    itemLineCompact: {
        color: string;
        fontSize: number;
        fontWeight: string;
        flexWrap: "wrap";
    };
    /** Column headers matching compact line items. */
    itemLineHeaderCompact: {
        fontSize: number;
        fontWeight: string;
        textTransform: "uppercase";
        color: string;
    };
    amount: {
        fontSize: number;
        fontWeight: string;
        flexWrap: "wrap";
    };
};
export declare const pdfUtils: {
    flexRowBetween: {
        display: "flex";
        alignItems: "center";
        justifyContent: "space-between";
        flexDirection: "row";
    };
    borderTop: {
        borderTop: string;
        borderTopStyle: "dashed";
    };
    borderBottom: {
        borderBottom: string;
        borderBottomStyle: "dashed";
    };
    borderLeft: {
        borderLeft: string;
        borderLeftStyle: "dashed";
    };
    borderRight: {
        borderRight: string;
        borderRightStyle: "dashed";
    };
    flexRowItemCenter: {
        display: "flex";
        alignItems: "center";
        flexDirection: "row";
    };
    flexRowItemStart: {
        display: "flex";
        alignItems: "flex-start";
        flexDirection: "row";
    };
    flexRowItemSpaceAround: {
        display: "flex";
        alignItems: "center";
        flexDirection: "row";
        justifyContent: "space-around";
    };
    flexColBetween: {
        display: "flex";
        alignItems: "center";
        justifyContent: "space-between";
        flexDirection: "column";
    };
};
export declare const pdfContainers: {
    page: {
        fontFamily: string;
        paddingTop: number;
        paddingBottom: number;
        paddingLeft: number;
        paddingRight: number;
    };
    invoiceTerms: {
        paddingHorizontal: number;
        paddingVertical: number;
        display: "flex";
        alignItems: "center";
        flexDirection: "row";
    };
    YourDetails: {
        paddingHorizontal: number;
        paddingVertical: number;
        flex: number;
    };
    /** Full width of column; avoid `flex: 1` here   in a column parent it can grow vertically. */
    CompanyDetails: {
        paddingLeft: number;
        paddingRight: number;
        paddingVertical: number;
        width: string;
        minWidth: number;
    };
    imageContainer: {
        width: string;
        display: "flex";
        justifyContent: "flex-start";
        alignItems: "flex-start";
        height: number;
        marginBottom: number;
    };
};
/**
 * Invoice/quotation header logo frame   matches web branding:
 * - Auth layout (`auth.tsx`): `width={180} height={60}` with `h-15 w-auto` (60px tall).
 * - Sidebar expanded (`app-sidebar.tsx`): `h-12` (48px) is slightly smaller; PDF uses the auth size.
 * CSS px @ 96dpi → PDF pt: 180×60 → 135×45 (3:1).
 */
export declare const pdfBrandingLogoBox: {
    readonly width: 135;
    readonly height: 45;
};
/**
 * Shared with `InvoiceTermsPdf` (invoice no / dates) and `CompanyDetailsPdf` (Bill To):
 * same label typography, value typography, row gap, and margin between rows.
 */
export declare const pdfInvoiceMeta: {
    label: {
        fontSize: number;
        textTransform: "uppercase";
        color: string;
    };
    value: {
        fontSize: number;
        fontWeight: "bold";
        color: string;
    };
    /** Right column: invoice number, issued, due date */
    rowTerms: {
        display: "flex";
        flexDirection: "row";
        alignItems: "center";
        justifyContent: "flex-end";
        gap: number;
        marginBottom: number;
    };
    /**
     * Bill To body: one `Text` with `\\n`-separated lines (`PdfCompanyDetailsBlock`).
     * `lineHeight` is a **unitless multiplier** (like CSS), not points   `13` would mean 13× fontSize.
     */
    valueBillTo: {
        fontSize: number;
        fontWeight: "medium";
        color: string;
        lineHeight: number;
    };
};
