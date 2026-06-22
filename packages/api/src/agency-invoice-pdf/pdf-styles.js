import { StyleSheet } from '@react-pdf/renderer';
const colors = {
    gray200: '#e5e7eb',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    'gray550/900': 'rgb(115 115 115 / 0.9)'
};
export const pdfTypography = StyleSheet.create({
    title: {
        fontSize: 11,
        fontWeight: "semibold",
        textTransform: "uppercase",
        color: colors.gray400
    },
    subTitle: {
        fontSize: 12,
        fontWeight: "medium",
    },
    text2xl: {
        fontSize: 24,
        fontWeight: 'medium'
    },
    description: {
        color: colors['gray550/900'],
        fontSize: 12
    },
    itemDescription: {
        color: colors.gray600,
        fontSize: 12,
        fontWeight: "medium",
        flexWrap: 'wrap'
    },
    /** Tighter table body for long descriptions (cron media-buying invoices). */
    itemLineCompact: {
        color: colors.gray600,
        fontSize: 7,
        fontWeight: "medium",
        flexWrap: "wrap",
    },
    /** Column headers matching compact line items. */
    itemLineHeaderCompact: {
        fontSize: 7,
        fontWeight: "bold",
        textTransform: "uppercase",
        color: colors.gray400,
    },
    amount: {
        fontSize: 16,
        fontWeight: "medium",
        flexWrap: 'wrap'
    },
});
export const pdfUtils = StyleSheet.create({
    flexRowBetween: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'row',
    },
    borderTop: { borderTop: `1px solid ${colors.gray200}`, borderTopStyle: 'dashed', },
    borderBottom: { borderBottom: `1px solid ${colors.gray200}`, borderBottomStyle: 'dashed', },
    borderLeft: { borderLeft: `1px solid ${colors.gray200}`, borderLeftStyle: 'dashed', },
    borderRight: { borderRight: `1px solid ${colors.gray200}`, borderRightStyle: 'dashed', },
    flexRowItemCenter: {
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'row',
    },
    flexRowItemStart: {
        display: 'flex',
        alignItems: 'flex-start',
        flexDirection: 'row',
    },
    flexRowItemSpaceAround: {
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    flexColBetween: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'column',
    },
});
export const pdfContainers = StyleSheet.create({
    page: {
        fontFamily: "Geist",
        paddingTop: 28,
        paddingBottom: 28,
        paddingLeft: 0,
        paddingRight: 0,
    },
    /** Reserve space so body content does not overlap the fixed eTIMS fiscal footer. */
    pageWithEtimsFooter: {
        fontFamily: "Geist",
        paddingTop: 28,
        paddingBottom: 72,
        paddingLeft: 0,
        paddingRight: 0,
    },
    invoiceTerms: {
        paddingHorizontal: 40,
        paddingVertical: 20,
        display: 'flex',
        alignItems: "center",
        flexDirection: 'row',
    },
    YourDetails: {
        paddingHorizontal: 40,
        paddingVertical: 16,
        flex: 1
    },
    /** Full width of column; avoid `flex: 1` here   in a column parent it can grow vertically. */
    CompanyDetails: {
        paddingLeft: 40,
        paddingRight: 20,
        paddingVertical: 0,
        width: "100%",
        minWidth: 0,
    },
    imageContainer: {
        width: "100%",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        height: 40,
        marginBottom: 12,
    }
});
/**
 * Invoice/quotation header logo frame   matches web branding:
 * - Auth layout (`auth.tsx`): `width={180} height={60}` with `h-15 w-auto` (60px tall).
 * - Sidebar expanded (`app-sidebar.tsx`): `h-12` (48px) is slightly smaller; PDF uses the auth size.
 * CSS px @ 96dpi → PDF pt: 180×60 → 135×45 (3:1).
 */
export const pdfBrandingLogoBox = {
    width: 135,
    height: 45,
};
/**
 * Shared with `InvoiceTermsPdf` (invoice no / dates) and `CompanyDetailsPdf` (Bill To):
 * same label typography, value typography, row gap, and margin between rows.
 */
export const pdfInvoiceMeta = {
    label: {
        fontSize: 11,
        textTransform: "uppercase",
        color: colors.gray500,
    },
    value: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#111827",
    },
    /** Right column: invoice number, issued, due date */
    rowTerms: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 6,
        marginBottom: 5,
    },
    /**
     * Bill To body: one `Text` with `\\n`-separated lines (`PdfCompanyDetailsBlock`).
     * `lineHeight` is a **unitless multiplier** (like CSS), not points   `13` would mean 13× fontSize.
     */
    valueBillTo: {
        fontSize: 10,
        fontWeight: "medium",
        color: "#111827",
        lineHeight: 1.2,
    },
};
