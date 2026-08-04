/** Prefer email, else normalized name, else unassigned — matches API grouping. */
export function quotationCustomerGroupKey(
	customerName: string | null | undefined,
	customerEmail: string | null | undefined,
): string {
	const email = customerEmail?.trim().toLowerCase();
	if (email) return `email:${email}`;
	const name = customerName?.trim().replace(/\s+/g, " ").toLowerCase();
	if (name) return `name:${name}`;
	return "unassigned";
}

export function quotationCustomerGroupPath(
	customerName: string | null | undefined,
	customerEmail: string | null | undefined,
): string {
	const key = quotationCustomerGroupKey(customerName, customerEmail);
	return `/agency/quotations/customers/${encodeURIComponent(key)}`;
}
