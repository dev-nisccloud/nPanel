import { useCurrency, type StorefrontCurrency } from "./providers/currency.tsx";

export function CurrencySelector({ mobile = false }: { mobile?: boolean }) {
	const { currency, setCurrency } = useCurrency();

	return (
		<label
			className={
				mobile
					? "flex w-full items-center justify-between gap-3 text-sm font-medium text-foreground"
					: "sr-only xl:not-sr-only"
			}
		>
			{mobile && <span>Currency</span>}
			<select
				aria-label="Display currency"
				value={currency}
				onChange={(event) =>
					setCurrency(event.target.value as StorefrontCurrency)
				}
				className="h-9 rounded-lg border border-border bg-background px-2 text-xs font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
			>
				<option value="KES">KES</option>
				<option value="USD">USD</option>
			</select>
		</label>
	);
}
