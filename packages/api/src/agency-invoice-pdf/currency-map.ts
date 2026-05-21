/** Currency symbols for agency invoice PDF line items (matches apps/web currency list). */
export const currencyList: {
	value: string;
	details: { currencyShortForm: string; currencySymbol: string };
}[] = [
	{ value: "USD", details: { currencyShortForm: "USD", currencySymbol: "$" } },
	{ value: "EUR", details: { currencyShortForm: "EUR", currencySymbol: "€" } },
	{ value: "KES", details: { currencyShortForm: "KES", currencySymbol: "KSh" } },
];
