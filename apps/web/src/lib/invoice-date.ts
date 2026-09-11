import { formatInvoiceDate as formatInvoiceDateApi } from "@npanel/api/lib/nisc-datetime-format";

export { INVOICE_DATE_FORMAT } from "@npanel/api/lib/nisc-datetime-format";

/** Invoice UI dates: dd-mm-yyyy. */
export function formatInvoiceDate(
	value: Date | string | null | undefined,
	fallback = "-",
): string {
	const formatted = formatInvoiceDateApi(value);
	return formatted || fallback;
}
