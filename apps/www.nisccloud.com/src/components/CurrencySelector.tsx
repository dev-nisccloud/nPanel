import { useCurrency, type StorefrontCurrency } from "./providers/currency.tsx";

export function CurrencySelector({ mobile = false }: { mobile?: boolean }) {
	const {
		currency,
		countryCode,
		source,
		locationLoading,
		rateError,
		rateLoading,
		retryRate,
		setCurrency,
	} = useCurrency();
	const contextMessage = locationLoading
		? "Detecting your display currency…"
		: rateError
			? "USD conversion is temporarily unavailable."
			: source === "location"
				? `Showing ${currency} based on your location${countryCode ? ` (${countryCode})` : ""}.`
				: source === "manual"
					? `Showing your selected currency: ${currency}.`
					: `Showing ${currency} as the safe default.`;

	return (
		<div
			className={
				mobile
					? "flex w-full items-center justify-between gap-4 text-sm text-foreground"
					: "hidden items-center gap-2 xl:flex"
			}
		>
			<div className={mobile ? "min-w-0" : "hidden max-w-44 2xl:block"}>
				<p className="font-medium">{mobile ? "Currency" : contextMessage}</p>
				{mobile && (
					<p className="mt-0.5 text-xs leading-snug text-muted-foreground" aria-live="polite">
						{contextMessage} {source === "location" && "Change currency any time."}
					</p>
				)}
				{rateError && (
					<button
						type="button"
						onClick={retryRate}
						className="mt-1 text-xs font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
					>
						Try conversion again
					</button>
				)}
			</div>
			<label className="shrink-0">
				<span className="sr-only">Display currency</span>
			<select
				aria-label="Display currency"
				aria-busy={rateLoading}
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
		</div>
	);
}
